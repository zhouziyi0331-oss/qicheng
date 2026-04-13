import pool from '../config/database';

/**
 * AI需求确认引擎
 */
export class AIRequirementEngine {
  /**
   * 开始需求确认对话
   */
  static async startDialogue(companyId: number, taskDraftId?: number) {
    const sessionId = `req_${Date.now()}_${companyId}`;

    // 创建初始对话
    await pool.query(
      `INSERT INTO ai_requirement_dialogues
       (company_id, task_draft_id, session_id, message_type, message_content)
       VALUES ($1, $2, $3, 'assistant', $4)`,
      [
        companyId,
        taskDraftId,
        sessionId,
        '您好！我是AI助手，将帮助您明确任务需求。请简单描述您想发布的任务。'
      ]
    );

    return { sessionId };
  }

  /**
   * 处理用户消息并生成AI回复
   */
  static async processMessage(sessionId: string, companyId: number, message: string) {
    // 保存用户消息
    await pool.query(
      `INSERT INTO ai_requirement_dialogues
       (company_id, session_id, message_type, message_content)
       VALUES ($1, $2, 'user', $3)`,
      [companyId, sessionId, message]
    );

    // 获取对话历史
    const historyResult = await pool.query(
      `SELECT message_type, message_content
       FROM ai_requirement_dialogues
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    // 模拟AI分析（实际应调用GPT/Claude API）
    const aiResponse = await this.generateAIResponse(historyResult.rows, message);

    // 保存AI回复
    await pool.query(
      `INSERT INTO ai_requirement_dialogues
       (company_id, session_id, message_type, message_content, extracted_info, confidence_score)
       VALUES ($1, $2, 'assistant', $3, $4, $5)`,
      [companyId, sessionId, aiResponse.message, aiResponse.extractedInfo, aiResponse.confidence]
    );

    return aiResponse;
  }

  /**
   * 生成AI回复（模拟）
   */
  private static async generateAIResponse(history: any[], latestMessage: string) {
    // 实际应调用AI API，这里做简单模拟
    const extractedInfo: any = {};
    let confidence = 0.8;
    let message = '';

    // 简单的关键词提取
    if (latestMessage.includes('视频') || latestMessage.includes('剪辑')) {
      extractedInfo.taskType = 'video_editing';
      message = '明白了，您需要视频剪辑服务。请问：\n1. 视频时长大约多少？\n2. 需要什么风格？\n3. 预算范围是多少？';
    } else if (latestMessage.includes('小程序') || latestMessage.includes('开发')) {
      extractedInfo.taskType = 'miniapp_development';
      message = '了解，您需要小程序开发。请问：\n1. 需要哪些功能？\n2. 有设计稿吗？\n3. 预计什么时候完成？';
    } else if (latestMessage.includes('设计') || latestMessage.includes('海报')) {
      extractedInfo.taskType = 'design';
      message = '好的，您需要设计服务。请问：\n1. 设计什么类型的作品？\n2. 尺寸要求？\n3. 有参考案例吗？';
    } else {
      message = '请详细描述您的任务需求，包括：\n1. 具体要做什么\n2. 交付标准\n3. 时间要求\n4. 预算范围';
      confidence = 0.5;
    }

    return {
      message,
      extractedInfo,
      confidence
    };
  }

  /**
   * 获取对话历史
   */
  static async getDialogueHistory(sessionId: string) {
    const result = await pool.query(
      `SELECT * FROM ai_requirement_dialogues
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows;
  }
}

/**
 * AI任务拆解引擎
 */
export class AITaskDecompositionEngine {
  /**
   * 拆解任务
   */
  static async decomposeTask(taskId: number, taskDescription: string) {
    // 模拟AI拆解（实际应调用AI API）
    const decomposition = await this.generateDecomposition(taskDescription);

    // 保存拆解结果
    const result = await pool.query(
      `INSERT INTO ai_task_decompositions
       (parent_task_id, original_description, decomposition_result, subtask_count, estimated_total_hours, ai_reasoning)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        taskId,
        taskDescription,
        JSON.stringify(decomposition.subtasks),
        decomposition.subtasks.length,
        decomposition.totalHours,
        decomposition.reasoning
      ]
    );

    return result.rows[0];
  }

  /**
   * 生成任务拆解（模拟）
   */
  private static async generateDecomposition(description: string) {
    // 实际应调用AI API
    const subtasks = [
      {
        title: '需求分析',
        description: '分析任务需求，明确目标和范围',
        estimatedHours: 2,
        dependencies: []
      },
      {
        title: '方案设计',
        description: '设计实现方案和技术选型',
        estimatedHours: 4,
        dependencies: [1]
      },
      {
        title: '开发实现',
        description: '按照方案进行开发',
        estimatedHours: 16,
        dependencies: [2]
      },
      {
        title: '测试验收',
        description: '测试功能并修复问题',
        estimatedHours: 4,
        dependencies: [3]
      }
    ];

    return {
      subtasks,
      totalHours: subtasks.reduce((sum, task) => sum + task.estimatedHours, 0),
      reasoning: '根据任务描述，将任务拆解为需求分析、方案设计、开发实现、测试验收四个阶段。'
    };
  }

  /**
   * 创建子任务
   */
  static async createSubtasks(decompositionId: number, parentTaskId: number) {
    const decompositionResult = await pool.query(
      `SELECT decomposition_result FROM ai_task_decompositions WHERE id = $1`,
      [decompositionId]
    );

    const subtasks = decompositionResult.rows[0].decomposition_result;

    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];
      await pool.query(
        `INSERT INTO subtasks
         (parent_task_id, decomposition_id, subtask_order, title, description, estimated_hours, dependencies)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          parentTaskId,
          decompositionId,
          i + 1,
          subtask.title,
          subtask.description,
          subtask.estimatedHours,
          JSON.stringify(subtask.dependencies)
        ]
      );
    }
  }

  /**
   * 获取任务的子任务列表
   */
  static async getSubtasks(parentTaskId: number) {
    const result = await pool.query(
      `SELECT * FROM subtasks
       WHERE parent_task_id = $1
       ORDER BY subtask_order ASC`,
      [parentTaskId]
    );

    return result.rows;
  }
}

/**
 * AI任务审核引擎
 */
export class AITaskReviewEngine {
  /**
   * AI审核任务
   */
  static async reviewTask(taskId: number, taskData: any) {
    // 模拟AI审核（实际应调用AI API）
    const review = await this.generateReview(taskData);

    // 保存审核结果
    const result = await pool.query(
      `INSERT INTO ai_task_reviews
       (task_id, review_type, ai_review_result, ai_score, ai_feedback, flagged_issues, human_review_required)
       VALUES ($1, 'initial', $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        taskId,
        review.result,
        review.score,
        review.feedback,
        JSON.stringify(review.issues),
        review.needsHumanReview
      ]
    );

    return result.rows[0];
  }

  /**
   * 生成审核结果（模拟）
   */
  private static async generateReview(taskData: any) {
    const issues: string[] = [];
    let score = 100;

    // 检查标题
    if (!taskData.title || taskData.title.length < 5) {
      issues.push('任务标题过短，建议至少5个字');
      score -= 10;
    }

    // 检查描述
    if (!taskData.description || taskData.description.length < 20) {
      issues.push('任务描述不够详细，建议至少20个字');
      score -= 15;
    }

    // 检查报酬
    if (!taskData.payment || taskData.payment < 50) {
      issues.push('任务报酬过低，可能影响接单率');
      score -= 10;
    }

    // 检查敏感词
    const sensitiveWords = ['刷单', '刷量', '违法', '色情'];
    for (const word of sensitiveWords) {
      if (taskData.description?.includes(word)) {
        issues.push(`包含敏感词：${word}`);
        score -= 50;
      }
    }

    let result = 'approved';
    let needsHumanReview = false;

    if (score < 60) {
      result = 'rejected';
      needsHumanReview = true;
    } else if (score < 80) {
      result = 'needs_human';
      needsHumanReview = true;
    }

    return {
      result,
      score,
      feedback: issues.length > 0 ? issues.join('\n') : '任务信息完整，符合发布标准',
      issues,
      needsHumanReview
    };
  }

  /**
   * 人工审核
   */
  static async humanReview(reviewId: number, reviewerId: number, approved: boolean, feedback: string) {
    await pool.query(
      `UPDATE ai_task_reviews
       SET human_reviewer_id = $1,
           human_review_result = $2,
           human_feedback = $3,
           human_reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [reviewerId, approved ? 'approved' : 'rejected', feedback, reviewId]
    );
  }
}

/**
 * AI问答引擎
 */
export class AIQAEngine {
  /**
   * 回答问题
   */
  static async answerQuestion(userId: number, question: string, taskId?: number) {
    const startTime = Date.now();

    // 从知识库匹配答案
    const answer = await this.matchAnswer(question);

    const responseTime = Date.now() - startTime;

    // 保存问答历史
    await pool.query(
      `INSERT INTO ai_qa_history
       (user_id, task_id, question, ai_answer, knowledge_base_id, confidence_score, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, taskId, question, answer.answer, answer.knowledgeBaseId, answer.confidence, responseTime]
    );

    return answer;
  }

  /**
   * 从知识库匹配答案
   */
  private static async matchAnswer(question: string) {
    const result = await pool.query(
      `SELECT * FROM ai_qa_knowledge_base
       WHERE is_active = TRUE
       ORDER BY priority DESC, usage_count DESC`
    );

    // 简单的关键词匹配
    for (const kb of result.rows) {
      const keywords = kb.keywords || [];
      for (const keyword of keywords) {
        if (question.includes(keyword)) {
          // 更新使用次数
          await pool.query(
            `UPDATE ai_qa_knowledge_base SET usage_count = usage_count + 1 WHERE id = $1`,
            [kb.id]
          );

          return {
            answer: kb.answer_template,
            knowledgeBaseId: kb.id,
            confidence: 0.8
          };
        }
      }
    }

    // 未匹配到，返回默认回复
    return {
      answer: '抱歉，我暂时无法回答这个问题。您可以选择转发给企业或联系客服。',
      knowledgeBaseId: null,
      confidence: 0.3
    };
  }

  /**
   * 标记答案是否有帮助
   */
  static async markHelpful(historyId: number, isHelpful: boolean) {
    const result = await pool.query(
      `UPDATE ai_qa_history
       SET is_helpful = $1
       WHERE id = $2
       RETURNING knowledge_base_id`,
      [isHelpful, historyId]
    );

    const knowledgeBaseId = result.rows[0]?.knowledge_base_id;

    if (knowledgeBaseId) {
      const field = isHelpful ? 'helpful_count' : 'not_helpful_count';
      await pool.query(
        `UPDATE ai_qa_knowledge_base SET ${field} = ${field} + 1 WHERE id = $1`,
        [knowledgeBaseId]
      );
    }
  }
}
