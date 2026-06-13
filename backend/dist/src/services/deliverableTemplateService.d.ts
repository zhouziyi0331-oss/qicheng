/**
 * 交付标准模板服务 - E-02功能
 * 管理交付标准模板库，提供标准化的交付要求
 */
interface DeliverableTemplate {
    id?: string;
    name: string;
    description: string;
    category: string;
    task_type: string;
    standards: {
        functional?: string[];
        quality?: string[];
        documentation?: string[];
        files?: string[];
    };
    checklist: Array<{
        item: string;
        required: boolean;
    }>;
    example_files?: any[];
    usage_count?: number;
    success_rate?: number;
    is_public?: boolean;
    is_official?: boolean;
    created_by?: string;
}
interface TemplateFilter {
    category?: string;
    task_type?: string;
    is_public?: boolean;
    is_official?: boolean;
}
declare class DeliverableTemplateService {
    /**
     * 创建交付标准模板
     */
    createTemplate(template: DeliverableTemplate, userId: string): Promise<string>;
    /**
     * 获取模板列表
     */
    getTemplates(filter?: TemplateFilter, limit?: number): Promise<DeliverableTemplate[]>;
    /**
     * 获取单个模板
     */
    getTemplate(templateId: string): Promise<DeliverableTemplate | null>;
    /**
     * 更新模板
     */
    updateTemplate(templateId: string, updates: Partial<DeliverableTemplate>): Promise<void>;
    /**
     * 删除模板
     */
    deleteTemplate(templateId: string): Promise<void>;
    /**
     * 为任务应用模板
     */
    applyTemplateToTask(taskId: string, templateId: string, userId: string, customizations?: {
        customized_standards?: any;
        customized_checklist?: any;
    }): Promise<void>;
    /**
     * 获取任务的交付标准
     */
    getTaskDeliverableStandards(taskId: string): Promise<any>;
    /**
     * 获取模板分类列表
     */
    getCategories(): Promise<Array<{
        category: string;
        count: number;
    }>>;
    /**
     * 获取任务类型列表
     */
    getTaskTypes(category?: string): Promise<Array<{
        task_type: string;
        count: number;
    }>>;
    /**
     * 根据任务类型推荐模板
     */
    recommendTemplates(taskDescription: string, limit?: number): Promise<DeliverableTemplate[]>;
    /**
     * 更新模板成功率
     */
    updateTemplateSuccessRate(templateId: string, wasSuccessful: boolean): Promise<void>;
}
declare const _default: DeliverableTemplateService;
export default _default;
//# sourceMappingURL=deliverableTemplateService.d.ts.map