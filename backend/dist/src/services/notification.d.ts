/**
 * 消息推送通知服务
 * 支持站内信、短信、邮件、微信模板消息
 */
export declare enum NotificationType {
    TASK_MATCHED = "task_matched",// 任务匹配成功
    TASK_ACCEPTED = "task_accepted",// 任务被接受
    TASK_SUBMITTED = "task_submitted",// 任务已提交
    TASK_APPROVED = "task_approved",// 任务已通过
    TASK_REJECTED = "task_rejected",// 任务被拒绝
    AMENDMENT_CREATED = "amendment_created",// 追加需求
    AMENDMENT_ACCEPTED = "amendment_accepted",// 追加需求被接受
    DISPUTE_CREATED = "dispute_created",// 申诉创建
    DISPUTE_RESOLVED = "dispute_resolved",// 申诉已解决
    PAYMENT_SUCCESS = "payment_success",// 支付成功
    WITHDRAWAL_APPROVED = "withdrawal_approved",// 提现已批准
    LEVEL_UP = "level_up",// 等级提升
    MENTOR_MESSAGE = "mentor_message",// AI导师消息
    SYSTEM_ANNOUNCEMENT = "system_announcement"
}
export declare enum NotificationChannel {
    IN_APP = "in_app",// 站内信
    SMS = "sms",// 短信
    EMAIL = "email",// 邮件
    WECHAT = "wechat"
}
interface NotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    channels: NotificationChannel[];
    data?: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}
/**
 * 发送通知（多渠道）
 */
export declare function sendNotification(payload: NotificationPayload): Promise<void>;
/**
 * 批量发送通知
 */
export declare function sendBatchNotifications(userIds: string[], type: NotificationType, title: string, content: string, channels: NotificationChannel[], data?: any): Promise<void>;
/**
 * 获取用户未读通知数量
 */
export declare function getUnreadCount(userId: string): Promise<number>;
/**
 * 标记通知为已读
 */
export declare function markAsRead(notificationId: string, userId: string): Promise<void>;
/**
 * 标记所有通知为已读
 */
export declare function markAllAsRead(userId: string): Promise<void>;
export {};
//# sourceMappingURL=notification.d.ts.map