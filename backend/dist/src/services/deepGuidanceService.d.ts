interface DeepPattern {
    id: number;
    patternName: string;
    patternCategory: string;
    patternDescription: string;
    surfaceManifestations: string[];
    underlyingBeliefs: string[];
    guidanceApproach: string;
    reframingQuestions: string[];
    newPerspectives: string[];
}
interface PatternDetectionResult {
    detected: boolean;
    pattern?: DeepPattern;
    confidence: number;
    manifestationExamples: string[];
    triggerSituation: string;
}
interface DeepGuidanceResponse {
    content: string;
    dialogueStage: string;
    patternAddressed?: string;
    beliefChallenged?: string;
    newPerspectiveOffered?: string;
    challengeProposed?: any;
}
declare class DeepGuidanceService {
    /**
     * 检测学生消息中的深层模式
     */
    detectDeepPattern(studentId: number, studentMessage: string, conversationHistory: Array<{
        role: string;
        content: string;
    }>, currentEmotion: string): Promise<PatternDetectionResult>;
    /**
     * 生成深层引导回复
     */
    generateDeepGuidance(studentId: number, studentMessage: string, conversationHistory: Array<{
        role: string;
        content: string;
    }>, detectedPattern: PatternDetectionResult, currentEmotion: string): Promise<DeepGuidanceResponse>;
    /**
     * 使用AI分析是否匹配深层模式
     */
    private analyzeForPatterns;
    /**
     * 生成深层引导对话
     */
    private generateGuidanceDialogue;
    /**
     * 提议成长挑战
     */
    proposeGrowthChallenge(studentId: number, patternId: number, challengeType: string): Promise<any>;
    /**
     * 获取所有深层模式
     */
    private getAllPatterns;
    /**
     * 获取单个模式
     */
    private getPattern;
    /**
     * 记录模式检测
     */
    private recordPatternDetection;
    /**
     * 获取学生模式进展
     */
    private getStudentPatternProgress;
    /**
     * 确定对话阶段
     */
    private determineDialogueStage;
    /**
     * 获取对话模板
     */
    private getDialogueTemplate;
    /**
     * 更新引导进展
     */
    private updateGuidanceProgress;
    /**
     * 生成挑战任务
     */
    private generateChallenge;
    /**
     * 获取学生的所有深层模式
     */
    getStudentPatterns(studentId: number): Promise<any[]>;
}
export declare const deepGuidanceService: DeepGuidanceService;
export {};
//# sourceMappingURL=deepGuidanceService.d.ts.map