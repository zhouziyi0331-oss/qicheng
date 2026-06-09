/**
 * 订单完成后的成长数据更新触发器
 * 当订单状态变为 completed 时，自动触发：
 * 1. 生成即时成长总结
 * 2. 更新六维能力数据
 */
declare class GrowthDataTrigger {
    /**
     * 订单完成后触发成长数据更新
     */
    onOrderCompleted(orderId: string): Promise<void>;
    /**
     * 获取订单信息
     */
    private getOrderInfo;
    /**
     * 异步生成即时成长总结
     */
    private generateSummaryAsync;
    /**
     * 异步更新六维能力
     */
    private updateAbilityAsync;
    /**
     * 检查并生成毕业报告
     */
    private checkAndGenerateGraduationReport;
    /**
     * 通知学生毕业报告已生成
     */
    private notifyStudentAboutGraduationReport;
    /**
     * 批量处理历史订单（用于初始化或补充数据）
     */
    processHistoricalOrders(studentId?: string): Promise<void>;
    /**
     * 延迟函数
     */
    private sleep;
}
declare const _default: GrowthDataTrigger;
export default _default;
//# sourceMappingURL=growthDataTrigger.d.ts.map