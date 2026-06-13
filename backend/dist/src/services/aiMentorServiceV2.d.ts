interface MentorMessage {
    role: 'student' | 'mentor' | 'system';
    message: string;
    quickReplies?: string[];
}
interface TriggerContext {
    triggerType: string;
    taskId?: string;
    taskTitle?: string;
    taskDescription?: string;
    studentLevel?: number;
    stuckPoint?: any;
    rejectionReason?: string;
    milestoneData?: any;
}
/**
 * AI导师核心服务
 * 实现5大触发场景的导师陪伴
 */
declare class AIMentorService {
    /**
     * 发送导师消息（支持5大触发场景）
     */
    sendMentorMessage(studentId: string, userMessage: string, context: TriggerContext): Promise<MentorMessage>;
    /**
     * T-01: 接单后第一步引导
     */
    triggerT01Onboarding(studentId: string, taskId: string, taskData: any): Promise<MentorMessage>;
    /**
     * T-02: 学生说"我卡住了"
     */
    triggerT02Stuck(studentId: string, taskId: string, userMessage: string, stuckDescription: string): Promise<MentorMessage>;
    /**
     * T-03: 交付物被打回
     */
    triggerT03Rejected(studentId: string, taskId: string, rejectionReason: string, feedbackDetails: any): Promise<MentorMessage>;
    /**
     * T-05: 里程碑见证
     */
    triggerT05Milestone(studentId: string, milestoneType: string, milestoneData: any): Promise<MentorMessage>;
    /**
     * 获取对话历史（最近10轮）
     */
    private getConversationHistory;
    /**
     * 查询同类卡点（用于T-02）
     */
    private findSimilarStuckPoints;
    /**
     * 获取导师人设记忆（偶尔引用）
     */
    private getPersonaMemory;
    /**
     * 构建AI Prompt
     */
    private buildPrompt;
    /**
     * 构建T-01接单引导Prompt
     */
    private buildT01Prompt;
    /**
     * 构建T-02卡住响应Prompt
     */
    private buildT02Prompt;
    /**
     * 构建T-03打回反馈Prompt
     */
    private buildT03Prompt;
    /**
     * 构建T-05里程碑见证Prompt
     */
    private buildT05Prompt;
    /**
     * 调用AI
     */
    private callAI;
}
declare const _default: AIMentorService;
export default _default;
//# sourceMappingURL=aiMentorServiceV2.d.ts.map