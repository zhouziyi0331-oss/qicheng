/**
 * 学生端路由 - 跳级测试
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as jumpTestCtrl from './jumpTestController';

const router = Router();

// 跳级相关路由
router.get('/jump-eligibility', authenticate, requireRole('student'), jumpTestCtrl.checkJumpEligibility);
router.post('/apply-jump', authenticate, requireRole('student'), jumpTestCtrl.applyForJumpTest);
router.post('/submit-jump-test', authenticate, requireRole('student'), jumpTestCtrl.submitJumpTest);
router.get('/jump-history', authenticate, requireRole('student'), jumpTestCtrl.getJumpHistory);

export default router;
