/**
 * 指令1: 用户注册登录模块
 * POST /auth/register       — 注册 (学生/企业角色注册时锁定，不可更改)
 * POST /auth/login          — 登录
 * POST /auth/send-code      — 发送手机验证码
 * POST /auth/refresh        — 刷新 access token
 * POST /auth/logout         — 登出 (撤销 refresh token)
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 发送验证码
router.post('/send-code',
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  controller.sendVerificationCode
);

// 注册
router.post('/register',
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('验证码格式不正确'),
  body('role').isIn(['student', 'company']).withMessage('角色必须是 student 或 company'),
  body('password').isLength({ min: 8 }).withMessage('密码至少8位'),
  controller.register
);

// 登录
router.post('/login',
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  controller.login
);

// 刷新令牌
router.post('/refresh',
  body('refreshToken').notEmpty(),
  controller.refreshToken
);

// 登出
router.post('/logout', authenticate, controller.logout);

export default router;
