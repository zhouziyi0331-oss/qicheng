import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// ============================================================
// POST /subcontract/create - 创建转包申请
// ============================================================
router.post(
  '/create',
  authenticate,
  [
    body('taskId').isUUID().withMessage('任务ID格式错误'),
    body('reason').isString().isLength({ min: 10, max: 500 }).withMessage('转包理由必须在10-500字之间'),
    body('subcontractBudget').isFloat({ min: 1 }).withMessage('转包预算必须大于0'),
  ],
  controller.createSubcontract
);

// ============================================================
// GET /subcontract/my - 获取我的转包记录
// ============================================================
router.get('/my', authenticate, controller.getMySubcontracts);

// ============================================================
// POST /subcontract/:id/complete - 完成转包任务
// ============================================================
router.post(
  '/:id/complete',
  authenticate,
  [param('id').isUUID().withMessage('转包ID格式错误')],
  controller.completeSubcontract
);

export default router;
