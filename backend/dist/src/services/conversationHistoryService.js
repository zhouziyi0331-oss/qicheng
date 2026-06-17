"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class ConversationHistoryService {
    /**
     * 获取订单的对话历史
     * @param orderId 订单ID
     * @param limit 获取最近N条消息（默认30条）
     * @returns 格式化的对话历史文本
     */
    async getConversationHistory(orderId, limit = 30) {
        try {
            // 从mentor_sessions表获取导师消息
            const mentorMessages = await (0, db_1.query)(`SELECT scenario, message, created_at
         FROM mentor_sessions
         WHERE order_id = $1
         ORDER BY created_at DESC
         LIMIT $2`, [orderId, limit]);
            // TODO: 如果有学生消息表，也需要获取学生消息
            // 这里假设学生消息存储在某个表中，需要根据实际情况调整
            if (mentorMessages.length === 0) {
                return '这是第一次对话';
            }
            // 格式化对话历史
            const history = mentorMessages
                .reverse() // 按时间正序排列
                .map((msg, index) => {
                const time = new Date(msg.created_at).toLocaleString('zh-CN');
                return `[${time}] 导师 (${msg.scenario}): ${msg.message.substring(0, 200)}${msg.message.length > 200 ? '...' : ''}`;
            })
                .join('\n\n');
            return history;
        }
        catch (error) {
            logger_1.default.error(`Failed to get conversation history for order ${orderId}:`, error);
            return '无法获取对话历史';
        }
    }
    /**
     * 获取订单的完整对话历史（包括学生和导师）
     * @param orderId 订单ID
     * @param limit 获取最近N条消息
     * @returns 对话消息数组
     */
    async getFullConversationHistory(orderId, limit = 30) {
        try {
            // 获取导师消息
            const mentorMessages = await (0, db_1.query)(`SELECT message, created_at
         FROM mentor_sessions
         WHERE order_id = $1
         ORDER BY created_at DESC
         LIMIT $2`, [orderId, limit]);
            // 转换为统一格式
            const messages = mentorMessages.map(msg => ({
                role: 'mentor',
                content: msg.message,
                created_at: msg.created_at,
            }));
            // 按时间正序排列
            messages.reverse();
            return messages;
        }
        catch (error) {
            logger_1.default.error(`Failed to get full conversation history for order ${orderId}:`, error);
            return [];
        }
    }
    /**
     * 格式化对话历史为Claude API可用的格式
     * @param messages 对话消息数组
     * @returns 格式化的文本
     */
    formatForPrompt(messages) {
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
    async getConversationSummary(orderId) {
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
        }
        catch (error) {
            logger_1.default.error(`Failed to get conversation summary for order ${orderId}:`, error);
            return '无法生成对话摘要';
        }
    }
}
exports.default = new ConversationHistoryService();
//# sourceMappingURL=conversationHistoryService.js.map