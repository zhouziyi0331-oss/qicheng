"use strict";
/**
 * 活跃度检测服务
 * 负责追踪学生登录活跃度，7天未登录暂停邀请资格
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityService = exports.ActivityService = void 0;
const db_1 = require("../../utils/db");
class ActivityService {
    /**
     * 记录学生登录
     */
    async recordLogin(studentId) {
        const queryText = `
      INSERT INTO student_activity_logs (
        student_id,
        last_login_at,
        last_active_at,
        is_active,
        invitation_eligible,
        login_count,
        weekly_logins,
        monthly_logins
      )
      VALUES ($1, NOW(), NOW(), true, true, 1, 1, 1)
      ON CONFLICT (student_id)
      DO UPDATE SET
        last_login_at = NOW(),
        last_active_at = NOW(),
        is_active = true,
        inactive_since = NULL,
        invitation_eligible = CASE
          WHEN (SELECT current_level FROM users WHERE id = $1) >= 10
          THEN true
          ELSE false
        END,
        login_count = student_activity_logs.login_count + 1,
        weekly_logins = student_activity_logs.weekly_logins + 1,
        monthly_logins = student_activity_logs.monthly_logins + 1,
        updated_at = NOW()
    `;
        await (0, db_1.query)(queryText, [studentId]);
    }
    /**
     * 记录学生活跃（任何操作）
     */
    async recordActivity(studentId) {
        const queryText = `
      UPDATE student_activity_logs
      SET
        last_active_at = NOW(),
        is_active = true,
        inactive_since = NULL,
        updated_at = NOW()
      WHERE student_id = $1
    `;
        await (0, db_1.query)(queryText, [studentId]);
    }
    /**
     * 检查学生是否有邀请资格
     */
    async checkInvitationEligibility(studentId) {
        const queryText = `
      SELECT
        sal.invitation_eligible,
        sal.is_active,
        u.current_level
      FROM student_activity_logs sal
      JOIN users u ON sal.student_id = u.id
      WHERE sal.student_id = $1
    `;
        const result = await (0, db_1.query)(queryText, [studentId]);
        if (result.length === 0) {
            return false;
        }
        const { invitation_eligible, is_active, level_a } = result[0];
        // 必须满足：满级 + 活跃 + 有邀请资格
        return level_a >= 10 && is_active && invitation_eligible;
    }
    /**
     * 获取学生活跃度信息
     */
    async getActivityLog(studentId) {
        const queryText = `
      SELECT * FROM student_activity_logs
      WHERE student_id = $1
    `;
        const result = await (0, db_1.query)(queryText, [studentId]);
        return result.length > 0 ? result[0] : null;
    }
    /**
     * 批量检测不活跃学生（定时任务调用）
     * 7天未登录 → 标记为不活跃，暂停邀请资格
     */
    async detectInactiveStudents() {
        const queryText = `
      UPDATE student_activity_logs
      SET
        is_active = false,
        inactive_since = CASE
          WHEN inactive_since IS NULL THEN NOW()
          ELSE inactive_since
        END,
        invitation_eligible = false,
        updated_at = NOW()
      WHERE
        is_active = true
        AND last_login_at < NOW() - INTERVAL '7 days'
      RETURNING student_id
    `;
        const result = await (0, db_1.query)(queryText);
        return result.length;
    }
    /**
     * 重新激活学生（登录后自动调用）
     */
    async reactivateStudent(studentId) {
        const queryText = `
      UPDATE student_activity_logs
      SET
        is_active = true,
        inactive_since = NULL,
        invitation_eligible = CASE
          WHEN (SELECT current_level FROM users WHERE id = $1) >= 10
          THEN true
          ELSE false
        END,
        updated_at = NOW()
      WHERE student_id = $1
    `;
        await (0, db_1.query)(queryText, [studentId]);
    }
    /**
     * 获取所有有邀请资格的学生列表
     */
    async getEligibleStudents(filters) {
        let queryText = `
      SELECT
        sal.student_id,
        u.current_level,
        sp.d1, sp.d2, sp.d3, sp.d4, sp.d5, sp.d6,
        sp.tags,
        sal.last_login_at
      FROM student_activity_logs sal
      JOIN users u ON sal.student_id = u.id
      WHERE
        sal.invitation_eligible = true
        AND sal.is_active = true
    `;
        const params = [];
        let paramIndex = 1;
        if (filters?.minLevel) {
            queryText += ` AND u.current_level >= $${paramIndex}`;
            params.push(filters.minLevel);
            paramIndex++;
        }
        if (filters?.abilities) {
            for (const [dimension, minScore] of Object.entries(filters.abilities)) {
                queryText += ` AND sp.${dimension} >= $${paramIndex}`;
                params.push(minScore);
                paramIndex++;
            }
        }
        if (filters?.tags && filters.tags.length > 0) {
            queryText += ` AND sp.tags && $${paramIndex}::text[]`;
            params.push(filters.tags);
            paramIndex++;
        }
        queryText += ` ORDER BY u.current_level DESC, sal.last_login_at DESC`;
        const result = await (0, db_1.query)(queryText, params);
        return result.map(row => ({
            student_id: row.student_id,
            level_a: row.current_level,
            abilities: {
                d1: row.d1,
                d2: row.d2,
                d3: row.d3,
                d4: row.d4,
                d5: row.d5,
                d6: row.d6,
            },
            tags: row.tags || [],
            last_login_at: row.last_login_at,
        }));
    }
    /**
     * 重置周统计（每周一执行）
     */
    async resetWeeklyStats() {
        const queryText = `
      UPDATE student_activity_logs
      SET weekly_logins = 0, updated_at = NOW()
    `;
        await (0, db_1.query)(queryText);
    }
    /**
     * 重置月统计（每月1号执行）
     */
    async resetMonthlyStats() {
        const queryText = `
      UPDATE student_activity_logs
      SET monthly_logins = 0, updated_at = NOW()
    `;
        await (0, db_1.query)(queryText);
    }
}
exports.ActivityService = ActivityService;
exports.activityService = new ActivityService();
//# sourceMappingURL=activityService.js.map