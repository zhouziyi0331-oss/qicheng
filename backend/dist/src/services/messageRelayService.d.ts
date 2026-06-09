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
interface SendMessageParams {
    taskId: string;
    fromUserId: string;
    toUserId: string;
    message: string;
    messageType?: 'text' | 'image' | 'file';
}
declare class MessageRelayService {
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
    sendMessage(params: SendMessageParams): Promise<{
        success: boolean;
        messageId: string;
        filtered: boolean;
        optimized: boolean;
        warning?: string;
    }>;
    /**
     * 获取合作次数
     */
    private getCollaborationCount;
    /**
     * 检测和屏蔽联系方式
     */
    private filterContactInfo;
    /**
     * 判断是否需要优化语气
     */
    private needsToneOptimization;
    /**
     * 优化语气（调用AI）
     */
    private optimizeTone;
    /**
     * 计算AI调用成本
     */
    private calculateCost;
    /**
     * 保存消息记录
     */
    private saveMessage;
    /**
     * 保存屏蔽日志
     */
    private saveFilterLogs;
    /**
     * 保存语气优化日志
     */
    private saveToneOptimizationLog;
    /**
     * 通知接收者（这里可以集成WebSocket或推送服务）
     */
    private notifyRecipient;
    /**
     * 提醒发送者关于屏蔽
     */
    private notifySenderAboutFilter;
    /**
     * 提醒发送者关于语气优化
     */
    private notifySenderAboutOptimization;
    /**
     * 获取用户信息
     */
    private getUser;
    /**
     * 发送消息的简化接口（供Controller调用）
     */
    relayMessage(fromUserId: string, toUserId: string, taskId: string, content: string): Promise<any>;
    /**
     * 获取消息历史（带权限验证）
     */
    getMessages(taskId: string, userId: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * 获取统计数据（平台端）
     */
    getStatistics(params: {
        studentId?: string;
        companyId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<any>;
    /**
     * 获取违规记录（平台端）
     */
    getViolations(userId?: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * 标记消息为已读
     */
    markAsRead(messageId: string, userId: string): Promise<void>;
}
export declare const messageRelayService: MessageRelayService;
export {};
//# sourceMappingURL=messageRelayService.d.ts.map