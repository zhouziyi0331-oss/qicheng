import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import mentorMemoryService from './mentorMemoryService';
import mentorExampleService from './mentorExampleService';
import mentorContextEnhancer from './mentorContextEnhancer';
import principleReviewService from './principleReviewService';

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
  private defaultModel = 'claude-haiku-4-5'; // 改用Haiku，更快（2-4秒 vs 5-8秒）
  private defaultTemperature = 0.7;
  private useStreaming = true; // 启用流式输出

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

      // 4. 构建AI Prompt（智能上下文管理）
      const prompt = await this.buildPrompt(context, message, taskId);

      // 5. 调用Claude API（带重试机制）
      let aiResponse = await this.callClaudeAPI(prompt);

      // 6. 【AI-07审核】检查回复是否符合初心原则
      const reviewResult = await principleReviewService.reviewMentorResponse(
        aiResponse,
        {
          studentLevel: context.student.level,
          conversationHistory: context.conversationHistory.map(m => m.content).join('\n'),
          hasRealCaseData: this.detectSignals(message, '').stuckPoint
        }
      );

      // 如果审核不通过，重新生成（最多1次）
      if (!reviewResult.pass) {
        logger.warn('AI-07 review failed, regenerating response', {
          reason: reviewResult.reason,
          originalLength: aiResponse.length
        });

        // 修改prompt，明确指出问题
        const retryPrompt = `${prompt}

---
**重要提醒**：上一次生成的回复被初心审核引擎拒绝，原因是：${reviewResult.reason}

请重新生成一条回复，确保：
- 不直接给答案，只给线索
- 不使用控制性语言（"你应该""必须"）
- 不编造案例（除非上面提供了真实案例）
- 引导学生自己思考`;

        aiResponse = await this.callClaudeAPI(retryPrompt);

        // 记录重新生成
        logger.info('AI-07 triggered regeneration', {
          newLength: aiResponse.length
        });
      }

      // 7. 检测信号
      const signals = this.detectSignals(message, aiResponse);

      // 8. 保存AI回复
      await this.saveMessage(session.id, 'mentor', aiResponse, {
        tokensUsed: Math.ceil(aiResponse.length / 4), // 粗略估算，向上取整
        signals,
      });

      // 9. 更新会话统计
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
    } catch (error: any) {
      logger.error('AI导师对话失败:', error);
      throw error;
    }
  }

  /**
   * 构建AI Prompt - 确保400字回复（集成长期记忆和风格自适应）
   */
  private async buildPrompt(context: MentorContext, studentMessage: string, taskId?: string): Promise<string> {
    const { student, task, conversationHistory } = context;

    // 智能上下文管理：根据对话长度决定策略
    const historyText = await this.buildContextHistory(conversationHistory);

    // 【新增】获取学生长期画像
    const profile = await mentorMemoryService.getStudentProfile(student.id);

    // 【T-02新增】检测stuck信号，获取真实卡点案例
    const isStuck = this.detectSignals(studentMessage, '').stuckPoint;
    let realStuckCase = null;
    if (isStuck && taskId) {
      realStuckCase = await mentorContextEnhancer.getRealStuckCase(student.id, taskId);
      logger.info('T-02: Stuck signal detected', {
        studentId: student.id,
        taskId,
        hasRealCase: !!realStuckCase
      });
    }

    // 基础Prompt
    let basePrompt = `你是启程平台的AI导师"启程小猫"，一只顶着书本的可爱小猫。

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
${student.recentStuckPoints.length > 0 ? `- 最近卡点：${student.recentStuckPoints.join('、')}` : ''}`;

    // 【新增】注入长期记忆
    if (profile) {
      basePrompt += `

## 【学生长期记忆】
${profile.profile_summary}

**历史高频卡点：**
${profile.top_stuck_points.map(sp => `- ${sp.category}（${sp.resolved ? '已突破' : '仍在克服'}）`).join('\n')}

**最近突破：**
${profile.recent_breakthroughs.map(bt => `- ${bt.description}`).join('\n')}

**工作模式：**
- 平均提前${profile.work_patterns.avg_delivery_days_before_deadline}天交付
- 平均修改${profile.work_patterns.avg_revision_rounds}轮
- 最近5单平均评分：${profile.work_patterns.recent_5_orders_avg_score}/5.0`;
    }

    basePrompt += `

${task ? `## 【当前任务】
- 标题：${task.title}
- 描述：${task.description}
- 类型：${task.trackType === 'A' ? '内容创作' : '工具开发'}
${task.acceptanceCriteria ? `- 验收标准：${task.acceptanceCriteria}` : ''}
` : ''}

${conversationHistory.length > 0 ? `## 【对话历史】
${historyText}
` : ''}`;

    // 【新增】注入风格自适应指令
    if (profile && profile.guidance_style) {
      basePrompt += `

## 【引导风格指令】
${profile.guidance_style.system_prompt_injection}`;
    }

    // 【T-02新增】如果检测到stuck且有真实案例，注入到prompt
    if (realStuckCase) {
      basePrompt += `

## 【真实卡点案例 + 羞耻感消除】（T-02 + 产品优化）
有其他学生在类似任务中也遇到过困难：

${realStuckCase.observation_content}

**羞耻感消除策略（必须执行）：**
1. **先接住情绪**：在给任何建议前，先说"这个地方确实容易卡住，之前有X个同学也在这里停了很久"
2. **数据支撑**：告诉学生具体有多少人遇到同样的问题（基于真实数据）
3. **正常化**：明确说"这不是你能力不行，是这个任务本身的难点"
4. **然后给线索**：情绪稳定后再给2-3个探索方向

**重要提示：** 这是真实案例，你可以简单提及"之前有同学也卡在这里"，但不要直接告诉学生答案。引导学生思考这个案例给他的启发。`;
    }

    // 【P1新增】检测是否应该展示范例
    if (task && mentorExampleService.shouldShowExample(conversationHistory)) {
      const similarCase = await mentorExampleService.findSimilarCase(
        task.id,
        student.level
      );

      if (similarCase) {
        const formattedCase = mentorExampleService.formatCaseForDisplay(similarCase);
        basePrompt += `

## 【参考案例】
学生连续求助，展示一个相似项目的案例供参考：

${formattedCase.full_text}

**重要：** 在你的回复中，先简单提及这个案例（1-2句话），然后引导学生思考可以借鉴哪一步。不要直接复述案例内容。`;

        // 记录范例展示
        await mentorExampleService.recordExampleShown(
          student.id,
          task.id,
          similarCase.order_id,
          similarCase.similarity_score
        );

        logger.info(`[MentorCore] 已注入范例: ${similarCase.order_id}, 相似度=${similarCase.similarity_score}`);
      }
    }

    basePrompt += `

## 【回复要求 - 非常重要】

### 长度要求（必须严格遵守）
- **最少350字，最多500字**
- 如果回复少于350字，会被系统拒绝
- 用字数计数器确认：中文字符数 >= 350

### 初心原则（AI-07审核标准）
- ✅ 只给线索和方向，让学生自己完成最后一步
- ✅ 引用的案例来自真实数据（如果提供了【真实卡点案例】）
- ✅ 夸奖要具体到某个行为或细节
- ✅ 用"你可以试试""要不要看看"等开放性建议
- ❌ 不要直接给完整答案
- ❌ 不要用"你应该""你需要""必须"等控制性语言
- ❌ 不要编造不存在的"其他学生"案例（除非上面提供了真实案例）
- ❌ 不要用"加油""你真棒"等空洞鼓励

### 结构要求
你的回复必须包含3个部分：

**第1部分：回应与理解（120-150字）**
- 回应学生的具体问题或情况
- 展示你理解了学生的处境
- 可以用一个具体的例子或类比
- **如果学生卡住/受挫，必须先消除羞耻感**：用"这里确实不容易""大家都会卡"等话术先接住情绪

**第2部分：引导与建议（180-250字）**
- 提供具体的、可操作的建议
- 不要说教，而是引导思考
- 可以分享"我之前也遇到过..."的经历
- 如果学生卡住了，提供2-3个具体的尝试方向
- **优先引用真实案例**：如果上面提供了【真实卡点案例】，简单提及"之前有同学在这卡了X天，后来发现..."

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
        max_tokens: 600, // 优化：400字回复只需600 tokens
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
        sp.opc_label, sp.life_question, u.current_level as level, sp.task_count
      FROM users u
      LEFT JOIN users u ON u.id = u.id
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
   * 智能上下文管理 - 根据对话长度决定策略
   *
   * 策略：
   * - ≤10条：直接使用全部对话
   * - 11-20条：保留最近10条
   * - >20条：压缩前面的对话，保留最近10条
   */
  private async buildContextHistory(conversationHistory: ConversationMessage[]): Promise<string> {
    const historyLength = conversationHistory.length;

    if (historyLength <= 10) {
      // 10条以内，直接使用
      return conversationHistory
        .map((msg) => `${msg.role === 'student' ? '学生' : '导师'}：${msg.content}`)
        .join('\n\n');
    } else if (historyLength <= 20) {
      // 11-20条，保留最近10条
      return conversationHistory
        .slice(-10)
        .map((msg) => `${msg.role === 'student' ? '学生' : '导师'}：${msg.content}`)
        .join('\n\n');
    } else {
      // 超过20条，压缩前面的对话
      const recent = conversationHistory.slice(-10); // 最近10条
      const older = conversationHistory.slice(0, -10); // 更早的对话

      // 生成对话摘要
      const summary = await this.summarizeConversation(older);

      // 构建上下文：摘要 + 最近10条
      const recentText = recent
        .map((msg) => `${msg.role === 'student' ? '学生' : '导师'}：${msg.content}`)
        .join('\n\n');

      return `【早期对话摘要】\n${summary}\n\n【最近对话】\n${recentText}`;
    }
  }

  /**
   * 生成对话摘要
   */
  private async summarizeConversation(messages: ConversationMessage[]): Promise<string> {
    try {
      const conversationText = messages
        .map((msg) => `${msg.role === 'student' ? '学生' : '导师'}：${msg.content}`)
        .join('\n\n');

      const prompt = `请将以下对话压缩成一段简洁的摘要（150字以内），保留关键信息：

${conversationText}

要求：
1. 保留学生的主要问题和困惑
2. 保留导师的核心建议
3. 保留重要的情感信号（热情火花、卡点等）
4. 用第三人称叙述

直接输出摘要，不要前缀：`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5', // 使用Haiku快速生成摘要
        max_tokens: 300,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }],
      });

      const summary = response.content[0].type === 'text' ? response.content[0].text : '';

      logger.info('对话摘要生成成功', {
        originalMessages: messages.length,
        summaryLength: summary.length,
      });

      return summary.trim();
    } catch (error: any) {
      logger.error('生成对话摘要失败:', error);
      // 降级：返回简单的统计信息
      return `前面进行了${messages.length}轮对话，讨论了学生的学习进展和遇到的问题。`;
    }
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

  /**
   * 流式对话方法 - 支持实时返回
   * @param studentId 学生ID
   * @param message 学生消息
   * @param onChunk 接收每个文本块的回调函数
   * @param taskId 任务ID（可选）
   * @param sessionId 会话ID（可选）
   */
  async chatStream(
    studentId: string,
    message: string,
    onChunk: (chunk: string) => void,
    taskId?: string,
    sessionId?: string
  ): Promise<{
    success: boolean;
    sessionId: string;
    fullResponse: string;
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

      // 4. 构建AI Prompt（智能上下文管理）
      const prompt = await this.buildPrompt(context, message, taskId);

      // 5. 调用Claude API（流式）
      logger.info('开始调用Claude API（流式）', {
        model: this.defaultModel,
        promptLength: prompt.length,
      });

      const stream = await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: 600,
        temperature: this.defaultTemperature,
        stream: true, // ✅ 启用流式输出
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // 6. 逐块处理响应
      let fullResponse = '';
      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        if (chunk.type === 'message_start') {
          inputTokens = chunk.message.usage.input_tokens;
        } else if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            fullResponse += text;
            // 实时回调给前端
            onChunk(text);
          }
        } else if (chunk.type === 'message_delta') {
          outputTokens = chunk.usage.output_tokens;
        }
      }

      logger.info('Claude API流式调用成功', {
        model: this.defaultModel,
        inputTokens,
        outputTokens,
        responseLength: fullResponse.length,
      });

      // 7. 检测信号
      const signals = this.detectSignals(message, fullResponse);

      // 8. 保存AI回复
      await this.saveMessage(session.id, 'mentor', fullResponse, {
        tokensUsed: outputTokens,
        signals,
      });

      // 9. 更新会话统计
      await this.updateSessionStats(session.id);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        sessionId: session.id,
        fullResponse,
        tokensUsed: outputTokens,
        responseTime,
        detectedSignals: signals,
        suggestions: this.generateSuggestions(signals),
      };
    } catch (error: any) {
      logger.error('AI导师流式对话失败:', error);
      throw error;
    }
  }

  /**
   * 验证订单归属（用于API路由）
   */
  async verifyOrderOwnership(orderId: string, studentId: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT id FROM orders WHERE id = $1 AND student_id = $2',
        [orderId, studentId]
      );
      return result.length > 0;
    } catch (error: any) {
      logger.error('验证订单归属失败:', error);
      return false;
    }
  }

  /**
   * 获取会话历史（用于API路由）
   */
  async getSessionHistory(orderId: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT
          id, user_id, order_id, trigger_type, sender_type,
          message, created_at
        FROM mentor_sessions
        WHERE order_id = $1
        ORDER BY created_at ASC`,
        [orderId]
      );
      return result;
    } catch (error: any) {
      logger.error('获取会话历史失败:', error);
      return [];
    }
  }

  /**
   * 创建学生消息记录（用于API路由）
   */
  async createStudentMessage(studentId: string, orderId: string, message: string): Promise<string> {
    try {
      const { v4: uuidv4 } = require('uuid');
      const sessionId = uuidv4();

      await query(
        `INSERT INTO mentor_sessions (
          id, user_id, order_id, trigger_type, sender_type, message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [sessionId, studentId, orderId, 'user_message', 'student', message]
      );

      return sessionId;
    } catch (error: any) {
      logger.error('创建学生消息失败:', error);
      throw error;
    }
  }

  /**
   * 处理学生消息并生成AI回复（用于API路由）
   */
  async handleStudentMessage(
    studentId: string,
    orderId: string,
    message: string,
    sessionId: string
  ): Promise<void> {
    try {
      // 调用chat方法生成回复
      await this.chat(studentId, message, orderId, sessionId);
    } catch (error: any) {
      logger.error('处理学生消息失败:', error);
      throw error;
    }
  }

  /**
   * 生成提交前自查清单（T-07场景）
   */
  async generatePreSubmitChecklist(
    studentId: string,
    orderId: string,
    submissionPreview?: string
  ): Promise<string> {
    try {
      // 获取订单信息
      const order = await queryOne(
        `SELECT o.*, p.title, p.description, p.deliverable_type
        FROM orders o
        JOIN projects p ON o.project_id = p.id
        WHERE o.id = $1`,
        [orderId]
      );

      if (!order) {
        throw new Error('订单不存在');
      }

      // 获取上次打回原因（如有）
      const lastRevision = await queryOne(
        `SELECT revision_feedback
        FROM order_submissions
        WHERE order_id = $1 AND revision_feedback IS NOT NULL
        ORDER BY version DESC
        LIMIT 1`,
        [orderId]
      );

      // 构建Prompt
      const prompt = `你是启程平台的AI导师。学生即将提交项目，请帮他生成一个自查清单。

## 项目信息
- 标题：${order.title}
- 描述：${order.description}
- 交付物类型：${order.deliverable_type}

${lastRevision ? `## 上次打回原因
${lastRevision.revision_feedback}` : ''}

${submissionPreview ? `## 学生准备提交的内容
${submissionPreview}` : ''}

请生成一个简洁的自查清单，包含3个核心检查点：
1. 需求匹配度
2. 上次问题是否解决（如有）
3. 交付物完整性

格式要求：
- 每个检查点用✅开头
- 每个检查点包含具体的检查内容
- 总字数控制在200字内
- 语气友好、具体

请生成自查清单：`;

      // 调用AI生成
      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      const checklist = message.content[0].type === 'text' ? message.content[0].text : '';

      // 保存到mentor_sessions
      const { v4: uuidv4 } = require('uuid');
      await query(
        `INSERT INTO mentor_sessions (
          id, user_id, order_id, trigger_type, sender_type, message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [uuidv4(), studentId, orderId, 'pre_submit', 'ai', checklist]
      );

      return checklist;
    } catch (error: any) {
      logger.error('生成自查清单失败:', error);
      throw error;
    }
  }
}

export default new MentorCoreService();
