"use strict";
/**
 * 任务草稿控制器
 *
 * 处理任务草稿相关的HTTP请求
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDraft = createDraft;
exports.getDrafts = getDrafts;
exports.getDraft = getDraft;
exports.updateDraft = updateDraft;
exports.deleteDraft = deleteDraft;
exports.duplicateDraft = duplicateDraft;
exports.reviewDraft = reviewDraft;
exports.getPricingSuggestion = getPricingSuggestion;
exports.publishDraft = publishDraft;
exports.getDraftHistory = getDraftHistory;
exports.restoreDraftVersion = restoreDraftVersion;
const taskDraftService_1 = require("../services/taskDraftService");
const logger_1 = __importDefault(require("../utils/logger"));
// =====================================================
// 类型定义
// =====================================================
// =====================================================
// 草稿CRUD接口
// =====================================================
/**
 * 创建新草稿
 * POST /api/v1/task-drafts
 */
async function createDraft(req, res) {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有企业可以创建草稿
        if (userRole !== 'company') {
            return res.status(403).json({ error: 'Only companies can create drafts' });
        }
        const draft = await taskDraftService_1.taskDraftService.createDraft({
            company_id: userId,
            ...req.body,
        });
        return res.status(201).json({
            success: true,
            data: draft,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to create draft', { error });
        return res.status(500).json({
            error: 'Failed to create draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取草稿列表
 * GET /api/v1/task-drafts
 */
async function getDrafts(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const status = req.query.status;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const result = await taskDraftService_1.taskDraftService.getDrafts(userId, {
            status,
            limit,
            offset,
        });
        return res.json({
            success: true,
            data: result.drafts,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get drafts', { error });
        return res.status(500).json({
            error: 'Failed to get drafts',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取草稿详情
 * GET /api/v1/task-drafts/:id
 */
async function getDraft(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const draft = await taskDraftService_1.taskDraftService.getDraft(id, userId);
        if (!draft) {
            return res.status(404).json({ error: 'Draft not found' });
        }
        return res.json({
            success: true,
            data: draft,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get draft', { error });
        return res.status(500).json({
            error: 'Failed to get draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 更新草稿
 * PUT /api/v1/task-drafts/:id
 */
async function updateDraft(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const draft = await taskDraftService_1.taskDraftService.updateDraft(id, userId, req.body);
        return res.json({
            success: true,
            data: draft,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to update draft', { error });
        return res.status(500).json({
            error: 'Failed to update draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 删除草稿
 * DELETE /api/v1/task-drafts/:id
 */
async function deleteDraft(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        await taskDraftService_1.taskDraftService.deleteDraft(id, userId);
        return res.json({
            success: true,
            message: 'Draft deleted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to delete draft', { error });
        return res.status(500).json({
            error: 'Failed to delete draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 复制草稿
 * POST /api/v1/task-drafts/:id/duplicate
 */
async function duplicateDraft(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const newDraft = await taskDraftService_1.taskDraftService.duplicateDraft(id, userId);
        return res.status(201).json({
            success: true,
            data: newDraft,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to duplicate draft', { error });
        return res.status(500).json({
            error: 'Failed to duplicate draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// AI辅助接口
// =====================================================
/**
 * AI审核草稿
 * POST /api/v1/task-drafts/:id/review
 */
async function reviewDraft(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const suggestions = await taskDraftService_1.taskDraftService.reviewDraftWithAI(id, userId);
        return res.json({
            success: true,
            data: suggestions,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to review draft', { error });
        return res.status(500).json({
            error: 'Failed to review draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取AI定价建议
 * POST /api/v1/task-drafts/:id/pricing-suggestion
 */
async function getPricingSuggestion(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const suggestion = await taskDraftService_1.taskDraftService.getPricingSuggestion(id, userId);
        return res.json({
            success: true,
            data: suggestion,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get pricing suggestion', { error });
        return res.status(500).json({
            error: 'Failed to get pricing suggestion',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 发布和历史接口
// =====================================================
/**
 * 发布草稿为正式任务
 * POST /api/v1/task-drafts/:id/publish
 */
async function publishDraft(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const taskId = await taskDraftService_1.taskDraftService.publishDraft(id, userId);
        return res.json({
            success: true,
            data: {
                task_id: taskId,
            },
            message: 'Draft published successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to publish draft', { error });
        return res.status(500).json({
            error: 'Failed to publish draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取草稿历史版本
 * GET /api/v1/task-drafts/:id/history
 */
async function getDraftHistory(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const history = await taskDraftService_1.taskDraftService.getDraftHistory(id, userId, limit);
        return res.json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get draft history', { error });
        return res.status(500).json({
            error: 'Failed to get draft history',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 恢复到历史版本
 * POST /api/v1/task-drafts/:id/restore/:historyId
 */
async function restoreDraftVersion(req, res) {
    try {
        const userId = req.user?.userId;
        const { id, historyId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const draft = await taskDraftService_1.taskDraftService.restoreDraftVersion(id, userId, historyId);
        return res.json({
            success: true,
            data: draft,
            message: 'Draft restored successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to restore draft version', { error });
        return res.status(500).json({
            error: 'Failed to restore draft version',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=taskDraftController.js.map