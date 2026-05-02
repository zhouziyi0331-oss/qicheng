"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStartupGuides = listStartupGuides;
exports.getStartupGuide = getStartupGuide;
exports.createStartupGuide = createStartupGuide;
exports.updateStartupGuide = updateStartupGuide;
exports.deleteStartupGuide = deleteStartupGuide;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
// GET /admin/startup-guides - 获取所有创业指南
async function listStartupGuides(req, res, next) {
    try {
        const guides = await (0, db_1.query)(`SELECT id, section, title, content, order_index, is_active, created_at, updated_at
       FROM startup_guides
       ORDER BY order_index ASC`, []);
        res.json({ success: true, data: guides });
    }
    catch (err) {
        next(err);
    }
}
// GET /admin/startup-guides/:id - 获取单个创业指南
async function getStartupGuide(req, res, next) {
    try {
        const { id } = req.params;
        const guide = await (0, db_1.queryOne)(`SELECT id, section, title, content, order_index, is_active, created_at, updated_at
       FROM startup_guides WHERE id = $1`, [id]);
        if (!guide) {
            throw new errorHandler_1.AppError(404, '创业指南不存在', 'GUIDE_NOT_FOUND');
        }
        res.json({ success: true, data: guide });
    }
    catch (err) {
        next(err);
    }
}
// POST /admin/startup-guides - 创建新的创业指南
async function createStartupGuide(req, res, next) {
    try {
        const { section, title, content, order_index = 0, is_active = true } = req.body;
        if (!section || !title || !content) {
            throw new errorHandler_1.AppError(400, '缺少必需字段', 'MISSING_FIELDS');
        }
        const result = await (0, db_1.queryOne)(`INSERT INTO startup_guides (section, title, content, order_index, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, section, title, content, order_index, is_active, created_at`, [section, title, content, order_index, is_active]);
        res.json({ success: true, data: result, message: '创业指南创建成功' });
    }
    catch (err) {
        next(err);
    }
}
// PUT /admin/startup-guides/:id - 更新创业指南
async function updateStartupGuide(req, res, next) {
    try {
        const { id } = req.params;
        const { section, title, content, order_index, is_active } = req.body;
        const guide = await (0, db_1.queryOne)('SELECT id FROM startup_guides WHERE id = $1', [id]);
        if (!guide) {
            throw new errorHandler_1.AppError(404, '创业指南不存在', 'GUIDE_NOT_FOUND');
        }
        const result = await (0, db_1.queryOne)(`UPDATE startup_guides
       SET section = COALESCE($1, section),
           title = COALESCE($2, title),
           content = COALESCE($3, content),
           order_index = COALESCE($4, order_index),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, section, title, content, order_index, is_active, updated_at`, [section, title, content, order_index, is_active, id]);
        res.json({ success: true, data: result, message: '创业指南更新成功' });
    }
    catch (err) {
        next(err);
    }
}
// DELETE /admin/startup-guides/:id - 删除创业指南
async function deleteStartupGuide(req, res, next) {
    try {
        const { id } = req.params;
        const guide = await (0, db_1.queryOne)('SELECT id FROM startup_guides WHERE id = $1', [id]);
        if (!guide) {
            throw new errorHandler_1.AppError(404, '创业指南不存在', 'GUIDE_NOT_FOUND');
        }
        await (0, db_1.query)('DELETE FROM startup_guides WHERE id = $1', [id]);
        res.json({ success: true, message: '创业指南删除成功' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=startupGuidesController.js.map