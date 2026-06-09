import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as authController from './authController';

const router = Router();

// 管理员登录（无需认证）
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  authController.login
);

// 获取当前管理员信息（需要认证）
router.get('/me', authenticate, authController.getCurrentAdmin);

// 修改密码（需要认证）
router.post(
  '/change-password',
  [
    authenticate,
    body('oldPassword').notEmpty().withMessage('原密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位')
  ],
  authController.changePassword
);

export default router;
