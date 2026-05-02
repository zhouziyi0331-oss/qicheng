/**
 * AI需求确认引擎
 */
export declare class AIRequirementEngine {
    /**
     * 开始需求确认对话
     */
    static startDialogue(companyId: string, taskDraftId?: number): Promise<{
        sessionId: string;
    }>;
    /**
     * 处理用户消息并生成AI回复
     */
    static processMessage(sessionId: string, companyId: string, message: string): Promise<{
        message: string;
        extractedInfo: any;
        confidence: number;
    }>;
    /**
     * 生成AI回复（模拟）
     */
    private static generateAIResponse;
    /**
     * 获取对话历史
     */
    static getDialogueHistory(sessionId: string): Promise<any[]>;
}
/**
 * AI任务拆解引擎
 */
export declare class AITaskDecompositionEngine {
    /**
     * 拆解任务
     */
    static decomposeTask(taskId: number, taskDescription: string): Promise<any>;
    /**
     * 生成任务拆解（模拟）
     */
    private static generateDecomposition;
    /**
     * 创建子任务
     */
    static createSubtasks(decompositionId: number, parentTaskId: number): Promise<void>;
    /**
     * 获取任务的子任务列表
     */
    static getSubtasks(parentTaskId: number): Promise<any[]>;
}
/**
 * AI任务审核引擎
 */
export declare class AITaskReviewEngine {
    /**
     * AI审核任务
     */
    static reviewTask(taskId: number, taskData: any): Promise<any>;
    /**
     * 生成审核结果（模拟）
     */
    private static generateReview;
    /**
     * 人工审核
     */
    static humanReview(reviewId: number, reviewerId: number, approved: boolean, feedback: string): Promise<void>;
}
/**
 * AI问答引擎
 */
export declare class AIQAEngine {
    /**
     * 回答问题
     */
    static answerQuestion(userId: string, question: string, taskId?: number): Promise<{
        answer: any;
        knowledgeBaseId: any;
        confidence: number;
    }>;
    /**
     * 从知识库匹配答案
     */
    private static matchAnswer;
    /**
     * 标记答案是否有帮助
     */
    static markHelpful(historyId: number, isHelpful: boolean): Promise<void>;
}
//# sourceMappingURL=aiEngineService.d.ts.map