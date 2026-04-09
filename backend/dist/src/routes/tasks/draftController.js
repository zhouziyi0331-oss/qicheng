"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDraft = exports.getSubmitDraft = exports.saveSubmitDraft = exports.getTaskDraft = exports.saveTaskDraft = void 0;
const db_1 = require("../../utils/db");
/**
 * 草稿箱控制器
 * 功能：任务发布草稿、任务提交草稿的自动保存和恢复
 */
// 保存任务发布草稿（企业端）
const saveTaskDraft = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { title, description, requirements, budget, level, track, tags, deadline } = req.body;
        // 检查是否已有草稿
        const existingDraft = await (0, db_1.query)('SELECT id FROM task_drafts WHERE user_id = $1 AND draft_type = $2', [userId, 'publish']);
        let result;
        if (existingDraft.length > 0) {
            // 更新现有草稿
            result = await (0, db_1.query)(`UPDATE task_drafts
         SET content = $1, updated_at = NOW()
         WHERE user_id = $2 AND draft_type = $3
         RETURNING id, updated_at`, [
                JSON.stringify({ title, description, requirements, budget, level, track, tags, deadline }),
                userId,
                'publish'
            ]);
        }
        else {
            // 创建新草稿
            result = await (0, db_1.query)(`INSERT INTO task_drafts (user_id, draft_type, content, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, updated_at`, [
                userId,
                'publish',
                JSON.stringify({ title, description, requirements, budget, level, track, tags, deadline })
            ]);
        }
        res.json({
            success: true,
            message: '草稿已自动保存',
            data: {
                draftId: result[0].id,
                savedAt: result[0].updated_at
            }
        });
    }
    catch (error) {
        console.error('保存草稿失败:', error);
        res.status(500).json({ success: false, message: '保存草稿失败' });
    }
};
exports.saveTaskDraft = saveTaskDraft;
// 获取任务发布草稿（企业端）
const getTaskDraft = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const result = await (0, db_1.query)(`SELECT id, content, updated_at
       FROM task_drafts
       WHERE user_id = $1 AND draft_type = $2
       ORDER BY updated_at DESC
       LIMIT 1`, [userId, 'publish']);
        if (result.length === 0) {
            return res.json({ success: true, data: null });
        }
        res.json({
            success: true,
            data: {
                draftId: result[0].id,
                content: result[0].content,
                savedAt: result[0].updated_at
            }
        });
    }
    catch (error) {
        console.error('获取草稿失败:', error);
        res.status(500).json({ success: false, message: '获取草稿失败' });
    }
};
exports.getTaskDraft = getTaskDraft;
// 保存任务提交草稿（学生端）
const saveSubmitDraft = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { taskId, content, attachments } = req.body;
        // 检查是否已有该任务的草稿
        const existingDraft = await (0, db_1.query)('SELECT id FROM task_drafts WHERE user_id = $1 AND draft_type = $2 AND task_id = $3', [userId, 'submit', taskId]);
        let result;
        if (existingDraft.length > 0) {
            // 更新现有草稿
            result = await (0, db_1.query)(`UPDATE task_drafts
         SET content = $1, updated_at = NOW()
         WHERE user_id = $2 AND draft_type = $3 AND task_id = $4
         RETURNING id, updated_at`, [
                JSON.stringify({ content, attachments }),
                userId,
                'submit',
                taskId
            ]);
        }
        else {
            // 创建新草稿
            result = await (0, db_1.query)(`INSERT INTO task_drafts (user_id, draft_type, task_id, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, updated_at`, [
                userId,
                'submit',
                taskId,
                JSON.stringify({ content, attachments })
            ]);
        }
        res.json({
            success: true,
            message: '草稿已自动保存',
            data: {
                draftId: result[0].id,
                savedAt: result[0].updated_at
            }
        });
    }
    catch (error) {
        console.error('保存提交草稿失败:', error);
        res.status(500).json({ success: false, message: '保存草稿失败' });
    }
};
exports.saveSubmitDraft = saveSubmitDraft;
// 获取任务提交草稿（学生端）
const getSubmitDraft = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { taskId } = req.params;
        const result = await (0, db_1.query)(`SELECT id, content, updated_at
       FROM task_drafts
       WHERE user_id = $1 AND draft_type = $2 AND task_id = $3
       ORDER BY updated_at DESC
       LIMIT 1`, [userId, 'submit', taskId]);
        if (result.length === 0) {
            return res.json({ success: true, data: null });
        }
        res.json({
            success: true,
            data: {
                draftId: result[0].id,
                content: result[0].content,
                savedAt: result[0].updated_at
            }
        });
    }
    catch (error) {
        console.error('获取提交草稿失败:', error);
        res.status(500).json({ success: false, message: '获取草稿失败' });
    }
};
exports.getSubmitDraft = getSubmitDraft;
// 删除草稿
const deleteDraft = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { draftId } = req.params;
        await (0, db_1.query)('DELETE FROM task_drafts WHERE id = $1 AND user_id = $2', [draftId, userId]);
        res.json({ success: true, message: '草稿已删除' });
    }
    catch (error) {
        console.error('删除草稿失败:', error);
        res.status(500).json({ success: false, message: '删除草稿失败' });
    }
};
exports.deleteDraft = deleteDraft;
//# sourceMappingURL=draftController.js.map