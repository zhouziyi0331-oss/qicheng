/**
 * 对话历史管理服务
 * 负责获取和格式化导师对话历史
 */
interface ConversationMessage {
    role: 'student' | 'mentor';
    content: string;
    created_at: Date;
}
declare class ConversationHistoryService {
    /**
     * 获取订单的对话历史
     * @param orderId 订单ID
     * @param limit 获取最近N条消息（默认30条）
     * @returns 格式化的对话历史文本
     */
    getConversationHistory(orderId: string, limit?: number): Promise<string>;
    /**
     * 获取订单的完整对话历史（包括学生和导师）
     * @param orderId 订单ID
     * @param limit 获取最近N条消息
     * @returns 对话消息数组
     */
    getFullConversationHistory(orderId: string, limit?: number): Promise<ConversationMessage[]>;
    /**
     * 格式化对话历史为Claude API可用的格式
     * @param messages 对话消息数组
     * @returns 格式化的文本
     */
    formatForPrompt(messages: ConversationMessage[]): string;
    /**
     * 获取对话摘要（用于长对话）
     * @param orderId 订单ID
     * @returns 对话摘要
     */
    getConversationSummary(orderId: string): Promise<string>;
}
declare const _default: ConversationHistoryService;
export default _default;
//# sourceMappingURL=conversationHistoryService.d.ts.map