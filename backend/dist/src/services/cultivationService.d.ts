interface CultivationPlan {
    company_id: string;
    student_id: string;
    plan_name: string;
    description?: string;
    target_role?: string;
    duration_months: number;
    target_skills: string[];
    target_level?: number;
    target_task_count?: number;
    phases: any[];
    incentives?: any;
    total_budget?: number;
}
/**
 * E-12: 定向培养计划服务
 * 企业为学生制定定向培养方案，培养所需人才
 */
declare class CultivationService {
    /**
     * 创建培养计划
     */
    createPlan(data: CultivationPlan): Promise<any>;
    /**
     * 学生响应培养计划
     */
    respondToPlan(planId: string, studentId: string, accepted: boolean, response?: string): Promise<any>;
    /**
     * 获取企业的培养计划列表
     */
    getCompanyPlans(companyId: string, status?: string): Promise<any[]>;
    /**
     * 获取学生的培养计划列表
     */
    getStudentPlans(studentId: string, status?: string): Promise<any[]>;
    /**
     * 获取培养计划详情
     */
    getPlanById(planId: string): Promise<any>;
    /**
     * 更新培养计划
     */
    updatePlan(planId: string, updates: any): Promise<any>;
    /**
     * 关联任务到培养计划
     */
    linkTask(planId: string, taskId: string, phaseNumber: number, purpose?: string): Promise<void>;
    /**
     * 记录技能学习
     */
    recordSkillLearning(planId: string, studentId: string, skillName: string, skillCategory?: string): Promise<any>;
    /**
     * 完成技能学习
     */
    completeSkillLearning(recordId: string, proficiencyLevel: number, verifiedByTaskId?: string): Promise<any>;
    /**
     * 添加反馈
     */
    addFeedback(planId: string, feedbackBy: string, feedbackRole: string, feedbackType: string, content: string): Promise<any>;
    /**
     * 获取反馈列表
     */
    getFeedbacks(planId: string): Promise<any[]>;
    /**
     * 完成培养计划评估
     */
    evaluatePlan(planId: string, evaluation: string, successScore: number): Promise<any>;
    /**
     * 获取培养统计
     */
    getCultivationStats(companyId: string): Promise<any>;
    /**
     * 获取推荐培养方案模板
     */
    getRecommendedTemplate(targetRole: string): Promise<any>;
}
declare const _default: CultivationService;
export default _default;
//# sourceMappingURL=cultivationService.d.ts.map