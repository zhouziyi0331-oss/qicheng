import express from 'express';
import * as semanticMatchingController from '../controllers/semanticMatchingController';
import * as qichengTeacherController from '../controllers/qichengTeacherController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * 语义匹配相关路由
 */

// 企业端：触发任务匹配
router.post(
  '/tasks/:taskId/trigger-matching',
  authenticate,
  semanticMatchingController.triggerMatching
);

// 企业端：查看匹配的学生
router.get(
  '/tasks/:taskId/matched-students',
  authenticate,
  semanticMatchingController.getMatchedStudents
);

// 企业端：推送任务给选中的学生
router.post(
  '/tasks/:taskId/push-to-students',
  authenticate,
  semanticMatchingController.pushToStudents
);

// 学生端：查看推荐任务
router.get(
  '/students/recommended-tasks',
  authenticate,
  semanticMatchingController.getRecommendedTasks
);

/**
 * 启程老师翻译相关路由
 */

// 获取任务的启程老师翻译
router.get(
  '/tasks/:taskId/translation',
  authenticate,
  qichengTeacherController.getTaskTranslation
);

// 为任务生成需求摘要
router.post(
  '/tasks/:taskId/generate-summary',
  authenticate,
  qichengTeacherController.generateRequirementSummary
);

export default router;
