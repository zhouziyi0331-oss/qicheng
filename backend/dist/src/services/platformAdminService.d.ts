/**
 * 平台管理增强服务
 *
 * 提供提现审核、评价管理、用户认证、任务审核等核心管理功能
 */
export interface WithdrawalReview {
    id: string;
    withdrawal_id: string;
    reviewer_id: string;
    review_action: string;
    review_reason?: string;
    risk_level?: string;
    risk_factors?: any;
    reviewed_at: Date;
}
export interface UserVerification {
    id: string;
    user_id: string;
    verification_type: string;
    submitted_data: any;
    status: string;
    review_note?: string;
}
export interface TaskReview {
    id: string;
    task_id: string;
    reviewer_id: string;
    review_type: string;
    status: string;
    issues?: any;
    review_note?: string;
}
export interface RiskAlert {
    id: string;
    alert_type: string;
    severity: string;
    entity_type: string;
    entity_id: string;
    alert_reason: string;
    status: string;
}
export interface PlatformMetrics {
    metric_date: Date;
    total_users: number;
    new_users: number;
    active_users: number;
    total_tasks: number;
    completed_tasks: number;
    total_gmv: number;
    platform_revenue: number;
    avg_rating: number;
}
declare class PlatformAdminService {
    /**
     * 提现审核 - 批准
     */
    approveWithdrawal(withdrawalId: string, reviewerId: string, reason?: string): Promise<any>;
    /**
     * 提现审核 - 拒绝
     */
    rejectWithdrawal(withdrawalId: string, reviewerId: string, reason: string, riskLevel?: string): Promise<any>;
    /**
     * 获取待审核提现列表
     */
    getPendingWithdrawals(limit?: number, offset?: number): Promise<any>;
    /**
     * 用户认证审核 - 批准
     */
    approveUserVerification(verificationId: string, reviewerId: string, note?: string): Promise<any>;
    /**
     * 用户认证审核 - 拒绝
     */
    rejectUserVerification(verificationId: string, reviewerId: string, reason: string): Promise<any>;
    /**
     * 获取待审核用户认证列表
     */
    getPendingVerifications(limit?: number, offset?: number): Promise<any>;
    /**
     * 任务审核
     */
    reviewTask(taskId: string, reviewerId: string, reviewType: string, status: 'approved' | 'rejected' | 'flagged', issues?: any, note?: string): Promise<any>;
    /**
     * 评价管理 - 隐藏评价
     */
    hideRating(ratingId: string, reviewerId: string, reason: string): Promise<any>;
    /**
     * 创建风险预警
     */
    createRiskAlert(alertType: string, severity: string, entityType: string, entityId: string, reason: string, data?: any): Promise<any>;
    /**
     * 获取风险预警列表
     */
    getRiskAlerts(status?: string, severity?: string, limit?: number, offset?: number): Promise<any>;
    /**
     * 获取平台指标
     */
    getPlatformMetrics(startDate: Date, endDate: Date): Promise<PlatformMetrics[]>;
    /**
     * 计算每日指标
     */
    calculateDailyMetrics(date: Date): Promise<void>;
    /**
     * 获取系统配置
     */
    getSystemConfig(configKey: string): Promise<any>;
    /**
     * 更新系统配置
     */
    updateSystemConfig(configKey: string, configValue: any, updatedBy: string): Promise<any>;
    /**
     * 获取待审核项目汇总
     */
    getPendingReviews(): Promise<any>;
}
export declare const platformAdminService: PlatformAdminService;
export {};
//# sourceMappingURL=platformAdminService.d.ts.map