/**
 * AI智能定价服务
 *
 * 基于任务特征、市场数据和AI分析提供智能定价建议
 */
export interface PricingSuggestion {
    suggested_min: number;
    suggested_max: number;
    reasoning: string;
    confidence_score: number;
    market_comparison: string;
    complexity_score: number;
    factors: PricingFactor[];
    warnings?: string[];
    recommendations?: string[];
}
export interface PricingFactor {
    name: string;
    value: number;
    weight: number;
    impact: number;
    description: string;
}
export interface MarketBenchmark {
    avg_price: number;
    median_price: number;
    min_price: number;
    max_price: number;
    sample_count: number;
}
export interface TaskPricingInput {
    title: string;
    description: string;
    requirements?: string;
    deliverables?: string;
    category?: string;
    difficulty_level?: string;
    estimated_hours?: number;
    required_abilities?: any[];
    deadline?: Date;
    company_id: string;
}
declare class AIPricingService {
    /**
     * 获取智能定价建议
     */
    getPricingSuggestion(input: TaskPricingInput): Promise<PricingSuggestion>;
    /**
     * 计算任务复杂度
     */
    private calculateComplexity;
    /**
     * 获取市场基准价格
     */
    private getMarketBenchmark;
    /**
     * 计算各个定价因子
     */
    private calculatePricingFactors;
    /**
     * 获取技能等级分数
     */
    private getSkillLevelScore;
    /**
     * 获取紧急程度分数
     */
    private getUrgencyScore;
    /**
     * 获取市场需求分数
     */
    private getMarketDemandScore;
    /**
     * 获取企业信誉分数
     */
    private getCompanyReputationScore;
    /**
     * 使用AI进行综合分析
     */
    private getAIAnalysis;
    /**
     * 计算最终建议价格
     */
    private calculateFinalPrice;
    /**
     * 保存定价历史
     */
    savePricingHistory(taskId: string, companyId: string, suggestion: PricingSuggestion, actualMin: number, actualMax: number): Promise<string>;
    /**
     * 记录定价调整
     */
    recordPricingAdjustment(taskId: string, companyId: string, originalMin: number, originalMax: number, adjustedMin: number, adjustedMax: number, reason: string, note?: string): Promise<void>;
    /**
     * 更新市场基准价格（定期任务）
     */
    updateMarketBenchmarks(): Promise<void>;
    /**
     * 获取定价准确度分析
     */
    getPricingAccuracy(category?: string, difficulty?: string): Promise<any[]>;
}
export declare const aiPricingService: AIPricingService;
export {};
//# sourceMappingURL=aiPricingService.d.ts.map