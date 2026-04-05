"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotifications = listNotifications;
exports.markAsRead = markAsRead;
exports.getUnreadCount = getUnreadCount;
const db_1 = require("../../utils/db");
// GET /notification
async function listNotifications(req, res, next) {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const notifications = await (0, db_1.query)(`SELECT id, type, title, body, is_read as "isRead",
              created_at as "createdAt", meta
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        res.json({ success: true, data: notifications });
    }
    catch (err) {
        next(err);
    }
}
// POST /notification/:id/read
async function markAsRead(req, res, next) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await (0, db_1.query)(`UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2`, [id, userId]);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
// GET /notification/unread-count
async function getUnreadCount(req, res, next) {
    try {
        const userId = req.user.userId;
        const result = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`, [userId]);
        res.json({ success: true, data: { count: parseInt(String(result[0]?.count || '0')) } });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map