/**
 * 订单状态管理服务
 * 负责订单状态变更时自动触发相应的AI任务
 */
export declare enum OrderStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    IN_PROGRESS = "in_progress",
    SUBMITTED = "submitted",
    REVISION_REQUESTED = "revision_requested",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
declare class OrderStatusService {
    /**
     * 更新订单状态并触发相应的AI任务
     */
    updateOrderStatus(orderId: string, newStatus: OrderStatus, metadata?: any): Promise<void>;
    /**
     * 处理订单状态变更事件
     */
    private handleStatusChange;
    /**
     * T-01: 接单后30秒，任务拆解引导
     */
    private scheduleT01Guidance;
    /**
     * T-04: 监控学生活动，无操作超过2小时则轻推
     */
    private scheduleT04Monitoring;
    /**
     * AI-03: 交付物预审核
     */
    private triggerSubmissionReview;
    /**
     * T-03: 企业打回，翻译反馈
     */
    private triggerT03Guidance;
    /**
     * 任务完成：触发成长报告 + T-05里程碑见证
     */
    private triggerCompletionTasks;
    /**
     * 清理订单相关任务
     */
    private cleanupOrderTasks;
    /**
     * 获取状态变更消息
     */
    private getStatusMessage;
    /**
     * 记录学生活动
     */
    recordStudentActivity(orderId: string): Promise<void>;
}
declare const _default: OrderStatusService;
export default _default;
//# sourceMappingURL=orderStatusService.d.ts.map