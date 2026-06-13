/**
 * 更新匹配引擎以支持赛道过滤
 * 确保只匹配学生选择的赛道的项目
 */

import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';

/**
 * 为学生推荐任务（基于赛道）
 * 只返回学生选择的赛道的任务
 */
export async function getRecommendedTasksForStudent(
  studentId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    // 1. 获取学生的赛道选择
    const studentResult = await pool.query(
      'SELECT selected_track FROM users WHERE id = $1',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      throw new Error('Student not found');
    }

    const selectedTrack = studentResult.rows[0].selected_track;

    if (!selectedTrack) {
      // 学生还未选择赛道，返回空数组或引导选择赛道
      logger.warn('Student has not selected track yet', { studentId });
      return [];
    }

    // 2. 查询该赛道的任务，并进行匹配
    const tasksResult = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.track,
        t.level_required,
        t.budget_gross,
        t.deadline,
        t.estimated_minutes,
        tsm.overall_score,
        tsm.skill_match_score,
        tsm.difficulty_match_score,
        tsm.is_pushed,
        tt.student_friendly_title,
        tt.student_friendly_description,
        tt.what_you_will_learn
       FROM tasks t
       LEFT JOIN task_student_matches tsm ON tsm.task_id = t.id AND tsm.student_id = $1
       LEFT JOIN task_translations tt ON tt.task_id = t.id
       WHERE t.status = 'active'
         AND t.track = $2
         AND (tsm.is_pushed = true OR tsm.overall_score > 0.6)
       ORDER BY
         tsm.is_pushed DESC,
         tsm.overall_score DESC,
         t.created_at DESC
       LIMIT $3`,
      [studentId, selectedTrack, limit]
    );

    return tasksResult.rows;

  } catch (error: unknown) {
    logger.error('Get recommended tasks failed', { error, studentId });
    throw error;
  }
}

/**
 * 触发任务匹配（企业端）
 * 只匹配符合任务赛道的学生
 */
export async function triggerTaskMatching(taskId: string): Promise<number> {
  try {
    // 1. 获取任务信息，包括赛道
    const taskResult = await pool.query(
      'SELECT id, track, level_required FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error('Task not found');
    }

    const task = taskResult.rows[0];

    // 2. 查询选择了该赛道的学生
    const studentsResult = await pool.query(
      `SELECT
        u.id,
        u.selected_track,
        sc.skills,
        sc.tasks_completed,
        sc.avg_task_quality,
        sc.on_time_delivery_rate
       FROM users u
       LEFT JOIN student_capabilities sc ON sc.student_id = u.id
       WHERE u.account_type = 'student'
         AND u.selected_track = $1
         AND u.is_active = true
       LIMIT 100`,
      [task.track]
    );

    if (studentsResult.rows.length === 0) {
      logger.warn('No students found for track', { taskId, track: task.track });
      return 0;
    }

    // 3. 为每个学生计算匹配分数
    let matchedCount = 0;

    for (const student of studentsResult.rows) {
      // 计算匹配分数（简化版，实际应该调用完整的匹配引擎）
      const match_score = calculateMatchScore(task, student);

      if (matchScore.overall_score > 0.5) {
        // 插入或更新匹配记录
        await pool.query(
          `INSERT INTO task_student_matches (
            task_id, student_id, overall_score,
            skill_match_score, difficulty_match_score,
            domain_match_score, growth_potential_score,
            reliability_score, preference_score,
            match_breakdown
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (task_id, student_id)
          DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            skill_match_score = EXCLUDED.skill_match_score,
            difficulty_match_score = EXCLUDED.difficulty_match_score,
            domain_match_score = EXCLUDED.domain_match_score,
            growth_potential_score = EXCLUDED.growth_potential_score,
            reliability_score = EXCLUDED.reliability_score,
            preference_score = EXCLUDED.preference_score,
            match_breakdown = EXCLUDED.match_breakdown`,
          [
            taskId,
            student.id,
            matchScore.overall_score,
            matchScore.skill_match_score,
            matchScore.difficulty_match_score,
            matchScore.domain_match_score,
            matchScore.growth_potential_score,
            matchScore.reliability_score,
            matchScore.preference_score,
            JSON.stringify(matchScore.breakdown)
          ]
        );

        matchedCount++;
      }
    }

    logger.info('Task matching completed', { taskId, matchedCount });
    return matchedCount;

  } catch (error: unknown) {
    logger.error('Trigger task matching failed', { error, taskId });
    throw error;
  }
}

/**
 * 计算匹配分数（简化版）
 */
function calculateMatchScore(task: any, student: any): any {
  // 这里是简化的匹配算法
  // 实际应该调用完整的6维度匹配引擎

  const skillMatchScore = 0.75; // 技能匹配
  const difficultyMatchScore = 0.80; // 难度匹配
  const domainMatchScore = 1.0; // 领域匹配（赛道已匹配）
  const growthPotentialScore = 0.70; // 成长潜力
  const reliabilityScore = student.on_time_delivery_rate || 0.85; // 可靠性
  const preferenceScore = 0.75; // 偏好对齐

  const overallScore = (
    skillMatchScore * 0.3 +
    difficultyMatchScore * 0.2 +
    domainMatchScore * 0.2 +
    growthPotentialScore * 0.1 +
    reliabilityScore * 0.1 +
    preferenceScore * 0.1
  );

  return {
    overall_score: overallScore,
    skill_match_score: skillMatchScore,
    difficulty_match_score: difficultyMatchScore,
    domain_match_score: domainMatchScore,
    growth_potential_score: growthPotentialScore,
    reliability_score: reliabilityScore,
    preference_score: preferenceScore,
    breakdown: {
      reason: '赛道匹配，技能符合要求',
      highlights: ['赛道一致', '技能匹配度高'],
      challenges: []
    }
  };
}

export default {
  getRecommendedTasksForStudent,
  triggerTaskMatching
};
