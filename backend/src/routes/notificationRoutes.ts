/**
 * 通知消息路由
 */

import express from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticate);

// =====================================================
// 通知管理路由
// =====================================================

/**
 * 发送通知（管理员）
 * POST /api/v1/notifications/send
 */
router.post('/send', notificationController.sendNotification);

/**
 * 批量发送通知（管理员）
 * POST /api/v1/notifications/send-bulk
 */
router.post('/send-bulk', notificationController.sendBulkNotifications);

/**
 * 获取用户通知列表
 * GET /api/v1/notifications
 * Query: ?isRead=false&category=chat&limit=20&offset=0
 */
router.get('/', notificationController.getUserNotifications);

/**
 * 获取未读消息统计
 * GET /api/v1/notifications/unread-count
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * 标记通知已读
 * PUT /api/v1/notifications/:notificationId/read
 */
router.put('/:notificationId/read', notificationController.markAsRead);

/**
 * 批量标记已读
 * PUT /api/v1/notifications/read-all
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * 删除通知
 * DELETE /api/v1/notifications/:notificationId
 */
router.delete('/:notificationId', notificationController.deleteNotification);

// =====================================================
// 通知设置路由
// =====================================================

/**
 * 获取用户通知设置
 * GET /api/v1/notifications/settings
 */
router.get('/settings', notificationController.getUserSettings);

/**
 * 更新用户通知设置
 * PUT /api/v1/notifications/settings
 */
router.put('/settings', notificationController.updateUserSettings);

// =====================================================
// 通知模板路由
// =====================================================

/**
 * 获取通知模板
 * GET /api/v1/notifications/templates/:templateKey
 */
router.get('/templates/:templateKey', notificationController.getTemplate);

/**
 * 获取所有模板
 * GET /api/v1/notifications/templates
 * Query: ?userType=student
 */
router.get('/templates', notificationController.getAllTemplates);

export default router;
