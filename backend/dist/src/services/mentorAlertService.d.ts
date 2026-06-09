/**
 * AI导师主动预警服务
 * 场景：T-06 主动风险预警
 *
 * 功能：
 * 1. 定时扫描风险条件（接高难度项目、连续同类打回、截止时间紧迫、方向偏差）
 * 2. 触发预警消息
 * 3. 调用AI-06生成个性化预警内容
 */
declare class MentorAlertService {
    /**
     * 扫描所有进行中的订单，检测风险条件并触发预警
     */
    scanAndTriggerAlerts(): Promise<void>;
    /**
     * 获取所有激活的预警规则
     */
    private getActiveRules;
    /**
     * 获取所有进行中的订单
     */
    private getActiveOrders;
    /**
     * 检查等级跨度预警
     * 条件：接了比当前等级高2级及以上的项目，且接单后30分钟内
     */
    private checkLevelGapAlerts;
    /**
     * 检查连续同类问题打回预警
     * 条件：连续2次提交被同一类问题打回，且在72小时内
     */
    private checkRepeatedRejectionAlerts;
    /**
     * 检查截止时间紧迫预警
     * 条件：剩余时间不足总时间的30%，且尚未提交
     */
    private checkDeadlinePressureAlerts;
    /**
     * 检查方向偏差预警
     * 条件：AI-03审核检测到交付物和需求有结构性偏差
     */
    private checkDirectionMismatchAlerts;
    /**
     * 触发预警：创建预警记录并调用AI-06生成个性化消息
     */
    private triggerAlert;
    /**
     * 生成个性化预警消息
     * 使用规则模板 + AI-06个性化处理
     */
    private generateAlertMessage;
    /**
     * 检查是否在指定小时内已发送过同类预警
     */
    private hasRecentAlert;
    /**
     * 找出连续出现的问题类型
     */
    private findRepeatedIssue;
    /**
     * 获取学生的未读预警列表
     */
    getUnreadAlerts(studentId: string): Promise<any[]>;
    /**
     * 标记预警为已读
     */
    markAlertAsViewed(alertId: string, studentId: string): Promise<void>;
    /**
     * 标记预警为已响应
     */
    markAlertAsResponded(alertId: string, studentId: string): Promise<void>;
    /**
     * 获取预警统计数据（用于监控和分析）
     */
    getAlertStats(days?: number): Promise<any>;
}
declare const _default: MentorAlertService;
export default _default;
//# sourceMappingURL=mentorAlertService.d.ts.map