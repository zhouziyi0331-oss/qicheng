interface AbilityScore {
    dimension: string;
    score: number;
    description: string;
}
interface PersonalityTag {
    name: string;
    description: string;
    color: string;
}
interface SelfPerception {
    userWords: string[];
    aiAnalysis: string;
    gap: string;
}
interface TrackRecommendation {
    track: string;
    match_score: number;
    reason: string;
    firstTaskSuggestion: string;
}
interface OPCAnalysisResult {
    abilityScores: AbilityScore[];
    personalityTags: PersonalityTag[];
    selfPerception: SelfPerception;
    trackRecommendation: TrackRecommendation;
}
declare class OPCv2AnalysisService {
    /**
     * 开始新的测试
     */
    startAssessment(userId: string): Promise<string>;
    /**
     * 提交答案
     */
    submitAnswer(assessmentId: string, questionId: string, questionType: 'definition' | 'choice', answerData: {
        answerText?: string;
        selectedOption?: string;
    }): Promise<void>;
    /**
     * 完成测试并生成分析报告
     */
    completeAssessment(assessmentId: string): Promise<OPCAnalysisResult>;
    /**
     * 使用Claude AI分析测试结果
     */
    private analyzeWithAI;
    /**
     * 构建AI分析提示词
     */
    private buildAnalysisPrompt;
    /**
     * 计算六维度分数（基于选择题答案）
     */
    private calculateDimensionScores;
    /**
     * 保存分析结果到数据库
     */
    private saveResult;
    /**
     * 获取测试结果
     */
    getResult(assessmentId: string): Promise<OPCAnalysisResult | null>;
    /**
     * 获取用户最新的OPC结果
     */
    getLatestResult(userId: string): Promise<OPCAnalysisResult | null>;
}
declare const _default: OPCv2AnalysisService;
export default _default;
//# sourceMappingURL=opcV2AnalysisService.d.ts.map