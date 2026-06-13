"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskExperienceService_1 = __importDefault(require("../../services/taskExperienceService"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * E-01d: 任务草稿箱
 */
// 保存草稿
router.post('/drafts', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const draft = await taskExperienceService_1.default.saveDraft({
            company_id: companyId,
            ...req.body,
        });
        res.json({
            success: true,
            data: draft,
            message: '草稿保存成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '保存草稿失败',
        });
    }
});
// 更新草稿
router.put('/drafts/:id', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const { id } = req.params;
        const draft = await taskExperienceService_1.default.updateDraft(id, companyId, req.body);
        res.json({
            success: true,
            data: draft,
            message: '草稿更新成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '更新草稿失败',
        });
    }
});
// 获取草稿列表
router.get('/drafts', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const drafts = await taskExperienceService_1.default.getDrafts(companyId);
        res.json({
            success: true,
            data: drafts,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取草稿列表失败',
        });
    }
});
// 删除草稿
router.delete('/drafts/:id', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const { id } = req.params;
        await taskExperienceService_1.default.deleteDraft(id, companyId);
        res.json({
            success: true,
            message: '草稿删除成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '删除草稿失败',
        });
    }
});
// 从草稿发布任务
router.post('/drafts/:id/publish', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const { id } = req.params;
        const draft = await taskExperienceService_1.default.publishFromDraft(id, companyId);
        res.json({
            success: true,
            data: draft,
            message: '可以使用草稿数据发布任务',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取草稿失败',
        });
    }
});
/**
 * E-01a: 任务模板市场
 */
// 获取模板列表
router.get('/templates', async (req, res) => {
    try {
        const { category } = req.query;
        const templates = await taskExperienceService_1.default.getTemplates(category);
        res.json({
            success: true,
            data: templates,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取模板列表失败',
        });
    }
});
// 获取模板详情
router.get('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const template = await taskExperienceService_1.default.getTemplateById(id);
        res.json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取模板详情失败',
        });
    }
});
// 使用模板创建草稿
router.post('/templates/:id/use', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const { id } = req.params;
        const draft = await taskExperienceService_1.default.createDraftFromTemplate(id, companyId, req.body);
        res.json({
            success: true,
            data: draft,
            message: '已根据模板创建草稿',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '使用模板失败',
        });
    }
});
// 获取分类列表
router.get('/templates/categories/list', async (req, res) => {
    try {
        const categories = await taskExperienceService_1.default.getCategories();
        res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取分类列表失败',
        });
    }
});
// 搜索模板
router.get('/templates/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: '请提供搜索关键词',
            });
        }
        const templates = await taskExperienceService_1.default.searchTemplates(keyword);
        res.json({
            success: true,
            data: templates,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '搜索模板失败',
        });
    }
});
/**
 * E-01b: 预算智能建议
 */
// 获取预算建议
router.post('/budget-suggestion', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const { task_category, task_description, required_skills, quality_expectation } = req.body;
        if (!task_category) {
            return res.status(400).json({
                success: false,
                message: '请提供任务分类',
            });
        }
        const suggestion = await taskExperienceService_1.default.suggestBudget({
            task_category,
            task_description,
            required_skills,
            quality_expectation,
        }, companyId);
        res.json({
            success: true,
            data: suggestion,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取预算建议失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map