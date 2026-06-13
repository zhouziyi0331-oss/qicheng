/**
 * 交付标准模板API路由 - E-02功能
 * 提供模板管理和应用相关的API端点
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import deliverableTemplateService from '../../services/deliverableTemplateService';
import logger from '../../utils/logger';

const router = Router();

/**
 * GET /api/tasks/deliverable-templates
 * 获取交付标准模板列表
 */
router.get('/deliverable-templates', authenticate, async (req: Request, res: Response) => {
  try {
    const { category, task_type, is_official, limit = 50 } = req.query;

    const templates = await deliverableTemplateService.getTemplates(
      {
        category: category as string,
        task_type: task_type as string,
        is_public: true,
        is_official: is_official === 'true' ? true : undefined,
      },
      Number(limit)
    );

    res.json({
      success: true,
      data: {
        templates,
        total: templates.length,
      },
    });
  } catch (error) {
    logger.error('Error getting templates:', error);
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
router.get('/deliverable-templates/categories', authenticate, async (req: Request, res: Response) => {
  try {
    const categories = await deliverableTemplateService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error getting categories:', error);
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
router.get('/deliverable-templates/task-types', authenticate, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const taskTypes = await deliverableTemplateService.getTaskTypes(category as string);

    res.json({
      success: true,
      data: taskTypes,
    });
  } catch (error) {
    logger.error('Error getting task types:', error);
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
router.post('/deliverable-templates/recommend', authenticate, async (req: Request, res: Response) => {
  try {
    const { taskDescription } = req.body;

    if (!taskDescription) {
      return res.status(400).json({
        success: false,
        error: 'taskDescription is required',
      });
    }

    const templates = await deliverableTemplateService.recommendTemplates(taskDescription, 5);

    res.json({
      success: true,
      data: {
        templates,
        total: templates.length,
      },
    });
  } catch (error) {
    logger.error('Error recommending templates:', error);
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
router.get('/deliverable-templates/:templateId', authenticate, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = await deliverableTemplateService.getTemplate(templateId);

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
  } catch (error) {
    logger.error('Error getting template:', error);
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
router.post('/deliverable-templates', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, description, category, task_type, standards, checklist, example_files, is_public } = req.body;

    if (!name || !standards || !checklist) {
      return res.status(400).json({
        success: false,
        error: 'name, standards, and checklist are required',
      });
    }

    const templateId = await deliverableTemplateService.createTemplate(
      {
        name,
        description,
        category,
        task_type,
        standards,
        checklist,
        example_files,
        is_public,
        is_official: req.user?.role === 'admin',
      },
      req.user!.userId
    );

    res.json({
      success: true,
      data: {
        templateId,
      },
    });
  } catch (error) {
    logger.error('Error creating template:', error);
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
router.put('/deliverable-templates/:templateId', authenticate, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;

    // TODO: 验证权限（仅创建者或管理员可以修改）

    await deliverableTemplateService.updateTemplate(templateId, updates);

    res.json({
      success: true,
      message: 'Template updated',
    });
  } catch (error) {
    logger.error('Error updating template:', error);
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
router.post('/:taskId/apply-template', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { templateId, customizations } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId is required',
      });
    }

    await deliverableTemplateService.applyTemplateToTask(
      taskId,
      templateId,
      req.user!.userId,
      customizations
    );

    res.json({
      success: true,
      message: 'Template applied to task',
    });
  } catch (error) {
    logger.error('Error applying template:', error);
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
router.get('/:taskId/deliverable-standards', authenticate, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const standards = await deliverableTemplateService.getTaskDeliverableStandards(taskId);

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
  } catch (error) {
    logger.error('Error getting deliverable standards:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get deliverable standards',
    });
  }
});

export default router;
