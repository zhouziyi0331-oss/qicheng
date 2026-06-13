/**
 * E-05a, E-05b, E-05c, E-05d: 匹配增强服务
 */
declare class MatchingEnhancementService {
    /**
     * E-05a: 创建试稿邀请
     */
    createTrialInvitation(data: {
        task_id: string;
        student_id: string;
        company_id: string;
        trial_requirement: string;
        trial_deadline: Date;
        trial_budget?: number;
    }): Promise<any>;
    /**
     * 学生响应试稿邀请
     */
    respondToTrialInvitation(invitationId: string, studentId: string, accepted: boolean, response?: string): Promise<any>;
    /**
     * 学生提交试稿
     */
    submitTrial(invitationId: string, studentId: string, submission: string, files?: any[]): Promise<any>;
    /**
     * 企业评估试稿
     */
    evaluateTrial(invitationId: string, companyId: string, evaluation: string, score: number, approved: boolean): Promise<any>;
    /**
     * 获取试稿邀请列表
     */
    getTrialInvitations(userId: string, role: string, status?: string): Promise<any[]>;
    /**
     * E-05b: 对比多个学生
     */
    compareStudents(companyId: string, studentIds: string[], taskId?: string, dimensions?: any): Promise<any>;
    /**
     * E-05c: 手动搜索和筛选学生
     */
    searchStudents(companyId: string, filters: any, taskId?: string): Promise<any>;
    /**
     * E-05d: 记录匹配拒绝反馈
     */
    recordRejectionFeedback(taskId: string, studentId: string, companyId: string, reason: string, detail?: string): Promise<any>;
    /**
     * 使用AI分析拒绝原因
     */
    private analyzeRejectionReason;
    /**
     * 获取学生收到的拒绝反馈
     */
    getStudentRejectionFeedback(studentId: string): Promise<any[]>;
    /**
     * 分析拒绝原因统计（用于优化匹配算法）
     */
    analyzeRejectionPatterns(taskId?: string): Promise<any>;
    /**
     * 更新学生可见度设置
     */
    updateVisibilitySettings(studentId: string, settings: any): Promise<any>;
    /**
     * 获取试稿统计
     */
    getTrialStats(userId: string, role: string): Promise<any>;
}
declare const _default: MatchingEnhancementService;
export default _default;
//# sourceMappingURL=matchingEnhancementService.d.ts.map