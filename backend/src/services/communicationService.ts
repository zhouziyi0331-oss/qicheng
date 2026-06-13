import { pool, QueryResult } from '../utils/db';

/**
 * 联系方式过滤服务
 */
export class ContactFilterService {
  private static filterRules: Array<{
    type: string;
    pattern: RegExp;
    replacement: string;
    priority: number;
  }> = [];

  /**
   * 加载过滤规则
   */
  static async loadRules() {
    const result = await pool.query(
      'SELECT rule_type, pattern, replacement, priority FROM contact_filter_rules WHERE is_active = TRUE ORDER BY priority DESC'
    );

    this.filterRules = result.rows.map(row => ({
      type: row.rule_type,
      pattern: new RegExp(row.pattern, 'gi'),
      replacement: row.replacement,
      priority: row.priority
    }));
  }

  /**
   * 过滤消息中的联系方式
   */
  static filterContent(content: string): { filtered: string; keywords: string[] } {
    if (this.filterRules.length === 0) {
      // 如果规则未加载，使用默认规则
      this.filterRules = [
        { type: 'phone', pattern: /1[3-9]\d{9}/gi, replacement: '[手机号已屏蔽]', priority: 100 },
        { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, replacement: '[邮箱已屏蔽]', priority: 90 },
        { type: 'wechat', pattern: /(微信|WeChat|wx|VX)[：:]\s*[a-zA-Z0-9_-]+/gi, replacement: '[微信号已屏蔽]', priority: 80 },
        { type: 'qq', pattern: /[Qq]{2}[：:]\s*\d{5,12}/gi, replacement: '[QQ号已屏蔽]', priority: 80 },
        { type: 'url', pattern: /https?:\/\/[^\s]+/gi, replacement: '[链接已屏蔽]', priority: 70 }
      ];
    }

    let filtered = content;
    const keywords: string[] = [];

    for (const rule of this.filterRules) {
      const matches = content.match(rule.pattern);
      if (matches) {
        keywords.push(...matches);
        filtered = filtered.replace(rule.pattern, rule.replacement);
      }
    }

    return { filtered, keywords };
  }
}

/**
 * 任务沟通服务
 */
export class CommunicationService {
  /**
   * 企业添加任务补充说明
   */
  static async addClarification(taskId: number, companyId: number, content: string, attachments: any[] = []) {
    const result = await pool.query(
      `INSERT INTO task_clarifications (task_id, company_id, content, attachments)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [taskId, companyId, content, JSON.stringify(attachments)]
    );
    return result.rows[0];
  }

  /**
   * 获取任务的所有补充说明
   */
  static async getClarifications(taskId: number) {
    const result = await pool.query(
      `SELECT c.*, u.username as company_name
       FROM task_clarifications c
       JOIN users u ON c.company_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at DESC`,
      [taskId]
    );
    return result.rows;
  }

  /**
   * 学生提问（先问AI）
   */
  static async askQuestion(taskId: number, studentId: number, question: string) {
    // 1. 先尝试AI回答
    const aiAnswer = await this.getAIAnswer(question);

    // 2. 保存问题和AI回答
    const result = await pool.query(
      `INSERT INTO task_questions (task_id, student_id, question, question_type, ai_answer, ai_confidence, status)
       VALUES ($1, $2, $3, 'ai', $4, $5, $6)
       RETURNING *`,
      [
        taskId,
        studentId,
        question,
        aiAnswer.answer,
        aiAnswer.confidence,
        aiAnswer.confidence >= 0.7 ? 'answered' : 'pending'
      ]
    );

    const questionRecord = result.rows[0];

    // 3. 如果AI置信度低，标记为需要转发
    if (aiAnswer.confidence < 0.7) {
      questionRecord.needsForward = true;
      questionRecord.forwardReason = 'AI置信度较低，建议转发给企业';
    }

    return questionRecord;
  }

  /**
   * AI回答问题（基于知识库匹配）
   */
  private static async getAIAnswer(question: string): Promise<{ answer: string; confidence: number }> {
    // 简单的关键词匹配算法
    const result = await pool.query(
      `SELECT answer, confidence_threshold, question_keywords
       FROM ai_qa_knowledge
       ORDER BY usage_count DESC, helpful_count DESC
       LIMIT 20`
    );

    let bestMatch = { answer: '抱歉，我无法回答这个问题。建议您转发给企业获取准确答案。', confidence: 0 };
    const questionLower = question.toLowerCase();

    for (const row of result.rows) {
      const keywords = row.question_keywords;
      let matchCount = 0;

      for (const keyword of keywords) {
        if (questionLower.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }

      const confidence = matchCount / keywords.length;
      if (confidence > bestMatch.confidence && confidence >= row.confidence_threshold) {
        bestMatch = { answer: row.answer, confidence };
      }
    }

    return bestMatch;
  }

  /**
   * 转发问题给企业
   */
  static async forwardToCompany(questionId: number, studentId: number) {
    // 1. 获取问题信息
    const questionResult = await pool.query(
      `SELECT tq.*, t.company_id
       FROM task_questions tq
       JOIN tasks t ON tq.task_id = t.id
       WHERE tq.id = $1 AND tq.student_id = $2`,
      [questionId, studentId]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('问题不存在或无权限');
    }

    const question = questionResult.rows[0];

    // 2. 更新问题状态
    await pool.query(
      `UPDATE task_questions
       SET status = 'forwarded', question_type = 'company'
       WHERE id = $1`,
      [questionId]
    );

    // 3. 记录转发
    await pool.query(
      `INSERT INTO question_forwards (question_id, forwarded_by, forwarded_to, reason)
       VALUES ($1, $2, $3, $4)`,
      [questionId, studentId, question.company_id, 'AI无法准确回答']
    );

    return { success: true, message: '问题已转发给企业，预计24小时内回复' };
  }

  /**
   * 企业回答学生问题
   */
  static async answerQuestion(questionId: number, companyId: number, answer: string) {
    const result = await pool.query(
      `UPDATE task_questions tq
       SET company_answer = $1, answered_by = $2, answered_at = CURRENT_TIMESTAMP, status = 'answered'
       FROM tasks t
       WHERE tq.id = $3 AND tq.task_id = t.id AND t.company_id = $4
       RETURNING tq.*`,
      [answer, companyId, questionId, companyId]
    );

    if (result.rows.length === 0) {
      throw new Error('问题不存在或无权限');
    }

    return result.rows[0];
  }

  /**
   * 获取任务的所有问答
   */
  static async getQuestions(taskId: number, userId: number, userRole: string) {
    let query = `
      SELECT tq.*,
             u.username as student_name,
             CASE
               WHEN tq.status = 'answered' THEN
                 COALESCE(tq.company_answer, tq.ai_answer)
               ELSE NULL
             END as answer
      FROM task_questions tq
      JOIN users u ON tq.student_id = u.id
      WHERE tq.task_id = $1
    `;

    const params: any[] = [taskId];

    // 学生只能看自己的问题
    if (userRole === 'student') {
      query += ' AND tq.student_id = $2';
      params.push(userId);
    }

    query += ' ORDER BY tq.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 发送中转消息（自动过滤联系方式）
   */
  static async sendRelayMessage(
    taskId: number,
    senderId: number,
    receiverId: number,
    content: string,
    attachments: any[] = []
  ) {
    // 1. 过滤联系方式
    const { filtered, keywords } = ContactFilterService.filterContent(content);

    // 2. 保存消息
    const result = await pool.query(
      `INSERT INTO relay_messages (task_id, sender_id, receiver_id, content, original_content, filtered_keywords, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [taskId, senderId, receiverId, filtered, content, JSON.stringify(keywords), JSON.stringify(attachments)]
    );

    return {
      ...result.rows[0],
      hasFiltered: keywords.length > 0,
      filteredCount: keywords.length
    };
  }

  /**
   * 获取中转消息列表
   */
  static async getRelayMessages(taskId: number, userId: number) {
    const result = await pool.query(
      `SELECT rm.*,
              sender.username as sender_name,
              receiver.username as receiver_name
       FROM relay_messages rm
       JOIN users sender ON rm.sender_id = sender.id
       JOIN users receiver ON rm.receiver_id = receiver.id
       WHERE rm.task_id = $1 AND (rm.sender_id = $2 OR rm.receiver_id = $2)
       ORDER BY rm.created_at ASC`,
      [taskId, userId]
    );

    // 标记已读
    await pool.query(
      `UPDATE relay_messages
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE task_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [taskId, userId]
    );

    return result.rows;
  }

  /**
   * 获取未读消息数
   */
  static async getUnreadCount(userId: number) {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM relay_messages
       WHERE receiver_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * 标记AI回答是否有帮助
   */
  static async markAIAnswerHelpful(questionId: number, isHelpful: boolean) {
    if (isHelpful) {
      // 增加知识库的有帮助计数
      await pool.query(
        `UPDATE ai_qa_knowledge
         SET helpful_count = helpful_count + 1, usage_count = usage_count + 1
         WHERE answer IN (
           SELECT ai_answer FROM task_questions WHERE id = $1
         )`,
        [questionId]
      );
    }
    return { success: true };
  }
}

// 初始化时加载过滤规则
ContactFilterService.loadRules().catch(console.error);
