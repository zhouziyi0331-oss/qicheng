/**
 * 管理端主路由
 * 整合所有管理端功能模块
 */
import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import studentRoutes from './studentRoutes';
import companyRoutes from './companyRoutes';
import taskRoutes from './taskRoutes';
import orderRoutes from './orderRoutes';
import mentorRoutes from './mentorRoutes';
import aiRoutes from './aiRoutes';
import contentRoutes from './contentRoutes';
import financeRoutes from './financeRoutes';
import systemRoutes from './systemRoutes';
import auditLogRoutes from './auditLogRoutes';
import platformRoutes from './platformRoutes';
import { authenticate } from '../../middleware/auth';

const router = Router();

// 认证相关（无需token）
router.use('/auth', authRoutes);

// 以下路由都需要认证
router.use('/dashboard', authenticate, dashboardRoutes);
router.use('/students', authenticate, studentRoutes);
router.use('/companies', authenticate, companyRoutes);
router.use('/tasks', authenticate, taskRoutes);
router.use('/orders', authenticate, orderRoutes);
router.use('/mentor', authenticate, mentorRoutes);
router.use('/ai', authenticate, aiRoutes);
router.use('/content', authenticate, contentRoutes);
router.use('/finance', authenticate, financeRoutes);
router.use('/system', authenticate, systemRoutes);
router.use('/audit-logs', authenticate, auditLogRoutes);
router.use('/platform', authenticate, platformRoutes); // 平台管理增强功能

export default router;
