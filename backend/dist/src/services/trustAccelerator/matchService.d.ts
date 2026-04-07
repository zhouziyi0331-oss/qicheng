/**
 * MatchService - 学生-商家匹配服务
 *
 * 核心功能：
 * 1. 记录学生完成商家任务的次数
 * 2. 检测是否达到解锁资格（完成2次任务）
 * 3. 触发解锁流程
 */
interface MatchRecord {
    id: string;
    student_id: string;
    company_id: string;
    completed_tasks: number;
    total_earnings: number;
    unlock_eligible: boolean;
    unlock_triggered_at: Date | null;
}
export declare class MatchService {
    /**
     * 任务完成后调用：更新匹配记录
     * 如果达到2次，自动设置unlock_eligible=true
     */
    static recordTaskCompletion(studentId: string, companyId: string, earnings: number): Promise<{
        unlockEligible: boolean;
        matchId: string;
    }>;
    /**
     * 获取学生的所有解锁资格
     */
    static getEligibleMatches(studentId: string): Promise<MatchRecord[]>;
    /**
     * 检查学生与商家的合作次数
     */
    static getMatchStatus(studentId: string, companyId: string): Promise<MatchRecord | null>;
    /**
     * 计算匹配分数（基于历史合作数据）
     */
    static calculateMatchScore(studentId: string, companyId: string): Promise<number>;
    /**
     * 生成匹配原因说明
     */
    static generateMatchReason(studentId: string, companyId: string): Promise<string>;
}
export {};
//# sourceMappingURL=matchService.d.ts.map