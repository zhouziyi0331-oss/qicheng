import { Request, Response } from 'express';
import semanticMatchingEngine from '../services/semanticMatchingEngine';
import logger from '../utils/logger';

/**
 * 语义匹配控制器
 * 连接AI匹配引擎到API端点
 */

/**
 * 触发任务匹配
 * POST /api/v1/tasks/:taskId/trigger-matching
 */
export const triggerMatching = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;

  try {
    logger.info(`Triggering matching for task ${taskId}, limit ${limit}`);

    // 调用AI匹配引擎
    const matches = await semanticMatchingEngine.findBestStudentsForTask(taskId, limit);

    if (matches.length === 0) {
      return res.json({
        success: true,
        matchedCount: 0,
        message: '未找到合适的学生，请检查任务要求或学生数据'
      });
    }

    res.json({
      success: true,
      matchedCount: matches.length,
      topScore: matches[0]?.overall_score || 0,
      message: `成功为任务匹配${matches.length}个学生`
    });
  } catch (error: any) {
    logger.error('Trigger matching failed:', error);
    res.status(500).json({
      error: '匹配失败',
      message: error.message
    });
  }
};

/**
 * 获取任务的匹配学生列表
 * GET /api/v1/tasks/:taskId/matched-students
 */
export const getMatchedStudents = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const matches = await semanticMatchingEngine.getMatchedStudentsForTask(taskId, limit);

    res.json({
      success: true,
      students: matches.map((match: any) => ({
        studentId: match.student_id,
        nickname: match.student_nickname,
        avatar: match.student_avatar,
        level: match.student_level,
        overall_score: Math.round(match.overall_score * 100),
        skillMatch: Math.round(match.skillMatch * 100),
        difficultyMatch: Math.round(match.difficultyMatch * 100),
        domainMatch: Math.round(match.domainMatch * 100),
        growthPotential: Math.round(match.growthPotential * 100),
        reliability: Math.round(match.reliability * 100),
        preferenceAlignment: Math.round(match.preferenceAlignment * 100),
        matchReason: match.match_reason,
        matchedAt: match.created_at
      }))
    });
  } catch (error: any) {
    logger.error('Get matched students failed:', error);
    res.status(500).json({
      error: '获取失败',
      message: error.message
    });
  }
};

/**
 * 推送任务给选中的学生
 * POST /api/v1/tasks/:taskId/push-to-students
 */
export const pushToStudents = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'studentIds必须是非空数组' });
  }

  try {
    const result = await semanticMatchingEngine.pushTaskToStudents(taskId, studentIds);

    res.json({
      success: true,
      pushedCount: result.pushedCount,
      message: `成功推送任务给${result.pushedCount}个学生`
    });
  } catch (error: any) {
    logger.error('Push to students failed:', error);
    res.status(500).json({
      error: '推送失败',
      message: error.message
    });
  }
};

/**
 * 学生查看推荐任务
 * GET /api/v1/students/recommended-tasks
 */
export const getRecommendedTasks = async (req: Request, res: Response) => {
  const studentId = (req as any).user?.id;

  if (!studentId) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const tasks = await semanticMatchingEngine.getRecommendedTasksForStudent(studentId);

    res.json({
      success: true,
      tasks: tasks.map((task: any) => ({
        taskId: task.task_id,
        title: task.task_title,
        description: task.task_description,
        track: task.task_track,
        level: task.task_level,
        budget: task.task_budget,
        duration: task.task_duration,
        match_score: Math.round(task.overall_score * 100),
        matchReason: task.match_reason,
        studentFriendlyTitle: task.student_friendly_title,
        whatYouWillDo: task.what_you_will_do,
        whatYouWillLearn: task.what_you_will_learn,
        estimatedHours: task.estimated_hours,
        pushedAt: task.pushed_at
      }))
    });
  } catch (error: any) {
    logger.error('Get recommended tasks failed:', error);
    res.status(500).json({
      error: '获取失败',
      message: error.message
    });
  }
};
