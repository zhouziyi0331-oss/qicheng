/**
 * 活跃度检测服务
 * 负责追踪学生登录活跃度，7天未登录暂停邀请资格
 */
interface ActivityLog {
    id: string;
    student_id: string;
    last_login_at: Date;
    last_active_at: Date;
    is_active: boolean;
    inactive_since: Date | null;
    invitation_eligible: boolean;
    weekly_logins: number;
    monthly_logins: number;
}
export declare class ActivityService {
    /**
     * 记录学生登录
     */
    recordLogin(studentId: string): Promise<void>;
    /**
     * 记录学生活跃（任何操作）
     */
    recordActivity(studentId: string): Promise<void>;
    /**
     * 检查学生是否有邀请资格
     */
    checkInvitationEligibility(studentId: string): Promise<boolean>;
    /**
     * 获取学生活跃度信息
     */
    getActivityLog(studentId: string): Promise<ActivityLog | null>;
    /**
     * 批量检测不活跃学生（定时任务调用）
     * 7天未登录 → 标记为不活跃，暂停邀请资格
     */
    detectInactiveStudents(): Promise<number>;
    /**
     * 重新激活学生（登录后自动调用）
     */
    reactivateStudent(studentId: string): Promise<void>;
    /**
     * 获取所有有邀请资格的学生列表
     */
    getEligibleStudents(filters?: {
        minLevel?: number;
        abilities?: Record<string, number>;
        tags?: string[];
    }): Promise<Array<{
        student_id: string;
        current_level: number;
        abilities: Record<string, number>;
        tags: string[];
        last_login_at: Date;
    }>>;
    /**
     * 重置周统计（每周一执行）
     */
    resetWeeklyStats(): Promise<void>;
    /**
     * 重置月统计（每月1号执行）
     */
    resetMonthlyStats(): Promise<void>;
}
export declare const activityService: ActivityService;
export {};
//# sourceMappingURL=activityService.d.ts.map