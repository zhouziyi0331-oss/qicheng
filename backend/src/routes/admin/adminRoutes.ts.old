import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as controller from './adminController';

const router = Router();

// 所有管理后台路由都需要管理员权限
router.use(authenticate, controller.requireAdmin);

// ============================================================
// GET /admin/dashboard - 数据看板
// ============================================================
router.get('/dashboard', controller.getDashboard);

// ============================================================
// GET /admin/users - 用户列表
// ============================================================
router.get('/users', controller.getUsers);

// ============================================================
// POST /admin/users/:id/ban - 封禁用户
// ============================================================
router.post(
  '/users/:id/ban',
  [
    param('id').isUUID().withMessage('用户ID格式错误'),
    body('reason').isString().isLength({ min: 10 }).withMessage('封禁理由至少10字'),
    body('duration').optional().isInt({ min: 1 }).withMessage('封禁时长必须为正整数'),
  ],
  controller.banUser
);

// ============================================================
// POST /admin/users/:id/unban - 解封用户
// ============================================================
router.post(
  '/users/:id/unban',
  [param('id').isUUID().withMessage('用户ID格式错误')],
  controller.unbanUser
);

// ============================================================
// GET /admin/tasks - 任务列表
// ============================================================
router.get('/tasks', controller.getTasks);

// ============================================================
// POST /admin/tasks/:id/review - 审核任务
// ============================================================
router.post(
  '/tasks/:id/review',
  [
    param('id').isUUID().withMessage('任务ID格式错误'),
    body('action').isIn(['approve', 'reject']).withMessage('操作必须是approve或reject'),
    body('notes').optional().isString().withMessage('备注必须是字符串'),
  ],
  controller.reviewTask
);

// ============================================================
// GET /admin/withdrawals - 提现申请列表
// ============================================================
router.get('/withdrawals', controller.getWithdrawals);

// ============================================================
// POST /admin/withdrawals/:id/process - 处理提现申请
// ============================================================
router.post(
  '/withdrawals/:id/process',
  [
    param('id').isUUID().withMessage('提现ID格式错误'),
    body('action').isIn(['approve', 'reject']).withMessage('操作必须是approve或reject'),
    body('notes').optional().isString().withMessage('备注必须是字符串'),
  ],
  controller.processWithdrawal
);

// ============================================================
// GET /admin/logs - 操作日志
// ============================================================
router.get('/logs', controller.getLogs);

export default router;
