import { pool } from '../config/database';
import { mentorRouterService } from './mentorRouterService';
import { pblAgentService } from './pblAgentService';
import { v4 as uuidv4 } from 'uuid';

// 统一导师服务
export class UnifiedMentorService {
  // 统一对话接口
  async chat(userId: string, message: string, options?: any) {
    const sessionId = options?.session_id || uuidv4();

    // 1. 保存用户消息
    await this.saveMessage(userId, sessionId, 'user', message);

    // 2. 获取用户上下文
    const context = await mentorRouterService.getUserContext(userId);

    // 3. 检查用户的导师模式偏好
    const mentorMode = context.mentor_mode;

    // 4. 如果用户设置了固定模式且不自动切换
    if (mentorMode?.preferred_mode && !mentorMode.auto_switch) {
      return await this.directRoute(
        userId,
        sessionId,
        message,
        mentorMode.preferred_mode,
        context
      );
    }

    // 5. 智能路由分析
    const analysis = await mentorRouterService.analyzeMessageType(message, context);

    // 6. 记录路由决策
    await mentorRouterService.logRouting(userId, analysis, sessionId);

    // 7. 根据分析结果路由
    if (analysis.suggested_mentor === 'both') {
      // 协同模式
      return await this.coordinatedResponse(userId, sessionId, message, context, analysis);
    } else if (analysis.suggested_mentor === 'emotional') {
      // 情感导师
      return await this.emotionalMentorResponse(userId, sessionId, message, context);
    } else {
      // 项目导师
      return await this.projectMentorResponse(userId, sessionId, message, context);
    }
  }

  // 直接路由（用户指定模式）
  private async directRoute(
    userId: string,
    sessionId: string,
    message: string,
    mode: string,
    context: any
  ) {
    if (mode === 'emotional') {
      return await this.emotionalMentorResponse(userId, sessionId, message, context);
    } else if (mode === 'project') {
      return await this.projectMentorResponse(userId, sessionId, message, context);
    } else {
      // hybrid
      return await this.coordinatedResponse(userId, sessionId, message, context, {
        suggested_mentor: 'both',
        reason: '用户选择协同模式'
      });
    }
  }

  // 情感导师响应
  private async emotionalMentorResponse(
    userId: string,
    sessionId: string,
    message: string,
    context: any
  ) {
    // 调用现有的情感导师服务（启程小猫）
    // 这里假设已有的导师服务，需要适配
    const response = await this.callEmotionalMentor(userId, message, context);

    // 保存响应
    await this.saveMessage(userId, sessionId, 'emotional_mentor', response.content, {
      mentor_type: 'emotional',
      message_type: response.type || 'answer',
      emotional_tone: response.tone || 'supportive'
    });

    // 检查是否需要建议切换到项目导师
    const switchSuggestion = await this.checkSwitchSuggestion(
      userId,
      message,
      response,
      'emotional',
      context
    );

    return {
      content: response.content,
      mentor_type: 'emotional',
      mentor_name: '启程小猫',
      mentor_avatar: '🐱',
      switch_suggestion: switchSuggestion,
      session_id: sessionId
    };
  }

  // 项目导师响应
  private async projectMentorResponse(
    userId: string,
    sessionId: string,
    message: string,
    context: any
  ) {
    // 获取或创建项目
    let projectId = context.active_project?.id;

    if (!projectId) {
      // 如果没有活跃项目，检查是否需要创建
      if (this.isProjectInitiationMessage(message)) {
        const project = await pblAgentService.initializeProject(userId, message);
        projectId = project.project.id;

        // 保存响应
        await this.saveMessage(userId, sessionId, 'project_mentor', project.opening_questions, {
          mentor_type: 'project',
          message_type: 'question'
        });

        return {
          content: project.opening_questions,
          mentor_type: 'project',
          mentor_name: '项目导师',
          mentor_avatar: '🎓',
          project_id: projectId,
          session_id: sessionId
        };
      } else {
        // 引导用户明确项目
        const guidanceMessage = "我是项目导师，专门帮助你完成实际项目。你想做什么项目呢？或者遇到了什么具体的工作问题？";

        await this.saveMessage(userId, sessionId, 'project_mentor', guidanceMessage, {
          mentor_type: 'project',
          message_type: 'question'
        });

        return {
          content: guidanceMessage,
          mentor_type: 'project',
          mentor_name: '项目导师',
          mentor_avatar: '🎓',
          session_id: sessionId
        };
      }
    }

    // 进行苏格拉底式对话
    const response = await pblAgentService.conductSocraticDialogue(
      projectId,
      message,
      context
    );

    // 保存响应
    await this.saveMessage(userId, sessionId, 'project_mentor', response.content, {
      mentor_type: 'project',
      message_type: response.type,
      socratic_technique: response.technique
    });

    return {
      content: response.content,
      mentor_type: 'project',
      mentor_name: '项目导师',
      mentor_avatar: '🎓',
      project_id: projectId,
      session_id: sessionId
    };
  }

  // 协同响应
  private async coordinatedResponse(
    userId: string,
    sessionId: string,
    message: string,
    context: any,
    analysis: any
  ) {
    // 1. 情感导师建立连接（简短模式）
    const emotionalResponse = await this.callEmotionalMentor(
      userId,
      message,
      { ...context, mode: 'brief' }
    );

    // 2. 生成过渡语
    const transition = await mentorRouterService.generateTransition(
      emotionalResponse,
      null
    );

    // 3. 项目导师提供实践方向
    let projectResponse;
    if (context.active_project) {
      projectResponse = await pblAgentService.conductSocraticDialogue(
        context.active_project.id,
        message,
        { ...context, emotional_context: emotionalResponse }
      );
    } else {
      // 引导创建项目
      projectResponse = {
        content: "我们可以从一个小项目开始。你想解决什么具体问题？或者想学习什么技能？",
        type: 'question'
      };
    }

    // 4. 整合响应
    const coordinatedContent = `${emotionalResponse.content}\n\n${transition}\n\n${projectResponse.content}`;

    // 5. 保存协同消息
    await this.saveMessage(userId, sessionId, 'coordinated', coordinatedContent, {
      mentor_type: 'coordinated',
      emotional_content: emotionalResponse.content,
      project_content: projectResponse.content,
      transition_text: transition
    });

    return {
      content: coordinatedContent,
      mentor_type: 'coordinated',
      emotional_part: {
        content: emotionalResponse.content,
        mentor_name: '启程小猫',
        mentor_avatar: '🐱'
      },
      transition: transition,
      project_part: {
        content: projectResponse.content,
        mentor_name: '项目导师',
        mentor_avatar: '🎓'
      },
      session_id: sessionId
    };
  }

  // 调用情感导师（适配现有系统）
  private async callEmotionalMentor(userId: string, message: string, context: any) {
    // 这里需要调用现有的导师服务
    // 暂时返回模拟响应

    // TODO: 集成现有的导师服务
    // const response = await existingMentorService.chat(userId, message);

    // 模拟响应
    return {
      content: `我听到你说"${message}"。能多说说吗？我想更好地理解你的感受。`,
      type: 'question',
      tone: 'empathetic'
    };
  }

  // 检查是否需要建议切换导师
  private async checkSwitchSuggestion(
    userId: string,
    userMessage: string,
    mentorResponse: any,
    currentMentor: string,
    context: any
  ) {
    // 如果情感导师检测到可以转化为项目
    if (currentMentor === 'emotional') {
      const projectIndicators = [
        '想做', '想学', '想实现', '怎么做', '如何',
        '项目', '代码', '开发', '设计'
      ];

      const hasProjectIntent = projectIndicators.some(indicator =>
        userMessage.includes(indicator)
      );

      if (hasProjectIntent) {
        return {
          suggested: true,
          to_mentor: 'project',
          reason: '看起来你有具体的想法想要实现，要不要切换到项目导师，我们一起做个项目？',
          confidence: 0.8
        };
      }
    }

    // 如果项目导师检测到情感困难
    if (currentMentor === 'project') {
      const emotionalIndicators = [
        '沮丧', '困难', '不会', '太难', '放弃',
        '累', '压力', '焦虑'
      ];

      const hasEmotionalNeed = emotionalIndicators.some(indicator =>
        userMessage.includes(indicator)
      );

      if (hasEmotionalNeed) {
        return {
          suggested: true,
          to_mentor: 'emotional',
          reason: '遇到困难很正常。要不要先和启程小猫聊聊，调整一下状态？',
          confidence: 0.7
        };
      }
    }

    return null;
  }

  // 判断是否是项目初始化消息
  private isProjectInitiationMessage(message: string) {
    const initiationPatterns = [
      '我想做', '我想实现', '我想开发', '我想学',
      '帮我', '如何做', '怎么做', '想要'
    ];

    return initiationPatterns.some(pattern => message.includes(pattern));
  }

  // 保存消息
  private async saveMessage(
    userId: string,
    sessionId: string,
    role: string,
    content: string,
    metadata?: any
  ) {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO unified_mentor_conversations (
          user_id, session_id, role, content, mentor_type,
          emotional_content, project_content, transition_text,
          message_type, emotional_tone, context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          userId,
          sessionId,
          role,
          content,
          metadata?.mentor_type || null,
          metadata?.emotional_content || null,
          metadata?.project_content || null,
          metadata?.transition_text || null,
          metadata?.message_type || null,
          metadata?.emotional_tone || null,
          metadata?.context ? JSON.stringify(metadata.context) : null
        ]
      );
    } finally {
      client.release();
    }
  }

  // 切换导师模式
  async switchMode(userId: string, mode: 'emotional' | 'project' | 'hybrid' | 'auto') {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO mentor_modes (user_id, current_mode, preferred_mode, auto_switch)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE
         SET current_mode = $2, preferred_mode = $3, auto_switch = $4, updated_at = NOW()`,
        [
          userId,
          mode,
          mode === 'auto' ? null : mode,
          mode === 'auto'
        ]
      );

      const modeNames = {
        emotional: '情感导师（启程小猫）',
        project: '项目导师',
        hybrid: '协同模式',
        auto: '智能切换'
      };

      return {
        success: true,
        message: `已切换到${modeNames[mode]}模式`
      };
    } finally {
      client.release();
    }
  }

  // 获取对话历史
  async getConversationHistory(userId: string, sessionId: string, limit: number = 20) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM unified_mentor_conversations
         WHERE user_id = $1 AND session_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [userId, sessionId, limit]
      );

      return result.rows.reverse();
    } finally {
      client.release();
    }
  }

  // 创建情感-项目关联
  async linkEmotionToProject(
    userId: string,
    emotionalData: {
      life_question_id?: string;
      flow_moment_id?: string;
      emotional_state?: string;
      emotional_description?: string;
    },
    projectId: string,
    linkType: string,
    transformationStory?: string
  ) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO emotional_project_links (
          user_id, life_question_id, flow_moment_id, emotional_state,
          emotional_description, pbl_project_id, link_type,
          link_reason, transformation_story
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          userId,
          emotionalData.life_question_id || null,
          emotionalData.flow_moment_id || null,
          emotionalData.emotional_state || null,
          emotionalData.emotional_description || null,
          projectId,
          linkType,
          `从${emotionalData.emotional_state || '困惑'}到项目实践`,
          transformationStory || null
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // 获取用户的成长旅程
  async getGrowthJourney(userId: string) {
    const client = await pool.connect();
    try {
      // 获取情感-项目关联
      const links = await client.query(
        `SELECT
          epl.*,
          p.title AS project_title,
          p.status AS project_status,
          p.progress_percentage
         FROM emotional_project_links epl
         LEFT JOIN pbl_projects p ON epl.pbl_project_id = p.id
         WHERE epl.user_id = $1
         ORDER BY epl.created_at DESC`,
        [userId]
      );

      return links.rows;
    } finally {
      client.release();
    }
  }
}

export const unifiedMentorService = new UnifiedMentorService();
