/**
 * 企业端价格推荐服务
 *
 * 功能：
 * 1. 根据项目参数计算推荐价格区间（常规派单）
 * 2. 计算指定大师模式的兜底价
 * 3. 基于历史数据优化推荐算法
 */
interface PriceRecommendationInput {
    track: 'A' | 'B' | 'AB';
    difficulty: number;
    estimatedHours: number;
    deliverableType?: string;
}
interface PriceRecommendation {
    basePrice: number;
    priceMin: number;
    priceMax: number;
    floorPrice: number;
    historicalAvgPrice?: number;
    similarTasksCount?: number;
}
declare class PriceRecommendationService {
    /**
     * 赛道基础价（元/小时）
     */
    private readonly TRACK_BASE_RATES;
    /**
     * 难度系数
     */
    private readonly DIFFICULTY_MULTIPLIERS;
    /**
     * 交付物复杂度系数
     */
    private readonly DELIVERABLE_MULTIPLIERS;
    /**
     * 计算价格推荐
     */
    calculatePriceRecommendation(input: PriceRecommendationInput): Promise<PriceRecommendation>;
    /**
     * 计算基准价格
     */
    private calculateBasePrice;
    /**
     * 获取历史数据参考
     */
    private getHistoricalData;
    /**
     * 保存价格计算历史（用于后续优化算法）
     */
    savePriceCalculationHistory(taskId: string, input: PriceRecommendationInput, recommendation: PriceRecommendation): Promise<void>;
    /**
     * 验证企业出价是否合理
     */
    validateEnterprisePrice(enterprisePrice: number, recommendation: PriceRecommendation): {
        valid: boolean;
        warning?: string;
        level: 'ok' | 'low' | 'high';
    };
}
declare const _default: PriceRecommendationService;
export default _default;
//# sourceMappingURL=priceRecommendationService.d.ts.map