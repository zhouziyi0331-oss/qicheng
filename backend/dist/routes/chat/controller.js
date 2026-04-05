"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
// GET /chat/:taskId/messages
async function getMessages(req, res, next) {
    try {
        const userId = req.user.userId;
        const { taskId } = req.params;
        // 验证用户有权查看此任务的沟通
        const access = await (0, db_1.queryOne)(`SELECT 1 FROM tasks t
       WHERE t.id = $1 AND (
         t.company_id = $2 OR
         EXISTS (SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id AND ta.student_id = $2)
       )`, [taskId, userId]);
        if (!access)
            throw new errorHandler_1.AppError(403, '无权查看此任务', 'FORBIDDEN');
        // 检查联系方式解锁状态
        const unlock = await (0, db_1.queryOne)(`SELECT cu.id FROM contact_unlocks cu
       JOIN tasks t ON t.id = $1
       WHERE cu.student_id = $2 AND cu.company_id = t.company_id`, [taskId, userId]);
        const messages = await (0, db_1.query)(`SELECT id, sender_type, content, is_filtered, created_at
       FROM chat_messages
       WHERE task_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`, [taskId]);
        res.json({
            success: true,
            data: messages,
            meta: { contactUnlocked: !!unlock },
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /chat/:taskId/messages
// contactFilterMiddleware 已在路由层处理联系方式过滤
async function sendMessage(req, res, next) {
    try {
        const userId = req.user.userId;
        const { taskId } = req.params;
        const { content, originalContent, isFiltered } = req.body;
        if (!content?.trim())
            throw new errorHandler_1.AppError(400, '消息内容不能为空', 'EMPTY_CONTENT');
        const [msg] = await (0, db_1.query)(`INSERT INTO chat_messages
        (task_id, sender_id, sender_type, content, is_filtered, original_content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`, [
            taskId, userId, req.user.role,
            content.trim(), isFiltered || false,
            isFiltered ? (originalContent || null) : null,
        ]);
        res.status(201).json({
            success: true,
            data: {
                messageId: msg.id,
                wasFiltered: isFiltered || false,
                filterNotice: isFiltered
                    ? '消息中的联系方式已被屏蔽。完成2单合作后可解锁直接联系。'
                    : null,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map