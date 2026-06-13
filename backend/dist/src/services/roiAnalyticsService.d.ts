interface FinancialStats {
    company_id: string;
    year: number;
    month: number;
    total_spent: number;
    platform_fees: number;
    task_payments: number;
    tasks_published: number;
    tasks_completed: number;
    avg_task_cost: number;
    estimated_market_cost: number;
    cost_savings: number;
    roi_percentage: number;
    total_task_hours: number;
}
interface ROIDashboard {
    current_period: FinancialStats;
    historical_data: FinancialStats[];
    cost_comparison: any;
    efficiency_metrics: any;
    recommendations: string[];
}
/**
 * E-17: ROI投入产出看板服务
 * 提供企业投入产出分析和成本对比
 */
declare class ROIAnalyticsService {
    /**
     * 获取企业ROI看板数据
     */
    getROIDashboard(companyId: string, period?: 'monthly' | 'quarterly' | 'yearly'): Promise<ROIDashboard>;
    /**
     * 获取月度财务统计
     */
    getFinancialStats(companyId: string, year: number, month: number): Promise<FinancialStats>;
    /**
     * 获取历史统计数据
     */
    getHistoricalStats(companyId: string, months: number): Promise<FinancialStats[]>;
    /**
     * 生成成本对比分析
     */
    generateCostComparison(companyId: string, currentStats: FinancialStats): Promise<any>;
    /**
     * 估算全职雇佣成本
     */
    private estimateFulltimeCost;
    /**
     * 计算效率指标
     */
    calculateEfficiencyMetrics(companyId: string): Promise<any>;
    /**
     * 生成建议
     */
    private generateRecommendations;
    /**
     * 创建成本对比分析报告
     */
    createCostComparisonAnalysis(companyId: string, period: 'monthly' | 'quarterly' | 'yearly', startDate: Date, endDate: Date): Promise<any>;
    /**
     * 获取市场价格基准
     */
    getMarketBenchmarks(): Promise<any[]>;
    /**
     * 更新财务统计（手动刷新）
     */
    refreshFinancialStats(companyId: string, year: number, month: number): Promise<void>;
}
declare const _default: ROIAnalyticsService;
export default _default;
//# sourceMappingURL=roiAnalyticsService.d.ts.map