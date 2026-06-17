/**
 * P2安全功能：防刷单风控系统
 * 真实实现 - 所有数据真实保存到数据库和Redis
 */
export interface RiskCheckResult {
    allowed: boolean;
    riskScore: number;
    reasons: string[];
    action: 'allow' | 'review' | 'block';
}
/**
 * 检查交易风险 - 真实查询数据库
 */
export declare function checkTransactionRisk(studentId: string, enterpriseId: string, taskId: string): Promise<RiskCheckResult>;
/**
 * 记录风险事件到数据库 - 真实保存
 */
export declare function recordRiskEvent(studentId: string, enterpriseId: string, taskId: string, riskCheck: RiskCheckResult): Promise<void>;
/**
 * 添加到黑名单 - 真实保存到Redis
 */
export declare function addToBlacklist(userId: string, reason: string, durationDays?: number): Promise<void>;
/**
 * 从黑名单移除 - 真实删除
 */
export declare function removeFromBlacklist(userId: string): Promise<void>;
//# sourceMappingURL=riskControl.d.ts.map