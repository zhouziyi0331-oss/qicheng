/**
 * AI定价API路由 - E-04功能
 * 提供智能定价建议
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import aiPricingService from '../../services/aiPricingService';
import logger from '../../utils/logger';

const router = Router();

/**
 * POST /api/tasks/ai-pricing
 * 计算AI定价建议
 */
router.post('/ai-pricing', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      required_skills,
      difficulty,
      estimated_hours,
      task_type,
      urgency
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'title and description are required',
      });
    }

    const pricingResult = await aiPricingService.calculatePrice({
      title,
      description,
      required_skills,
      difficulty,
      estimated_hours,
      task_type,
      urgency,
    });

    res.json({
      success: true,
      data: pricingResult,
    });
  } catch (error: unknown) {
    logger.error('Error calculating AI pricing:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate pricing',
    });
  }
});

/**
 * POST /api/tasks/:taskId/ai-pricing
 * 为已存在的任务计算定价
 */
router.post('/:taskId/ai-pricing', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { estimated_hours, urgency } = req.body;

    // TODO: 从数据库获取任务信息
    // 这里暂时使用请求体中的数据

    const taskFeatures = {
      title: req.body.title,
      description: req.body.description,
      required_skills: req.body.required_skills,
      difficulty: req.body.difficulty,
      estimated_hours,
      task_type: req.body.task_type,
      urgency,
    };

    const pricingResult = await aiPricingService.calculatePrice(taskFeatures);

    // 保存定价记录
    await aiPricingService.savePricingRecord(taskId, taskFeatures, pricingResult);

    res.json({
      success: true,
      data: pricingResult,
    });
  } catch (error: unknown) {
    logger.error('Error calculating task pricing:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate pricing',
    });
  }
});

export default router;
