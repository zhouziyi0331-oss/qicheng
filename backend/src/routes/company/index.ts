/**
 * 企业端路由
 * GET  /company/profile  — 获取企业档案
 * POST /company/profile  — 更新企业信息
 * GET  /company/report   — 获取数据报告
 * GET  /company/students/:studentId/profile — 查看学生资料
 * GET  /company/tasks/:taskId/progress — 查看任务进度
 * GET  /company/favorites — 获取收藏的学生列表
 * POST /company/favorites — 收藏学生
 * DELETE /company/favorites/:studentId — 取消收藏学生
 * GET  /company/tasks/:taskId/supplements — 获取追加需求历史
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();
router.use(authenticate, requireRole('company'));

router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);
router.get('/report', controller.getReport);
router.get('/students/:studentId/profile', controller.getStudentProfile);
router.get('/tasks/:taskId/progress', controller.getTaskProgress);
router.get('/favorites', controller.getFavoriteStudents);
router.post('/favorites', controller.addFavoriteStudent);
router.delete('/favorites/:studentId', controller.removeFavoriteStudent);
router.get('/tasks/:taskId/supplements', controller.getRequirementSupplements);

export default router;
