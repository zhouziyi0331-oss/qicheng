/**
 * 任务分级和智能匹配路由
 *
 * 定义任务等级、学生等级、智能匹配相关的API路由
 */

import express from 'express';
import * as taskLevelMatchingController from '../controllers/taskLevelMatchingController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticateToken);

// =====================================================
// 任务等级路由
// =====================================================

/**
 * 获取所有任务等级定义
 * GET /api/v1/task-levels
 */
router.get('/', taskLevelMatchingController.getTaskLevels);

/**
 * 计算任务等级
 * POST /api/v1/task-levels/calculate/:taskId
 */
router.post('/calculate/:taskId', taskLevelMatchingController.calculateTaskLevel);

// =====================================================
// 学生等级路由
// =====================================================

/**
 * 获取学生等级信息
 * GET /api/v1/task-levels/student/:studentId
 */
router.get('/student/:studentId', taskLevelMatchingController.getStudentLevel);

/**
 * 更新学生等级（手动触发）
 * POST /api/v1/task-levels/student/:studentId/update
 */
router.post('/student/:studentId/update', taskLevelMatchingController.updateStudentLevel);

// =====================================================
// 智能匹配路由
// =====================================================

/**
 * 为任务匹配学生
 * POST /api/v1/task-levels/matching/task/:taskId/match
 */
router.post('/matching/task/:taskId/match', taskLevelMatchingController.matchTaskWithStudents);

/**
 * 获取任务的匹配学生列表
 * GET /api/v1/task-levels/matching/task/:taskId/matches
 */
router.get('/matching/task/:taskId/matches', taskLevelMatchingController.getTaskMatches);

/**
 * 获取学生的推荐任务
 * GET /api/v1/task-levels/matching/student/:studentId/recommendations
 */
router.get(
  '/matching/student/:studentId/recommendations',
  taskLevelMatchingController.getStudentRecommendations
);

/**
 * 通知匹配的学生
 * POST /api/v1/task-levels/matching/task/:taskId/notify
 */
router.post('/matching/task/:taskId/notify', taskLevelMatchingController.notifyMatchedStudents);

export default router;
