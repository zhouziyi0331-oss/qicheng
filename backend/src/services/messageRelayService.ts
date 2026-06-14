/**
 * 消息中转服务
 *
 * 核心功能：
 * 1. 所有消息都经过AI中转
 * 2. 自动屏蔽联系方式（前2次合作）
 * 3. 优化语气（可选）
 * 4. 记录沟通历史
 * 5. 第3次合作后可交换联系方式
 */

import { query, queryOne } from '../utils/db';
import { aiServiceClient } from './aiServiceClient';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================

interface SendMessageParams {
  taskId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  messageType?: 'text' | 'image' | 'file';
}

interface FilterResult {
  filteredMessage: string;
  isFiltered: boolean;
  detectedContacts: DetectedContact[];
}

interface DetectedContact {
  type: 'phone' | 'wechat' | 'qq' | 'email' | 'other';
  value: string;
  originalText: string;
}

interface OptimizationResult {
  optimizedMessage: string;
  isOptimized: boolean;
  reason?: string;
  tokensUsed?: number;
  cost?: number;
}

// =====================================================
// 联系方式检测规则
// =====================================================

const CONTACT_PATTERNS = {
  // 手机号
  phone: [
    /1[3-9]\d{9}/g,
    /\d{3}[-\s]?\d{4}[-\s]?\d{4}/g,
  ],

  // 微信号
  wechat: [
    /微信[：:]\s*[\w-]+/gi,
    /wx[：:]\s*[\w-]+/gi,
    /vx[：:]\s*[\w-]+/gi,
    /加我微信/gi,
    /加微信/gi,
    /威信/gi,  // 谐音
    /薇信/gi,
    /vvx/gi,
  ],

  // QQ号
  qq: [
    /QQ[：:]\s*\d{5,}/gi,
    /[qQ]{2}[：:]\s*\d{5,}/gi,
    /扣扣/gi,  // 谐音
    /抠抠/gi,
  ],

  // 邮箱
  email: [
    /[\w.-]+@[\w.-]+\.\w+/g,
  ],

  // 其他平台
  other: [
    /钉钉/gi,
    /飞书/gi,
    /企业微信/gi,
  ],
};

// =====================================================
// MessageRelayService 类
// =====================================================

class MessageRelayService {
  /**
   * 发送消息（核心方法）
   *
   * 流程：
   * 1. 查询合作次数
   * 2. 检测和屏蔽联系方式
   * 3. 优化语气（可选）
   * 4. 保存消息记录
   * 5. 发送给接收者
   */
  async sendMessage(params: SendMessageParams): Promise<{
    success: boolean;
    messageId: string;
    filtered: boolean;
    optimized: boolean;
    warning?: string;
  }> {
    const { taskId, fromUserId, toUserId, message, messageType = 'text' } = params;

    try {
      // 1. 查询合作次数
      const collabCount = await this.getCollaborationCount(fromUserId, toUserId);
      logger.info(`Collaboration count between ${fromUserId} and ${toUserId}: ${collabCount}`);

      // 2. 检测和屏蔽联系方式
      const filterResult = this.filterContactInfo(message, collabCount);

      // 3. 优化语气（如果是企业发给学生，且语气生硬）
      let optimizationResult: OptimizationResult = {
        optimizedMessage: filterResult.filteredMessage,
        isOptimized: false,
      };

      const fromUser = await this.getUser(fromUserId);
      if (fromUser.role === 'company' && this.needsToneOptimization(filterResult.filteredMessage)) {
        optimizationResult = await this.optimizeTone(filterResult.filteredMessage, fromUserId, toUserId);
      }

      // 4. 保存消息记录
      const messageId = await this.saveMessage({
        taskId,
        fromUserId,
        toUserId,
        originalMessage: message,
        filteredMessage: optimizationResult.optimizedMessage,
        isFiltered: filterResult.isFiltered,
        isOptimized: optimizationResult.isOptimized,
        messageType,
      });

      // 5. 保存屏蔽日志
      if (filterResult.isFiltered && filterResult.detectedContacts.length > 0) {
        await this.saveFilterLogs(messageId, fromUserId, filterResult.detectedContacts, collabCount);
      }

      // 6. 保存优化日志
      if (optimizationResult.isOptimized) {
        await this.saveToneOptimizationLog({
          messageId,
          userId: fromUserId,
          originalTone: filterResult.filteredMessage,
          optimizedTone: optimizationResult.optimizedMessage,
          reason: optimizationResult.reason,
          tokensUsed: optimizationResult.tokensUsed,
          cost: optimizationResult.cost,
        });
      }

      // 7. 发送通知给接收者（这里可以集成WebSocket或推送服务）
      await this.notifyRecipient(toUserId, messageId);

      // 8. 如果屏蔽了内容，提醒发送者
      let warning: string | undefined;
      if (filterResult.isFiltered) {
        warning = await this.notifySenderAboutFilter(fromUserId, collabCount);
      }

      // 9. 如果优化了语气，提醒发送者
      if (optimizationResult.isOptimized) {
        await this.notifySenderAboutOptimization(fromUserId);
      }

      return {
        success: true,
        messageId,
        filtered: filterResult.isFiltered,
        optimized: optimizationResult.isOptimized,
        warning,
      };
    } catch (error: any) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * 获取合作次数
   */
  private async getCollaborationCount(userId1: string, userId2: string): Promise<number> {
    // 判断谁是学生，谁是企业
    const user1 = await this.getUser(userId1);
    const user2 = await this.getUser(userId2);

    let studentId: string;
    let companyId: string;

    if (user1.role === 'student') {
      studentId = userId1;
      companyId = userId2;
    } else {
      studentId = userId2;
      companyId = userId1;
    }

    const sql = `SELECT get_collaboration_count($1, $2) as count`;
    const result = await queryOne(sql, [studentId, companyId]);
    return result.count || 0;
  }

  /**
   * 检测和屏蔽联系方式
   */
  private filterContactInfo(message: string, collabCount: number): FilterResult {
    // 如果已经合作3次及以上，不屏蔽
    if (collabCount >= 3) {
      return {
        filteredMessage: message,
        isFiltered: false,
        detectedContacts: [],
      };
    }

    let filteredMessage = message;
    const detectedContacts: DetectedContact[] = [];

    // 遍历所有检测规则
    for (const [type, patterns] of Object.entries(CONTACT_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = message.match(pattern);
        if (matches) {
          matches.forEach(match => {
            detectedContacts.push({
              type: type as any,
              value: match,
              originalText: match,
            });

            // 替换为[已屏蔽]
            filteredMessage = filteredMessage.replace(pattern, '[已屏蔽]');
          });
        }
      }
    }

    return {
      filteredMessage,
      isFiltered: detectedContacts.length > 0,
      detectedContacts,
    };
  }

  /**
   * 判断是否需要优化语气
   */
  private needsToneOptimization(message: string): boolean {
    // 简单规则：检测生硬的表达
    const harshPatterns = [
      /怎么还没/,
      /为什么不/,
      /必须/,
      /赶紧/,
      /快点/,
      /不行/,
      /重做/,
    ];

    return harshPatterns.some(pattern => pattern.test(message));
  }

  /**
   * 优化语气（调用AI）
   */
  private async optimizeTone(
    message: string,
    fromUserId: string,
    toUserId: string
  ): Promise<OptimizationResult> {
    try {
      const prompt = `你是一个沟通专家。请分析以下企业发给学生的消息，判断语气是否合适。

消息内容：
"${message}"

如果语气生硬、可能引起反感，请优化为更友好的表达。
如果语气已经很好，直接返回原消息。

只返回优化后的消息，不要解释。`;

      const startTime = Date.now();
      const response = await aiServiceClient.chat({
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-haiku-4-5',  // 使用便宜的模型
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseTime = Date.now() - startTime;
      const optimizedMessage = response.content.trim();

      // 判断是否真的优化了
      const isOptimized = optimizedMessage !== message;

      return {
        optimizedMessage,
        isOptimized,
        reason: isOptimized ? '语气生硬，已优化' : undefined,
        tokensUsed: response.usage?.total_tokens,
        cost: this.calculateCost(response.usage?.total_tokens || 0, 'claude-haiku-4-5'),
      };
    } catch (error: any) {
      logger.error('Failed to optimize tone:', error);
      // 如果AI调用失败，返回原消息
      return {
        optimizedMessage: message,
        isOptimized: false,
      };
    }
  }

  /**
   * 计算AI调用成本
   */
  private calculateCost(tokens: number, model: string): number {
    // Claude Haiku 4.5 价格：$0.25 / 1M input tokens, $1.25 / 1M output tokens
    // 简化计算，假设input和output各占一半
    const inputCost = (tokens / 2) * 0.25 / 1000000;
    const outputCost = (tokens / 2) * 1.25 / 1000000;
    return inputCost + outputCost;
  }

  /**
   * 保存消息记录
   */
  private async saveMessage(params: {
    taskId: string;
    fromUserId: string;
    toUserId: string;
    originalMessage: string;
    filteredMessage: string;
    isFiltered: boolean;
    isOptimized: boolean;
    messageType: string;
  }): Promise<string> {
    const sql = `
      INSERT INTO task_messages (
        task_id, from_user_id, to_user_id,
        original_message, filtered_message,
        is_filtered, is_optimized, message_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const result = await queryOne(sql, [
      params.taskId,
      params.fromUserId,
      params.toUserId,
      params.originalMessage,
      params.filteredMessage,
      params.isFiltered,
      params.isOptimized,
      params.messageType,
    ]);

    // 更新任务的消息统计
    await query(
      `UPDATE tasks
       SET total_messages = total_messages + 1,
           filtered_messages = filtered_messages + $1
       WHERE id = $2`,
      [params.isFiltered ? 1 : 0, params.taskId]
    );

    return result.id;
  }

  /**
   * 保存屏蔽日志
   */
  private async saveFilterLogs(
    messageId: string,
    userId: string,
    detectedContacts: DetectedContact[],
    collabCount: number
  ): Promise<void> {
    const sql = `
      INSERT INTO contact_filter_logs (
        message_id, user_id, detected_type, detected_value,
        original_text, filtered_text, collaboration_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const contact of detectedContacts) {
      await query(sql, [
        messageId,
        userId,
        contact.type,
        contact.value,
        contact.originalText,
        '[已屏蔽]',
        collabCount,
      ]);
    }
  }

  /**
   * 保存语气优化日志
   */
  private async saveToneOptimizationLog(params: {
    messageId: string;
    userId: string;
    originalTone: string;
    optimizedTone: string;
    reason?: string;
    tokensUsed?: number;
    cost?: number;
  }): Promise<void> {
    const sql = `
      INSERT INTO tone_optimization_logs (
        message_id, user_id, original_tone, optimized_tone,
        optimization_reason, model_used, tokens_used, cost
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await query(sql, [
      params.messageId,
      params.userId,
      params.originalTone,
      params.optimizedTone,
      params.reason,
      'claude-haiku-4-5',
      params.tokensUsed,
      params.cost,
    ]);
  }

  /**
   * 通知接收者（这里可以集成WebSocket或推送服务）
   */
  private async notifyRecipient(userId: string, messageId: string): Promise<void> {
    // TODO: 集成WebSocket或推送服务
    logger.info(`Notifying user ${userId} about new message ${messageId}`);
  }

  /**
   * 提醒发送者关于屏蔽
   */
  private async notifySenderAboutFilter(userId: string, collabCount: number): Promise<string> {
    const message = `嗨，我注意到你想留联系方式。
为了保护双方，前2次合作需要通过平台沟通。
你可以直接在平台上传文件和沟通。

等你们合作3次后，如果双方都愿意，
我可以帮你们交换联系方式 :)`;

    // TODO: 发送系统消息给用户
    logger.info(`Notifying user ${userId} about contact filter`);

    return message;
  }

  /**
   * 提醒发送者关于语气优化
   */
  private async notifySenderAboutOptimization(userId: string): Promise<void> {
    const message = `我已经帮您稍微调整了一下语气，这样学生更容易接受 :)

沟通小技巧：
- 先询问进度，而不是质问
- 表达理解，提供帮助
- 学生会更愿意配合`;

    // TODO: 发送系统消息给用户
    logger.info(`Notifying user ${userId} about tone optimization`);
  }

  /**
   * 获取用户信息
   */
  private async getUser(userId: string): Promise<{ id: string; role: string }> {
    const sql = `SELECT id, role FROM users WHERE id = $1`;
    const user = await queryOne(sql, [userId]);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    return user;
  }

  /**
   * 发送消息的简化接口（供Controller调用）
   */
  async relayMessage(
    fromUserId: string,
    toUserId: string,
    taskId: string,
    content: string
  ): Promise<any> {
    return this.sendMessage({
      taskId,
      fromUserId,
      toUserId,
      message: content,
    });
  }

  /**
   * 获取消息历史（带权限验证）
   */
  async getMessages(taskId: string, userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    // 验证用户是否有权限查看该任务的消息
    const taskSql = `
      SELECT student_id, company_id
      FROM tasks
      WHERE id = $1
    `;
    const task = await queryOne(taskSql, [taskId]);

    if (!task) {
      throw new Error('Task not found');
    }

    // 只有任务的学生或企业可以查看消息
    if (userId !== task.student_id && userId !== task.company_id) {
      throw new Error('Unauthorized to view messages');
    }

    const sql = `
      SELECT
        m.id,
        m.task_id,
        m.from_user_id,
        m.to_user_id,
        m.filtered_message as message,
        m.is_filtered,
        m.is_optimized,
        m.message_type,
        m.read_at,
        m.created_at,
        u1.name as from_user_name,
        u2.name as to_user_name
      FROM task_messages m
      JOIN users u1 ON m.from_user_id = u1.id
      JOIN users u2 ON m.to_user_id = u2.id
      WHERE m.task_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const messages = await query(sql, [taskId, limit, offset]);
    return messages;
  }

  /**
   * 获取统计数据（平台端）
   */
  async getStatistics(params: {
    studentId?: string;
    companyId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const { studentId, companyId, startDate, endDate } = params;

    let whereClauses: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (studentId) {
      whereClauses.push(`(m.from_user_id = $${paramIndex} OR m.to_user_id = $${paramIndex})`);
      queryParams.push(studentId);
      paramIndex++;
    }

    if (companyId) {
      whereClauses.push(`(m.from_user_id = $${paramIndex} OR m.to_user_id = $${paramIndex})`);
      queryParams.push(companyId);
      paramIndex++;
    }

    if (startDate) {
      whereClauses.push(`m.created_at >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClauses.push(`m.created_at <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE is_filtered = true) as filtered_messages,
        COUNT(*) FILTER (WHERE is_optimized = true) as optimized_messages,
        COUNT(DISTINCT task_id) as total_tasks,
        COUNT(DISTINCT from_user_id) as unique_senders
      FROM task_messages m
      ${whereClause}
    `;

    const stats = await queryOne(sql, queryParams);

    // 获取屏蔽统计
    const filterStatsSql = `
      SELECT
        detected_type,
        COUNT(*) as count
      FROM contact_filter_logs l
      JOIN task_messages m ON l.message_id = m.id
      ${whereClause.replace('m.created_at', 'l.created_at')}
      GROUP BY detected_type
    `;

    const filterStats = await query(filterStatsSql, queryParams);

    return {
      ...stats,
      filterBreakdown: filterStats,
    };
  }

  /**
   * 获取违规记录（平台端）
   */
  async getViolations(userId?: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    let whereClauses: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (userId) {
      whereClauses.push(`l.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    queryParams.push(limit, offset);

    const sql = `
      SELECT
        l.id,
        l.user_id,
        u.name as user_name,
        u.role as user_role,
        l.detected_type,
        l.detected_value,
        l.original_text,
        l.collaboration_count,
        l.created_at,
        m.task_id
      FROM contact_filter_logs l
      JOIN users u ON l.user_id = u.id
      JOIN task_messages m ON l.message_id = m.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const violations = await query(sql, queryParams);
    return violations;
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    const sql = `
      UPDATE task_messages
      SET read_at = NOW()
      WHERE id = $1 AND to_user_id = $2 AND read_at IS NULL
    `;

    await query(sql, [messageId, userId]);
  }
}

// =====================================================
// 导出单例
// =====================================================

export const messageRelayService = new MessageRelayService();
