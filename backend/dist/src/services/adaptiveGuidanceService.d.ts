interface StudentContext {
    studentId: number;
    taskId: number;
    sessionId: number;
    currentMessage: string;
    conversationHistory: Array<{
        role: string;
        content: string;
    }>;
    currentStage: string;
}
interface GuidanceResponse {
    content: string;
    tone: string;
    approach: string;
    encouragement?: string;
    celebrationMessage?: string;
    detectedEmotion?: string;
    emotionIntensity?: number;
    milestoneAchieved?: boolean;
    adaptations: {
        emotionalSupport: boolean;
        simplification: boolean;
        challenge: boolean;
        celebration: boolean;
    };
}
declare class AdaptiveGuidanceService {
    /**
     * 生成自适应引导回复
     */
    generateAdaptiveGuidance(context: StudentContext): Promise<GuidanceResponse>;
    /**
     * 使用AI生成自适应引导
     */
    private generateGuidanceWithAI;
    /**
     * 构建系统提示
     */
    private buildSystemPrompt;
    /**
     * 选择合适的AI模型
     */
    private selectModel;
    /**
     * 提取鼓励语句
     */
    private extractEncouragement;
    /**
     * 构建上下文摘要
     */
    private buildContextSummary;
    /**
     * 提取标签
     */
    private extractTags;
    /**
     * 获取学生档案
     */
    private getStudentProfile;
    /**
     * 异步提取并保存记忆
     */
    private extractAndSaveMemories;
    /**
     * 更新学习档案
     */
    updateLearningProfile(studentId: number, updates: {
        learningStyle?: any;
        preferredPace?: string;
        technicalSkills?: any;
        softSkills?: any;
        preferredGuidanceStyle?: string;
    }): Promise<void>;
    /**
     * 分析学习模式并更新档案
     */
    analyzeAndUpdateLearningPatterns(studentId: number, sessionId: number): Promise<void>;
    /**
     * 获取自适应引导建议
     */
    getGuidanceRecommendations(studentId: number, sessionId: number): Promise<{
        recommendedApproach: string;
        recommendedTone: string;
        shouldSimplify: boolean;
        shouldChallenge: boolean;
        shouldEncourage: boolean;
        reasoning: string;
    }>;
}
export declare const adaptiveGuidanceService: AdaptiveGuidanceService;
export {};
//# sourceMappingURL=adaptiveGuidanceService.d.ts.map