/**
 * 指令8: 支付与提现系统
 * POST /payments/withdraw     — 学生申请提现
 * GET  /payments/balance      — 获取余额
 * GET  /payments/history      — 收支历史
 * POST /payments/notify/wechat — 微信支付回调
 * POST /payments/notify/alipay — 支付宝回调
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 学生端
router.get('/balance', authenticate, requireRole('student'), controller.getBalance);
router.get('/history', authenticate, requireRole('student'), controller.getHistory);
router.post('/withdraw', authenticate, requireRole('student'), controller.requestWithdrawal);

// 支付回调 (不需要 JWT 认证, 由支付平台签名验证)
router.post('/notify/wechat', controller.wechatNotify);
router.post('/notify/alipay', controller.alipayNotify);

export default router;
