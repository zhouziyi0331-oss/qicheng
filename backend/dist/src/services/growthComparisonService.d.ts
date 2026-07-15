/**
 * Phase 2.3: 成长对比服务
 *
 * 功能：
 * 1. 对比学生入驻时和当前的能力数据
 * 2. 生成成长对比卡片数据
 * 3. 提炼成长亮点
 */
interface AbilityComparison {
    dimension: string;
    initialScore: number;
    currentScore: number;
    growth: number;
    growthPercentage: number;
}
interface MetricComparison {
    metric: string;
    label: string;
    initialValue: number;
    currentValue: number;
    growth: number;
    unit: string;
}
interface GrowthHighlight {
    type: 'ability' | 'achievement' | 'milestone';
    title: string;
    description: string;
    icon: string;
}
interface GrowthComparisonData {
    studentId: string;
    joinDate: string;
    daysOnPlatform: number;
    abilityComparison: AbilityComparison[];
    metrics: MetricComparison[];
    highlights: GrowthHighlight[];
    summary: {
        totalGrowthScore: number;
        fastestGrowingAbility: string;
        keyAchievement: string;
    };
}
declare class GrowthComparisonService {
    /**
     * 生成成长对比数据
     */
    generateComparison(studentId: string): Promise<GrowthComparisonData>;
    /**
     * 获取能力对比数据（六维雷达图）
     */
    private getAbilityComparison;
    /**
     * 获取关键指标对比
     */
    private getMetricsComparison;
    /**
     * 生成成长亮点
     */
    private generateHighlights;
    /**
     * 生成成长总结
     */
    private generateSummary;
    /**
     * 获取等级名称
     */
    private getLevelName;
    /**
     * 默认能力对比数据
     */
    private getDefaultAbilityComparison;
}
declare const _default: GrowthComparisonService;
export default _default;
//# sourceMappingURL=growthComparisonService.d.ts.map