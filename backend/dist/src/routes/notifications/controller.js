"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotifications = listNotifications;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
// GET /notifications
async function listNotifications(req, res, next) {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const offset = (page - 1) * limit;
        const notifications = await (0, db_1.query)(`SELECT id, type, title, content AS body, is_read, action_url, created_at
       FROM notifications
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        res.json({ success: true, data: notifications, meta: { page, limit } });
    }
    catch (err) {
        next(err);
    }
}
// PATCH /notifications/:id/read
async function markRead(req, res, next) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const n = await (0, db_1.queryOne)('SELECT id FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
        if (!n)
            throw new errorHandler_1.AppError(404, '通知不存在', 'NOT_FOUND');
        await (0, db_1.query)('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1', [id]);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
// PATCH /notifications/read-all
async function markAllRead(req, res, next) {
    try {
        const userId = req.user.userId;
        await (0, db_1.query)('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE', [userId]);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map