"use strict";
/**
 * MatchService - 学生-商家匹配服务
 *
 * 核心功能：
 * 1. 记录学生完成商家任务的次数
 * 2. 检测是否达到解锁资格（完成2次任务）
 * 3. 触发解锁流程
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const db_1 = require("../../utils/db");
const logger_1 = __importDefault(require("../../utils/logger"));
class MatchService {
    /**
     * 任务完成后调用：更新匹配记录
     * 如果达到2次，自动设置unlock_eligible=true
     */
    static async recordTaskCompletion(studentId, companyId, earnings) {
        return (0, db_1.withTransaction)(async (client) => {
            // 查询或创建匹配记录
            const existingMatch = await client.query(`SELECT * FROM student_company_matches
         WHERE student_id = $1 AND company_id = $2 AND deleted_at IS NULL`, [studentId, companyId]);
            let matchId;
            let completedTasks;
            if (existingMatch.rows.length === 0) {
                // 首次合作，创建记录
                const result = await client.query(`INSERT INTO student_company_matches
           (student_id, company_id, completed_tasks, total_earnings, unlock_eligible)
           VALUES ($1, $2, 1, $3, false)
           RETURNING id, completed_tasks`, [studentId, companyId, earnings]);
                matchId = result.rows[0].id;
                completedTasks = 1;
            }
            else {
                // 更新记录
                const result = await client.query(`UPDATE student_company_matches
           SET completed_tasks = completed_tasks + 1,
               total_earnings = total_earnings + $3,
               unlock_eligible = CASE WHEN completed_tasks + 1 >= 2 THEN true ELSE false END,
               unlock_triggered_at = CASE WHEN completed_tasks + 1 = 2 THEN NOW() ELSE unlock_triggered_at END,
               updated_at = NOW()
           WHERE id = $1
           RETURNING id, completed_tasks, unlock_eligible`, [existingMatch.rows[0].id, studentId, earnings]);
                matchId = result.rows[0].id;
                completedTasks = result.rows[0].completed_tasks;
            }
            const unlockEligible = completedTasks >= 2;
            logger_1.default.info(`[MatchService] 学生 ${studentId} 完成商家 ${companyId} 第 ${completedTasks} 个任务，解锁资格: ${unlockEligible}`);
            return { unlockEligible, matchId };
        });
    }
    /**
     * 获取学生的所有解锁资格
     */
    static async getEligibleMatches(studentId) {
        const result = await (0, db_1.query)(`SELECT m.*,
              u.nickname as company_name,
              cp.company_name as company_full_name
       FROM student_company_matches m
       JOIN users u ON m.company_id = u.id
       LEFT JOIN company_profiles cp ON m.company_id = cp.user_id
       WHERE m.student_id = $1
         AND m.unlock_eligible = true
         AND m.status = 'pending'
         AND m.deleted_at IS NULL
       ORDER BY m.unlock_triggered_at DESC`, [studentId]);
        return result;
    }
    /**
     * 检查学生与商家的合作次数
     */
    static async getMatchStatus(studentId, companyId) {
        const result = await (0, db_1.query)(`SELECT * FROM student_company_matches
       WHERE student_id = $1 AND company_id = $2 AND deleted_at IS NULL`, [studentId, companyId]);
        return result[0] || null;
    }
    /**
     * 计算匹配分数（基于历史合作数据）
     */
    static async calculateMatchScore(studentId, companyId) {
        const result = await (0, db_1.query)(`SELECT
         COUNT(*) as total_tasks,
         AVG(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) as approval_rate,
         AVG(EXTRACT(EPOCH FROM (s.submitted_at - ta.accepted_at)) / 3600) as avg_hours
       FROM task_assignments ta
       JOIN task_submissions s ON ta.id = s.assignment_id
       WHERE ta.student_id = $1
         AND ta.task_id IN (SELECT id FROM tasks WHERE company_id = $2)
         AND ta.deleted_at IS NULL`, [studentId, companyId]);
        const { total_tasks, approval_rate, avg_hours } = result[0];
        if (total_tasks === 0)
            return 0;
        // 匹配分数 = 通过率 * 0.6 + 速度分 * 0.4
        const speedScore = Math.max(0, 1 - (avg_hours / 48)); // 48小时内完成得满分
        const match_score = (approval_rate || 0) * 0.6 + speedScore * 0.4;
        return Math.min(1, Math.max(0, match_score));
    }
    /**
     * 生成匹配原因说明
     */
    static async generateMatchReason(studentId, companyId) {
        const match = await this.getMatchStatus(studentId, companyId);
        if (!match) {
            return '首次合作机会';
        }
        const score = await this.calculateMatchScore(studentId, companyId);
        const completedTasks = match.completed_tasks;
        if (completedTasks === 1) {
            return '你已完成该商家1个任务，表现优秀！再完成1次即可解锁深度合作机会';
        }
        else if (completedTasks >= 2) {
            if (score >= 0.8) {
                return `你已完成该商家${completedTasks}个任务，合作默契度${Math.round(score * 100)}%，强烈推荐深度合作`;
            }
            else if (score >= 0.6) {
                return `你已完成该商家${completedTasks}个任务，合作默契度${Math.round(score * 100)}%，可以尝试深度合作`;
            }
            else {
                return `你已完成该商家${completedTasks}个任务，建议先提升合作质量`;
            }
        }
        return '匹配成功';
    }
}
exports.MatchService = MatchService;
//# sourceMappingURL=matchService.js.map