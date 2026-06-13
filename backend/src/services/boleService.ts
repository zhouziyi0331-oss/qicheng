import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface TalentDiscovery {
  discoverer_id: string;
  student_id: string;
  discovery_reason: string;
  recommended_skills?: string[];
  potential_rating?: number;
}

/**
 * E-11: 伯乐标签系统服务
 * 企业发现并推荐优秀学生，获得伯乐标签和奖励
 */
class BoleService {
  /**
   * 创建伯乐推荐
   */
  async createDiscovery(data: TalentDiscovery): Promise<any> {
    const { discoverer_id, student_id, discovery_reason, recommended_skills, potential_rating } =
      data;

    // 检查是否已经推荐过
    const existing = await pool.query(
      `SELECT id FROM talent_discoveries WHERE discoverer_id = $1 AND student_id = $2`,
      [discoverer_id, student_id]
    );

    if (existing.rows.length > 0) {
      throw new Error('已经推荐过该学生');
    }

    // 获取学生当前状态
    const student = await pool.query(
      `SELECT student_level,
              (SELECT COUNT(*) FROM tasks WHERE student_id = $1 AND status = 'completed') as tasks_completed
       FROM users WHERE id = $1`,
      [student_id]
    );

    if (student.rows.length === 0) {
      throw new Error('学生不存在');
    }

    const studentData = student.rows[0];

    // 计算基础奖励
    const rewardConfig = await this.getRewardConfig();
    const basePoints = rewardConfig.discovery_base_points;

    const result = await pool.query(
      `INSERT INTO talent_discoveries
       (id, discoverer_id, student_id, discovery_reason, recommended_skills, potential_rating,
        student_level_at_discovery, tasks_completed_at_discovery, reward_points)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        uuidv4(),
        discoverer_id,
        student_id,
        discovery_reason,
        recommended_skills || [],
        potential_rating || 0.8,
        studentData.student_level,
        studentData.tasks_completed,
        basePoints,
      ]
    );

    return result.rows[0];
  }

  /**
   * 获取企业的推荐列表
   */
  async getCompanyDiscoveries(companyId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT td.*,
              u.username as student_name,
              u.avatar as student_avatar,
              u.student_level as current_level,
              (SELECT COUNT(*) FROM tasks WHERE student_id = td.student_id AND status = 'completed') as current_tasks
       FROM talent_discoveries td
       JOIN users u ON td.student_id = u.id
       WHERE td.discoverer_id = $1
       ORDER BY td.created_at DESC`,
      [companyId]
    );

    return result.rows;
  }

  /**
   * 获取学生被推荐记录
   */
  async getStudentDiscoveries(studentId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT td.*,
              u.company_name as discoverer_name,
              u.avatar as discoverer_avatar
       FROM talent_discoveries td
       JOIN users u ON td.discoverer_id = u.id
       WHERE td.student_id = $1
       ORDER BY td.created_at DESC`,
      [studentId]
    );

    return result.rows;
  }

  /**
   * 获取推荐详情
   */
  async getDiscoveryById(discoveryId: string): Promise<any> {
    const result = await pool.query(
      `SELECT td.*,
              s.username as student_name,
              s.avatar as student_avatar,
              s.student_level as current_level,
              c.company_name as discoverer_name,
              c.avatar as discoverer_avatar
       FROM talent_discoveries td
       JOIN users s ON td.student_id = s.id
       JOIN users c ON td.discoverer_id = c.id
       WHERE td.id = $1`,
      [discoveryId]
    );

    if (result.rows.length === 0) {
      throw new Error('推荐记录不存在');
    }

    return result.rows[0];
  }

  /**
   * 获取伯乐标签
   */
  async getBoleBadges(companyId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM bole_badges
       WHERE company_id = $1 AND is_active = true
       ORDER BY CASE badge_level
         WHEN 'platinum' THEN 4
         WHEN 'gold' THEN 3
         WHEN 'silver' THEN 2
         WHEN 'bronze' THEN 1
       END DESC`,
      [companyId]
    );

    return result.rows;
  }

  /**
   * 检查并授予伯乐标签
   */
  async checkAndAwardBadge(companyId: string): Promise<any | null> {
    // 获取企业推荐统计
    const stats = await pool.query(
      `SELECT
         COUNT(*) as total_discoveries,
         COUNT(*) FILTER (WHERE is_validated = true) as validated_discoveries
       FROM talent_discoveries
       WHERE discoverer_id = $1`,
      [companyId]
    );

    const { total_discoveries, validated_discoveries } = stats.rows[0];

    // 标签等级要求
    const badgeRequirements = [
      { level: 'platinum', name: '白金伯乐', discoveries: 50, validated: 20 },
      { level: 'gold', name: '黄金伯乐', discoveries: 20, validated: 10 },
      { level: 'silver', name: '白银伯乐', discoveries: 10, validated: 5 },
      { level: 'bronze', name: '青铜伯乐', discoveries: 5, validated: 2 },
    ];

    // 查找符合的最高等级
    for (const badge of badgeRequirements) {
      if (
        parseInt(total_discoveries, 10) >= badge.discoveries &&
        parseInt(validated_discoveries, 10) >= badge.validated
      ) {
        // 检查是否已有该标签
        const existingBadge = await pool.query(
          `SELECT id FROM bole_badges WHERE company_id = $1 AND badge_level = $2`,
          [companyId, badge.level]
        );

        if (existingBadge.rows.length === 0) {
          // 授予新标签
          const result = await pool.query(
            `INSERT INTO bole_badges
             (id, company_id, badge_level, badge_name, discoveries_required, validated_discoveries_required, benefits)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
              uuidv4(),
              companyId,
              badge.level,
              badge.name,
              badge.discoveries,
              badge.validated,
              JSON.stringify(this.getBadgeBenefits(badge.level)),
            ]
          );

          // 更新用户表
          await pool.query(
            `UPDATE users SET bole_badge_level = $1 WHERE id = $2`,
            [badge.level, companyId]
          );

          return result.rows[0];
        }

        return null; // 已有该标签
      }
    }

    return null; // 不符合任何标签
  }

  /**
   * 获取标签权益
   */
  private getBadgeBenefits(level: string): any {
    const benefits: Record<string, any> = {
      bronze: {
        priority_matching: false,
        featured_profile: true,
        discount_rate: 0.02,
      },
      silver: {
        priority_matching: true,
        featured_profile: true,
        exclusive_students: 3,
        discount_rate: 0.03,
      },
      gold: {
        priority_matching: true,
        featured_profile: true,
        exclusive_students: 5,
        discount_rate: 0.05,
      },
      platinum: {
        priority_matching: true,
        featured_profile: true,
        exclusive_students: 10,
        discount_rate: 0.08,
        vip_support: true,
      },
    };

    return benefits[level] || {};
  }

  /**
   * 获取伯乐排行榜
   */
  async getLeaderboard(month?: string): Promise<any[]> {
    const targetMonth = month || new Date().toISOString().substring(0, 7);

    const result = await pool.query(
      `SELECT bl.*,
              u.company_name,
              u.avatar,
              u.bole_badge_level
       FROM bole_leaderboard bl
       JOIN users u ON bl.company_id = u.id
       WHERE bl.month = $1
       ORDER BY bl.rank ASC
       LIMIT 50`,
      [targetMonth]
    );

    return result.rows;
  }

  /**
   * 获取企业伯乐统计
   */
  async getCompanyBoleStats(companyId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         u.students_discovered,
         u.validated_discoveries,
         u.bole_points,
         u.bole_badge_level,
         COUNT(td.id) as total_discoveries,
         COUNT(td.id) FILTER (WHERE td.is_validated = true) as validated_count,
         COUNT(td.id) FILTER (WHERE td.reward_status = 'paid') as rewards_paid,
         COALESCE(SUM(td.reward_amount), 0) as total_rewards
       FROM users u
       LEFT JOIN talent_discoveries td ON u.id = td.discoverer_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [companyId]
    );

    if (result.rows.length === 0) {
      throw new Error('企业不存在');
    }

    const stats = result.rows[0];

    // 获取排行榜排名
    const currentMonth = new Date().toISOString().substring(0, 7);
    const rankResult = await pool.query(
      `SELECT rank FROM bole_leaderboard WHERE company_id = $1 AND month = $2`,
      [companyId, currentMonth]
    );

    return {
      ...stats,
      students_discovered: parseInt(stats.students_discovered, 10),
      validated_discoveries: parseInt(stats.validated_discoveries, 10),
      bole_points: parseInt(stats.bole_points, 10),
      total_discoveries: parseInt(stats.total_discoveries, 10),
      validated_count: parseInt(stats.validated_count, 10),
      rewards_paid: parseInt(stats.rewards_paid, 10),
      total_rewards: parseFloat(stats.total_rewards),
      current_month_rank: rankResult.rows[0]?.rank || null,
    };
  }

  /**
   * 获取奖励配置
   */
  async getRewardConfig(): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM bole_reward_config WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      // 返回默认配置
      return {
        discovery_base_points: 10,
        discovery_base_amount: 0,
        validation_points_multiplier: 2.0,
        validation_bonus_amount: 50.0,
        student_level_multiplier: { '1-3': 1.0, '4-6': 1.5, '7-10': 2.0, '11+': 3.0 },
      };
    }

    return result.rows[0];
  }

  /**
   * 手动验证推荐（管理员）
   */
  async validateDiscovery(discoveryId: string, adminId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE talent_discoveries
       SET is_validated = true,
           validated_at = NOW(),
           status = 'validated',
           reward_status = 'approved'
       WHERE id = $1
       RETURNING *`,
      [discoveryId]
    );

    if (result.rows.length === 0) {
      throw new Error('推荐记录不存在');
    }

    // 检查并授予标签
    await this.checkAndAwardBadge(result.rows[0].discoverer_id);

    return result.rows[0];
  }

  /**
   * 创建学生成长快照
   */
  async createGrowthSnapshot(): Promise<void> {
    await pool.query(`SELECT create_student_growth_snapshot()`);
  }

  /**
   * 更新伯乐排行榜
   */
  async updateLeaderboard(): Promise<void> {
    await pool.query(`SELECT update_bole_leaderboard()`);
  }

  /**
   * 获取学生成长轨迹
   */
  async getStudentGrowthTrack(studentId: string, months: number = 12): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM student_growth_tracking
       WHERE student_id = $1
       ORDER BY snapshot_month DESC
       LIMIT $2`,
      [studentId, months]
    );

    return result.rows;
  }

  /**
   * 推荐候选学生（AI推荐）
   */
  async getRecommendedStudents(companyId: string, limit: number = 10): Promise<any[]> {
    // 基于企业历史合作，推荐潜力学生
    const result = await pool.query(
      `SELECT DISTINCT
         u.id,
         u.username,
         u.avatar,
         u.student_level,
         u.bio,
         (SELECT COUNT(*) FROM tasks WHERE student_id = u.id AND status = 'completed') as tasks_completed,
         (SELECT AVG(client_rating) FROM tasks WHERE student_id = u.id AND status = 'completed') as avg_rating,
         (SELECT COUNT(*) FROM talent_discoveries WHERE student_id = u.id) as times_discovered
       FROM users u
       WHERE u.role = 'student'
         AND u.id NOT IN (SELECT student_id FROM talent_discoveries WHERE discoverer_id = $1)
         AND u.student_level BETWEEN 3 AND 7  -- 中等水平，有潜力
         AND EXISTS (
           SELECT 1 FROM tasks
           WHERE student_id = u.id AND company_id = $1 AND status = 'completed' AND client_rating >= 4.0
         )
       ORDER BY avg_rating DESC, tasks_completed DESC
       LIMIT $2`,
      [companyId, limit]
    );

    return result.rows;
  }
}

export default new BoleService();
