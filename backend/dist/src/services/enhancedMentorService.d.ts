interface MentorResponse {
    content: string;
    mentorType: 'emotional' | 'project' | 'coordinated';
    emotionalContent?: string;
    projectContent?: string;
    transitionText?: string;
    detectedSignals: {
        passionSpark: boolean;
        flowMoment: boolean;
        stuckPoint: boolean;
        breakthrough: boolean;
    };
    suggestions?: string[];
    projectGuidance?: {
        socraticQuestions?: string[];
        mvpSuggestion?: any;
        taskDecomposition?: any;
    };
}
export declare class EnhancedMentorService {
    private anthropic;
    private defaultModel;
    private emotionalKeywords;
    private projectKeywords;
    private stuckIndicators;
    constructor();
    /**
     * 主对话方法 - 统一入口
     */
    chat(userId: string, message: string, options?: {
        sessionId?: string;
        taskId?: string;
        projectId?: string;
        forceMode?: 'emotional' | 'project';
    }): Promise<{
        success: boolean;
        sessionId: string;
        response: MentorResponse;
        tokensUsed: number;
        responseTime: number;
    }>;
    /**
     * 分析消息类型
     */
    private analyzeMessage;
    /**
     * AI分析消息
     */
    private aiAnalyzeMessage;
    /**
     * 生成响应
     */
    private generateResponse;
    /**
     * 生成情感响应
     */
    private generateEmotionalResponse;
    /**
     * 生成项目响应（苏格拉底式）
     */
    private generateProjectResponse;
    /**
     * 生成协同响应
     */
    private generateCoordinatedResponse;
    /**
     * 构建情感模式的System Prompt
     */
    private buildEmotionalSystemPrompt;
    /**
     * 构建项目模式的System Prompt
     */
    private buildProjectSystemPrompt;
    /**
     * 生成苏格拉底式问题
     */
    private generateSocraticQuestions;
    /**
     * 生成MVP方案
     */
    private generateMVPSuggestion;
    /**
     * 生成过渡语
     */
    private generateTransition;
    /**
     * 检测信号
     */
    private detectSignals;
    /**
     * 检查是否可以转化为项目
     */
    private canTransformToProject;
    /**
     * 计算关键词分数
     */
    private calculateKeywordScore;
    /**
     * 创建强制分析（当用户指定模式时）
     */
    private createForcedAnalysis;
    /**
     * 获取用户上下文
     */
    private getUserContext;
    /**
     * 获取对话历史
     */
    private getConversationHistory;
    /**
     * 创建会话
     */
    private createSession;
    /**
     * 保存对话记录
     */
    private saveConversation;
    /**
     * 更新导师模式统计
     */
    private updateMentorModeStats;
}
declare const _default: EnhancedMentorService;
export default _default;
//# sourceMappingURL=enhancedMentorService.d.ts.map