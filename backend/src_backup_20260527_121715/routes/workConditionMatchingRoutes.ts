/**
 * 工作条件匹配路由
 * 基于OPC测试结果的工作条件画像进行智能匹配
 */

import express from 'express';
import * as workConditionMatchingController from './tasks/workConditionMatchingController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticateToken);

// =====================================================
// 学生工作条件画像路由
// =====================================================

/**
 * 生成学生工作条件画像（基于OPC测试结果）
 * POST /api/v1/work-condition/student/:studentId/generate-profile
 */
router.post(
  '/student/:studentId/generate-profile',
  workConditionMatchingController.generateStudentProfile
);

/**
 * 获取学生工作条件画像
 * GET /api/v1/work-condition/student/:studentId/profile
 */
router.get(
  '/student/:studentId/profile',
  workConditionMatchingController.getStudentProfile
);

/**
 * 学生查看推荐任务（基于工作条件匹配）
 * GET /api/v1/work-condition/student/recommended-tasks
 */
router.get(
  '/student/recommended-tasks',
  workConditionMatchingController.getRecommendedTasksForStudent
);

// =====================================================
// 任务需求条件画像路由
// =====================================================

/**
 * 生成任务需求条件画像
 * POST /api/v1/work-condition/task/:taskId/generate-requirement
 */
router.post(
  '/task/:taskId/generate-requirement',
  workConditionMatchingController.generateTaskRequirement
);

/**
 * 获取任务需求条件画像
 * GET /api/v1/work-condition/task/:taskId/requirement
 */
router.get(
  '/task/:taskId/requirement',
  workConditionMatchingController.getTaskRequirement
);

// =====================================================
// 工作条件匹配路由
// =====================================================

/**
 * 触发工作条件匹配
 * POST /api/v1/work-condition/task/:taskId/match
 */
router.post(
  '/task/:taskId/match',
  workConditionMatchingController.triggerWorkConditionMatching
);

/**
 * 企业查看工作条件匹配结果
 * GET /api/v1/work-condition/task/:taskId/matches
 */
router.get(
  '/task/:taskId/matches',
  workConditionMatchingController.getWorkConditionMatches
);

/**
 * 学生查看具体任务的匹配详情
 * GET /api/v1/work-condition/task/:taskId/match-detail
 */
router.get(
  '/task/:taskId/match-detail',
  workConditionMatchingController.getMatchDetail
);

export default router;
