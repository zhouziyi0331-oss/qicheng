/**
 * 指令1: 用户注册登录模块
 * POST /auth/register       — 注册 (学生/企业角色注册时锁定，不可更改)
 * POST /auth/login          — 登录
 * POST /auth/send-code      — 发送手机验证码
 * POST /auth/refresh        — 刷新 access token
 * POST /auth/logout         — 登出 (撤销 refresh token)
 * POST /auth/wechat/login   — 微信小程序登录
 * POST /auth/wechat/bind-phone — 微信登录后绑定手机号
 * POST /auth/wechat/decrypt-phone — 解密微信手机号
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';
import * as wechatController from './wechatController';

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

// 微信登录
router.post('/wechat/login',
  body('code').notEmpty().withMessage('微信登录code不能为空'),
  body('userType').isIn(['student', 'company']).withMessage('用户类型必须是 student 或 company'),
  wechatController.wechatLogin
);

// 微信登录后绑定手机号
router.post('/wechat/bind-phone',
  authenticate,
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('验证码格式不正确'),
  wechatController.bindPhone
);

// 解密微信手机号
router.post('/wechat/decrypt-phone',
  authenticate,
  body('encryptedData').notEmpty().withMessage('加密数据不能为空'),
  body('iv').notEmpty().withMessage('iv不能为空'),
  wechatController.decryptWechatPhone
);

export default router;
