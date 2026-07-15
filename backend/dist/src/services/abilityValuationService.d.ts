/**
 * Phase 2.2: 能力估值服务
 *
 * 功能：
 * 1. 计算学生能力的市场价值
 * 2. 生成资产仪表盘数据
 * 3. 追踪能力价值变化趋势
 */
interface AbilityAsset {
    abilityName: string;
    currentLevel: number;
    experiencePoints: number;
    marketValue: number;
    monthlyGrowth: number;
    potentialValue: number;
}
interface AssetDashboard {
    totalValue: number;
    monthlyIncome: number;
    growthRate: number;
    assets: AbilityAsset[];
    trends: {
        date: string;
        value: number;
    }[];
    marketComparison: {
        percentile: number;
        averageValue: number;
        topPerformerValue: number;
    };
    nextMilestone: {
        targetValue: number;
        estimatedDays: number;
        requiredActions: string[];
    };
}
declare class AbilityValuationService {
    /**
     * 生成学生的资产仪表盘
     */
    generateDashboard(studentId: string): Promise<AssetDashboard>;
    /**
     * 计算单项能力的市场价值
     */
    private calculateAbilityValue;
    /**
     * 计算月均收入
     */
    private calculateMonthlyIncome;
    /**
     * 计算能力月度成长值
     */
    private calculateMonthlyGrowth;
    /**
     * 获取价值变化趋势（最近7天）
     */
    private getValueTrends;
    /**
     * 获取市场对比数据
     */
    private getMarketComparison;
    /**
     * 计算下一个里程碑
     */
    private calculateNextMilestone;
}
declare const _default: AbilityValuationService;
export default _default;
//# sourceMappingURL=abilityValuationService.d.ts.map