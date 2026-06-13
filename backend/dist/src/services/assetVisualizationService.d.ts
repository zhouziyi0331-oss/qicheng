/**
 * 资产可视化服务
 * 实现个人资产仪表盘、成长对比卡片、升级通关仪式
 */
declare class AssetVisualizationService {
    /**
     * 获取个人资产仪表盘数据
     */
    getDashboard(studentId: string): Promise<any>;
    /**
     * 生成成长对比卡片
     */
    generateGrowthComparisonCard(studentId: string, triggerType: string, currentTaskId?: string): Promise<any>;
    /**
     * 生成升级仪式数据
     */
    generateLevelUpCeremony(studentId: string, fromLevel: number, toLevel: number): Promise<any>;
    /**
     * AI生成成长对比文案
     */
    private generateComparisonMessage;
    /**
     * AI生成导师升级留言
     */
    private generateMentorLevelUpMessage;
    /**
     * 获取等级标签
     */
    private getLevelLabel;
    /**
     * 获取熟练度标签
     */
    private getMasteryLabel;
    /**
     * 获取等级解锁能力
     */
    private getUnlockedAbilities;
    /**
     * 获取下一级要求
     */
    private getNextLevelRequirements;
}
declare const _default: AssetVisualizationService;
export default _default;
//# sourceMappingURL=assetVisualizationService.d.ts.map