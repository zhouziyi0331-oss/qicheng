"use strict";
/**
 * 交付标准模板API路由 - E-02功能
 * 提供模板管理和应用相关的API端点
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const deliverableTemplateService_1 = __importDefault(require("../../services/deliverableTemplateService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const router = (0, express_1.Router)();
/**
 * GET /api/tasks/deliverable-templates
 * 获取交付标准模板列表
 */
router.get('/deliverable-templates', auth_1.authenticate, async (req, res) => {
    try {
        const { category, task_type, is_official, limit = 50 } = req.query;
        const templates = await deliverableTemplateService_1.default.getTemplates({
            category: category,
            task_type: task_type,
            is_public: true,
            is_official: is_official === 'true' ? true : undefined,
        }, Number(limit));
        res.json({
            success: true,
            data: {
                templates,
                total: templates.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting templates:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get templates',
        });
    }
});
/**
 * GET /api/tasks/deliverable-templates/categories
 * 获取模板分类列表
 */
router.get('/deliverable-templates/categories', auth_1.authenticate, async (req, res) => {
    try {
        const categories = await deliverableTemplateService_1.default.getCategories();
        res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get categories',
        });
    }
});
/**
 * GET /api/tasks/deliverable-templates/task-types
 * 获取任务类型列表
 */
router.get('/deliverable-templates/task-types', auth_1.authenticate, async (req, res) => {
    try {
        const { category } = req.query;
        const taskTypes = await deliverableTemplateService_1.default.getTaskTypes(category);
        res.json({
            success: true,
            data: taskTypes,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting task types:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get task types',
        });
    }
});
/**
 * POST /api/tasks/deliverable-templates/recommend
 * 根据任务描述推荐模板
 */
router.post('/deliverable-templates/recommend', auth_1.authenticate, async (req, res) => {
    try {
        const { taskDescription } = req.body;
        if (!taskDescription) {
            return res.status(400).json({
                success: false,
                error: 'taskDescription is required',
            });
        }
        const templates = await deliverableTemplateService_1.default.recommendTemplates(taskDescription, 5);
        res.json({
            success: true,
            data: {
                templates,
                total: templates.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error recommending templates:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to recommend templates',
        });
    }
});
/**
 * GET /api/tasks/deliverable-templates/:templateId
 * 获取单个模板详情
 */
router.get('/deliverable-templates/:templateId', auth_1.authenticate, async (req, res) => {
    try {
        const { templateId } = req.params;
        const template = await deliverableTemplateService_1.default.getTemplate(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found',
            });
        }
        res.json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting template:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get template',
        });
    }
});
/**
 * POST /api/tasks/deliverable-templates
 * 创建新的交付标准模板（企业或管理员）
 */
router.post('/deliverable-templates', auth_1.authenticate, async (req, res) => {
    try {
        const { name, description, category, task_type, standards, checklist, example_files, is_public } = req.body;
        if (!name || !standards || !checklist) {
            return res.status(400).json({
                success: false,
                error: 'name, standards, and checklist are required',
            });
        }
        const templateId = await deliverableTemplateService_1.default.createTemplate({
            name,
            description,
            category,
            task_type,
            standards,
            checklist,
            example_files,
            is_public,
            is_official: req.user?.role === 'admin',
        }, req.user.userId);
        res.json({
            success: true,
            data: {
                templateId,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error creating template:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create template',
        });
    }
});
/**
 * PUT /api/tasks/deliverable-templates/:templateId
 * 更新模板（仅创建者或管理员）
 */
router.put('/deliverable-templates/:templateId', auth_1.authenticate, async (req, res) => {
    try {
        const { templateId } = req.params;
        const updates = req.body;
        // TODO: 验证权限（仅创建者或管理员可以修改）
        await deliverableTemplateService_1.default.updateTemplate(templateId, updates);
        res.json({
            success: true,
            message: 'Template updated',
        });
    }
    catch (error) {
        logger_1.default.error('Error updating template:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update template',
        });
    }
});
/**
 * POST /api/tasks/:taskId/apply-template
 * 为任务应用交付标准模板
 */
router.post('/:taskId/apply-template', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { taskId } = req.params;
        const { templateId, customizations } = req.body;
        if (!templateId) {
            return res.status(400).json({
                success: false,
                error: 'templateId is required',
            });
        }
        await deliverableTemplateService_1.default.applyTemplateToTask(taskId, templateId, req.user.userId, customizations);
        res.json({
            success: true,
            message: 'Template applied to task',
        });
    }
    catch (error) {
        logger_1.default.error('Error applying template:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to apply template',
        });
    }
});
/**
 * GET /api/tasks/:taskId/deliverable-standards
 * 获取任务的交付标准
 */
router.get('/:taskId/deliverable-standards', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const standards = await deliverableTemplateService_1.default.getTaskDeliverableStandards(taskId);
        if (!standards) {
            return res.status(404).json({
                success: false,
                error: 'No deliverable standards found for this task',
            });
        }
        res.json({
            success: true,
            data: standards,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting deliverable standards:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get deliverable standards',
        });
    }
});
exports.default = router;
//# sourceMappingURL=deliverable-templates.js.map