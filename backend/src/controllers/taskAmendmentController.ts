/**
 * 任务追加需求控制器
 *
 * 处理任务追加需求相关的HTTP请求
 */

import { Request, Response } from 'express';
import { taskAmendmentService } from '../services/taskAmendmentService';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================


// =====================================================
// 追加需求CRUD接口
// =====================================================

/**
 * 创建追加需求（企业）
 * POST /api/v1/task-amendments
 */
export async function createAmendment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有企业可以创建追加需求
    if (userRole !== 'company') {
      return res.status(403).json({ error: 'Only companies can create amendments' });
    }

    const {
      task_id,
      student_id,
      amendment_type,
      title,
      description,
      original_requirement,
      new_requirement,
      price_adjustment,
      adjustment_reason,
      deadline_extension_days,
      new_deadline,
    } = req.body;

    if (!task_id || !student_id || !amendment_type || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const amendment = await taskAmendmentService.createAmendment({
      task_id,
      company_id: userId,
      student_id,
      amendment_type,
      title,
      description,
      original_requirement,
      new_requirement,
      price_adjustment,
      adjustment_reason,
      deadline_extension_days,
      new_deadline,
    });

    return res.status(201).json({
      success: true,
      data: amendment,
    });
  } catch (error: unknown) {
    logger.error('Failed to create amendment', { error });
    return res.status(500).json({
      error: 'Failed to create amendment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 学生响应追加需求
 * POST /api/v1/task-amendments/:id/respond
 */
export async function studentRespond(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有学生可以响应
    if (userRole !== 'student') {
      return res.status(403).json({ error: 'Only students can respond to amendments' });
    }

    const { response, counter_offer, action } = req.body;

    if (!response || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['accept', 'reject', 'negotiate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const amendment = await taskAmendmentService.studentRespond({
      amendment_id: id,
      student_id: userId,
      response,
      counter_offer,
      action,
    });

    return res.json({
      success: true,
      data: amendment,
    });
  } catch (error: unknown) {
    logger.error('Failed to respond to amendment', { error });
    return res.status(500).json({
      error: 'Failed to respond to amendment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 企业最终决定（协商后）
 * POST /api/v1/task-amendments/:id/decide
 */
export async function companyDecide(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有企业可以做最终决定
    if (userRole !== 'company') {
      return res.status(403).json({ error: 'Only companies can make final decisions' });
    }

    const { decision, comment } = req.body;

    if (!decision) {
      return res.status(400).json({ error: 'Missing decision' });
    }

    if (!['accept_student_offer', 'insist_original', 'cancel'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const amendment = await taskAmendmentService.companyFinalDecision({
      amendment_id: id,
      company_id: userId,
      decision,
      comment,
    });

    return res.json({
      success: true,
      data: amendment,
    });
  } catch (error: unknown) {
    logger.error('Failed to make final decision', { error });
    return res.status(500).json({
      error: 'Failed to make final decision',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 取消追加需求（企业主动取消）
 * POST /api/v1/task-amendments/:id/cancel
 */
export async function cancelAmendment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有企业可以取消
    if (userRole !== 'company') {
      return res.status(403).json({ error: 'Only companies can cancel amendments' });
    }

    const { reason } = req.body;

    await taskAmendmentService.cancelAmendment(id, userId, reason);

    return res.json({
      success: true,
      message: 'Amendment cancelled successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to cancel amendment', { error });
    return res.status(500).json({
      error: 'Failed to cancel amendment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 查询接口
// =====================================================

/**
 * 获取任务的所有追加需求
 * GET /api/v1/task-amendments/task/:taskId
 */
export async function getTaskAmendments(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const amendments = await taskAmendmentService.getTaskAmendments(taskId, userId);

    return res.json({
      success: true,
      data: amendments,
    });
  } catch (error: unknown) {
    logger.error('Failed to get task amendments', { error });
    return res.status(500).json({
      error: 'Failed to get task amendments',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取追加需求详情
 * GET /api/v1/task-amendments/:id
 */
export async function getAmendment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const amendment = await taskAmendmentService.getAmendment(id, userId);

    if (!amendment) {
      return res.status(404).json({ error: 'Amendment not found' });
    }

    return res.json({
      success: true,
      data: amendment,
    });
  } catch (error: unknown) {
    logger.error('Failed to get amendment', { error });
    return res.status(500).json({
      error: 'Failed to get amendment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// AI辅助接口
// =====================================================

/**
 * AI评估追加需求的合理性
 * POST /api/v1/task-amendments/:id/analyze
 */
export async function analyzeAmendment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 验证用户有权限查看此追加需求
    const amendment = await taskAmendmentService.getAmendment(id, userId);
    if (!amendment) {
      return res.status(404).json({ error: 'Amendment not found or unauthorized' });
    }

    const analysis = await taskAmendmentService.analyzeAmendmentFairness(id);

    return res.json({
      success: true,
      data: analysis,
    });
  } catch (error: unknown) {
    logger.error('Failed to analyze amendment', { error });
    return res.status(500).json({
      error: 'Failed to analyze amendment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
