"use strict";
/**
 * 通知控制器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.getUnreadCountHandler = getUnreadCountHandler;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.deleteNotification = deleteNotification;
exports.updateNotificationPreferences = updateNotificationPreferences;
exports.getNotificationPreferences = getNotificationPreferences;
const db_1 = require("../../utils/db");
const notification_1 = require("../../services/notification");
/**
 * 获取用户通知列表
 */
async function getNotifications(req, res) {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 20, type, isRead } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let queryStr = `
      SELECT id, type, title, content, data, priority, is_read, created_at, read_at
      FROM notifications
      WHERE user_id = $1
    `;
        const params = [userId];
        let paramIndex = 2;
        if (type) {
            queryStr += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        if (isRead !== undefined) {
            queryStr += ` AND is_read = $${paramIndex}`;
            params.push(isRead === 'true');
            paramIndex++;
        }
        queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(Number(limit), offset);
        const result = await (0, db_1.query)(queryStr, params);
        let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE user_id = $1`;
        const countParams = [userId];
        let countParamIndex = 2;
        if (type) {
            countQuery += ` AND type = $${countParamIndex}`;
            countParams.push(type);
            countParamIndex++;
        }
        if (isRead !== undefined) {
            countQuery += ` AND is_read = $${countParamIndex}`;
            countParams.push(isRead === 'true');
        }
        const countResult = await (0, db_1.query)(countQuery, countParams);
        const total = parseInt(String(countResult[0].total), 10);
        res.json({
            success: true,
            data: {
                notifications: result,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: '获取通知列表失败' });
    }
}
async function getUnreadCountHandler(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        const count = await (0, notification_1.getUnreadCount)(userId);
        res.json({ success: true, data: { unreadCount: count } });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, message: '获取未读数量失败' });
    }
}
async function markNotificationAsRead(req, res) {
    try {
        const userId = req.user?.userId;
        const { notificationId } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        await (0, notification_1.markAsRead)(notificationId, userId);
        res.json({ success: true, message: '已标记为已读' });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: '标记失败' });
    }
}
async function markAllNotificationsAsRead(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        await (0, notification_1.markAllAsRead)(userId);
        res.json({ success: true, message: '已全部标记为已读' });
    }
    catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, message: '标记失败' });
    }
}
async function deleteNotification(req, res) {
    try {
        const userId = req.user?.userId;
        const { notificationId } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        await (0, db_1.query)(`DELETE FROM notifications WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
        res.json({ success: true, message: '删除成功' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: '删除失败' });
    }
}
async function updateNotificationPreferences(req, res) {
    try {
        const userId = req.user?.userId;
        const { preferences } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({ success: false, message: '无效的偏好设置' });
        }
        await (0, db_1.query)(`UPDATE users SET notification_preferences = $1 WHERE id = $2`, [JSON.stringify(preferences), userId]);
        res.json({ success: true, message: '偏好设置已更新' });
    }
    catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ success: false, message: '更新失败' });
    }
}
async function getNotificationPreferences(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        const result = await (0, db_1.query)(`SELECT notification_preferences FROM users WHERE id = $1`, [userId]);
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        const preferences = result[0].notification_preferences || {
            in_app: true,
            sms: { task_matched: true, task_approved: true, payment_success: true, withdrawal_approved: true },
            email: { task_rejected: true, dispute_resolved: true, system_announcement: true },
            wechat: { task_matched: true, task_submitted: true, payment_success: true }
        };
        res.json({ success: true, data: { preferences } });
    }
    catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ success: false, message: '获取偏好设置失败' });
    }
}
//# sourceMappingURL=controller.js.map