interface HumanizedResponse {
    content: string;
    tone: string;
    hasEmpathy: boolean;
    hasWarmth: boolean;
    remembersPast: boolean;
    toolRecommendations?: ToolRecommendation[];
    followUpTopics?: string[];
    deepGuidance?: {
        patternDetected: boolean;
        patternName?: string;
        dialogueStage?: string;
        beliefChallenged?: string;
    };
}
interface ToolRecommendation {
    toolName: string;
    whyRecommend: string;
    howToUse: string;
    quickStartSteps: string[];
    websiteUrl: string;
}
declare class HumanizedConversationService {
    /**
     * 生成人性化的对话回复（终极版 - 包含深层引导）
     */
    generateHumanizedResponse(studentId: number, taskId: number, sessionId: number, studentMessage: string, conversationHistory: Array<{
        role: string;
        content: string;
    }>, currentEmotion: string): Promise<HumanizedResponse>;
    /**
     * 构建人性化的系统提示
     */
    private buildHumanizedSystemPrompt;
    /**
     * 分析学生的具体困难
     */
    private analyzeSpecificStruggle;
    /**
     * 分析任务并推荐工具
     */
    private analyzeAndRecommendTools;
    /**
     * 检测任务类型
     */
    private detectTaskType;
    /**
     * 获取合适的对话片段
     */
    private getAppropriatePhrase;
    /**
     * 获取人性化上下文
     */
    private getHumanizedContext;
    /**
     * 更新人性化上下文
     */
    private updateHumanizedContext;
    /**
     * 提取值得记住的话
     */
    private extractMemorableQuote;
    /**
     * 检测重要时刻
     */
    private detectImportantMoment;
    /**
     * 检测共同经历
     */
    private detectSharedExperience;
    /**
     * 记录具体困难
     */
    private recordSpecificStruggle;
    /**
     * 获取工具ID
     */
    private getToolId;
    /**
     * 生成跟进话题
     */
    private generateFollowUpTopics;
    /**
     * 检测语气
     */
    private detectTone;
    /**
     * 检测是否有共情
     */
    private hasEmpathy;
    /**
     * 检测是否有温度
     */
    private hasWarmth;
    /**
     * 提取标签
     */
    private extractTags;
}
export declare const humanizedConversationService: HumanizedConversationService;
export {};
//# sourceMappingURL=humanizedConversationService.d.ts.map