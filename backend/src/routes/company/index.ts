/**
 * 指令1: 企业端个人信息
 * GET  /company/profile  — 获取企业档案
 * POST /company/profile  — 更新企业信息
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();
router.use(authenticate, requireRole('company'));

router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);

export default router;
