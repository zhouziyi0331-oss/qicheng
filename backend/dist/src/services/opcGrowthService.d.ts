/**
 * OPC测评服务
 */
export declare class OPCAssessmentService {
    /**
     * 开始测评
     */
    static startAssessment(studentId: string, assessmentType?: string): Promise<{
        assessment: any;
        questions: any[];
    }>;
    /**
     * 提交答案
     */
    static submitAnswer(assessmentId: number, questionId: number, answer: any): Promise<void>;
    /**
     * 完成测评并生成结果
     */
    static completeAssessment(assessmentId: number): Promise<any>;
    /**
     * 获取测评结果
     */
    static getAssessmentResult(assessmentId: number): Promise<any>;
}
/**
 * 成长报告服务
 */
export declare class GrowthReportService {
    /**
     * 生成成长报告
     */
    static generateReport(studentId: string, reportPeriod: string, periodStart: Date, periodEnd: Date): Promise<any>;
    /**
     * 获取能力变化
     */
    private static getAbilityChanges;
    /**
     * 获取等级变化
     */
    private static getLevelChanges;
    /**
     * 获取成长亮点
     */
    private static getHighlights;
    /**
     * 获取里程碑
     */
    private static getMilestones;
    /**
     * 获取雷达图数据
     */
    private static getRadarChartData;
    /**
     * 获取趋势数据
     */
    private static getTrendData;
    /**
     * 生成AI洞察
     */
    private static generateAIInsights;
    /**
     * 生成AI建议
     */
    private static generateAISuggestions;
    /**
     * 创建能力快照
     */
    static createAbilitySnapshot(studentId: string): Promise<void>;
}
//# sourceMappingURL=opcGrowthService.d.ts.map