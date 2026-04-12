/**
 * 用户个人资料路由
 * GET /user/profile              — 获取当前用户资料
 * PUT /user/profile              — 更新完整资料
 * PUT /user/profile/nickname     — 更新昵称
 * PUT /user/profile/avatar       — 更新头像
 * POST /user/profile/upload-avatar — 获取头像上传URL
 * POST /user/bind-phone          — 绑定手机号
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as profileController from './profileController';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取个人资料
router.get('/profile', profileController.getProfile);

// 更新昵称
router.put('/profile/nickname',
  body('nickname').notEmpty().withMessage('昵称不能为空'),
  profileController.updateNickname
);

// 更新头像
router.put('/profile/avatar',
  body('avatar').notEmpty().withMessage('头像URL不能为空'),
  profileController.updateAvatar
);

// 更新完整资料
router.put('/profile', profileController.updateProfile);

// 获取头像上传URL
router.post('/profile/upload-avatar', profileController.getAvatarUploadUrl);

// 绑定手机号
router.post('/bind-phone',
  body('phone').notEmpty().withMessage('手机号不能为空'),
  body('code').notEmpty().withMessage('验证码不能为空'),
  profileController.bindPhone
);

export default router;
