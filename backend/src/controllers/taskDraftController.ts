/**
 * 任务草稿控制器
 *
 * 处理任务草稿相关的HTTP请求
 */

import { Request, Response } from 'express';
import { taskDraftService } from '../services/taskDraftService';
import logger from '../utils/logger';

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
export async function createDraft(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有企业可以创建草稿
    if (userRole !== 'company') {
      return res.status(403).json({ error: 'Only companies can create drafts' });
    }

    const draft = await taskDraftService.createDraft({
      company_id: userId,
      ...req.body,
    });

    return res.status(201).json({
      success: true,
      data: draft,
    });
  } catch (error: unknown) {
    logger.error('Failed to create draft', { error });
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
export async function getDrafts(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await taskDraftService.getDrafts(userId, {
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
  } catch (error: unknown) {
    logger.error('Failed to get drafts', { error });
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
export async function getDraft(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const draft = await taskDraftService.getDraft(id, userId);

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    return res.json({
      success: true,
      data: draft,
    });
  } catch (error: unknown) {
    logger.error('Failed to get draft', { error });
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
export async function updateDraft(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const draft = await taskDraftService.updateDraft(id, userId, req.body);

    return res.json({
      success: true,
      data: draft,
    });
  } catch (error: unknown) {
    logger.error('Failed to update draft', { error });
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
export async function deleteDraft(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await taskDraftService.deleteDraft(id, userId);

    return res.json({
      success: true,
      message: 'Draft deleted successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to delete draft', { error });
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
export async function duplicateDraft(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newDraft = await taskDraftService.duplicateDraft(id, userId);

    return res.status(201).json({
      success: true,
      data: newDraft,
    });
  } catch (error: unknown) {
    logger.error('Failed to duplicate draft', { error });
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
export async function reviewDraft(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const suggestions = await taskDraftService.reviewDraftWithAI(id, userId);

    return res.json({
      success: true,
      data: suggestions,
    });
  } catch (error: unknown) {
    logger.error('Failed to review draft', { error });
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
export async function getPricingSuggestion(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const suggestion = await taskDraftService.getPricingSuggestion(id, userId);

    return res.json({
      success: true,
      data: suggestion,
    });
  } catch (error: unknown) {
    logger.error('Failed to get pricing suggestion', { error });
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
export async function publishDraft(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const taskId = await taskDraftService.publishDraft(id, userId);

    return res.json({
      success: true,
      data: {
        task_id: taskId,
      },
      message: 'Draft published successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to publish draft', { error });
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
export async function getDraftHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await taskDraftService.getDraftHistory(id, userId, limit);

    return res.json({
      success: true,
      data: history,
    });
  } catch (error: unknown) {
    logger.error('Failed to get draft history', { error });
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
export async function restoreDraftVersion(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id, historyId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const draft = await taskDraftService.restoreDraftVersion(id, userId, historyId);

    return res.json({
      success: true,
      data: draft,
      message: 'Draft restored successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to restore draft version', { error });
    return res.status(500).json({
      error: 'Failed to restore draft version',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
