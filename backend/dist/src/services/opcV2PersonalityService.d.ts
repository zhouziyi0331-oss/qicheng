interface OPCAnswer {
    questionId: string;
    questionNumber: number;
    dimension: string;
    answerValue: any;
}
interface OPCAnalysisResult {
    personalityType: string;
    personalityTypeLabel: string;
    initialLevel: number;
    levelReason: string;
    trackRecommendation: string;
    trackRecommendationLabel: string;
    trackReason: string;
    threeStrengths: string[];
    twoGaps: string[];
    declaration: string;
}
declare class OPCAnalysisService {
    /**
     * 提交测试答案并进行AI分析
     */
    submitAndAnalyze(userId: string, answers: OPCAnswer[]): Promise<{
        sessionId: string;
        analysisResult: OPCAnalysisResult;
    }>;
    /**
     * 使用AI分析用户答案
     */
    private analyzeWithAI;
    /**
     * 验证AI分析结果
     */
    private validateAnalysisResult;
    /**
     * 获取用户最新的OPC分析结果
     */
    getLatestProfile(userId: string): Promise<any>;
    /**
     * 获取所有测试题目
     */
    getQuestions(): Promise<any[]>;
}
declare const _default: OPCAnalysisService;
export default _default;
//# sourceMappingURL=opcV2PersonalityService.d.ts.map