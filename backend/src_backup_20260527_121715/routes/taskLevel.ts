import express from 'express';
import {
  publishTask,
  confirmPublishTask,
  getMatchedStudents,
  getRecommendedTasks,
  acceptTask,
  getTaskDetail,
  getCompanyTasks,
} from '../controllers/taskLevelController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';

const router = express.Router();

/**
 * 企业端路由
 */

// 发布任务（草稿）
router.post('/publish', authenticate, requireRole('company'), publishTask);

// 确认发布任务（触发匹配）
router.post('/:taskId/confirm', authenticate, requireRole('company'), confirmPublishTask);

// 获取任务的匹配学生列表（Top 3）
router.get('/:taskId/matched-students', authenticate, requireRole('company'), getMatchedStudents);

// 获取企业的任务列表
router.get('/company/list', authenticate, requireRole('company'), getCompanyTasks);

/**
 * 学生端路由
 */

// 获取推荐任务列表
router.get('/recommended', authenticate, requireRole('student'), getRecommendedTasks);

// 接受任务
router.post('/:taskId/accept', authenticate, requireRole('student'), acceptTask);

/**
 * 通用路由
 */

// 获取任务详情（包含匹配信息）
router.get('/:taskId', authenticate, getTaskDetail);

export default router;
