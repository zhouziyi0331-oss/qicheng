import { pool, QueryResult } from '../utils/db';

/**
 * 跳级挑战服务
 */
export class ChallengeService {
  /**
   * 获取可用的挑战任务
   */
  static async getAvailableChallenges(studentId: string) {
    // 获取学生当前等级
    const studentResult = await pool.query(
      `SELECT current_level, track FROM student_abilities WHERE student_id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      throw new Error('学生能力数据不存在');
    }

    const { current_level, track } = studentResult.rows[0];

    // 获取可挑战的任务（当前等级+1）
    const challengesResult = await pool.query(
      `SELECT * FROM level_challenge_tasks
       WHERE level = $1 AND track = $2`,
      [current_level + 1, track]
    );

    return challengesResult.rows;
  }

  /**
   * 开始挑战
   */
  static async startChallenge(studentId: string, challengeTaskId: number) {
    // 检查是否在冷却期
    const cooldownCheck = await pool.query(
      `SELECT * FROM student_challenges
       WHERE student_id = $1
       AND challenge_task_id = $2
       AND status = 'failed'
       AND cooldown_until > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId, challengeTaskId]
    );

    if (cooldownCheck.rows.length > 0) {
      const cooldownUntil = new Date(cooldownCheck.rows[0].cooldown_until);
      throw new Error(`挑战失败后需要冷却，请在 ${cooldownUntil.toLocaleString()} 后重试`);
    }

    // 获取挑战任务信息
    const taskResult = await pool.query(
      `SELECT * FROM level_challenge_tasks WHERE id = $1`,
      [challengeTaskId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error('挑战任务不存在');
    }

    const task = taskResult.rows[0];

    // 获取学生当前等级
    const studentResult = await pool.query(
      `SELECT current_level FROM student_abilities WHERE student_id = $1`,
      [studentId]
    );

    const currentLevel = studentResult.rows[0]?.current_level || 0;

    // 创建挑战记录
    const result = await pool.query(
      `INSERT INTO student_challenges
       (student_id, challenge_task_id, current_level, target_level, status)
       VALUES ($1, $2, $3, $4, 'in_progress')
       RETURNING *`,
      [studentId, challengeTaskId, currentLevel, task.level]
    );

    return result.rows[0];
  }

  /**
   * 提交挑战作品
   */
  static async submitChallenge(
    challengeId: number,
    studentId: string,
    submissionUrl: string,
    submissionContent: string
  ) {
    const result = await pool.query(
      `UPDATE student_challenges
       SET status = 'submitted',
           submission_url = $1,
           submission_content = $2,
           submitted_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND student_id = $4 AND status = 'in_progress'
       RETURNING *`,
      [submissionUrl, submissionContent, challengeId, studentId]
    );

    if (result.rows.length === 0) {
      throw new Error('挑战不存在或已提交');
    }

    return result.rows[0];
  }

  /**
   * 评审挑战（管理员）
   */
  static async reviewChallenge(
    challengeId: number,
    reviewerId: string,
    score: number,
    feedback: string
  ) {
    const challengeResult = await pool.query(
      `SELECT * FROM student_challenges WHERE id = $1`,
      [challengeId]
    );

    if (challengeResult.rows.length === 0) {
      throw new Error('挑战不存在');
    }

    const challenge = challengeResult.rows[0];

    // 获取通过分数
    const taskResult = await pool.query(
      `SELECT pass_score FROM level_challenge_tasks WHERE id = $1`,
      [challenge.challenge_task_id]
    );

    const passScore = taskResult.rows[0].pass_score;
    const passed = score >= passScore;

    // 更新挑战状态
    await pool.query(
      `UPDATE student_challenges
       SET status = $1,
           score = $2,
           feedback = $3,
           reviewer_id = $4,
           reviewed_at = CURRENT_TIMESTAMP,
           cooldown_until = CASE WHEN $1 = 'failed' THEN CURRENT_TIMESTAMP + INTERVAL '7 days' ELSE NULL END
       WHERE id = $5`,
      [passed ? 'passed' : 'failed', score, feedback, reviewerId, challengeId]
    );

    // 如果通过，升级学生等级
    if (passed) {
      await pool.query(
        `UPDATE student_abilities
         SET current_level = $1
         WHERE student_id = $2`,
        [challenge.target_level, challenge.student_id]
      );

      // 记录成长历史
      await pool.query(
        `INSERT INTO growth_history (student_id, event_type, description, level_change)
         VALUES ($1, 'level_up', $2, $3)`,
        [
          challenge.student_id,
          `通过Lv.${challenge.target_level}挑战，成功跳级`,
          challenge.target_level - challenge.current_level
        ]
      );
    }

    return { passed, score, feedback };
  }

  /**
   * 获取学生的挑战历史
   */
  static async getChallengeHistory(studentId: string) {
    const result = await pool.query(
      `SELECT sc.*, lct.title, lct.level, lct.track
       FROM student_challenges sc
       JOIN level_challenge_tasks lct ON sc.challenge_task_id = lct.id
       WHERE sc.student_id = $1
       ORDER BY sc.created_at DESC`,
      [studentId]
    );

    return result.rows;
  }
}

/**
 * 毕业系统服务
 */
export class GraduationService {
  /**
   * 检查毕业资格
   */
  static async checkEligibility(studentId: string) {
    // 检查是否达到Lv.4
    const levelResult = await pool.query(
      `SELECT current_level, track FROM student_abilities WHERE student_id = $1`,
      [studentId]
    );

    if (levelResult.rows.length === 0 || levelResult.rows[0].current_level < 4) {
      return {
        eligible: false,
        reason: '需要达到Lv.4才能申请毕业'
      };
    }

    // 检查完成任务数
    const tasksResult = await pool.query(
      `SELECT COUNT(*) as count FROM task_applications
       WHERE student_id = $1 AND status = 'completed'`,
      [studentId]
    );

    const tasksCompleted = parseInt(tasksResult.rows[0].count);
    if (tasksCompleted < 10) {
      return {
        eligible: false,
        reason: `需要完成至少10个任务，当前完成${tasksCompleted}个`
      };
    }

    // 检查总收入
    const earningsResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM escrow_transactions
       WHERE user_id = $1 AND transaction_type = 'release' AND status = 'completed'`,
      [studentId]
    );

    const totalEarnings = parseFloat(earningsResult.rows[0].total);
    if (totalEarnings < 5000) {
      return {
        eligible: false,
        reason: `需要累计收入至少5000元，当前收入${totalEarnings.toFixed(2)}元`
      };
    }

    return {
      eligible: true,
      track: levelResult.rows[0].track,
      tasksCompleted,
      totalEarnings
    };
  }

  /**
   * 提交毕业申请
   */
  static async applyForGraduation(
    studentId: string,
    portfolioUrl: string,
    selfIntroduction: string,
    careerGoals: string
  ) {
    // 检查资格
    const eligibility = await this.checkEligibility(studentId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    // 检查是否已有待审核的申请
    const existingResult = await pool.query(
      `SELECT * FROM graduation_applications
       WHERE student_id = $1 AND status = 'pending'`,
      [studentId]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('已有待审核的毕业申请');
    }

    // 创建申请
    const result = await pool.query(
      `INSERT INTO graduation_applications
       (student_id, track, total_tasks_completed, total_earnings, portfolio_url, self_introduction, career_goals)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        studentId,
        eligibility.track,
        eligibility.tasksCompleted,
        eligibility.totalEarnings,
        portfolioUrl,
        selfIntroduction,
        careerGoals
      ]
    );

    return result.rows[0];
  }

  /**
   * 审核毕业申请（管理员）
   */
  static async reviewGraduation(
    applicationId: number,
    reviewerId: string,
    approved: boolean,
    feedback: string
  ) {
    const appResult = await pool.query(
      `SELECT * FROM graduation_applications WHERE id = $1`,
      [applicationId]
    );

    if (appResult.rows.length === 0) {
      throw new Error('申请不存在');
    }

    const application = appResult.rows[0];

    // 更新申请状态
    await pool.query(
      `UPDATE graduation_applications
       SET status = $1,
           reviewer_id = $2,
           review_feedback = $3,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [approved ? 'approved' : 'rejected', reviewerId, feedback, applicationId]
    );

    // 如果通过，创建毕业生权益和认证
    if (approved) {
      // 创建权益记录
      await pool.query(
        `INSERT INTO graduate_benefits
         (student_id, graduation_id, opc_report_unlocked, company_contact_unlocked,
          certification_issued, investment_resources_unlocked, mentor_network_unlocked, priority_tasks_unlocked)
         VALUES ($1, $2, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)`,
        [application.student_id, applicationId]
      );

      // 生成认证编号
      const certNumber = `QC-${application.track.toUpperCase()}-${Date.now()}-${application.student_id}`;

      // 创建认证
      await pool.query(
        `INSERT INTO graduate_certifications
         (student_id, certification_number, track, level)
         VALUES ($1, $2, $3, 4)`,
        [application.student_id, certNumber, application.track]
      );
    }

    return { approved, feedback };
  }

  /**
   * 获取毕业生权益
   */
  static async getGraduateBenefits(studentId: string) {
    const result = await pool.query(
      `SELECT gb.*, gc.certification_number, gc.issued_at
       FROM graduate_benefits gb
       LEFT JOIN graduate_certifications gc ON gb.student_id = gc.student_id
       WHERE gb.student_id = $1`,
      [studentId]
    );

    return result.rows[0] || null;
  }

  /**
   * 获取毕业申请列表（管理员）
   */
  static async getApplications(status?: string) {
    let query = `
      SELECT ga.*, u.username, u.email
      FROM graduation_applications ga
      JOIN users u ON ga.student_id = u.id
    `;

    const params: any[] = [];
    if (status) {
      query += ' WHERE ga.status = $1';
      params.push(status);
    }

    query += ' ORDER BY ga.applied_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }
}
