interface EmotionSignal {
    word: string;
    weight: number;
    category: string;
}
interface EmotionAnalysisResult {
    emotion: string;
    intensity: number;
    signals: EmotionSignal[];
    confidence: number;
}
interface EmotionResponseStrategy {
    emotion: string;
    responseApproach: string;
    toneGuidelines: string;
    examplePhrases: string[];
    guidanceAdjustments: any;
}
declare class EmotionAnalysisService {
    private emotionKeywords;
    /**
     * 分析学生消息中的情绪
     */
    analyzeEmotion(studentId: number, taskId: number, sessionId: number, messageId: number | null, content: string, context?: string): Promise<EmotionAnalysisResult>;
    /**
     * 基于规则的情绪检测
     */
    private detectEmotionByRules;
    /**
     * 使用AI进行情绪检测（用于复杂情况）
     */
    private detectEmotionByAI;
    /**
     * 合并规则检测和AI检测结果
     */
    private mergeResults;
    /**
     * 记录情绪到数据库
     */
    private logEmotion;
    /**
     * 更新对话上下文
     */
    private updateConversationContext;
    /**
     * 获取情绪响应策略
     */
    getResponseStrategy(emotion: string): Promise<EmotionResponseStrategy | null>;
    /**
     * 获取学生最近的情绪历史
     */
    getRecentEmotions(studentId: number, limit?: number): Promise<Array<{
        emotion: string;
        intensity: number;
        createdAt: Date;
    }>>;
    /**
     * 获取当前对话上下文
     */
    getConversationContext(sessionId: number): Promise<any>;
}
export declare const emotionAnalysisService: EmotionAnalysisService;
export {};
//# sourceMappingURL=emotionAnalysisService.d.ts.map