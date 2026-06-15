import { pool } from '../config/database';
import logger from '../utils/logger';
import { claudeService } from './claudeService';
import { emotionAnalysisService } from './emotionAnalysisService';
import mentorMemoryService from './mentorMemoryService';
import { deepGuidanceService } from './deepGuidanceService';

interface HumanizedResponse {
  content: string;
  tone: string;
  hasEmpathy: boolean;
  hasWarmth: boolean;
  remembersPast: boolean;
  toolRecommendations?: ToolRecommendation[];
  followUpTopics?: string[];
  deepGuidance?: {
    patternDetected: boolean;
    patternName?: string;
    dialogueStage?: string;
    beliefChallenged?: string;
  };
}

interface ToolRecommendation {
  toolName: string;
  whyRecommend: string;
  howToUse: string;
  quickStartSteps: string[];
  websiteUrl: string;
}

interface ConversationPhrase {
  phraseText: string;
  variations: string[];
}

class HumanizedConversationService {
  /**
   * 生成人性化的对话回复（终极版 - 包含深层引导）
   */
  async generateHumanizedResponse(
    studentId: number,
    taskId: number,
    sessionId: number,
    studentMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    currentEmotion: string
  ): Promise<HumanizedResponse> {
    try {
      // 1. 检测深层模式
      const patternDetection = await deepGuidanceService.detectDeepPattern(
        studentId,
        studentMessage,
        conversationHistory,
        currentEmotion
      );

      // 2. 如果检测到深层模式，使用深层引导
      if (patternDetection.detected && patternDetection.pattern) {
        const deepGuidance = await deepGuidanceService.generateDeepGuidance(
          studentId,
          studentMessage,
          conversationHistory,
          patternDetection,
          currentEmotion
        );

        if (deepGuidance.content) {
          return {
            content: deepGuidance.content,
            tone: 'insightful',
            hasEmpathy: true,
            hasWarmth: true,
            remembersPast: true,
            deepGuidance: {
              patternDetected: true,
              patternName: deepGuidance.patternAddressed,
              dialogueStage: deepGuidance.dialogueStage,
              beliefChallenged: deepGuidance.beliefChallenged
            }
          };
        }
      }

      // 3. 如果没有深层模式，使用常规人性化对话
      // （保留原有的逻辑）
      const humanizedContext = await this.getHumanizedContext(sessionId, studentId);
      const struggle = await this.analyzeSpecificStruggle(
        studentMessage,
        conversationHistory,
        currentEmotion
      );
      const phrases = await this.getAppropriatePhrase(currentEmotion, struggle?.situation);
      const memories = await mentorMemoryService.recallMemories(
        studentId,
        {
          currentEmotion,
          searchTags: this.extractTags(studentMessage)
        },
        3
      );
      const toolRecommendations = await this.analyzeAndRecommendTools(
        taskId,
        struggle,
        studentId
      );

      const systemPrompt = this.buildHumanizedSystemPrompt(
        humanizedContext,
        struggle,
        phrases,
        memories,
        toolRecommendations,
        currentEmotion
      );

      const response = await claudeService.chat(
        [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-5).map(m => ({
            role: m.role === 'student' ? 'user' as const : 'assistant' as const,
            content: m.content
          })),
          { role: 'user', content: studentMessage }
        ],
        {
          model: 'claude-sonnet-4-6',
          maxTokens: 2000,
          temperature: 0.8
        }
      );

      await this.updateHumanizedContext(
        sessionId,
        studentId,
        studentMessage,
        response.content,
        struggle
      );

      if (struggle) {
        await this.recordSpecificStruggle(
          studentId,
          taskId,
          sessionId,
          struggle,
          toolRecommendations
        );
      }

      return {
        content: response.content,
        tone: this.detectTone(response.content),
        hasEmpathy: this.hasEmpathy(response.content),
        hasWarmth: this.hasWarmth(response.content),
        remembersPast: memories.relevantMemories.length > 0,
        toolRecommendations,
        followUpTopics: await this.generateFollowUpTopics(studentMessage, struggle),
        deepGuidance: {
          patternDetected: false
        }
      };
    } catch (error: any) {
      logger.error('生成人性化回复失败', { error, studentId, sessionId });
      throw error;
    }
  }

  /**
   * 构建人性化的系统提示
   */
  private buildHumanizedSystemPrompt(
    humanizedContext: any,
    struggle: any,
    phrases: ConversationPhrase | null,
    memories: any,
    toolRecommendations: ToolRecommendation[],
    currentEmotion: string
  ): string {
    let prompt = `你是启程小猫，一个温暖、真诚的朋友和导师。

## 🎯 核心原则：像朋友一样说话

**不要像**：
❌ 一个分析师在观察："检测到你的焦虑情绪，强度7/10"
❌ 一个老师在评估："你达成了里程碑：首次独立解决问题"
❌ 一个系统在记录："根据你的学习档案..."

**要像**：
✅ 一个朋友在陪伴："我感觉到你有点紧张，是不是这个任务让你有点不知道从哪开始？"
✅ 一个伙伴在理解："哇！你刚才自己想出来了！还记得一开始你说'我完全不知道怎么办'吗？"
✅ 一个人在看见："我看到你完成第一步了，是不是松了一口气？其实开始是最难的，你已经迈出去了"

## 💬 说话方式

1. **用"我"，不用"系统"**
   - ✅ "我感觉到..."、"我看到..."、"我记得..."
   - ❌ "系统检测到..."、"根据分析..."

2. **口语化、有情绪**
   - ✅ "嗯嗯"、"哎"、"哇"、"嘿"
   - ✅ "是吧"、"对吧"、"你说呢"
   - ❌ 过于正式的书面语

3. **有停顿、有思考**
   - ✅ "让我想想..."、"嗯..."、"这样吧..."
   - 用"..."表示思考和停顿

4. **记得过去，提起细节**
   - ✅ "上次你说..."、"还记得吗..."
   - ✅ 引用学生的原话

5. **先共情，再解决**
   - 永远先回应情绪，再给方案
   - 不要直接跳到解决方案

## 📊 当前情况

**学生情绪**: ${currentEmotion}

`;

    // 添加合适的开场片段
    if (phrases) {
      prompt += `**建议开场方式**（选一个或改编）:
${phrases.phraseText}

变体：
${phrases.variations.map(v => `- ${v}`).join('\n')}

`;
    }

    // 添加学生的具体困难
    if (struggle) {
      prompt += `**学生的具体困难**:
${struggle.description}

学生原话："${struggle.studentOriginalWords}"

根本原因：${struggle.rootCause}
具体缺少：${struggle.specificGap}

`;
    }

    // 添加记忆
    if (memories.relevantMemories.length > 0) {
      prompt += `## 🧠 我记得的事情

${memories.summary}

**具体记忆**:
${memories.relevantMemories.map((m: any) =>
  `- ${m.memory_title}: ${m.memory_content}`
).join('\n')}

**重要**：自然地提起这些记忆，不要生硬地说"根据记忆..."，而是像朋友聊天一样：
- "上次你说..."
- "还记得吗..."
- "你之前..."

`;
    }

    // 添加工具推荐
    if (toolRecommendations.length > 0) {
      prompt += `## 🛠️ 可以推荐的工具

`;
      toolRecommendations.forEach(tool => {
        prompt += `**${tool.toolName}**
为什么推荐：${tool.whyRecommend}

怎么用：
${tool.howToUse}

快速上手：
${tool.quickStartSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

网址：${tool.websiteUrl}

---

`;
      });

      prompt += `**推荐工具时的方式**：
1. 先分析任务需要什么
2. 再推荐具体工具
3. 说明为什么推荐（不是"这个工具很好"，而是"这个能帮你解决X问题"）
4. 给出具体步骤（1、2、3...）
5. 鼓励尝试："要不要试试？"、"我觉得这个能帮到你"

`;
    }

    // 添加关系上下文
    if (humanizedContext) {
      prompt += `## 💝 我们的关系

关系阶段：${humanizedContext.relationship_stage}
信任程度：${humanizedContext.trust_level}

`;

      if (humanizedContext.important_moments && humanizedContext.important_moments.length > 0) {
        prompt += `**重要时刻**：
${humanizedContext.important_moments.map((m: any) =>
  `- ${m.moment}: ${m.detail} (${m.date})`
).join('\n')}

`;
      }

      if (humanizedContext.shared_experiences && humanizedContext.shared_experiences.length > 0) {
        prompt += `**我们一起经历的**：
${humanizedContext.shared_experiences.map((e: string) => `- ${e}`).join('\n')}

`;
      }

      if (humanizedContext.memorable_quotes && humanizedContext.memorable_quotes.length > 0) {
        prompt += `**学生说过的话**（可以引用）：
${humanizedContext.memorable_quotes.map((q: any) =>
  `- "${q.quote}" (${q.context})`
).join('\n')}

`;
      }
    }

    prompt += `
## 📝 回复要求

1. **50-200字**（不要太长，像聊天一样）

2. **结构**：
   - 先共情（回应情绪）
   - 再分析（如果需要）
   - 然后给方案（具体的、可操作的）
   - 最后陪伴（"我等你消息"、"有问题随时找我"）

3. **语气**：
   - 温暖、真诚、口语化
   - 有情绪、有共鸣
   - 像朋友聊天

4. **禁止**：
   - ❌ 不要说"根据你的情况..."
   - ❌ 不要说"系统分析..."
   - ❌ 不要用过于正式的语言
   - ❌ 不要直接跳到解决方案（先共情！）
   - ❌ 不要泛泛而谈（要具体！）

5. **必须**：
   - ✅ 用"我"说话
   - ✅ 提起过去（如果有记忆）
   - ✅ 给具体步骤（1、2、3...）
   - ✅ 表达陪伴（"我陪着你"、"我等你"）

现在，用这种方式回复学生。记住：你是一个朋友，不是一个系统。
`;

    return prompt;
  }

  /**
   * 分析学生的具体困难
   */
  private async analyzeSpecificStruggle(
    studentMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    currentEmotion: string
  ): Promise<any> {
    // 检测困难信号词
    const struggleSignals = [
      '不会', '不知道', '不懂', '看不懂', '不理解',
      '怎么办', '怎么做', '太难', '做不了', '完成不了',
      '卡住了', '不行', '失败', '错误', '报错'
    ];

    const hasStruggle = struggleSignals.some(signal => studentMessage.includes(signal));

    if (!hasStruggle) {
      return null;
    }

    // 使用AI分析具体困难
    const prompt = `分析学生的具体困难。

学生消息：${studentMessage}

最近对话：
${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

当前情绪：${currentEmotion}

请识别：
1. 具体困难是什么（不要抽象，要具体）
2. 学生的原话（直接引用）
3. 根本原因（lack_of_knowledge, lack_of_tool, lack_of_confidence, unclear_requirement）
4. 具体缺少什么（如"不会用React Hooks"、"不知道怎么写登录功能"）
5. 当前情境（first_time, stuck, frustrated, confused, anxious）

返回JSON：
{
  "description": "具体困难描述",
  "studentOriginalWords": "学生原话",
  "rootCause": "根本原因",
  "specificGap": "具体缺少什么",
  "situation": "当前情境"
}`;

    try {
      const response = await claudeService.chat(
        [{ role: 'user', content: prompt }],
        {
          model: 'claude-haiku-4-5',
          maxTokens: 500,
          temperature: 0.3
        }
      );

      return JSON.parse(response.content);
    } catch (error: any) {
      logger.error('分析具体困难失败', { error });
      return null;
    }
  }

  /**
   * 分析任务并推荐工具
   */
  private async analyzeAndRecommendTools(
    taskId: number,
    struggle: any,
    studentId: number
  ): Promise<ToolRecommendation[]> {
    try {
      // 获取任务信息
      const taskResult = await pool.query(
        'SELECT title, description, requirements FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        return [];
      }

      const task = taskResult.rows[0];

      // 分析任务类型
      const taskType = this.detectTaskType(task.title, task.description);

      // 获取推荐的工具
      const toolsResult = await pool.query(
        `SELECT * FROM mentor_tool_recommendations
         WHERE suitable_for @> $1::jsonb
         ORDER BY times_recommended DESC, success_rate DESC NULLS LAST
         LIMIT 3`,
        [JSON.stringify({ task_type: [taskType] })]
      );

      return toolsResult.rows.map(row => ({
        toolName: row.tool_name,
        whyRecommend: row.why_recommend,
        howToUse: row.how_to_use,
        quickStartSteps: row.quick_start_steps,
        websiteUrl: row.website_url
      }));
    } catch (error: any) {
      logger.error('分析任务并推荐工具失败', { error, taskId });
      return [];
    }
  }

  /**
   * 检测任务类型
   */
  private detectTaskType(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('ui') || text.includes('设计') || text.includes('界面') || text.includes('原型')) {
      return 'ui_design';
    }
    if (text.includes('小程序') || text.includes('前端') || text.includes('页面')) {
      return 'frontend';
    }
    if (text.includes('后端') || text.includes('api') || text.includes('接口')) {
      return 'backend';
    }
    if (text.includes('数据') || text.includes('分析')) {
      return 'data_analysis';
    }

    return 'general';
  }

  /**
   * 获取合适的对话片段
   */
  private async getAppropriatePhrase(
    emotion: string,
    situation?: string
  ): Promise<ConversationPhrase | null> {
    try {
      const query = `
        SELECT phrase_text, variations
        FROM mentor_conversation_phrases
        WHERE student_emotion = $1
        ${situation ? 'AND situation = $2' : ''}
        ORDER BY RANDOM()
        LIMIT 1
      `;

      const params = situation ? [emotion, situation] : [emotion];
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      return {
        phraseText: result.rows[0].phrase_text,
        variations: result.rows[0].variations || []
      };
    } catch (error: any) {
      logger.error('获取对话片段失败', { error, emotion, situation });
      return null;
    }
  }

  /**
   * 获取人性化上下文
   */
  private async getHumanizedContext(sessionId: number, studentId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT * FROM mentor_humanized_context WHERE session_id = $1',
        [sessionId]
      );

      if (result.rows.length === 0) {
        // 创建新的上下文
        await pool.query(
          `INSERT INTO mentor_humanized_context (session_id, student_id)
           VALUES ($1, $2)`,
          [sessionId, studentId]
        );
        return {
          relationship_stage: 'initial',
          trust_level: 0.5,
          important_moments: [],
          shared_experiences: [],
          memorable_quotes: []
        };
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('获取人性化上下文失败', { error, sessionId });
      return null;
    }
  }

  /**
   * 更新人性化上下文
   */
  private async updateHumanizedContext(
    sessionId: number,
    studentId: number,
    studentMessage: string,
    mentorResponse: string,
    struggle: any
  ): Promise<void> {
    try {
      // 检测是否有值得记住的话
      const memorableQuote = this.extractMemorableQuote(studentMessage);

      // 检测是否有重要时刻
      const importantMoment = this.detectImportantMoment(studentMessage, mentorResponse, struggle);

      // 检测是否有共同经历
      const sharedExperience = this.detectSharedExperience(studentMessage, mentorResponse);

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (memorableQuote) {
        updates.push(`memorable_quotes = COALESCE(memorable_quotes, '[]'::jsonb) || $${paramIndex}::jsonb`);
        values.push(JSON.stringify([memorableQuote]));
        paramIndex++;
      }

      if (importantMoment) {
        updates.push(`important_moments = COALESCE(important_moments, '[]'::jsonb) || $${paramIndex}::jsonb`);
        values.push(JSON.stringify([importantMoment]));
        paramIndex++;
      }

      if (sharedExperience) {
        updates.push(`shared_experiences = array_append(COALESCE(shared_experiences, ARRAY[]::text[]), $${paramIndex})`);
        values.push(sharedExperience);
        paramIndex++;
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(sessionId);

        const query = `
          UPDATE mentor_humanized_context
          SET ${updates.join(', ')}
          WHERE session_id = $${paramIndex}
        `;

        await pool.query(query, values);
      }
    } catch (error: any) {
      logger.error('更新人性化上下文失败', { error, sessionId });
    }
  }

  /**
   * 提取值得记住的话
   */
  private extractMemorableQuote(message: string): any | null {
    const emotionalPhrases = [
      '我觉得我', '我感觉', '我害怕', '我担心',
      '我不会', '我做不了', '太难了', '我想放弃'
    ];

    for (const phrase of emotionalPhrases) {
      if (message.includes(phrase)) {
        return {
          quote: message,
          context: '表达了情绪和想法',
          date: new Date().toISOString().split('T')[0]
        };
      }
    }

    return null;
  }

  /**
   * 检测重要时刻
   */
  private detectImportantMoment(studentMessage: string, mentorResponse: string, struggle: any): any | null {
    const breakthroughPhrases = ['我明白了', '我懂了', '原来是这样', '我知道了', '我会了'];
    const isBreakthrough = breakthroughPhrases.some(phrase => studentMessage.includes(phrase));

    if (isBreakthrough) {
      return {
        moment: 'breakthrough',
        detail: struggle ? struggle.description : '理解了新概念',
        date: new Date().toISOString().split('T')[0]
      };
    }

    return null;
  }

  /**
   * 检测共同经历
   */
  private detectSharedExperience(studentMessage: string, mentorResponse: string): string | null {
    if (mentorResponse.includes('我们一起') || mentorResponse.includes('一起解决')) {
      return `一起解决了问题：${studentMessage.substring(0, 30)}...`;
    }

    return null;
  }

  /**
   * 记录具体困难
   */
  private async recordSpecificStruggle(
    studentId: number,
    taskId: number,
    sessionId: number,
    struggle: any,
    toolRecommendations: ToolRecommendation[]
  ): Promise<void> {
    try {
      const toolId = toolRecommendations.length > 0
        ? await this.getToolId(toolRecommendations[0].toolName)
        : null;

      await pool.query(
        `INSERT INTO mentor_student_specific_struggles
         (student_id, task_id, session_id, struggle_description, student_original_words, root_cause, specific_gap, tool_recommended)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          studentId,
          taskId,
          sessionId,
          struggle.description,
          struggle.studentOriginalWords,
          struggle.rootCause,
          struggle.specificGap,
          toolId
        ]
      );
    } catch (error: any) {
      logger.error('记录具体困难失败', { error });
    }
  }

  /**
   * 获取工具ID
   */
  private async getToolId(toolName: string): Promise<number | null> {
    try {
      const result = await pool.query(
        'SELECT id FROM mentor_tool_recommendations WHERE tool_name = $1',
        [toolName]
      );
      return result.rows.length > 0 ? result.rows[0].id : null;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * 生成跟进话题
   */
  private async generateFollowUpTopics(studentMessage: string, struggle: any): Promise<string[]> {
    const topics: string[] = [];

    if (struggle) {
      topics.push(`问问${struggle.specificGap}的进展`);
      topics.push('看看工具用得怎么样');
    }

    return topics;
  }

  /**
   * 检测语气
   */
  private detectTone(content: string): string {
    if (content.includes('哇') || content.includes('太棒了')) return 'excited';
    if (content.includes('嗯嗯') || content.includes('我懂')) return 'understanding';
    if (content.includes('别担心') || content.includes('没关系')) return 'comforting';
    return 'supportive';
  }

  /**
   * 检测是否有共情
   */
  private hasEmpathy(content: string): boolean {
    const empathyPhrases = ['我理解', '我懂', '我明白', '我知道', '我感觉到'];
    return empathyPhrases.some(phrase => content.includes(phrase));
  }

  /**
   * 检测是否有温度
   */
  private hasWarmth(content: string): boolean {
    const warmthPhrases = ['陪着你', '一起', '我等你', '别担心', '没关系', '加油'];
    return warmthPhrases.some(phrase => content.includes(phrase));
  }

  /**
   * 提取标签
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const keywords = ['代码', '设计', 'UI', '功能', 'bug', '错误', '不会', '困难'];
    keywords.forEach(keyword => {
      if (content.includes(keyword)) tags.push(keyword);
    });
    return tags;
  }
}

export const humanizedConversationService = new HumanizedConversationService();
