/**
 * 通知消息服务
 *
 * 提供完整的消息推送、管理和统计功能
 */
export interface Notification {
    id: string;
    user_id: string;
    user_type: string;
    type: string;
    category: string;
    title: string;
    content: string;
    icon?: string;
    data?: any;
    actions?: any[];
    priority: string;
    channels: string[];
    is_read: boolean;
    read_at?: Date;
    created_at: Date;
    expires_at?: Date;
}
export interface NotificationTemplate {
    id: string;
    template_key: string;
    template_name: string;
    title_template: string;
    content_template: string;
    icon?: string;
    user_type: string;
    type: string;
    category: string;
    priority: string;
    default_channels: string[];
    actions_template: any[];
    variables: string[];
}
export interface SendNotificationParams {
    userId: string;
    templateKey: string;
    variables?: Record<string, any>;
    relatedTaskId?: string;
    relatedUserId?: string;
    scheduledAt?: Date;
}
export interface NotificationSettings {
    user_id: string;
    in_app_enabled: boolean;
    wechat_enabled: boolean;
    sms_enabled: boolean;
    email_enabled: boolean;
    mentor_messages_enabled: boolean;
    task_updates_enabled: boolean;
    milestones_enabled: boolean;
    warnings_enabled: boolean;
    recommendations_enabled: boolean;
}
declare class NotificationService {
    /**
     * 发送通知（基于模板）
     */
    sendNotification(params: SendNotificationParams): Promise<Notification>;
    /**
     * 批量发送通知
     */
    sendBulkNotifications(notifications: SendNotificationParams[]): Promise<Notification[]>;
    /**
     * 获取用户通知列表
     */
    getUserNotifications(userId: string, options?: {
        isRead?: boolean;
        category?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        notifications: Notification[];
        total: number;
    }>;
    /**
     * 获取未读消息统计
     */
    getUnreadCount(userId: string): Promise<any>;
    /**
     * 标记通知已读
     */
    markAsRead(notificationId: string): Promise<boolean>;
    /**
     * 批量标记已读
     */
    markAllAsRead(userId: string): Promise<number>;
    /**
     * 删除通知
     */
    deleteNotification(notificationId: string): Promise<boolean>;
    /**
     * 获取用户通知设置
     */
    getUserSettings(userId: string): Promise<NotificationSettings>;
    /**
     * 更新用户通知设置
     */
    updateUserSettings(userId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings>;
    /**
     * 检查是否应该发送通知
     */
    private shouldSendNotification;
    /**
     * 推送到各个渠道
     */
    private pushToChannels;
    /**
     * 推送到具体渠道
     */
    private pushToChannel;
    /**
     * 小程序内推送（WebSocket）
     */
    private pushInApp;
    /**
     * 微信服务号推送
     */
    private pushWechat;
    /**
     * 短信推送
     */
    private pushSMS;
    /**
     * 邮件推送
     */
    private pushEmail;
    /**
     * 获取通知模板
     */
    getTemplate(templateKey: string): Promise<NotificationTemplate | null>;
    /**
     * 获取所有模板
     */
    getAllTemplates(userType?: string): Promise<NotificationTemplate[]>;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notificationService.d.ts.map