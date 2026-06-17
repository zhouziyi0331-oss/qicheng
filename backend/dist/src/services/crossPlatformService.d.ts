/**
 * 跨端打通服务
 * 实现企业端和学生端的双向联动功能
 */
interface RequirementChange {
    task_id: string;
    changed_by: string;
    old_requirements: any;
    new_requirements: any;
}
interface MatchingUpdateNotification {
    student_id: string;
    task_id: string;
    change_type: string;
    old_match_score: number;
    new_match_score: number;
    change_reason: string;
}
declare class CrossPlatformService {
    /**
     * 记录需求变更并触发重新匹配
     */
    recordRequirementChange(data: RequirementChange): Promise<{
        change_id: any;
        affected_students_count: number;
        improved_count: number;
        decreased_count: number;
    }>;
    /**
     * 创建匹配更新通知
     */
    createMatchingUpdateNotification(data: MatchingUpdateNotification): Promise<void>;
    /**
     * 获取学生的匹配更新通知
     */
    getMatchingUpdatesForStudent(studentId: string): Promise<any[]>;
    /**
     * 处理学生等级变化（由触发器调用）
     */
    handleLevelChange(studentId: string, oldLevel: number, newLevel: number): Promise<{
        new_tasks_count: number;
        new_tasks: any[];
        notified_companies_count: number;
    }>;
    /**
     * 企业设置等待学生成长的条件
     */
    setWatchStudent(companyId: string, studentId: string, condition: any, note?: string): Promise<any>;
    /**
     * 获取企业等待的学生列表
     */
    getWatchingStudents(companyId: string): Promise<any[]>;
    /**
     * 学生更新任务进度
     */
    updateTaskProgress(taskId: string, studentId: string, stage: string, progressPercentage: number, estimatedCompletion?: Date): Promise<any>;
    /**
     * 企业查看任务进度
     */
    getTaskProgress(taskId: string, companyId: string): Promise<any>;
    /**
     * 记录卡点并生成脱敏摘要
     */
    recordBlockage(taskId: string, studentId: string, blockageType: string, description: string): Promise<any>;
    /**
     * 使用AI生成脱敏摘要
     */
    private generateDesensitizedSummary;
    /**
     * 企业关注学生
     */
    followStudent(companyId: string, studentId: string, reason?: string, source?: string): Promise<any>;
    /**
     * 获取企业关注的学生动态
     */
    getFollowedStudentsUpdates(companyId: string): Promise<any[]>;
    /**
     * 获取学生的关注者（企业）
     */
    getStudentFollowers(studentId: string): Promise<any[]>;
    /**
     * 创建双向评价
     */
    createMutualRating(data: {
        task_id: string;
        company_id: string;
        student_id: string;
        company_to_student_rating: number;
        company_to_student_comment: string;
        student_to_company_rating: number;
        student_to_company_comment: string;
        student_to_company_dimensions?: any;
    }): Promise<any>;
    /**
     * 获取企业-学生的关系标签
     */
    getRelationshipBadges(companyId: string, studentId: string): Promise<any[]>;
    /**
     * 学生添加创作说明
     */
    addCreationNotes(data: {
        task_id: string;
        student_id: string;
        style_explanation?: string;
        creative_challenge?: string;
        satisfaction_highlight?: string;
        time_spent_hours?: number;
        tools_used?: string[];
    }): Promise<any>;
    /**
     * 使用AI生成需求变更摘要
     */
    private summarizeChange;
    /**
     * 重新计算匹配分数 - 真实算法
     */
    private recalculateMatchScore;
    /**
     * 生成需求变更原因 - 真实分析
     */
    private generateChangeReason;
}
declare const _default: CrossPlatformService;
export default _default;
//# sourceMappingURL=crossPlatformService.d.ts.map