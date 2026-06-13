interface TaskDraft {
    company_id: string;
    title?: string;
    description?: string;
    category?: string;
    required_skills?: string[];
    budget?: number;
    deadline?: Date;
    requirements?: string[];
    deliverables?: string[];
    is_template?: boolean;
    template_name?: string;
}
interface BudgetSuggestionParams {
    task_category: string;
    task_description?: string;
    required_skills?: string[];
    quality_expectation?: 'basic' | 'standard' | 'premium';
}
/**
 * E-01a, E-01b, E-01d: 任务发布体验优化服务
 */
declare class TaskExperienceService {
    /**
     * E-01d: 保存任务草稿
     */
    saveDraft(data: TaskDraft): Promise<any>;
    /**
     * 更新草稿
     */
    updateDraft(draftId: string, companyId: string, updates: Partial<TaskDraft>): Promise<any>;
    /**
     * 获取草稿列表
     */
    getDrafts(companyId: string): Promise<any[]>;
    /**
     * 删除草稿
     */
    deleteDraft(draftId: string, companyId: string): Promise<void>;
    /**
     * 从草稿创建任务
     */
    publishFromDraft(draftId: string, companyId: string): Promise<any>;
    /**
     * E-01a: 获取任务模板列表
     */
    getTemplates(category?: string): Promise<any[]>;
    /**
     * 获取模板详情
     */
    getTemplateById(templateId: string): Promise<any>;
    /**
     * 使用模板创建草稿
     */
    createDraftFromTemplate(templateId: string, companyId: string, customData?: any): Promise<any>;
    /**
     * E-01b: 智能预算建议
     */
    suggestBudget(params: BudgetSuggestionParams, companyId: string): Promise<any>;
    /**
     * 使用AI生成预算建议理由
     */
    private generateBudgetReasoning;
    /**
     * 获取分类列表（用于模板筛选）
     */
    getCategories(): Promise<any[]>;
    /**
     * 搜索模板
     */
    searchTemplates(keyword: string): Promise<any[]>;
}
declare const _default: TaskExperienceService;
export default _default;
//# sourceMappingURL=taskExperienceService.d.ts.map