import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as dashboardController from './dashboardController';

const router = Router();

// 所有路由都需要管理员认证
router.use(authenticate);

// 获取数据看板统计
router.get('/stats', dashboardController.getDashboardStats);

// 获取预警列表
router.get('/alerts', dashboardController.getAlerts);

export default router;
