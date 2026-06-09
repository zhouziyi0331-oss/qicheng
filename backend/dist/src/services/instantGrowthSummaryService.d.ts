/**
 * 即时成长总结服务
 * 模块一：每次项目完成后的即时成长总结
 *
 * 功能：
 * 1. 订单完成后自动触发
 * 2. 读取学生画像、导师对话、成长观察等数据
 * 3. 调用AI生成300-500字的成长总结
 * 4. 存储到 growth_summary_cache 表
 */
interface InstantSummary {
    headline: string;
    before_after_comparison: string;
    breakthrough_point: string;
    skills_demonstrated: string[];
    stuck_point_resolved: string;
    next_recommendation: string;
}
declare class InstantGrowthSummaryService {
    private anthropic;
    constructor();
    /**
     * 生成即时成长总结（订单完成后触发）
     */
    generateInstantSummary(orderId: string): Promise<InstantSummary>;
    /**
     * 收集生成总结所需的所有数据
     */
    private collectData;
    /**
     * 检查是否已有缓存的总结
     */
    private checkCache;
    /**
     * 调用AI生成总结（严格按照技术规格）
     */
    private callAI;
    /**
     * 构建发送给AI的用户提示词
     */
    private buildUserPrompt;
    /**
     * 保存到缓存表
     */
    private saveToCache;
    /**
     * 更新 mentor_growth_observations 表
     */
    private updateGrowthObservation;
    /**
     * 获取学生的即时成长总结列表
     */
    getStudentSummaries(userId: string, limit?: number): Promise<any[]>;
    /**
     * 标记总结为已查看
     */
    markAsViewed(summaryId: string): Promise<void>;
    /**
     * 提交用户反馈
     */
    submitFeedback(summaryId: string, feedback: 'helpful' | 'not_helpful' | 'neutral'): Promise<void>;
}
declare const _default: InstantGrowthSummaryService;
export default _default;
//# sourceMappingURL=instantGrowthSummaryService.d.ts.map