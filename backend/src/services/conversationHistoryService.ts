import { query, QueryResult } from '../utils/db';
import logger from '../utils/logger';

/**
 * 对话历史管理服务
 * 负责获取和格式化导师对话历史
 */

interface ConversationMessage {
  role: 'student' | 'mentor';
  content: string;
  created_at: Date;
}

class ConversationHistoryService {
  /**
   * 获取订单的对话历史
   * @param orderId 订单ID
   * @param limit 获取最近N条消息（默认30条）
   * @returns 格式化的对话历史文本
   */
  async getConversationHistory(orderId: string, limit: number = 30): Promise<string> {
    try {
      // 从mentor_sessions表获取导师消息
      const mentorMessages = await query<{
        scenario: string;
        message: string;
        created_at: Date;
      }>(
        `SELECT scenario, message, created_at
         FROM mentor_sessions
         WHERE order_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [orderId, limit]
      );

      // TODO: 如果有学生消息表，也需要获取学生消息
      // 这里假设学生消息存储在某个表中，需要根据实际情况调整

      if (mentorMessages.length === 0) {
        return '这是第一次对话';
      }

      // 格式化对话历史
      const history = mentorMessages.rows
        .reverse() // 按时间正序排列
        .map((msg, index) => {
          const time = new Date(msg.created_at).toLocaleString('zh-CN');
          return `[${time}] 导师 (${msg.scenario}): ${msg.message.substring(0, 200)}${msg.message.length > 200 ? '...' : ''}`;
        })
        .join('\n\n');

      return history;
    } catch (error: any) {
      logger.error(`Failed to get conversation history for order ${orderId}:`, error);
      return '无法获取对话历史';
    }
  }

  /**
   * 获取订单的完整对话历史（包括学生和导师）
   * @param orderId 订单ID
   * @param limit 获取最近N条消息
   * @returns 对话消息数组
   */
  async getFullConversationHistory(orderId: string, limit: number = 30): Promise<ConversationMessage[]> {
    try {
      // 获取导师消息
      const mentorMessages = await query<{
        message: string;
        created_at: Date;
      }>(
        `SELECT message, created_at
         FROM mentor_sessions
         WHERE order_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [orderId, limit]
      );

      // 转换为统一格式
      const messages: ConversationMessage[] = mentorMessages.map(msg => ({
        role: 'mentor' as const,
        content: msg.message,
        created_at: msg.created_at,
      }));

      // 按时间正序排列
      messages.reverse();

      return messages;
    } catch (error: any) {
      logger.error(`Failed to get full conversation history for order ${orderId}:`, error);
      return [];
    }
  }

  /**
   * 格式化对话历史为Claude API可用的格式
   * @param messages 对话消息数组
   * @returns 格式化的文本
   */
  formatForPrompt(messages: ConversationMessage[]): string {
    if (messages.length === 0) {
      return '这是第一次对话';
    }

    return messages
      .map(msg => {
        const role = msg.role === 'student' ? '学生' : '导师';
        const time = new Date(msg.created_at).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        // 限制每条消息长度，避免prompt过长
        const content = msg.content.length > 300
          ? msg.content.substring(0, 300) + '...'
          : msg.content;
        return `[${time}] ${role}: ${content}`;
      })
      .join('\n\n');
  }

  /**
   * 获取对话摘要（用于长对话）
   * @param orderId 订单ID
   * @returns 对话摘要
   */
  async getConversationSummary(orderId: string): Promise<string> {
    try {
      // 获取所有对话
      const messages = await this.getFullConversationHistory(orderId, 50);

      if (messages.length === 0) {
        return '暂无对话历史';
      }

      // 简单摘要：提取关键信息
      const mentorCount = messages.filter(m => m.role === 'mentor').length;
      const studentCount = messages.filter(m => m.role === 'student').length;

      // 获取最近5条消息作为上下文
      const recentMessages = messages.slice(-5);
      const recentContext = this.formatForPrompt(recentMessages);

      return `对话轮次：导师${mentorCount}次，学生${studentCount}次

最近对话：
${recentContext}`;
    } catch (error: any) {
      logger.error(`Failed to get conversation summary for order ${orderId}:`, error);
      return '无法生成对话摘要';
    }
  }
}

export default new ConversationHistoryService();
