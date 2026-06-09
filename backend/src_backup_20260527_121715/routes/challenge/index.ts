import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// ============================================================
// POST /challenge/start - 开始跳级挑战测试
// ============================================================
router.post(
  '/start',
  authenticate,
  [
    body('targetLevel').isInt({ min: 1, max: 5 }).withMessage('目标等级必须在1-5之间'),
  ],
  controller.startChallenge
);

// ============================================================
// POST /challenge/submit - 提交跳级挑战答案
// ============================================================
router.post(
  '/submit',
  authenticate,
  [
    body('challengeId').isUUID().withMessage('挑战ID格式错误'),
    body('answers').isArray({ min: 10, max: 10 }).withMessage('必须提交10道题的答案'),
  ],
  controller.submitChallenge
);

// ============================================================
// GET /challenge/history - 获取挑战历史
// ============================================================
router.get('/history', authenticate, controller.getChallengeHistory);

export default router;
