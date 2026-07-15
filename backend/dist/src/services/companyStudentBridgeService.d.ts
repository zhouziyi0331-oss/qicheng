/**
 * Phase 3.3: 企业-学生端打通服务
 * 让企业看到学生的成长，学生获得来自企业的认可
 */
export interface GrowthNotification {
    id: number;
    studentId: string;
    studentName?: string;
    companyId: string;
    notificationType: 'level_up' | 'skill_breakthrough' | 'achievement_unlock' | 'project_completed';
    title: string;
    content: string;
    metadata?: any;
    isRead: boolean;
    createdAt: Date;
}
export interface ReputationTag {
    id: number;
    companyId: string;
    studentId: string;
    tagType: 'strength' | 'potential' | 'concern';
    tagName: string;
    tagDescription?: string;
    evidence?: string;
    sourceTaskId?: string;
    confidenceScore?: number;
    isVisibleToStudent: boolean;
    createdAt: Date;
}
export interface StudentMilestone {
    id: string;
    studentId: string;
    milestoneType: 'level_up' | 'task_count' | 'earning_milestone' | 'skill_mastery';
    milestoneName: string;
    milestoneDescription?: string;
    achievedValue: number;
    metadata?: any;
    achievedAt: Date;
}
declare class CompanyStudentBridgeService {
    /**
     * 记录学生成长里程碑
     */
    recordMilestone(params: {
        studentId: string;
        milestoneType: 'level_up' | 'task_count' | 'earning_milestone' | 'skill_mastery';
        milestoneName: string;
        milestoneDescription?: string;
        achievedValue: number;
        metadata?: any;
    }): Promise<string>;
    /**
     * 通知订阅的企业
     */
    private notifySubscribedCompanies;
    /**
     * 生成通知内容
     */
    private generateNotificationContent;
    /**
     * 企业订阅学生成长
     */
    subscribeToStudent(params: {
        companyId: string;
        studentId: string;
        subscriptionType?: 'normal' | 'priority' | 'potential';
        notificationPreferences?: any;
    }): Promise<boolean>;
    /**
     * 企业添加学生声誉标签
     */
    addReputationTag(params: {
        companyId: string;
        studentId: string;
        tagType: 'strength' | 'potential' | 'concern';
        tagName: string;
        tagDescription?: string;
        evidence?: string;
        sourceTaskId?: string;
        confidenceScore?: number;
        isVisibleToStudent?: boolean;
        createdBy: string;
    }): Promise<number>;
    /**
     * 获取学生的声誉标签（学生视角）
     */
    getStudentReputationTags(studentId: string): Promise<ReputationTag[]>;
    /**
     * 获取企业的成长通知
     */
    getCompanyNotifications(params: {
        companyId: string;
        unreadOnly?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        notifications: GrowthNotification[];
        total: number;
    }>;
    /**
     * 标记通知为已读
     */
    markNotificationAsRead(notificationId: number, companyId: string): Promise<boolean>;
    /**
     * 获取学生的成长里程碑
     */
    getStudentMilestones(params: {
        studentId: string;
        milestoneType?: string;
        limit?: number;
    }): Promise<StudentMilestone[]>;
}
declare const _default: CompanyStudentBridgeService;
export default _default;
//# sourceMappingURL=companyStudentBridgeService.d.ts.map