import { Request, Response } from 'express';
import { query, queryOne } from '../../utils/db';
import logger from '../../utils/logger';
import semanticMatchingEngine from '../../services/semanticMatchingEngine';
import qichengTeacherService from '../../services/qichengTeacherService';
import vectorGenerationService from '../../services/vectorGenerationService';

/**
 * 匹配控制器
 * 处理任务-学生匹配相关的API请求
 */

/**
 * 企业发布任务后，触发AI匹配
 * POST /api/v1/tasks/:taskId/trigger-matching
 */
export async function triggerMatching(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user?.id;

    // 验证任务存在且属于当前企业
    const task = await queryOne<{ id: string; company_id: string; status: string }>(
      `SELECT id, company_id, status FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (task.company_id !== userId) {
      return res.status(403).json({ error: '无权操作此任务' });
    }

    // 1. 生成任务向量
    await vectorGenerationService.updateTaskEmbedding(taskId);

    // 2. 生成任务翻译
    await qichengTeacherService.analyzeAndTranslateTask(taskId as any);

    // 3. 找出最匹配的100个学生
    const matches = await semanticMatchingEngine.findBestStudentsForTask(taskId, 100);

    // 4. 保存匹配结果到数据库
    for (const match of matches) {
      await query(
        `INSERT INTO task_student_matches (
          task_id, student_id, overall_score,
          skill_match_score, difficulty_match_score, domain_match_score,
          growth_potential_score, reliability_score, preference_score,
          match_breakdown, rank_in_task
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (task_id, student_id) DO UPDATE SET
          overall_score = EXCLUDED.overall_score,
          skill_match_score = EXCLUDED.skill_match_score,
          difficulty_match_score = EXCLUDED.difficulty_match_score,
          domain_match_score = EXCLUDED.domain_match_score,
          growth_potential_score = EXCLUDED.growth_potential_score,
          reliability_score = EXCLUDED.reliability_score,
          preference_score = EXCLUDED.preference_score,
          match_breakdown = EXCLUDED.match_breakdown,
          rank_in_task = EXCLUDED.rank_in_task`,
        [
          taskId,
          match.student_id,
          (match.match_score as any).overall_score,
          (match.match_score as any).skillMatch.score,
          (match.match_score as any).difficultyMatch.score,
          (match.match_score as any).domainMatch.score,
          (match.match_score as any).growthPotential.score,
          (match.match_score as any).reliability.score,
          (match.match_score as any).preferenceAlignment.score,
          JSON.stringify((match.match_score as any).breakdown),
          match.rank
        ]
      );
    }

    // 5. 更新任务的匹配状态
    const topScore = matches.length > 0 ? matches[0].match_score.overall_score : 0;
    await query(
      `UPDATE tasks SET
        matched_students_count = $1,
        top_match_score = $2,
        matching_completed_at = NOW()
       WHERE id = $3`,
      [matches.length, topScore, taskId]
    );

    logger.info(`Matching completed for task ${taskId}, found ${matches.length} students`);

    res.json({
      success: true,
      matchedCount: matches.length,
      topScore,
      message: `成功匹配${matches.length}个学生`
    });
  } catch (error: any) {
    logger.error('Failed to trigger matching:', error);
    res.status(500).json({ error: '匹配失败，请稍后重试' });
  }
}

/**
 * 企业查看匹配的学生列表
 * GET /api/v1/tasks/:taskId/matched-students
 */
export async function getMatchedStudents(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    // 验证任务存在且属于当前企业
    const task = await queryOne<{ id: string; company_id: string }>(
      `SELECT id, company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (task.company_id !== userId) {
      return res.status(403).json({ error: '无权查看此任务的匹配结果' });
    }

    // 获取匹配的学生列表
    const matches = await query<{
      student_id: string;
      overall_score: number;
      skill_match_score: number;
      difficulty_match_score: number;
      domain_match_score: number;
      growth_potential_score: number;
      reliability_score: number;
      preference_score: number;
      match_breakdown: any;
      rank_in_task: number;
      username: string;
      avatar_url: string;
      bio: string;
      tasks_completed: number;
      avg_task_quality: number;
      avg_client_satisfaction: number;
    }>(
      `SELECT
        tsm.student_id,
        tsm.overall_score,
        tsm.skill_match_score,
        tsm.difficulty_match_score,
        tsm.domain_match_score,
        tsm.growth_potential_score,
        tsm.reliability_score,
        tsm.preference_score,
        tsm.match_breakdown,
        tsm.rank_in_task,
        u.username,
        u.avatar_url,
        u.bio,
        sc.tasks_completed,
        sc.avg_task_quality,
        sc.avg_client_satisfaction
       FROM task_student_matches tsm
       JOIN users u ON tsm.student_id = u.id
       LEFT JOIN student_capabilities sc ON tsm.student_id = sc.student_id
       WHERE tsm.task_id = $1
       ORDER BY tsm.overall_score DESC
       LIMIT $2`,
      [taskId, limit]
    );

    res.json({
      success: true,
      students: matches.map(m => ({
        studentId: m.student_id,
        username: m.username,
        avatarUrl: m.avatar_url,
        bio: m.bio,
        tasksCompleted: m.tasks_completed || 0,
        avgQuality: m.avg_task_quality || 0,
        avgSatisfaction: m.avg_client_satisfaction || 0,
        match_score: {
          overall: m.overall_score,
          skill: m.skill_match_score,
          difficulty: m.difficulty_match_score,
          domain: m.domain_match_score,
          growth: m.growth_potential_score,
          reliability: m.reliability_score,
          preference: m.preference_score
        },
        matchReason: m.match_breakdown,
        rank: m.rank_in_task
      }))
    });
  } catch (error: any) {
    logger.error('Failed to get matched students:', error);
    res.status(500).json({ error: '获取匹配学生失败' });
  }
}

/**
 * 企业选择学生推送任务
 * POST /api/v1/tasks/:taskId/push-to-students
 * Body: { studentIds: [id1, id2, id3, id4, id5] }
 */
export async function pushToStudents(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const { studentIds } = req.body;
    const userId = (req as any).user?.id;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: '请选择要推送的学生' });
    }

    if (studentIds.length > 5) {
      return res.status(400).json({ error: '最多只能推送给5个学生' });
    }

    // 验证任务存在且属于当前企业
    const task = await queryOne<{ id: string; company_id: string }>(
      `SELECT id, company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (task.company_id !== userId) {
      return res.status(403).json({ error: '无权操作此任务' });
    }

    // 更新推送状态
    for (const studentId of studentIds) {
      await query(
        `UPDATE task_student_matches SET
          is_pushed = true,
          pushed_at = NOW()
         WHERE task_id = $1 AND student_id = $2`,
        [taskId, studentId]
      );
    }

    logger.info(`Pushed task ${taskId} to ${studentIds.length} students`);

    res.json({
      success: true,
      pushedCount: studentIds.length,
      message: `已推送给${studentIds.length}个学生`
    });
  } catch (error: any) {
    logger.error('Failed to push to students:', error);
    res.status(500).json({ error: '推送失败' });
  }
}

/**
 * 学生查看推荐任务
 * GET /api/v1/students/recommended-tasks
 */
export async function getRecommendedTasks(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    // 获取推送给该学生的任务
    const tasks = await query<{
      task_id: string;
      overall_score: number;
      match_breakdown: any;
      pushed_at: Date;
      student_viewed: boolean;
      title: string;
      description: string;
      budget_min: number;
      budget_max: number;
      track_type: string;
      level_required: string;
      status: string;
      company_name: string;
      student_friendly_title: string;
      student_friendly_description: string;
      what_you_will_learn: string;
      estimated_hours: number;
      difficulty_overall: number;
    }>(
      `SELECT
        tsm.task_id,
        tsm.overall_score,
        tsm.match_breakdown,
        tsm.pushed_at,
        tsm.student_viewed,
        t.title,
        t.description,
        t.budget_min,
        t.budget_max,
        t.track_type,
        t.level_required,
        t.status,
        u.username as company_name,
        tt.student_friendly_title,
        tt.student_friendly_description,
        tt.what_you_will_learn,
        tt.estimated_hours,
        tt.difficulty_overall
       FROM task_student_matches tsm
       JOIN tasks t ON tsm.task_id = t.id
       JOIN users u ON t.company_id = u.id
       LEFT JOIN task_translations tt ON t.id = tt.task_id
       WHERE tsm.student_id = $1
         AND tsm.is_pushed = true
         AND t.status = 'open'
       ORDER BY tsm.pushed_at DESC`,
      [userId]
    );

    // 标记为已查看
    await query(
      `UPDATE task_student_matches SET
        student_viewed = true,
        viewed_at = NOW()
       WHERE student_id = $1 AND is_pushed = true AND student_viewed = false`,
      [userId]
    );

    res.json({
      success: true,
      tasks: tasks.map(t => ({
        taskId: t.task_id,
        title: t.student_friendly_title || t.title,
        description: t.student_friendly_description || t.description,
        originalTitle: t.title,
        budgetMin: t.budget_min,
        budgetMax: t.budget_max,
        trackType: t.track_type,
        levelRequired: t.level_required,
        companyName: t.company_name,
        match_score: t.overall_score,
        matchReason: t.match_breakdown,
        whatYouWillLearn: t.what_you_will_learn,
        estimatedHours: t.estimated_hours,
        difficulty: t.difficulty_overall,
        pushedAt: t.pushed_at,
        viewed: t.student_viewed
      }))
    });
  } catch (error: any) {
    logger.error('Failed to get recommended tasks:', error);
    res.status(500).json({ error: '获取推荐任务失败' });
  }
}

/**
 * 学生查看任务翻译
 * GET /api/v1/tasks/:taskId/translation
 */
export async function getTaskTranslation(req: Request, res: Response) {
  try {
    const { taskId } = req.params;

    // 获取任务翻译
    const translation = await qichengTeacherService.getTaskTranslation(taskId);

    if (!translation) {
      return res.status(404).json({ error: '任务翻译不存在' });
    }

    res.json({
      success: true,
      translation: {
        taskId: translation.taskId,
        studentFriendlyTitle: translation.studentFriendlyTitle,
        studentFriendlyDescription: translation.studentFriendlyDescription,
        functionalModules: translation.functionalModules,
        whatYouWillDo: translation.whatYouWillDo,
        whatYouWillLearn: translation.whatYouWillLearn,
        estimatedHours: translation.estimatedHours,
        requiredSkills: translation.requiredSkills,
        difficulty: translation.difficulty,
        learningValue: translation.learningValue,
        careerImpact: translation.careerImpact
      }
    });
  } catch (error: any) {
    logger.error('Failed to get task translation:', error);
    res.status(500).json({ error: '获取任务翻译失败' });
  }
}

/**
 * 学生接受推荐任务
 * POST /api/v1/tasks/:taskId/accept-recommendation
 */
export async function acceptRecommendation(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user?.id;

    // 验证是否推送给该学生
    const match = await queryOne<{ task_id: string; is_pushed: boolean }>(
      `SELECT task_id, is_pushed FROM task_student_matches
       WHERE task_id = $1 AND student_id = $2`,
      [taskId, userId]
    );

    if (!match || !match.is_pushed) {
      return res.status(403).json({ error: '此任务未推送给你' });
    }

    // 更新接受状态
    await query(
      `UPDATE task_student_matches SET
        student_accepted = true,
        accepted_at = NOW()
       WHERE task_id = $1 AND student_id = $2`,
      [taskId, userId]
    );

    logger.info(`Student ${userId} accepted task ${taskId}`);

    res.json({
      success: true,
      message: '已接受任务推荐'
    });
  } catch (error: any) {
    logger.error('Failed to accept recommendation:', error);
    res.status(500).json({ error: '接受任务失败' });
  }
}

/**
 * 获取任务的匹配统计
 * GET /api/v1/tasks/:taskId/matching-stats
 */
export async function getMatchingStats(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user?.id;

    // 验证任务存在且属于当前企业
    const task = await queryOne<{ id: string; company_id: string }>(
      `SELECT id, company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (task.company_id !== userId) {
      return res.status(403).json({ error: '无权查看此任务的统计' });
    }

    // 获取统计数据
    const stats = await queryOne<{
      total_matches: number;
      pushed_count: number;
      viewed_count: number;
      accepted_count: number;
      avg_score: number;
      top_score: number;
    }>(
      `SELECT
        COUNT(*) as total_matches,
        COUNT(*) FILTER (WHERE is_pushed = true) as pushed_count,
        COUNT(*) FILTER (WHERE student_viewed = true) as viewed_count,
        COUNT(*) FILTER (WHERE student_accepted = true) as accepted_count,
        AVG(overall_score) as avg_score,
        MAX(overall_score) as top_score
       FROM task_student_matches
       WHERE task_id = $1`,
      [taskId]
    );

    res.json({
      success: true,
      stats: {
        totalMatches: parseInt(stats?.total_matches as any) || 0,
        pushedCount: parseInt(stats?.pushed_count as any) || 0,
        viewedCount: parseInt(stats?.viewed_count as any) || 0,
        acceptedCount: parseInt(stats?.accepted_count as any) || 0,
        avgScore: stats?.avg_score || 0,
        topScore: stats?.top_score || 0
      }
    });
  } catch (error: any) {
    logger.error('Failed to get matching stats:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
}

/**
 * 手动触发重新匹配（更新匹配结果）
 * POST /api/v1/tasks/:taskId/rematch
 */
export async function rematchTask(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user?.id;

    // 验证任务存在且属于当前企业
    const task = await queryOne<{ id: string; company_id: string }>(
      `SELECT id, company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (task.company_id !== userId) {
      return res.status(403).json({ error: '无权操作此任务' });
    }

    // 触发重新匹配
    const matchingScheduler = require('../../services/matchingScheduler').default;
    await matchingScheduler.triggerRematch(taskId, task.company_id);

    res.json({
      success: true,
      message: '重新匹配完成'
    });
  } catch (error: any) {
    logger.error('Failed to rematch task:', error);
    res.status(500).json({ error: '重新匹配失败' });
  }
}
