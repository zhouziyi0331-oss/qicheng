/**
 * OPC测试结果分析服务
 * 从38道测试题的原始回答，推导出学生的"理想工作条件画像"
 */
interface OPCTestResult {
    studentId: string;
    answers: any;
    scores: {
        openness: number;
        persistence: number;
        creativity: number;
        informationProcessing: number;
        creationDrive: number;
        learningStyle: number;
        executionRhythm: number;
        collaborationStyle: number;
        riskAttitude: number;
    };
    personalityTag: string;
}
interface WorkConditionProfile {
    studentId: string;
    informationReception: {
        preference: string;
        idealCondition: string;
        unsuitableCondition: string;
        clientType: string;
    };
    creationDrive: {
        source: string;
        motivation: string;
        unsuitableTask: string;
        projectType: string;
    };
    learningApproach: {
        style: string;
        idealStart: string;
        unsuitableStart: string;
        mentorStyle: string;
    };
    executionRhythm: {
        pattern: string;
        idealCycle: string;
        unsuitableCycle: string;
        clientExpectation: string;
    };
    autonomyNeed: {
        level: string;
        idealCollaboration: string;
        unsuitableCollaboration: string;
    };
    riskTolerance: {
        attitude: string;
        idealChallenge: string;
        unsuitableChallenge: string;
    };
    profileText: string;
    coreStrengths: string[];
}
declare class OPCAnalysisService {
    /**
     * 从OPC测试结果生成学生的工作条件画像
     */
    generateWorkConditionProfile(testResult: OPCTestResult): Promise<WorkConditionProfile>;
    /**
     * 分析信息接收方式
     */
    private analyzeInformationReception;
    /**
     * 分析创作驱动来源
     */
    private analyzeCreationDrive;
    /**
     * 分析学习切入方式
     */
    private analyzeLearningApproach;
    /**
     * 分析执行节奏
     */
    private analyzeExecutionRhythm;
    /**
     * 分析自主度需求
     */
    private analyzeAutonomyNeed;
    /**
     * 分析风险承受度
     */
    private analyzeRiskTolerance;
    /**
     * 推导核心优势（最适合的项目类型）
     */
    private deriveCoreStrengths;
    /**
     * 生成综合画像文本（用于向量化匹配）
     */
    private generateProfileText;
    /**
     * 保存工作条件画像到数据库
     */
    saveWorkConditionProfile(profile: WorkConditionProfile): Promise<void>;
}
declare const _default: OPCAnalysisService;
export default _default;
//# sourceMappingURL=opcAnalysisService.d.ts.map