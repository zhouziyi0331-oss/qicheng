import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router();

router.use(authenticate);

// GET /notification - 获取通知列表
router.get('/', ctrl.listNotifications);

// POST /notification/:id/read - 标记已读
router.post('/:id/read', ctrl.markAsRead);

// GET /notification/unread-count - 未读数量
router.get('/unread-count', ctrl.getUnreadCount);

export default router;
