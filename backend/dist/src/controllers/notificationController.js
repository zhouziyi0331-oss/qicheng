"use strict";
/**
 * 通知消息控制器
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.sendBulkNotifications = sendBulkNotifications;
exports.getUserNotifications = getUserNotifications;
exports.getUnreadCount = getUnreadCount;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.deleteNotification = deleteNotification;
exports.getUserSettings = getUserSettings;
exports.updateUserSettings = updateUserSettings;
exports.getTemplate = getTemplate;
exports.getAllTemplates = getAllTemplates;
const notificationService_1 = require("../services/notificationService");
const logger_1 = __importDefault(require("../utils/logger"));
// =====================================================
// 通知管理
// =====================================================
/**
 * 发送通知
 */
async function sendNotification(req, res) {
    try {
        const { userId, templateKey, variables, relatedTaskId, relatedUserId, scheduledAt } = req.body;
        if (!userId || !templateKey) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数',
            });
        }
        const notification = await notificationService_1.notificationService.sendNotification({
            userId,
            templateKey,
            variables,
            relatedTaskId,
            relatedUserId,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        });
        res.json({
            success: true,
            message: '通知发送成功',
            data: notification,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to send notification', { error });
        res.status(500).json({
            success: false,
            message: '发送通知失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 批量发送通知
 */
async function sendBulkNotifications(req, res) {
    try {
        const { notifications } = req.body;
        if (!Array.isArray(notifications) || notifications.length === 0) {
            return res.status(400).json({
                success: false,
                message: '通知列表不能为空',
            });
        }
        const results = await notificationService_1.notificationService.sendBulkNotifications(notifications);
        res.json({
            success: true,
            message: `成功发送 ${results.length} 条通知`,
            data: results,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to send bulk notifications', { error });
        res.status(500).json({
            success: false,
            message: '批量发送通知失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取用户通知列表
 */
async function getUserNotifications(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '未授权',
            });
        }
        const { isRead, category, limit = 20, offset = 0 } = req.query;
        const result = await notificationService_1.notificationService.getUserNotifications(userId, {
            isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
            category: category,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        res.json({
            success: true,
            data: result.notifications,
            pagination: {
                total: result.total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get user notifications', { error });
        res.status(500).json({
            success: false,
            message: '获取通知列表失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取未读消息统计
 */
async function getUnreadCount(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '未授权',
            });
        }
        const stats = await notificationService_1.notificationService.getUnreadCount(userId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get unread count', { error });
        res.status(500).json({
            success: false,
            message: '获取未读统计失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 标记通知已读
 */
async function markAsRead(req, res) {
    try {
        const { notificationId } = req.params;
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: '缺少通知ID',
            });
        }
        const success = await notificationService_1.notificationService.markAsRead(notificationId);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: '通知不存在或已读',
            });
        }
        res.json({
            success: true,
            message: '标记已读成功',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to mark notification as read', { error });
        res.status(500).json({
            success: false,
            message: '标记已读失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 批量标记已读
 */
async function markAllAsRead(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '未授权',
            });
        }
        const count = await notificationService_1.notificationService.markAllAsRead(userId);
        res.json({
            success: true,
            message: `成功标记 ${count} 条通知为已读`,
            data: { count },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to mark all as read', { error });
        res.status(500).json({
            success: false,
            message: '批量标记已读失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 删除通知
 */
async function deleteNotification(req, res) {
    try {
        const { notificationId } = req.params;
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: '缺少通知ID',
            });
        }
        const success = await notificationService_1.notificationService.deleteNotification(notificationId);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: '通知不存在',
            });
        }
        res.json({
            success: true,
            message: '删除通知成功',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to delete notification', { error });
        res.status(500).json({
            success: false,
            message: '删除通知失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 通知设置
// =====================================================
/**
 * 获取用户通知设置
 */
async function getUserSettings(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '未授权',
            });
        }
        const settings = await notificationService_1.notificationService.getUserSettings(userId);
        res.json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get user settings', { error });
        res.status(500).json({
            success: false,
            message: '获取通知设置失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 更新用户通知设置
 */
async function updateUserSettings(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '未授权',
            });
        }
        const settings = await notificationService_1.notificationService.updateUserSettings(userId, req.body);
        res.json({
            success: true,
            message: '更新通知设置成功',
            data: settings,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to update user settings', { error });
        res.status(500).json({
            success: false,
            message: '更新通知设置失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 通知模板
// =====================================================
/**
 * 获取通知模板
 */
async function getTemplate(req, res) {
    try {
        const { templateKey } = req.params;
        if (!templateKey) {
            return res.status(400).json({
                success: false,
                message: '缺少模板Key',
            });
        }
        const template = await notificationService_1.notificationService.getTemplate(templateKey);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: '模板不存在',
            });
        }
        res.json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get template', { error });
        res.status(500).json({
            success: false,
            message: '获取模板失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取所有模板
 */
async function getAllTemplates(req, res) {
    try {
        const { userType } = req.query;
        const templates = await notificationService_1.notificationService.getAllTemplates(userType);
        res.json({
            success: true,
            data: templates,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get all templates', { error });
        res.status(500).json({
            success: false,
            message: '获取模板列表失败',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=notificationController.js.map