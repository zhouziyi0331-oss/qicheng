interface RiskDimension {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    issues: string[];
}
interface IdentifiedRisk {
    risk_id: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    probability: number;
    impact: string;
    mitigation: string;
}
interface RiskAssessment {
    id: string;
    task_id: string;
    overall_risk_level: string;
    overall_risk_score: number;
    risk_dimensions: Record<string, RiskDimension>;
    identified_risks: IdentifiedRisk[];
    mitigation_suggestions: string[];
    publish_recommendation: string;
    ai_analysis: string;
    confidence_level: number;
}
/**
 * E-03: 风险预检服务
 * 任务发布前AI自动识别潜在风险
 */
declare class RiskDetectionService {
    /**
     * 评估任务风险
     */
    assessTaskRisk(data: {
        taskId?: string;
        title: string;
        description: string;
        budget?: number;
        deadline?: Date;
        requiredSkills?: string[];
        deliverableRequirements?: string;
    }): Promise<RiskAssessment>;
    /**
     * 获取任务的风险评估历史
     */
    getTaskRiskHistory(taskId: string): Promise<RiskAssessment[]>;
    /**
     * 企业确认风险评估
     */
    acknowledgeRisk(assessmentId: string, companyId: string, decision: 'proceed_anyway' | 'revise_task' | 'cancel', notes?: string): Promise<void>;
    /**
     * 获取企业的风险统计
     */
    getCompanyRiskStats(companyId: string): Promise<any>;
    /**
     * 获取常见风险类型
     */
    getCommonRiskTypes(): Promise<any[]>;
    /**
     * 解析AI响应
     */
    private parseAIResponse;
    /**
     * 计算总体风险分数
     */
    private calculateOverallRiskScore;
    /**
     * 分数转风险等级
     */
    private scoreToRiskLevel;
    /**
     * 降级方案：基于规则的风险评估
     */
    private generateFallbackAssessment;
    /**
     * 更新企业风险统计
     */
    private updateRiskStats;
}
declare const _default: RiskDetectionService;
export default _default;
//# sourceMappingURL=riskDetectionService.d.ts.map