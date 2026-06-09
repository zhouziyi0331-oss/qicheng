import express from 'express';
import * as semanticMatchingController from '../controllers/semanticMatchingController';
import * as qichengTeacherController from '../controllers/qichengTeacherController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * 语义匹配相关路由
 */

// 企业端：触发任务匹配
router.post(
  '/tasks/:taskId/trigger-matching',
  authenticateToken,
  semanticMatchingController.triggerMatching
);

// 企业端：查看匹配的学生
router.get(
  '/tasks/:taskId/matched-students',
  authenticateToken,
  semanticMatchingController.getMatchedStudents
);

// 企业端：推送任务给选中的学生
router.post(
  '/tasks/:taskId/push-to-students',
  authenticateToken,
  semanticMatchingController.pushToStudents
);

// 学生端：查看推荐任务
router.get(
  '/students/recommended-tasks',
  authenticateToken,
  semanticMatchingController.getRecommendedTasks
);

/**
 * 启程老师翻译相关路由
 */

// 获取任务的启程老师翻译
router.get(
  '/tasks/:taskId/translation',
  authenticateToken,
  qichengTeacherController.getTaskTranslation
);

// 为任务生成需求摘要
router.post(
  '/tasks/:taskId/generate-summary',
  authenticateToken,
  qichengTeacherController.generateRequirementSummary
);

export default router;
