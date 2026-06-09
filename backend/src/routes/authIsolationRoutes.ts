/**
 * 账号隔离和赛道选择路由
 */

import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import {
  registerStudent,
  registerEnterprise,
  loginStudent,
  loginEnterprise
} from '../controllers/authIsolationController';
import {
  getTrackRecommendation,
  selectTrack,
  getTrackPaths,
  getMyTrack
} from '../controllers/trackSelectionController';
import { authenticate } from '../middleware/auth';
import { requireStudentAccount } from '../middleware/accountTypeMiddleware';

const router = express.Router();

// ============================================================
// 账号隔离 - 注册接口
// ============================================================

/**
 * 学生注册
 * POST /api/v1/auth/register/student
 */
router.post(
  '/register/student',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    body('sms_code').isLength({ min: 4, max: 6 }).withMessage('请输入验证码'),
    body('nickname').notEmpty().withMessage('请输入昵称'),
    validate
  ],
  registerStudent
);

/**
 * 企业注册
 * POST /api/v1/auth/register/enterprise
 */
router.post(
  '/register/enterprise',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    body('sms_code').isLength({ min: 4, max: 6 }).withMessage('请输入验证码'),
    body('company_name').notEmpty().withMessage('请输入企业名称'),
    body('contact_name').notEmpty().withMessage('请输入联系人姓名'),
    validate
  ],
  registerEnterprise
);

// ============================================================
// 账号隔离 - 登录接口
// ============================================================

/**
 * 学生登录
 * POST /api/v1/auth/login/student
 */
router.post(
  '/login/student',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    body('password').notEmpty().withMessage('请输入密码'),
    validate
  ],
  loginStudent
);

/**
 * 企业登录
 * POST /api/v1/auth/login/enterprise
 */
router.post(
  '/login/enterprise',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    body('password').notEmpty().withMessage('请输入密码'),
    validate
  ],
  loginEnterprise
);

// ============================================================
// 赛道选择接口 (需要学生账号认证)
// ============================================================

/**
 * 获取赛道推荐
 * GET /api/v1/students/track-recommendation
 */
router.get(
  '/students/track-recommendation',
  authenticate,
  requireStudentAccount,
  getTrackRecommendation
);

/**
 * 选择赛道
 * POST /api/v1/students/select-track
 */
router.post(
  '/students/select-track',
  authenticate,
  requireStudentAccount,
  [
    body('track').isIn(['content', 'dev']).withMessage('赛道类型必须是 content 或 dev'),
    validate
  ],
  selectTrack
);

/**
 * 获取赛道路径对比
 * GET /api/v1/students/track-paths
 */
router.get(
  '/students/track-paths',
  authenticate,
  requireStudentAccount,
  getTrackPaths
);

/**
 * 获取我的赛道信息
 * GET /api/v1/students/my-track
 */
router.get(
  '/students/my-track',
  authenticate,
  requireStudentAccount,
  getMyTrack
);

export default router;
