/**
 * 活跃度检测服务
 * 负责追踪学生登录活跃度，7天未登录暂停邀请资格
 */

import { query as poolQuery } from '../../utils/db';

interface ActivityLog {
  id: string;
  student_id: string;
  last_login_at: Date;
  last_active_at: Date;
  is_active: boolean;
  inactive_since: Date | null;
  invitation_eligible: boolean;
  weekly_logins: number;
  monthly_logins: number;
}

export class ActivityService {
  /**
   * 记录学生登录
   */
  async recordLogin(studentId: string): Promise<void> {
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
          WHEN (SELECT level_a FROM student_profiles WHERE user_id = $1) >= 10
          THEN true
          ELSE false
        END,
        login_count = student_activity_logs.login_count + 1,
        weekly_logins = student_activity_logs.weekly_logins + 1,
        monthly_logins = student_activity_logs.monthly_logins + 1,
        updated_at = NOW()
    `;

    await poolQuery(queryText, [studentId]);
  }

  /**
   * 记录学生活跃（任何操作）
   */
  async recordActivity(studentId: string): Promise<void> {
    const queryText = `
      UPDATE student_activity_logs
      SET
        last_active_at = NOW(),
        is_active = true,
        inactive_since = NULL,
        updated_at = NOW()
      WHERE student_id = $1
    `;

    await poolQuery(queryText, [studentId]);
  }

  /**
   * 检查学生是否有邀请资格
   */
  async checkInvitationEligibility(studentId: string): Promise<boolean> {
    const queryText = `
      SELECT
        sal.invitation_eligible,
        sal.is_active,
        sp.level_a
      FROM student_activity_logs sal
      JOIN student_profiles sp ON sal.student_id = sp.user_id
      WHERE sal.student_id = $1
    `;

    const result = await poolQuery<{
      invitation_eligible: boolean;
      is_active: boolean;
      level_a: number;
    }>(queryText, [studentId]);

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
  async getActivityLog(studentId: string): Promise<ActivityLog | null> {
    const queryText = `
      SELECT * FROM student_activity_logs
      WHERE student_id = $1
    `;

    const result = await poolQuery<ActivityLog>(queryText, [studentId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 批量检测不活跃学生（定时任务调用）
   * 7天未登录 → 标记为不活跃，暂停邀请资格
   */
  async detectInactiveStudents(): Promise<number> {
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

    const result = await poolQuery<{ student_id: string }>(queryText);
    return result.length;
  }

  /**
   * 重新激活学生（登录后自动调用）
   */
  async reactivateStudent(studentId: string): Promise<void> {
    const queryText = `
      UPDATE student_activity_logs
      SET
        is_active = true,
        inactive_since = NULL,
        invitation_eligible = CASE
          WHEN (SELECT level_a FROM student_profiles WHERE user_id = $1) >= 10
          THEN true
          ELSE false
        END,
        updated_at = NOW()
      WHERE student_id = $1
    `;

    await poolQuery(queryText, [studentId]);
  }

  /**
   * 获取所有有邀请资格的学生列表
   */
  async getEligibleStudents(filters?: {
    minLevel?: number;
    abilities?: Record<string, number>;
    tags?: string[];
  }): Promise<Array<{
    student_id: string;
    level_a: number;
    abilities: Record<string, number>;
    tags: string[];
    last_login_at: Date;
  }>> {
    let queryText = `
      SELECT
        sal.student_id,
        sp.level_a,
        sp.d1, sp.d2, sp.d3, sp.d4, sp.d5, sp.d6,
        sp.tags,
        sal.last_login_at
      FROM student_activity_logs sal
      JOIN student_profiles sp ON sal.student_id = sp.user_id
      WHERE
        sal.invitation_eligible = true
        AND sal.is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.minLevel) {
      queryText += ` AND sp.level_a >= $${paramIndex}`;
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

    queryText += ` ORDER BY sp.level_a DESC, sal.last_login_at DESC`;

    const result = await poolQuery<{
      student_id: string;
      level_a: number;
      d1: number;
      d2: number;
      d3: number;
      d4: number;
      d5: number;
      d6: number;
      tags: string[];
      last_login_at: Date;
    }>(queryText, params);

    return result.map(row => ({
      student_id: row.student_id,
      level_a: row.level_a,
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
  async resetWeeklyStats(): Promise<void> {
    const queryText = `
      UPDATE student_activity_logs
      SET weekly_logins = 0, updated_at = NOW()
    `;

    await poolQuery(queryText);
  }

  /**
   * 重置月统计（每月1号执行）
   */
  async resetMonthlyStats(): Promise<void> {
    const queryText = `
      UPDATE student_activity_logs
      SET monthly_logins = 0, updated_at = NOW()
    `;

    await poolQuery(queryText);
  }
}

export const activityService = new ActivityService();
