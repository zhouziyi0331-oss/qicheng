/**
 * ✅ P2安全: AI导师服务 - Prompt注入防护
 *
 * 关键措施：
 * 1. 检测并过滤已知的注入模式
 * 2. 加固System Prompt
 * 3. 检测AI响应异常
 * 4. 记录所有疑似注入尝试
 */
export declare class MentorService {
    /**
     * ✅ P2安全: 过滤Prompt注入
     */
    private sanitizeUserMessage;
    /**
     * ✅ P2安全: 加固的System Prompt
     */
    private getSecureSystemPrompt;
    /**
     * ✅ P2安全: 发送消息（带注入防护）
     */
    sendMessage(userId: string, sessionId: string, message: string): Promise<string>;
    /**
     * ✅ P2安全: 检查AI响应是否异常
     */
    private isAnomalousResponse;
    /**
     * 记录安全事件
     */
    private recordSecurityEvent;
    /**
     * 调用AI（占位符，实际实现需要调用真实的AI API）
     */
    private callAI;
    /**
     * 保存消息
     */
    private saveMessage;
}
export declare const mentorService: MentorService;
//# sourceMappingURL=mentorService.d.ts.map