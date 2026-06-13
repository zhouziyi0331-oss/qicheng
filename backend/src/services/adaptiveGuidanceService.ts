import { pool } from '../config/database';
import logger from '../utils/logger';
import { claudeService } from './claudeService';
import { emotionAnalysisService } from './emotionAnalysisService';
import { growthTrackingService } from './growthTrackingService';
import { mentorMemoryService } from './mentorMemoryService';

interface StudentContext {
  studentId: number;
  taskId: number;
  sessionId: number;
  currentMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  currentStage: string;
}

interface GuidanceResponse {
  content: string;
  tone: string;
  approach: string;
  encouragement?: string;
  celebrationMessage?: string;
  detectedEmotion?: string;
  emotionIntensity?: number;
  milestoneAchieved?: boolean;
  adaptations: {
    emotionalSupport: boolean;
    simplification: boolean;
    challenge: boolean;
    celebration: boolean;
  };
}

interface LearningProfile {
  learningStyle: any;
  preferredPace: string;
  technicalSkills: any;
  softSkills: any;
  commonEmotions: any;
  stressTriggers: any;
  motivationFactors: any;
  preferredGuidanceStyle: string;
  responseToFeedback: any;
}

class AdaptiveGuidanceService {
  /**
   * 生成自适应引导回复
   */
  async generateAdaptiveGuidance(
    context: StudentContext
  ): Promise<GuidanceResponse> {
    try {
      // 1. 分析当前情绪
      const emotionResult = await emotionAnalysisService.analyzeEmotion(
        context.studentId,
        context.taskId,
        context.sessionId,
        null,
        context.currentMessage,
        this.buildContextSummary(context.conversationHistory)
      );

      // 2. 检测成长里程碑
      const recentEmotions = await emotionAnalysisService.getRecentEmotions(
        context.studentId,
        5
      );
      const milestone = await growthTrackingService.detectAndRecordMilestone(
        context.studentId,
        context.taskId,
        context.sessionId,
        {
          currentMessage: context.currentMessage,
          previousMessages: context.conversationHistory,
          currentEmotion: emotionResult.emotion,
          previousEmotions: recentEmotions
        }
      );

      // 3. 召回相关记忆
      const memoryRecall = await mentorMemoryService.recallMemories(
        context.studentId,
        {
          currentEmotion: emotionResult.emotion,
          searchTags: this.extractTags(context.currentMessage)
        },
        3
      );

      // 4. 获取学习档案
      const profile = await this.getStudentProfile(context.studentId);

      // 5. 获取情绪响应策略
      const emotionStrategy = await emotionAnalysisService.getResponseStrategy(
        emotionResult.emotion
      );

      // 6. 获取对话上下文
      const conversationContext = await emotionAnalysisService.getConversationContext(
        context.sessionId
      );

      // 7. 生成自适应回复
      const guidance = await this.generateGuidanceWithAI(
        context,
        emotionResult,
        emotionStrategy,
        memoryRecall,
        profile,
        conversationContext,
        milestone
      );

      // 8. 异步提取并保存新记忆
      this.extractAndSaveMemories(context, emotionResult.emotion).catch(err => {
        logger.error('提取记忆失败', { error: err });
      });

      return guidance;
    } catch (error: unknown) {
      logger.error('生成自适应引导失败', { error, context });
      // 返回基础回复
      return {
        content: '我理解你的问题，让我们一起来解决它。',
        tone: 'supportive',
        approach: 'direct',
        adaptations: {
          emotionalSupport: false,
          simplification: false,
          challenge: false,
          celebration: false
        }
      };
    }
  }

  /**
   * 使用AI生成自适应引导
   */
  private async generateGuidanceWithAI(
    context: StudentContext,
    emotionResult: any,
    emotionStrategy: any,
    memoryRecall: any,
    profile: LearningProfile | null,
    conversationContext: any,
    milestone: any
  ): Promise<GuidanceResponse> {
    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(
      emotionResult,
      emotionStrategy,
      memoryRecall,
      profile,
      conversationContext,
      milestone
    );

    // 构建对话历史
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...context.conversationHistory.slice(-5).map(m => ({
        role: m.role === 'student' ? 'user' as const : 'assistant' as const,
        content: m.content
      })),
      { role: 'user' as const, content: context.currentMessage }
    ];

    // 调用AI
    const response = await claudeService.chat(messages, {
      model: this.selectModel(emotionResult.emotion, context.currentStage),
      maxTokens: 2000,
      temperature: 0.7
    });

    // 解析响应
    return {
      content: response.content,
      tone: emotionStrategy?.toneGuidelines || 'supportive',
      approach: conversationContext?.guidance_approach || 'socratic',
      encouragement: this.extractEncouragement(response.content),
      celebrationMessage: milestone?.celebration_message,
      detectedEmotion: emotionResult.emotion,
      emotionIntensity: emotionResult.intensity,
      milestoneAchieved: !!milestone,
      adaptations: {
        emotionalSupport: ['anxious', 'frustrated', 'overwhelmed'].includes(emotionResult.emotion),
        simplification: conversationContext?.needs_simplification || false,
        challenge: conversationContext?.needs_challenge || false,
        celebration: !!milestone
      }
    };
  }

  /**
   * 构建系统提示
   */
  private buildSystemPrompt(
    emotionResult: any,
    emotionStrategy: any,
    memoryRecall: any,
    profile: LearningProfile | null,
    conversationContext: any,
    milestone: any
  ): string {
    let prompt = `你是启程小猫，一位温暖、有洞察力的AI导师。你的目标是通过启发式引导帮助学生成长。

## 当前学生状态

**情绪状态**: ${emotionResult.emotion}（强度: ${emotionResult.intensity.toFixed(2)}）
${emotionResult.signals.length > 0 ? `**情绪信号**: ${emotionResult.signals.map((s: any) => s.word).join('、')}` : ''}

**情绪响应策略**:
${emotionStrategy ? `
- 响应方式: ${emotionStrategy.responseApproach}
- 语气指南: ${emotionStrategy.toneGuidelines}
- 示例短语: ${emotionStrategy.examplePhrases.join('、')}
` : '使用温暖、支持性的语气'}

`;

    // 添加记忆信息
    if (memoryRecall.relevantMemories.length > 0) {
      prompt += `## 我记得的关于这位学生

${memoryRecall.summary}

**相关记忆**:
${memoryRecall.relevantMemories.slice(0, 3).map((m: any) =>
  `- ${m.memory_title}: ${m.memory_content}`
).join('\n')}

`;

      if (memoryRecall.insights.length > 0) {
        prompt += `**洞察**:
${memoryRecall.insights.map((i: string) => `- ${i}`).join('\n')}

`;
      }
    }

    // 添加学习档案
    if (profile) {
      prompt += `## 学习档案

**学习风格**: ${JSON.stringify(profile.learningStyle)}
**偏好节奏**: ${profile.preferredPace}
**引导风格偏好**: ${profile.preferredGuidanceStyle}
${profile.stressTriggers ? `**压力触发点**: ${JSON.stringify(profile.stressTriggers)}` : ''}
${profile.motivationFactors ? `**激励因素**: ${JSON.stringify(profile.motivationFactors)}` : ''}

`;
    }

    // 添加对话上下文
    if (conversationContext) {
      prompt += `## 对话上下文

**对话深度**: ${conversationContext.conversation_depth}层
**当前信心水平**: ${conversationContext.current_confidence_level?.toFixed(2) || '未知'}
${conversationContext.current_struggle_area ? `**当前困难**: ${conversationContext.current_struggle_area}` : ''}
${conversationContext.needs_encouragement ? '**需要鼓励**: 是' : ''}
${conversationContext.needs_simplification ? '**需要简化**: 是' : ''}
${conversationContext.needs_challenge ? '**需要挑战**: 是' : ''}

`;
    }

    // 添加里程碑信息
    if (milestone) {
      prompt += `## 🎉 刚刚达成里程碑！

**${milestone.milestone_title}**
${milestone.milestone_description}

请在回复中自然地庆祝这个成就，让学生感受到你看到了他们的成长。

`;
    }

    // 添加引导原则
    prompt += `## 引导原则

1. **启发式教学**: 不直接给答案，用问题引导学生思考
2. **情绪共鸣**: 先回应情绪，再解决问题
3. **个性化**: 根据学生的学习风格和历史调整方式
4. **成长视角**: 看到学生的进步，及时肯定
5. **适度挑战**: 在学生能力范围内提供适当挑战
6. **记忆连续性**: 引用之前的对话和经历，让学生感受到被理解

## 回复要求

- 50-150字
- 温暖、真诚、具体
- 根据情绪调整语气和方法
- 包含1-2个启发性问题
- 如果达成里程碑，自然地表达庆祝
`;

    return prompt;
  }

  /**
   * 选择合适的AI模型
   */
  private selectModel(emotion: string, stage: string): string {
    // 情绪敏感场景使用Sonnet（更好的理解能力）
    if (['anxious', 'frustrated', 'overwhelmed'].includes(emotion)) {
      return 'claude-sonnet-4-6';
    }

    // 质量审核阶段使用Sonnet
    if (stage === 'quality_review') {
      return 'claude-sonnet-4-6';
    }

    // 其他场景使用Haiku（成本优化）
    return 'claude-haiku-4-5';
  }

  /**
   * 提取鼓励语句
   */
  private extractEncouragement(content: string): string | undefined {
    const encouragementPhrases = [
      '你做得很好',
      '太棒了',
      '很好的想法',
      '你已经',
      '我看到了你的',
      '继续加油'
    ];

    for (const phrase of encouragementPhrases) {
      if (content.includes(phrase)) {
        // 提取包含鼓励短语的句子
        const sentences = content.split(/[。！？]/);
        const encouragingSentence = sentences.find(s => s.includes(phrase));
        if (encouragingSentence) {
          return encouragingSentence.trim();
        }
      }
    }

    return undefined;
  }

  /**
   * 构建上下文摘要
   */
  private buildContextSummary(history: Array<{ role: string; content: string }>): string {
    return history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
  }

  /**
   * 提取标签
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // 技术关键词
    const techKeywords = ['代码', '函数', '变量', 'bug', '错误', 'API', '数据库'];
    techKeywords.forEach(keyword => {
      if (content.includes(keyword)) tags.push(keyword);
    });

    // 情绪关键词
    const emotionKeywords = ['焦虑', '困惑', '兴奋', '沮丧'];
    emotionKeywords.forEach(keyword => {
      if (content.includes(keyword)) tags.push(keyword);
    });

    return tags;
  }

  /**
   * 获取学生档案
   */
  private async getStudentProfile(studentId: number): Promise<LearningProfile | null> {
    try {
      const query = `SELECT * FROM student_learning_profiles WHERE student_id = $1`;
      const result = await pool.query(query, [studentId]);
      return result.rows[0] || null;
    } catch (error: unknown) {
      logger.error('获取学生档案失败', { error, studentId });
      return null;
    }
  }

  /**
   * 异步提取并保存记忆
   */
  private async extractAndSaveMemories(
    context: StudentContext,
    currentEmotion: string
  ): Promise<void> {
    try {
      await mentorMemoryService.extractMemoryFromConversation(
        context.studentId,
        context.taskId,
        context.sessionId,
        context.conversationHistory,
        currentEmotion
      );
    } catch (error: unknown) {
      logger.error('提取并保存记忆失败', { error });
    }
  }

  /**
   * 更新学习档案
   */
  async updateLearningProfile(
    studentId: number,
    updates: {
      learningStyle?: any;
      preferredPace?: string;
      technicalSkills?: any;
      softSkills?: any;
      preferredGuidanceStyle?: string;
    }
  ): Promise<void> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.learningStyle) {
        setClauses.push(`learning_style = $${paramIndex}`);
        values.push(JSON.stringify(updates.learningStyle));
        paramIndex++;
      }

      if (updates.preferredPace) {
        setClauses.push(`preferred_pace = $${paramIndex}`);
        values.push(updates.preferredPace);
        paramIndex++;
      }

      if (updates.technicalSkills) {
        setClauses.push(`technical_skills = $${paramIndex}`);
        values.push(JSON.stringify(updates.technicalSkills));
        paramIndex++;
      }

      if (updates.softSkills) {
        setClauses.push(`soft_skills = $${paramIndex}`);
        values.push(JSON.stringify(updates.softSkills));
        paramIndex++;
      }

      if (updates.preferredGuidanceStyle) {
        setClauses.push(`preferred_guidance_style = $${paramIndex}`);
        values.push(updates.preferredGuidanceStyle);
        paramIndex++;
      }

      if (setClauses.length === 0) return;

      setClauses.push(`updated_at = NOW()`);
      values.push(studentId);

      const query = `
        UPDATE student_learning_profiles
        SET ${setClauses.join(', ')}
        WHERE student_id = $${paramIndex}
      `;

      await pool.query(query, values);
    } catch (error: unknown) {
      logger.error('更新学习档案失败', { error, studentId, updates });
    }
  }

  /**
   * 分析学习模式并更新档案
   */
  async analyzeAndUpdateLearningPatterns(
    studentId: number,
    sessionId: number
  ): Promise<void> {
    try {
      // 获取最近的情绪历史
      const emotions = await emotionAnalysisService.getRecentEmotions(studentId, 20);

      // 分析常见情绪
      const emotionCounts: { [key: string]: number } = {};
      emotions.forEach(e => {
        emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      });

      // 识别压力触发点
      const stressTriggers: string[] = [];
      if (emotionCounts['anxious'] >= 3) stressTriggers.push('新挑战');
      if (emotionCounts['overwhelmed'] >= 2) stressTriggers.push('复杂任务');
      if (emotionCounts['frustrated'] >= 3) stressTriggers.push('技术难题');

      // 识别激励因素
      const motivationFactors: string[] = [];
      if (emotionCounts['excited'] >= 2) motivationFactors.push('突破时刻');
      if (emotionCounts['proud'] >= 2) motivationFactors.push('完成成就');
      if (emotionCounts['confident'] >= 3) motivationFactors.push('掌握技能');

      // 更新档案
      await pool.query(
        `UPDATE student_learning_profiles
         SET
           common_emotions = $1,
           stress_triggers = $2,
           motivation_factors = $3,
           updated_at = NOW()
         WHERE student_id = $4`,
        [
          JSON.stringify(emotionCounts),
          JSON.stringify(stressTriggers),
          JSON.stringify(motivationFactors),
          studentId
        ]
      );
    } catch (error: unknown) {
      logger.error('分析学习模式失败', { error, studentId });
    }
  }

  /**
   * 获取自适应引导建议
   */
  async getGuidanceRecommendations(
    studentId: number,
    sessionId: number
  ): Promise<{
    recommendedApproach: string;
    recommendedTone: string;
    shouldSimplify: boolean;
    shouldChallenge: boolean;
    shouldEncourage: boolean;
    reasoning: string;
  }> {
    try {
      const profile = await this.getStudentProfile(studentId);
      const conversationContext = await emotionAnalysisService.getConversationContext(sessionId);
      const recentEmotions = await emotionAnalysisService.getRecentEmotions(studentId, 5);

      // 分析当前状态
      const currentEmotion = recentEmotions[0]?.emotion || 'neutral';
      const confidenceLevel = conversationContext?.current_confidence_level || 0.5;

      // 决定引导方式
      let recommendedApproach = 'socratic';
      let recommendedTone = 'supportive';
      let shouldSimplify = false;
      let shouldChallenge = false;
      let shouldEncourage = false;
      let reasoning = '';

      if (['anxious', 'overwhelmed'].includes(currentEmotion)) {
        recommendedApproach = 'direct';
        recommendedTone = 'calm';
        shouldSimplify = true;
        shouldEncourage = true;
        reasoning = '学生当前感到焦虑/不堪重负，需要直接指导和简化';
      } else if (currentEmotion === 'frustrated') {
        recommendedApproach = 'reframe';
        recommendedTone = 'empathetic';
        shouldEncourage = true;
        reasoning = '学生感到沮丧，需要换个角度看问题';
      } else if (currentEmotion === 'confused') {
        recommendedApproach = 'clarifying';
        recommendedTone = 'patient';
        shouldSimplify = true;
        reasoning = '学生困惑，需要澄清和简化';
      } else if (['confident', 'excited'].includes(currentEmotion) && confidenceLevel > 0.7) {
        recommendedApproach = 'challenging';
        recommendedTone = 'encouraging';
        shouldChallenge = true;
        reasoning = '学生自信且兴奋，可以提供更多挑战';
      } else {
        recommendedApproach = profile?.preferredGuidanceStyle || 'socratic';
        recommendedTone = 'supportive';
        reasoning = '使用学生偏好的引导方式';
      }

      return {
        recommendedApproach,
        recommendedTone,
        shouldSimplify,
        shouldChallenge,
        shouldEncourage,
        reasoning
      };
    } catch (error: unknown) {
      logger.error('获取引导建议失败', { error, studentId });
      return {
        recommendedApproach: 'socratic',
        recommendedTone: 'supportive',
        shouldSimplify: false,
        shouldChallenge: false,
        shouldEncourage: true,
        reasoning: '使用默认引导方式'
      };
    }
  }
}

export const adaptiveGuidanceService = new AdaptiveGuidanceService();
