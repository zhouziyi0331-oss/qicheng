/**
 * 通知中心
 * GET  /notifications           — 获取当前用户通知列表（分页）
 * PATCH /notifications/:id/read — 标记单条已读
 * PATCH /notifications/read-all — 全部标为已读
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();
router.use(authenticate);

router.get('/', controller.listNotifications);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

export default router;
