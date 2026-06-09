/**
 * 工作条件匹配引擎
 * 不匹配"描述"，而是匹配"模式" - 判断学生的工作条件和项目的需求条件是否适配
 */
interface MatchAnalysis {
    taskId: string;
    studentId: string;
    overallFit: 'high' | 'medium' | 'low';
    fitScore: number;
    dimensionMatches: {
        informationReception: DimensionMatch;
        creationDrive: DimensionMatch;
        learningApproach: DimensionMatch;
        executionRhythm: DimensionMatch;
        autonomy: DimensionMatch;
        riskTolerance: DimensionMatch;
    };
    matchPoints: string[];
    frictionPoints: string[];
    adjustmentSuggestions: string[];
    recommendationForStudent: string;
    recommendationForCompany: string;
    vectorSimilarity?: number;
}
interface DimensionMatch {
    match: boolean;
    score: number;
    reason: string;
}
declare class WorkConditionMatchingEngine {
    /**
     * 为任务找到最匹配的学生（使用向量检索 + 规则匹配）
     */
    findBestStudentsForTask(taskId: string, limit?: number): Promise<MatchAnalysis[]>;
    /**
     * 使用向量相似度检索学生
     */
    private getStudentsByVectorSimilarity;
    /**
     * 核心方法：分析学生和项目的适配度
     * 结合规则匹配和向量相似度
     */
    private analyzeMatch;
    /**
     * 匹配维度1：信息接收方式
     */
    private matchInformationReception;
    /**
     * 匹配维度2：创作驱动
     */
    private matchCreationDrive;
    /**
     * 匹配维度3：学习切入方式
     */
    private matchLearningApproach;
    /**
     * 匹配维度4：执行节奏
     */
    private matchExecutionRhythm;
    /**
     * 匹配维度5：自主度
     */
    private matchAutonomy;
    /**
     * 匹配维度6：风险承受度
     */
    private matchRiskTolerance;
    /**
     * 计算整体适配度
     */
    private calculateOverallFit;
    /**
     * 生成调整建议
     */
    private generateAdjustmentSuggestions;
    /**
     * 生成面向学生的推荐理由
     */
    private generateStudentRecommendation;
    /**
     * 生成面向企业的推荐理由
     */
    private generateCompanyRecommendation;
    /**
     * 获取项目画像
     */
    private getProjectProfile;
    /**
     * 获取所有学生画像
     */
    private getAllStudentProfiles;
    /**
     * 保存匹配记录
     */
    private saveMatchRecord;
}
declare const _default: WorkConditionMatchingEngine;
export default _default;
//# sourceMappingURL=workConditionMatchingEngine.d.ts.map