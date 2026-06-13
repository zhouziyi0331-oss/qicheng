import { Router, Request, Response } from 'express';
import taskExperienceService from '../../services/taskExperienceService';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * E-01d: 任务草稿箱
 */

// 保存草稿
router.post('/drafts', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const draft = await taskExperienceService.saveDraft({
      company_id: companyId,
      ...req.body,
    });

    res.json({
      success: true,
      data: draft,
      message: '草稿保存成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '保存草稿失败',
    });
  }
});

// 更新草稿
router.put('/drafts/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { id } = req.params;

    const draft = await taskExperienceService.updateDraft(id, companyId, req.body);

    res.json({
      success: true,
      data: draft,
      message: '草稿更新成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新草稿失败',
    });
  }
});

// 获取草稿列表
router.get('/drafts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const drafts = await taskExperienceService.getDrafts(companyId);

    res.json({
      success: true,
      data: drafts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取草稿列表失败',
    });
  }
});

// 删除草稿
router.delete('/drafts/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { id } = req.params;

    await taskExperienceService.deleteDraft(id, companyId);

    res.json({
      success: true,
      message: '草稿删除成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '删除草稿失败',
    });
  }
});

// 从草稿发布任务
router.post('/drafts/:id/publish', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { id } = req.params;

    const draft = await taskExperienceService.publishFromDraft(id, companyId);

    res.json({
      success: true,
      data: draft,
      message: '可以使用草稿数据发布任务',
    });
  } catch (error: any) {
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
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const templates = await taskExperienceService.getTemplates(category as string);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取模板列表失败',
    });
  }
});

// 获取模板详情
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await taskExperienceService.getTemplateById(id);

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取模板详情失败',
    });
  }
});

// 使用模板创建草稿
router.post('/templates/:id/use', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { id } = req.params;

    const draft = await taskExperienceService.createDraftFromTemplate(id, companyId, req.body);

    res.json({
      success: true,
      data: draft,
      message: '已根据模板创建草稿',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '使用模板失败',
    });
  }
});

// 获取分类列表
router.get('/templates/categories/list', async (req: Request, res: Response) => {
  try {
    const categories = await taskExperienceService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取分类列表失败',
    });
  }
});

// 搜索模板
router.get('/templates/search', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词',
      });
    }

    const templates = await taskExperienceService.searchTemplates(keyword as string);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
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
router.post('/budget-suggestion', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { task_category, task_description, required_skills, quality_expectation } = req.body;

    if (!task_category) {
      return res.status(400).json({
        success: false,
        message: '请提供任务分类',
      });
    }

    const suggestion = await taskExperienceService.suggestBudget(
      {
        task_category,
        task_description,
        required_skills,
        quality_expectation,
      },
      companyId
    );

    res.json({
      success: true,
      data: suggestion,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取预算建议失败',
    });
  }
});

export default router;
