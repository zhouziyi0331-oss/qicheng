/**
 * AI定价服务 - E-04功能
 * 基于任务特征、市场数据、历史价格提供智能定价建议
 * 增强E-01的定价能力
 */
interface TaskFeatures {
    title: string;
    description: string;
    required_skills?: string[];
    difficulty?: number;
    estimated_hours?: number;
    task_type?: string;
    urgency?: 'normal' | 'urgent' | 'very_urgent';
}
interface PricingResult {
    suggested_price: number;
    min_price: number;
    max_price: number;
    confidence_level: number;
    pricing_breakdown: {
        base_price: number;
        skill_premium: number;
        difficulty_premium: number;
        urgency_premium: number;
        market_adjustment: number;
    };
    market_comparison: {
        platform_average: number;
        similar_tasks_avg: number;
        percentile_rank: number;
    };
    reasoning: string;
    recommendations: string[];
}
declare class AIPricingService {
    private anthropic;
    private readonly BASE_RATES;
    private readonly SKILL_PREMIUMS;
    constructor();
    /**
     * 计算智能定价
     */
    calculatePrice(taskFeatures: TaskFeatures): Promise<PricingResult>;
    /**
     * 计算基础价格
     */
    private calculateBasePrice;
    /**
     * 获取市场数据
     */
    private getMarketData;
    /**
     * 使用AI进行定价分析
     */
    private getAIPricingAnalysis;
    /**
     * 计算最终定价
     */
    private calculateFinalPricing;
    /**
     * 降级定价（AI失败时）
     */
    private getFallbackPricing;
    /**
     * 保存定价记录
     */
    savePricingRecord(taskId: string, taskFeatures: TaskFeatures, result: PricingResult): Promise<void>;
}
declare const _default: AIPricingService;
export default _default;
//# sourceMappingURL=aiPricingService.d.ts.map