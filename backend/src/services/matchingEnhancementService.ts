import { pool } from '../config/database';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';

const anthropic = new Anthropic({
  apiKey: config.ai.anthropicApiKey,
});

/**
 * E-05a, E-05b, E-05c, E-05d: 匹配增强服务
 */
class MatchingEnhancementService {
  /**
   * E-05a: 创建试稿邀请
   */
  async createTrialInvitation(data: {
    task_id: string;
    student_id: string;
    company_id: string;
    trial_requirement: string;
    trial_deadline: Date;
    trial_budget?: number;
  }): Promise<any> {
    const result = await pool.query(
      `INSERT INTO trial_invitations
       (id, task_id, student_id, company_id, trial_requirement, trial_deadline, trial_budget)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        uuidv4(),
        data.task_id,
        data.student_id,
        data.company_id,
        data.trial_requirement,
        data.trial_deadline,
        data.trial_budget,
      ]
    );

    return result.rows[0];
  }

  /**
   * 学生响应试稿邀请
   */
  async respondToTrialInvitation(
    invitationId: string,
    studentId: string,
    accepted: boolean,
    response?: string
  ): Promise<any> {
    const status = accepted ? 'accepted' : 'rejected';
    const timestampField = accepted ? 'accepted_at' : 'rejected_at';

    const result = await pool.query(
      `UPDATE trial_invitations
       SET student_status = $1, student_response = $2, ${timestampField} = NOW(), updated_at = NOW()
       WHERE id = $3 AND student_id = $4
       RETURNING *`,
      [status, response, invitationId, studentId]
    );

    if (result.rows.length === 0) {
      throw new Error('试稿邀请不存在');
    }

    return result.rows[0];
  }

  /**
   * 学生提交试稿
   */
  async submitTrial(
    invitationId: string,
    studentId: string,
    submission: string,
    files?: any[]
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE trial_invitations
       SET student_status = 'submitted',
           trial_submission = $1,
           trial_files = $2,
           submitted_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND student_id = $4 AND student_status = 'accepted'
       RETURNING *`,
      [submission, JSON.stringify(files || []), invitationId, studentId]
    );

    if (result.rows.length === 0) {
      throw new Error('试稿邀请不存在或状态不正确');
    }

    return result.rows[0];
  }

  /**
   * 企业评估试稿
   */
  async evaluateTrial(
    invitationId: string,
    companyId: string,
    evaluation: string,
    score: number,
    approved: boolean
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE trial_invitations
       SET company_evaluation = $1,
           evaluation_score = $2,
           is_approved = $3,
           evaluated_at = NOW(),
           updated_at = NOW()
       WHERE id = $4 AND company_id = $5
       RETURNING *`,
      [evaluation, score, approved, invitationId, companyId]
    );

    if (result.rows.length === 0) {
      throw new Error('试稿邀请不存在');
    }

    return result.rows[0];
  }

  /**
   * 获取试稿邀请列表
   */
  async getTrialInvitations(userId: string, role: string, status?: string): Promise<any[]> {
    let query = `
      SELECT ti.*,
             t.title as task_title,
             t.category as task_category,
             s.username as student_name,
             s.avatar as student_avatar,
             s.student_level,
             c.company_name
      FROM trial_invitations ti
      JOIN tasks t ON ti.task_id = t.id
      JOIN users s ON ti.student_id = s.id
      JOIN users c ON ti.company_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (role === 'company') {
      query += ` AND ti.company_id = $${paramIndex++}`;
      params.push(userId);
    } else {
      query += ` AND ti.student_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (status) {
      query += ` AND ti.student_status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY ti.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * E-05b: 对比多个学生
   */
  async compareStudents(
    companyId: string,
    studentIds: string[],
    taskId?: string,
    dimensions?: any
  ): Promise<any> {
    // 获取学生详细信息
    const studentsResult = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.avatar,
         u.student_level,
         u.total_tasks_completed,
         u.avg_task_rating,
         u.on_time_delivery_rate,
         u.avg_response_time_hours,
         u.skills,
         u.hourly_rate,
         sc.skills as capability_skills,
         sc.avg_task_quality,
         sc.growth_rate,
         sc.preferred_task_types
       FROM users u
       LEFT JOIN student_capabilities sc ON u.id = sc.student_id
       WHERE u.id = ANY($1)`,
      [studentIds]
    );

    const students = studentsResult.rows;

    // 如果有任务ID，获取匹配分数
    if (taskId) {
      const matchesResult = await pool.query(
        `SELECT student_id, overall_score, skill_match_score, reliability_score
         FROM task_student_matches
         WHERE task_id = $1 AND student_id = ANY($2)`,
        [taskId, studentIds]
      );

      const matchScores = matchesResult.rows.reduce((acc: any, row: any) => {
        acc[row.student_id] = {
          overall: row.overall_score,
          skill: row.skill_match_score,
          reliability: row.reliability_score,
        };
        return acc;
      }, {});

      students.forEach((student: any) => {
        student.match_scores = matchScores[student.id] || null;
      });
    }

    // 保存对比记录
    const comparisonId = uuidv4();
    await pool.query(
      `INSERT INTO student_comparisons
       (id, company_id, task_id, student_ids, comparison_dimensions, comparison_result)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        comparisonId,
        companyId,
        taskId,
        studentIds,
        JSON.stringify(dimensions || {}),
        JSON.stringify(students),
      ]
    );

    return {
      comparison_id: comparisonId,
      students,
    };
  }

  /**
   * E-05c: 手动搜索和筛选学生
   */
  async searchStudents(companyId: string, filters: any, taskId?: string): Promise<any> {
    let query = `
      SELECT
        u.id,
        u.username,
        u.avatar,
        u.student_level,
        u.total_tasks_completed,
        u.avg_task_rating,
        u.on_time_delivery_rate,
        u.avg_response_time_hours,
        u.skills,
        u.hourly_rate,
        u.bio,
        u.location,
        sc.avg_task_quality,
        sc.growth_rate,
        sc.preferred_task_types
      FROM users u
      LEFT JOIN student_capabilities sc ON u.id = sc.student_id
      LEFT JOIN student_visibility_settings svs ON u.id = svs.student_id
      WHERE u.role = 'student'
        AND u.is_active = true
        AND (svs.allow_manual_search IS NULL OR svs.allow_manual_search = true)
        AND (svs.blocked_companies IS NULL OR NOT ($1 = ANY(svs.blocked_companies)))
    `;

    const params: any[] = [companyId];
    let paramIndex = 2;

    // 应用筛选条件
    if (filters.student_level_min) {
      query += ` AND u.student_level >= $${paramIndex++}`;
      params.push(filters.student_level_min);
    }

    if (filters.student_level_max) {
      query += ` AND u.student_level <= $${paramIndex++}`;
      params.push(filters.student_level_max);
    }

    if (filters.required_skills && filters.required_skills.length > 0) {
      query += ` AND u.skills @> $${paramIndex++}::jsonb`;
      params.push(JSON.stringify(filters.required_skills));
    }

    if (filters.min_rating) {
      query += ` AND u.avg_task_rating >= $${paramIndex++}`;
      params.push(filters.min_rating);
    }

    if (filters.min_completed_tasks) {
      query += ` AND u.total_tasks_completed >= $${paramIndex++}`;
      params.push(filters.min_completed_tasks);
    }

    if (filters.max_response_hours) {
      query += ` AND u.avg_response_time_hours <= $${paramIndex++}`;
      params.push(filters.max_response_hours);
    }

    if (filters.location) {
      query += ` AND u.location ILIKE $${paramIndex++}`;
      params.push(`%${filters.location}%`);
    }

    if (filters.max_hourly_rate) {
      query += ` AND u.hourly_rate <= $${paramIndex++}`;
      params.push(filters.max_hourly_rate);
    }

    query += ` ORDER BY u.student_level DESC, u.avg_task_rating DESC LIMIT 50`;

    const result = await pool.query(query, params);

    // 保存搜索记录
    await pool.query(
      `INSERT INTO manual_search_filters
       (id, company_id, task_id, filter_conditions, matched_students_count, search_results)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        companyId,
        taskId,
        JSON.stringify(filters),
        result.rows.length,
        JSON.stringify(result.rows),
      ]
    );

    return result.rows;
  }

  /**
   * E-05d: 记录匹配拒绝反馈
   */
  async recordRejectionFeedback(
    taskId: string,
    studentId: string,
    companyId: string,
    reason: string,
    detail?: string
  ): Promise<any> {
    // 使用AI分析拒绝原因
    const aiAnalysis = await this.analyzeRejectionReason(reason, detail);

    const result = await pool.query(
      `INSERT INTO match_rejection_feedback
       (id, task_id, student_id, company_id, rejection_reason, rejection_detail, ai_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (task_id, student_id)
       DO UPDATE SET
         rejection_reason = EXCLUDED.rejection_reason,
         rejection_detail = EXCLUDED.rejection_detail,
         ai_analysis = EXCLUDED.ai_analysis
       RETURNING *`,
      [uuidv4(), taskId, studentId, companyId, reason, detail, JSON.stringify(aiAnalysis)]
    );

    return result.rows[0];
  }

  /**
   * 使用AI分析拒绝原因
   */
  private async analyzeRejectionReason(reason: string, detail?: string): Promise<any> {
    const prompt = `分析企业拒绝学生的原因，提供改进建议。

拒绝原因类型：${reason}
详细说明：${detail || '无'}

请分析：
1. 拒绝的根本原因类别（技能差距/经验不足/价格问题/其他）
2. 学生缺少的具体技能或能力
3. 给学生的改进建议（1-2句话，具体可执行）

以JSON格式回复：
{
  "reason_category": "skill_gap" | "experience_lack" | "price_issue" | "other",
  "missing_skills": ["skill1", "skill2"],
  "improvement_suggestion": "建议..."
}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      logger.error('AI分析拒绝原因失败:', error);
    }

    // 降级方案
    return {
      reason_category: reason.includes('skill') ? 'skill_gap' : 'other',
      missing_skills: [],
      improvement_suggestion: '继续提升技能和积累经验',
    };
  }

  /**
   * 获取学生收到的拒绝反馈
   */
  async getStudentRejectionFeedback(studentId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT mrf.*,
              t.title as task_title,
              t.category as task_category,
              c.company_name
       FROM match_rejection_feedback mrf
       JOIN tasks t ON mrf.task_id = t.id
       JOIN users c ON mrf.company_id = c.id
       WHERE mrf.student_id = $1
       ORDER BY mrf.created_at DESC
       LIMIT 20`,
      [studentId]
    );

    return result.rows;
  }

  /**
   * 分析拒绝原因统计（用于优化匹配算法）
   */
  async analyzeRejectionPatterns(taskId?: string): Promise<any> {
    let query = `
      SELECT
        rejection_reason,
        COUNT(*) as count,
        jsonb_agg(ai_analysis) as analyses
      FROM match_rejection_feedback
    `;

    const params: any[] = [];

    if (taskId) {
      query += ` WHERE task_id = $1`;
      params.push(taskId);
    }

    query += ` GROUP BY rejection_reason ORDER BY count DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 更新学生可见度设置
   */
  async updateVisibilitySettings(studentId: string, settings: any): Promise<any> {
    const result = await pool.query(
      `INSERT INTO student_visibility_settings
       (id, student_id, is_discoverable, allow_manual_search, allow_trial_invitations, blocked_companies)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id)
       DO UPDATE SET
         is_discoverable = EXCLUDED.is_discoverable,
         allow_manual_search = EXCLUDED.allow_manual_search,
         allow_trial_invitations = EXCLUDED.allow_trial_invitations,
         blocked_companies = EXCLUDED.blocked_companies,
         updated_at = NOW()
       RETURNING *`,
      [
        uuidv4(),
        studentId,
        settings.is_discoverable !== undefined ? settings.is_discoverable : true,
        settings.allow_manual_search !== undefined ? settings.allow_manual_search : true,
        settings.allow_trial_invitations !== undefined ? settings.allow_trial_invitations : true,
        settings.blocked_companies || [],
      ]
    );

    return result.rows[0];
  }

  /**
   * 获取试稿统计
   */
  async getTrialStats(userId: string, role: string): Promise<any> {
    if (role === 'company') {
      const result = await pool.query(
        `SELECT
           COUNT(*) as total_sent,
           COUNT(*) FILTER (WHERE student_status = 'accepted') as accepted_count,
           COUNT(*) FILTER (WHERE student_status = 'submitted') as submitted_count,
           COUNT(*) FILTER (WHERE is_approved = true) as approved_count,
           AVG(evaluation_score) FILTER (WHERE evaluation_score IS NOT NULL) as avg_score
         FROM trial_invitations
         WHERE company_id = $1`,
        [userId]
      );

      return result.rows[0];
    } else {
      const result = await pool.query(
        `SELECT
           COUNT(*) as total_received,
           COUNT(*) FILTER (WHERE student_status = 'accepted') as accepted_count,
           COUNT(*) FILTER (WHERE student_status = 'submitted') as submitted_count,
           COUNT(*) FILTER (WHERE is_approved = true) as approved_count,
           AVG(evaluation_score) FILTER (WHERE evaluation_score IS NOT NULL) as avg_score
         FROM trial_invitations
         WHERE student_id = $1`,
        [userId]
      );

      return result.rows[0];
    }
  }
}

export default new MatchingEnhancementService();
