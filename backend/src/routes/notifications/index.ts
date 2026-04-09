import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getNotifications,
  getUnreadCountHandler,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateNotificationPreferences,
  getNotificationPreferences
} from './controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取通知列表
router.get('/', getNotifications);

// 获取未读数量
router.get('/unread-count', getUnreadCountHandler);

// 标记单个通知为已读
router.put('/:notificationId/read', markNotificationAsRead);

// 标记所有通知为已读
router.put('/read-all', markAllNotificationsAsRead);

// 删除通知
router.delete('/:notificationId', deleteNotification);

// 获取通知偏好设置
router.get('/preferences', getNotificationPreferences);

// 更新通知偏好设置
router.put('/preferences', updateNotificationPreferences);

export default router;
