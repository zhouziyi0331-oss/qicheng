/**
 * 任务追加需求服务
 *
 * 处理任务进行中的需求变更、价格调整、协商等功能
 */
export interface TaskAmendment {
    id: string;
    task_id: string;
    company_id: string;
    student_id: string;
    amendment_type: string;
    title: string;
    description: string;
    original_requirement?: string;
    new_requirement?: string;
    price_adjustment: number;
    adjustment_reason?: string;
    deadline_extension_days: number;
    new_deadline?: Date;
    status: string;
    student_response?: string;
    student_counter_offer?: number;
    student_responded_at?: Date;
    company_final_decision?: string;
    company_final_comment?: string;
    negotiation_history: any[];
    ai_fairness_score?: number;
    ai_suggested_price?: number;
    ai_analysis?: string;
    completed: boolean;
    completed_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface CreateAmendmentParams {
    task_id: string;
    company_id: string;
    student_id: string;
    amendment_type: 'requirement_change' | 'scope_expansion' | 'deadline_extension' | 'other';
    title: string;
    description: string;
    original_requirement?: string;
    new_requirement?: string;
    price_adjustment?: number;
    adjustment_reason?: string;
    deadline_extension_days?: number;
    new_deadline?: Date;
}
export interface StudentResponseParams {
    amendment_id: string;
    student_id: string;
    response: string;
    counter_offer?: number;
    action: 'accept' | 'reject' | 'negotiate';
}
export interface CompanyDecisionParams {
    amendment_id: string;
    company_id: string;
    decision: 'accept_student_offer' | 'insist_original' | 'cancel';
    comment?: string;
}
export interface AIFairnessAnalysis {
    fairness_score: number;
    is_reasonable: boolean;
    suggested_price?: number;
    analysis: string;
    concerns: string[];
    recommendations: string[];
}
declare class TaskAmendmentService {
    /**
     * 创建追加需求
     */
    createAmendment(params: CreateAmendmentParams): Promise<TaskAmendment>;
    /**
     * 学生响应追加需求
     */
    studentRespond(params: StudentResponseParams): Promise<TaskAmendment>;
    /**
     * 企业最终决定（在协商后）
     */
    companyFinalDecision(params: CompanyDecisionParams): Promise<TaskAmendment>;
    /**
     * 应用追加需求到任务（内部方法）
     */
    private applyAmendmentToTask;
    /**
     * AI评估追加需求的合理性
     */
    analyzeAmendmentFairness(amendmentId: string): Promise<AIFairnessAnalysis>;
    /**
     * 获取任务的所有追加需求
     */
    getTaskAmendments(taskId: string, userId: string): Promise<TaskAmendment[]>;
    /**
     * 获取追加需求详情
     */
    getAmendment(amendmentId: string, userId: string): Promise<TaskAmendment | null>;
    /**
     * 取消追加需求（企业主动取消）
     */
    cancelAmendment(amendmentId: string, companyId: string, reason?: string): Promise<void>;
}
export declare const taskAmendmentService: TaskAmendmentService;
export {};
//# sourceMappingURL=taskAmendmentService.d.ts.map