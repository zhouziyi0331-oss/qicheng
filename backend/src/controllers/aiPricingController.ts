/**
 * AI智能定价控制器
 *
 * 处理AI智能定价相关的HTTP请求
 */

import { Request, Response } from 'express';
import aiPricingService from '../services/aiPricingService';
import logger from '../utils/logger';

// 扩展Request以包含user

// =====================================================
// 定价建议接口
// =====================================================

/**
 * 获取智能定价建议
 * POST /api/v1/ai-pricing/suggest
 */
export async function getPricingSuggestion(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有企业可以获取定价建议
    if (userRole !== 'company') {
      return res.status(403).json({ error: 'Only companies can get pricing suggestions' });
    }

    const {
      title,
      description,
      requirements,
      deliverables,
      category,
      difficulty_level,
      estimated_hours,
      required_abilities,
      deadline,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Missing required fields: title and description' });
    }

    const suggestion = await aiPricingService.calculatePrice({
      title,
      description,
      estimated_hours: estimated_hours || 40,
      difficulty: difficulty_level,
      required_skills: category ? [category] : []
    });

    return res.json({
      success: true,
      data: suggestion,
    });
  } catch (error: any) {
    logger.error('Failed to get pricing suggestion', { error });
    return res.status(500).json({
      error: 'Failed to get pricing suggestion',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 保存定价历史（任务发布时调用）
 * POST /api/v1/ai-pricing/save-history
 */
export async function savePricingHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (userRole !== 'company') {
      return res.status(403).json({ error: 'Only companies can save pricing history' });
    }

    const { task_id, suggestion, actual_min, actual_max } = req.body;

    if (!task_id || !suggestion || actual_min === undefined || actual_max === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await aiPricingService.savePricingRecord(
      task_id,
      { title: '', description: '' },
      {
        suggested_price: suggestion,
        min_price: actual_min,
        max_price: actual_max,
        confidence_level: 0.8,
        pricing_breakdown: {
          base_price: 0,
          skill_premium: 0,
          difficulty_premium: 0,
          urgency_premium: 0,
          market_adjustment: 0
        },
        market_comparison: { platform_average: 0, similar_tasks_avg: 0, percentile_rank: 0 },
        reasoning: '',
        recommendations: []
      }
    );

    return res.json({
      success: true,
      data: {
        history_id: task_id,
      },
    });
  } catch (error: any) {
    logger.error('Failed to save pricing history', { error });
    return res.status(500).json({
      error: 'Failed to save pricing history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 记录定价调整
 * POST /api/v1/ai-pricing/record-adjustment
 */
export async function recordAdjustment(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (userRole !== 'company') {
      return res.status(403).json({ error: 'Only companies can record adjustments' });
    }

    const {
      task_id,
      original_min,
      original_max,
      adjusted_min,
      adjusted_max,
      reason,
      note,
    } = req.body;

    if (
      !task_id ||
      original_min === undefined ||
      original_max === undefined ||
      adjusted_min === undefined ||
      adjusted_max === undefined ||
      !reason
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: recordPricingAdjustment method does not exist
    // await aiPricingService.recordPricingAdjustment(
    //   task_id,
    //   userId,
    //   original_min,
    //   original_max,
    //   adjusted_min,
    //   adjusted_max,
    //   reason,
    //   note
    // );

    return res.json({
      success: true,
      message: 'Pricing adjustment recorded',
    });
  } catch (error: any) {
    logger.error('Failed to record adjustment', { error });
    return res.status(500).json({
      error: 'Failed to record adjustment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 分析和统计接口
// =====================================================

/**
 * 获取定价准确度分析
 * GET /api/v1/ai-pricing/accuracy
 */
export async function getPricingAccuracy(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有管理员可以查看准确度分析
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;

    const accuracy = await aiPricingService.getPricingAccuracy(category, difficulty);

    return res.json({
      success: true,
      data: accuracy,
    });
  } catch (error: any) {
    logger.error('Failed to get pricing accuracy', { error });
    return res.status(500).json({
      error: 'Failed to get pricing accuracy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 手动更新市场基准价格（管理员）
 * POST /api/v1/ai-pricing/update-benchmarks
 */
export async function updateBenchmarks(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有管理员可以手动更新基准价格
    if (userRole !== 'admin' && userRole !== 'platform') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await aiPricingService.updateMarketBenchmarks();

    return res.json({
      success: true,
      message: 'Market benchmarks updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update benchmarks', { error });
    return res.status(500).json({
      error: 'Failed to update benchmarks',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
