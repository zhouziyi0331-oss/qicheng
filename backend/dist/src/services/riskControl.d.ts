/**
 * P2安全功能：防刷单风控系统
 *
 * 功能：
 * 1. 检测异常交易模式
 * 2. 限制交易频率
 * 3. 风险评分
 * 4. 自动/人工审核
 */
export interface RiskCheckResult {
    allowed: boolean;
    riskScore: number;
    reasons: string[];
    action: 'allow' | 'review' | 'block';
}
/**
 * 检查交易风险
 */
export declare function checkTransactionRisk(studentId: string, enterpriseId: string, taskId: string): Promise<RiskCheckResult>;
/**
 * 记录风险事件
 */
export declare function recordRiskEvent(studentId: string, enterpriseId: string, taskId: string, riskCheck: RiskCheckResult): Promise<void>;
/**
 * 添加到黑名单
 */
export declare function addToBlacklist(userId: string, reason: string, durationDays?: number): Promise<void>;
//# sourceMappingURL=riskControl.d.ts.map