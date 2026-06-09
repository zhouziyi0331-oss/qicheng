/**
 * 任务草稿服务
 *
 * 处理任务草稿的创建、编辑、保存、发布等功能
 */
export interface TaskDraft {
    id: string;
    company_id: string;
    title: string;
    description: string;
    requirements?: string;
    deliverables?: string;
    category?: string;
    tags?: string[];
    budget_min?: number;
    budget_max?: number;
    deadline?: Date;
    estimated_hours?: number;
    required_abilities?: any[];
    difficulty_level?: string;
    attachments?: any[];
    draft_status: string;
    completion_percentage: number;
    ai_suggestions?: any;
    ai_pricing_suggestion?: any;
    last_ai_review_at?: Date;
    version: number;
    parent_draft_id?: string;
    created_at: Date;
    updated_at: Date;
    published_at?: Date;
    published_task_id?: string;
}
export interface CreateDraftParams {
    company_id: string;
    title: string;
    description?: string;
    requirements?: string;
    deliverables?: string;
    category?: string;
    tags?: string[];
    budget_min?: number;
    budget_max?: number;
    deadline?: Date;
    estimated_hours?: number;
    required_abilities?: any[];
    difficulty_level?: string;
    attachments?: any[];
}
export interface UpdateDraftParams {
    title?: string;
    description?: string;
    requirements?: string;
    deliverables?: string;
    category?: string;
    tags?: string[];
    budget_min?: number;
    budget_max?: number;
    deadline?: Date;
    estimated_hours?: number;
    required_abilities?: any[];
    difficulty_level?: string;
    attachments?: any[];
    draft_status?: string;
}
export interface AISuggestion {
    title_suggestions?: string[];
    description_improvements?: string[];
    requirement_clarifications?: string[];
    deliverable_suggestions?: string[];
    missing_information?: string[];
    overall_score: number;
    readiness: 'not_ready' | 'needs_improvement' | 'ready';
}
export interface AIPricingSuggestion {
    suggested_min: number;
    suggested_max: number;
    reasoning: string;
    market_comparison: string;
    complexity_score: number;
    time_estimate_hours: number;
}
declare class TaskDraftService {
    /**
     * 创建新草稿
     */
    createDraft(params: CreateDraftParams): Promise<TaskDraft>;
    /**
     * 更新草稿
     */
    updateDraft(draftId: string, companyId: string, params: UpdateDraftParams): Promise<TaskDraft>;
    /**
     * 获取草稿详情
     */
    getDraft(draftId: string, companyId: string): Promise<TaskDraft | null>;
    /**
     * 获取企业的所有草稿
     */
    getDrafts(companyId: string, filters?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        drafts: TaskDraft[];
        total: number;
    }>;
    /**
     * 删除草稿
     */
    deleteDraft(draftId: string, companyId: string): Promise<void>;
    /**
     * 复制草稿
     */
    duplicateDraft(draftId: string, companyId: string): Promise<TaskDraft>;
    /**
     * AI审核草稿并给出建议
     */
    reviewDraftWithAI(draftId: string, companyId: string): Promise<AISuggestion>;
    /**
     * AI智能定价建议
     */
    getPricingSuggestion(draftId: string, companyId: string): Promise<AIPricingSuggestion>;
    /**
     * 发布草稿为正式任务
     */
    publishDraft(draftId: string, companyId: string): Promise<string>;
    /**
     * 获取草稿历史版本
     */
    getDraftHistory(draftId: string, companyId: string, limit?: number): Promise<any[]>;
    /**
     * 恢复到历史版本
     */
    restoreDraftVersion(draftId: string, companyId: string, historyId: string): Promise<TaskDraft>;
}
export declare const taskDraftService: TaskDraftService;
export {};
//# sourceMappingURL=taskDraftService.d.ts.map