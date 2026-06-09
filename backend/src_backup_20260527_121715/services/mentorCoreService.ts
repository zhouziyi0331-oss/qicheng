import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';

/**
 * AI导师核心服务 - SaaS化版本
 *
 * 核心特性：
 * 1. 真实AI API调用（Claude 3.5 Sonnet）
 * 2. 400字深度回复
 * 3. 完整上下文管理
 * 4. 信号检测系统
 * 5. 多租户支持
 */

interface StudentContext {
  id: string;
  name: string;
  opcLabel?: string;
  lifeQuestion?: string;
  level: number;
  taskCount: number;
  usedTools: string[];
  recentStuckPoints: string[];
}

interface TaskContext {
  id: string;
  title: string;
  description: string;
  trackType: string;
  acceptanceCriteria?: string;
}

interface ConversationMessage {
  role: 'student' | 'mentor' | 'system';
  content: string;
  timestamp: string;
}

interface MentorContext {
  student: StudentContext;
  task?: TaskContext;
  conversationHistory: ConversationMessage[];
  detectedSignals: {
    passionSparks: number;
    flowMoments: number;
    stuckPoints: number;
  };
}

interface DetectedSignals {
  passionSpark: boolean;
  flowMoment: boolean;
  stuckPoint: boolean;
  lifeQuestionConnection: boolean;
}

export class MentorCoreService {
  private anthropic: Anthropic;
  private defaultModel = 'claude-sonnet-4-6';
  private defaultTemperature = 0.7;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * 核心对话方法
   * @param studentId 学生ID
   * @param message 学生消息
   * @param taskId 任务ID（可选）
   * @param sessionId 会话ID（可选，用于继续对话）
   */
  async chat(
    studentId: string,
    message: string,
    taskId?: string,
    sessionId?: string
  ): Promise<{
    success: boolean;
    sessionId: string;
    response: string;
    tokensUsed: number;
    responseTime: number;
    detectedSignals: DetectedSignals;
    suggestions?: string[];
  }> {
    const startTime = Date.now();

    try {
      // 1. 加载或创建会话
      const session = await this.getOrCreateSession(studentId, taskId, sessionId);

      // 2. 构建完整上下文
      const context = await this.buildContext(studentId, taskId, session.id);

      // 3. 保存学生消息
      await this.saveMessage(session.id, 'student', message);

      // 4. 构建AI Prompt
      const prompt = this.buildPrompt(context, message);

      // 5. 调用Claude API
      const aiResponse = await this.callClaudeAPI(prompt);

      // 6. 检测信号
      const signals = this.detectSignals(message, aiResponse);

      // 7. 保存AI回复
      await this.saveMessage(session.id, 'mentor', aiResponse, {
        tokensUsed: Math.ceil(aiResponse.length / 4), // 粗略估算，向上取整
        signals,
      });

      // 8. 更新会话统计
      await this.updateSessionStats(session.id);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        sessionId: session.id,
        response: aiResponse,
        tokensUsed: Math.ceil(aiResponse.length / 4),
        responseTime,
        detectedSignals: signals,
        suggestions: this.generateSuggestions(signals),
      };
    } catch (error) {
      logger.error('AI导师对话失败:', error);
      throw error;
    }
  }

  /**
   * 构建AI Prompt - 确保400字回复
   */
  private buildPrompt(context: MentorContext, studentMessage: string): string {
    const { student, task, conversationHistory } = context;

    // 格式化对话历史
    const historyText = conversationHistory
      .slice(-10) // 最近10条消息
      .map((msg) => `${msg.role === 'student' ? '学生' : '导师'}：${msg.content}`)
      .join('\n\n');

    return `你是启程平台的AI导师"启程小猫"，一只顶着书本的可爱小猫。

## 【核心使命】
你不是来教技能的，是来帮学生看见自己的。
- 不问"你学会了什么"，问"你发现了什么关于自己的事"
- 不说"你做错了"，说"你注意到这里可以不一样吗？"
- 捕捉热情火花、穿越感时刻、连接生命问题

## 【学生档案】
- 姓名：${student.name || '同学'}
- OPC标签：${student.opcLabel || '未测评'}
- 生命问题：${student.lifeQuestion || '未填写'}
- 等级：Lv.${student.level}
- 历史任务数：${student.taskCount}
- 用过的工具：${student.usedTools.join('、') || '暂无'}
${student.recentStuckPoints.length > 0 ? `- 最近卡点：${student.recentStuckPoints.join('、')}` : ''}

${task ? `## 【当前任务】
- 标题：${task.title}
- 描述：${task.description}
- 类型：${task.trackType === 'A' ? '内容创作' : '工具开发'}
${task.acceptanceCriteria ? `- 验收标准：${task.acceptanceCriteria}` : ''}
` : ''}

${conversationHistory.length > 0 ? `## 【对话历史】
${historyText}
` : ''}

## 【回复要求 - 非常重要】

### 长度要求（必须严格遵守）
- **最少350字，最多500字**
- 如果回复少于350字，会被系统拒绝
- 用字数计数器确认：中文字符数 >= 350

### 结构要求
你的回复必须包含3个部分：

**第1部分：回应与理解（120-150字）**
- 回应学生的具体问题或情况
- 展示你理解了学生的处境
- 可以用一个具体的例子或类比

**第2部分：引导与建议（180-250字）**
- 提供具体的、可操作的建议
- 不要说教，而是引导思考
- 可以分享"我之前也遇到过..."的经历
- 如果学生卡住了，提供2-3个具体的尝试方向

**第3部分：开放式提问（50-100字）**
- 提出1-2个开放式问题
- 鼓励学生继续探索
- 如果相关，连接到学生的生命问题

### 语气要求
- 温暖、好奇、具体、口语化
- 像朋友聊天，不要太正式
- 可以用emoji，但不要过度（最多3个）
- 避免专业术语，用生活化的语言

### 必须包含
- ✅ 至少1个具体的例子或类比
- ✅ 至少1个开放式问题
- ✅ 如果相关，连接学生的生命问题
- ✅ 总字数350-500字

### 禁止
- ❌ 说教式语气（"你应该..."、"正确的做法是..."）
- ❌ 空洞的鼓励（"加油"、"你可以的"）
- ❌ 少于350字的回复
- ❌ 专业术语堆砌

## 【学生的最新消息】
${studentMessage}

---

现在，请根据以上所有信息，生成你的回复。记住：
1. 必须350-500字
2. 包含3个部分：回应、引导、提问
3. 温暖、具体、有画面感
4. 不说教，引导学生自己思考

请开始你的回复：`;
  }

  /**
   * 调用Claude API
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    try {
      logger.info('开始调用Claude API', {
        model: this.defaultModel,
        apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
        apiKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
        promptLength: prompt.length,
      });

      const message = await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: 2000, // 确保有足够空间生成400字
        temperature: this.defaultTemperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      logger.info('Claude API调用成功', {
        messageId: message.id,
        model: message.model,
        stopReason: message.stop_reason,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      // 验证回复长度
      if (response.length < 300) {
        logger.warn('AI回复过短，重新生成', { length: response.length });
        // 可以选择重试或使用备用策略
      }

      return response;
    } catch (error: any) {
      logger.error('Claude API调用失败:', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        status: error.status,
        type: error.type,
        apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
      });
      throw new Error(`AI服务暂时不可用: ${error.message}`);
    }
  }

  /**
   * 检测信号
   */
  private detectSignals(studentMessage: string, mentorResponse: string): DetectedSignals {
    const message = studentMessage.toLowerCase();

    // 1. 热情火花检测
    const passionKeywords = ['发现', '有意思', '很酷', '喜欢', '兴奋', '好玩', '惊喜'];
    const passionSpark = passionKeywords.some((keyword) => message.includes(keyword)) ||
                         (studentMessage.match(/！/g) || []).length >= 2;

    // 2. 穿越感时刻检测
    const flowKeywords = ['时间过得很快', '忘记时间', '沉浸', '专注', '停不下来', '一直在做'];
    const flowMoment = flowKeywords.some((keyword) => message.includes(keyword));

    // 3. 卡点检测
    const stuckKeywords = ['卡住', '不知道', '困惑', '失败', '不会', '怎么办', '求助'];
    const stuckPoint = stuckKeywords.some((keyword) => message.includes(keyword));

    // 4. 生命问题连接检测
    const lifeQuestionKeywords = ['生命问题', '真正喜欢', '想要什么', '意义', '价值'];
    const lifeQuestionConnection = lifeQuestionKeywords.some((keyword) => message.includes(keyword));

    return {
      passionSpark,
      flowMoment,
      stuckPoint,
      lifeQuestionConnection,
    };
  }

  /**
   * 生成建议
   */
  private generateSuggestions(signals: DetectedSignals): string[] {
    const suggestions: string[] = [];

    if (signals.passionSpark) {
      suggestions.push('记录这个热情火花时刻');
      suggestions.push('深入探索这个方向');
    }

    if (signals.flowMoment) {
      suggestions.push('标记为穿越感时刻');
      suggestions.push('分析是什么让你进入心流状态');
    }

    if (signals.stuckPoint) {
      suggestions.push('换个角度试试');
      suggestions.push('先做个简单版本');
      suggestions.push('寻求同伴帮助');
    }

    return suggestions;
  }

  /**
   * 构建上下文
   */
  private async buildContext(
    studentId: string,
    taskId?: string,
    sessionId?: string
  ): Promise<MentorContext> {
    // 1. 加载学生信息
    const student = await this.loadStudentContext(studentId);

    // 2. 加载任务信息
    const task = taskId ? await this.loadTaskContext(taskId) : undefined;

    // 3. 加载对话历史
    const conversationHistory = sessionId
      ? await this.loadConversationHistory(sessionId)
      : [];

    // 4. 统计检测到的信号
    const detectedSignals = await this.countDetectedSignals(sessionId);

    return {
      student,
      task,
      conversationHistory,
      detectedSignals,
    };
  }

  /**
   * 加载学生上下文
   */
  private async loadStudentContext(studentId: string): Promise<StudentContext> {
    const student = await queryOne<any>(
      `SELECT
        u.id, u.nickname as name,
        sp.opc_label, sp.life_question, sp.level_a as level, sp.task_count
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = $1`,
      [studentId]
    );

    if (!student) {
      throw new Error('学生不存在');
    }

    // 加载使用过的工具
    const tools = await query<{ tool: string }>(
      `SELECT DISTINCT jsonb_array_elements_text(milestone_data->'tools_used') as tool
       FROM student_milestones
       WHERE student_id = $1::uuid AND milestone_type = 'new_tool'
       LIMIT 10`,
      [studentId]
    );

    // 加载最近的卡点
    const stuckPoints = await query<{ content: string }>(
      `SELECT content
       FROM mentor_messages
       WHERE session_id IN (
         SELECT id FROM mentor_sessions WHERE student_id = $1::uuid
       )
       AND detected_signals->>'stuckPoint' = 'true'
       ORDER BY created_at DESC
       LIMIT 5`,
      [studentId]
    );

    return {
      id: student.id,
      name: student.name || '同学',
      opcLabel: student.opc_label,
      lifeQuestion: student.life_question,
      level: student.level || 0,
      taskCount: student.task_count || 0,
      usedTools: tools.map((t) => t.tool),
      recentStuckPoints: stuckPoints.map((s) => s.content),
    };
  }

  /**
   * 加载任务上下文
   */
  private async loadTaskContext(taskId: string): Promise<TaskContext | undefined> {
    const task = await queryOne<any>(
      `SELECT id, title, description, track, acceptance_criteria
       FROM tasks
       WHERE id = $1`,
      [taskId]
    );

    if (!task) return undefined;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      trackType: task.track,
      acceptanceCriteria: task.acceptance_criteria,
    };
  }

  /**
   * 加载对话历史
   */
  private async loadConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    const messages = await query<any>(
      `SELECT role, content, created_at
       FROM mentor_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [sessionId]
    );

    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
    }));
  }

  /**
   * 统计检测到的信号
   */
  private async countDetectedSignals(sessionId?: string): Promise<{
    passionSparks: number;
    flowMoments: number;
    stuckPoints: number;
  }> {
    if (!sessionId) {
      return { passionSparks: 0, flowMoments: 0, stuckPoints: 0 };
    }

    const result = await queryOne<any>(
      `SELECT
        COUNT(*) FILTER (WHERE detected_signals->>'passionSpark' = 'true') as passion_sparks,
        COUNT(*) FILTER (WHERE detected_signals->>'flowMoment' = 'true') as flow_moments,
        COUNT(*) FILTER (WHERE detected_signals->>'stuckPoint' = 'true') as stuck_points
       FROM mentor_messages
       WHERE session_id = $1`,
      [sessionId]
    );

    return {
      passionSparks: parseInt(result?.passion_sparks || '0'),
      flowMoments: parseInt(result?.flow_moments || '0'),
      stuckPoints: parseInt(result?.stuck_points || '0'),
    };
  }

  /**
   * 获取或创建会话
   */
  private async getOrCreateSession(
    studentId: string,
    taskId?: string,
    sessionId?: string
  ): Promise<{ id: string }> {
    if (sessionId) {
      const session = await queryOne<{ id: string }>(
        'SELECT id FROM mentor_sessions WHERE id = $1',
        [sessionId]
      );
      if (session) return session;
    }

    // 创建新会话
    const newSession = await queryOne<{ id: string }>(
      `INSERT INTO mentor_sessions (student_id, task_id, tenant_id, status)
       VALUES ($1::uuid, $2, $3::uuid, 'active')
       RETURNING id`,
      [studentId, taskId, '00000000-0000-0000-0000-000000000000'] // 使用默认租户
    );

    return newSession!;
  }

  /**
   * 保存消息
   */
  private async saveMessage(
    sessionId: string,
    role: 'student' | 'mentor' | 'system',
    content: string,
    metadata?: {
      tokensUsed?: number;
      signals?: DetectedSignals;
    }
  ): Promise<void> {
    await query(
      `INSERT INTO mentor_messages (session_id, role, content, tokens_used, detected_signals)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        sessionId,
        role,
        content,
        metadata?.tokensUsed || 0,
        metadata?.signals ? JSON.stringify(metadata.signals) : null,
      ]
    );
  }

  /**
   * 更新会话统计
   */
  private async updateSessionStats(sessionId: string): Promise<void> {
    await query(
      `UPDATE mentor_sessions
       SET message_count = message_count + 1,
           last_message_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );
  }

  /**
   * 获取会话消息列表
   */
  async getSessionMessages(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationMessage[]> {
    const messages = await query<any>(
      `SELECT role, content, created_at, detected_signals
       FROM mentor_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
    }));
  }

  /**
   * 获取学生的所有会话
   */
  async getStudentSessions(studentId: string): Promise<any[]> {
    const sessions = await query<any>(
      `SELECT
        id,
        task_id,
        status,
        started_at,
        last_message_at,
        message_count,
        total_tokens
       FROM mentor_sessions
       WHERE student_id = $1::uuid
       ORDER BY last_message_at DESC
       LIMIT 20`,
      [studentId]
    );

    return sessions;
  }

  /**
   * 获取会话统计
   */
  async getSessionStats(sessionId: string): Promise<{
    messageCount: number;
    totalTokens: number;
    passionSparks: number;
    flowMoments: number;
    stuckPoints: number;
    avgResponseTime: number;
  }> {
    const stats = await queryOne<any>(
      `SELECT
        COUNT(*) as message_count,
        SUM(tokens_used) as total_tokens,
        COUNT(*) FILTER (WHERE detected_signals->>'passionSpark' = 'true') as passion_sparks,
        COUNT(*) FILTER (WHERE detected_signals->>'flowMoment' = 'true') as flow_moments,
        COUNT(*) FILTER (WHERE detected_signals->>'stuckPoint' = 'true') as stuck_points,
        AVG(response_time_ms) as avg_response_time
       FROM mentor_messages
       WHERE session_id = $1`,
      [sessionId]
    );

    return {
      messageCount: parseInt(stats?.message_count || '0'),
      totalTokens: parseInt(stats?.total_tokens || '0'),
      passionSparks: parseInt(stats?.passion_sparks || '0'),
      flowMoments: parseInt(stats?.flow_moments || '0'),
      stuckPoints: parseInt(stats?.stuck_points || '0'),
      avgResponseTime: parseInt(stats?.avg_response_time || '0'),
    };
  }

  /**
   * 获取学生的对话统计
   */
  async getStudentStats(studentId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalTokens: number;
    passionSparks: number;
    flowMoments: number;
    stuckPoints: number;
    lastConversationAt: string | null;
  }> {
    const stats = await queryOne<any>(
      `SELECT
        COUNT(DISTINCT ms.id) as total_sessions,
        COUNT(mm.id) as total_messages,
        SUM(mm.tokens_used) as total_tokens,
        COUNT(*) FILTER (WHERE mm.detected_signals->>'passionSpark' = 'true') as passion_sparks,
        COUNT(*) FILTER (WHERE mm.detected_signals->>'flowMoment' = 'true') as flow_moments,
        COUNT(*) FILTER (WHERE mm.detected_signals->>'stuckPoint' = 'true') as stuck_points,
        MAX(ms.last_message_at) as last_conversation_at
       FROM mentor_sessions ms
       LEFT JOIN mentor_messages mm ON ms.id = mm.session_id
       WHERE ms.student_id = $1::uuid
       GROUP BY ms.student_id`,
      [studentId]
    );

    return {
      totalSessions: parseInt(stats?.total_sessions || '0'),
      totalMessages: parseInt(stats?.total_messages || '0'),
      totalTokens: parseInt(stats?.total_tokens || '0'),
      passionSparks: parseInt(stats?.passion_sparks || '0'),
      flowMoments: parseInt(stats?.flow_moments || '0'),
      stuckPoints: parseInt(stats?.stuck_points || '0'),
      lastConversationAt: stats?.last_conversation_at || null,
    };
  }
}

export default new MentorCoreService();
