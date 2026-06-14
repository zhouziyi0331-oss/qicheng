/**
 * 任务分级和智能匹配控制器
 *
 * 处理任务等级、学生等级、智能匹配相关的HTTP请求
 */

import { Request, Response } from 'express';
import { taskLevelMatchingService } from '../services/taskLevelMatchingService';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================


// =====================================================
// 任务等级接口
// =====================================================

/**
 * 获取所有任务等级定义
 * GET /api/v1/task-levels
 */
export async function getTaskLevels(req: Request, res: Response) {
  try {
    const levels = await taskLevelMatchingService.getTaskLevels();

    return res.json({
      success: true,
      data: levels,
    });
  } catch (error: unknown) {
    logger.error('Failed to get task levels', { error });
    return res.status(500).json({
      error: 'Failed to get task levels',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 计算任务等级
 * POST /api/v1/task-levels/calculate/:taskId
 */
export async function calculateTaskLevel(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const level = await taskLevelMatchingService.calculateTaskLevel(taskId);

    return res.json({
      success: true,
      data: {
        task_id: taskId,
        level,
      },
    });
  } catch (error: unknown) {
    logger.error('Failed to calculate task level', { error });
    return res.status(500).json({
      error: 'Failed to calculate task level',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 学生等级接口
// =====================================================

/**
 * 获取学生等级信息
 * GET /api/v1/student-levels/:studentId
 */
export async function getStudentLevel(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const level = await taskLevelMatchingService.getStudentLevel(studentId);

    if (!level) {
      return res.status(404).json({ error: 'Student level not found' });
    }

    return res.json({
      success: true,
      data: level,
    });
  } catch (error: unknown) {
    logger.error('Failed to get student level', { error });
    return res.status(500).json({
      error: 'Failed to get student level',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 更新学生等级（手动触发）
 * POST /api/v1/student-levels/:studentId/update
 */
export async function updateStudentLevel(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { studentId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有学生本人或管理员可以更新
    if (userId !== studentId && req.user?.role !== 'admin' && req.user?.role !== 'platform') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await taskLevelMatchingService.updateStudentLevel(studentId);

    const updatedLevel = await taskLevelMatchingService.getStudentLevel(studentId);

    return res.json({
      success: true,
      data: updatedLevel,
      message: 'Student level updated successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to update student level', { error });
    return res.status(500).json({
      error: 'Failed to update student level',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 智能匹配接口
// =====================================================

/**
 * 为任务匹配学生
 * POST /api/v1/matching/task/:taskId/match
 */
export async function matchTaskWithStudents(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { taskId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有企业或管理员可以触发匹配
    if (userRole !== 'company' && userRole !== 'admin' && userRole !== 'platform') {
      return res.status(403).json({ error: 'Only companies can match tasks' });
    }

    const matches = await taskLevelMatchingService.matchTaskWithStudents(taskId, limit);

    return res.json({
      success: true,
      data: matches,
      total: matches.length,
    });
  } catch (error: unknown) {
    logger.error('Failed to match task with students', { error });
    return res.status(500).json({
      error: 'Failed to match task with students',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取任务的匹配学生列表
 * GET /api/v1/matching/task/:taskId/matches
 */
export async function getTaskMatches(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const matches = await taskLevelMatchingService.getTaskMatches(taskId, limit);

    return res.json({
      success: true,
      data: matches,
      total: matches.length,
    });
  } catch (error: unknown) {
    logger.error('Failed to get task matches', { error });
    return res.status(500).json({
      error: 'Failed to get task matches',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取学生的推荐任务
 * GET /api/v1/matching/student/:studentId/recommendations
 */
export async function getStudentRecommendations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有学生本人可以查看推荐
    if (userId !== studentId && req.user?.role !== 'admin' && req.user?.role !== 'platform') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const recommendations = await taskLevelMatchingService.getStudentRecommendedTasks(
      studentId,
      limit
    );

    return res.json({
      success: true,
      data: recommendations,
      total: recommendations.length,
    });
  } catch (error: unknown) {
    logger.error('Failed to get student recommendations', { error });
    return res.status(500).json({
      error: 'Failed to get student recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 通知匹配的学生
 * POST /api/v1/matching/task/:taskId/notify
 */
export async function notifyMatchedStudents(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { taskId } = req.params;
    const topN = parseInt(req.body.top_n) || 5;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有企业或管理员可以通知
    if (userRole !== 'company' && userRole !== 'admin' && userRole !== 'platform') {
      return res.status(403).json({ error: 'Only companies can notify students' });
    }

    await taskLevelMatchingService.notifyMatchedStudents(taskId, topN);

    return res.json({
      success: true,
      message: `Notified top ${topN} matched students`,
    });
  } catch (error: unknown) {
    logger.error('Failed to notify matched students', { error });
    return res.status(500).json({
      error: 'Failed to notify matched students',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
