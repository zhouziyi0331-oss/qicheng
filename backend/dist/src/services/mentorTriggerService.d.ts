/**
 * AI导师触发服务
 * 负责在任务流程的关键节点自动触发导师对话
 */
export declare enum TriggerType {
    TASK_ACCEPTED = "task_accepted",
    EXECUTION_STARTED = "execution_started",
    STUDENT_STUCK = "student_stuck",
    SUBMISSION_READY = "submission_ready",
    COMPANY_FEEDBACK = "company_feedback",
    MANUAL = "manual"
}
export interface TriggerCondition {
    type: TriggerType;
    taskId: string;
    studentId: string;
    metadata?: any;
}
export declare class MentorTriggerService {
    /**
     * 触发需求理解阶段（任务接单后24小时内）
     */
    triggerRequirementUnderstanding(taskId: string, studentId: string): Promise<void>;
    /**
     * 触发执行引导阶段（学生开始执行后）
     */
    triggerExecutionGuidance(taskId: string, studentId: string, studentQuestion?: string): Promise<void>;
    /**
     * 触发质量预审阶段（学生准备提交前）
     */
    triggerQualityReview(taskId: string, studentId: string, submission: string): Promise<{
        passed: boolean;
        score: number;
        feedback: string;
    }>;
    /**
     * 触发沟通桥梁阶段（企业反馈后）
     */
    triggerCommunicationBridge(taskId: string, studentId: string, companyFeedback: string): Promise<void>;
    /**
     * 记录触发事件
     */
    private recordTrigger;
    /**
     * 构建上下文
     */
    private buildContext;
    /**
     * 映射模型推荐
     */
    private mapModelRecommendation;
    /**
     * 计算成本（简化版）
     */
    private calculateCost;
}
export declare const mentorTriggerService: MentorTriggerService;
//# sourceMappingURL=mentorTriggerService.d.ts.map