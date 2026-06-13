interface DiscountTier {
    id: string;
    tier_level: number;
    tasks_threshold: number;
    discount_rate: number;
    service_fee_rate: number;
    tier_name: string;
    tier_description: string;
    tier_color: string;
    tier_icon: string;
    benefits: any[];
}
interface CompanyTierInfo {
    tier_level: number;
    tier_name: string;
    discount_rate: number;
    tasks_count: number;
    next_tier_threshold: number | null;
    tasks_to_next: number | null;
    current_tier: DiscountTier | null;
    next_tier: DiscountTier | null;
}
interface MonthlyStats {
    company_id: string;
    year: number;
    month: number;
    tasks_published: number;
    tasks_completed: number;
    total_spent: number;
    total_saved: number;
    current_tier_level: number;
    current_discount_rate: number;
}
/**
 * E-13: 阶梯优惠服务
 * 根据月度任务数自动享受折扣
 */
declare class TieredDiscountService {
    /**
     * 获取所有折扣阶梯
     */
    getAllTiers(): Promise<DiscountTier[]>;
    /**
     * 获取企业当前阶梯信息
     */
    getCompanyTierInfo(companyId: string): Promise<CompanyTierInfo>;
    /**
     * 获取企业月度统计
     */
    getMonthlyStats(companyId: string, year?: number, month?: number): Promise<MonthlyStats | null>;
    /**
     * 计算折扣金额
     */
    calculateDiscount(companyId: string, originalAmount: number): Promise<{
        tier_level: number;
        discount_rate: number;
        original_amount: number;
        discount_amount: number;
        final_amount: number;
        service_fee_rate: number;
    }>;
    /**
     * 应用折扣到任务
     */
    applyDiscountToTask(taskId: string, companyId: string, originalAmount: number): Promise<any>;
    /**
     * 获取企业折扣历史
     */
    getDiscountHistory(companyId: string, limit?: number, offset?: number): Promise<{
        applications: any[];
        total: number;
    }>;
    /**
     * 获取企业历史月度统计
     */
    getHistoricalStats(companyId: string, months?: number): Promise<MonthlyStats[]>;
    /**
     * 获取企业折扣进度（用于UI展示）
     */
    getDiscountProgress(companyId: string): Promise<any>;
    /**
     * 手动更新月度统计（用于修正数据）
     */
    refreshMonthlyStats(companyId: string, year: number, month: number): Promise<void>;
}
declare const _default: TieredDiscountService;
export default _default;
//# sourceMappingURL=tieredDiscountService.d.ts.map