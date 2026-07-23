export declare class AIDecompositionService {
    /**
     * 生成AI实践拆解报告的主函数
     */
    generateDecompositionReport(projectId: string, userId: string): Promise<any>;
    /**
     * 模块1: 能力拆解
     */
    private generateAbilityBreakdown;
    /**
     * 模块2: 问题价值分析
     */
    private generateProblemValue;
    /**
     * 模块3: 目标客户分析
     */
    private generateTargetCustomers;
    /**
     * 模块4: 获客渠道推荐
     */
    private generateAcquisitionChannels;
    /**
     * 模块5: 成长路径规划
     */
    private generateGrowthPath;
    /**
     * 生成免费预览数据
     */
    private generatePreview;
    /**
     * 解锁报告（付费后）
     */
    unlockReport(reportId: string, userId: string, paymentAmount: number): Promise<any>;
    /**
     * 获取完整报告（需要已解锁）
     */
    getFullReport(reportId: string, userId: string): Promise<any>;
}
export declare const aiDecompositionService: AIDecompositionService;
//# sourceMappingURL=aiDecomposition.service.d.ts.map