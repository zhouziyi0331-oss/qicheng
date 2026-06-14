/**
 * 消息中转控制器
 *
 * 处理消息中转和联系方式交换的HTTP请求
 */

import { Request, Response } from 'express';
import { messageRelayService } from '../services/messageRelayService';
import { contactExchangeService } from '../services/contactExchangeService';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================


// =====================================================
// 消息中转接口
// =====================================================

/**
 * 发送消息（通过AI中转）
 *
 * POST /api/relay/send
 *
 * Body:
 * {
 *   taskId: string;
 *   receiverId: string;
 *   content: string;
 * }
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const { taskId, receiverId, content } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!taskId || !receiverId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 调用消息中转服务
    const result = await messageRelayService.relayMessage(
      senderId,
      receiverId,
      taskId,
      content
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    logger.error('Failed to send message:', error);
    return res.status(500).json({
      error: 'Failed to send message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取任务的中转消息
 *
 * GET /api/relay/messages/:taskId
 *
 * Query:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function getMessages(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!taskId) {
      return res.status(400).json({ error: 'Missing taskId' });
    }

    // 获取消息列表
    const messages = await messageRelayService.getMessages(taskId, userId, limit, offset);

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error: unknown) {
    logger.error('Failed to get messages:', error);
    return res.status(500).json({
      error: 'Failed to get messages',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取消息统计
 *
 * GET /api/relay/statistics
 *
 * Query:
 * - studentId: string (optional)
 * - companyId: string (optional)
 * - startDate: string (optional)
 * - endDate: string (optional)
 */
export async function getStatistics(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有平台管理员可以查看统计
    if (userRole !== 'admin' && userRole !== 'platform') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { studentId, companyId, startDate, endDate } = req.query;

    const statistics = await messageRelayService.getStatistics({
      studentId: studentId as string,
      companyId: companyId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return res.json({
      success: true,
      data: statistics,
    });
  } catch (error: unknown) {
    logger.error('Failed to get statistics:', error);
    return res.status(500).json({
      error: 'Failed to get statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取违规记录
 *
 * GET /api/relay/violations
 *
 * Query:
 * - userId: string (optional)
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export async function getViolations(req: Request, res: Response) {
  try {
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有平台管理员可以查看违规记录
    if (userRole !== 'admin' && userRole !== 'platform') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const violations = await messageRelayService.getViolations(userId, limit, offset);

    return res.json({
      success: true,
      data: violations,
    });
  } catch (error: unknown) {
    logger.error('Failed to get violations:', error);
    return res.status(500).json({
      error: 'Failed to get violations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 联系方式交换接口
// =====================================================

/**
 * 同意交换联系方式
 *
 * POST /api/relay/exchange/agree
 *
 * Body:
 * {
 *   studentId: string;
 *   companyId: string;
 * }
 */
export async function agreeToExchange(req: Request, res: Response) {
  try {
    const { studentId, companyId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!studentId || !companyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 验证用户是否是学生或企业之一
    if (userId !== studentId && userId !== companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await contactExchangeService.agreeToExchange(
      userId,
      studentId,
      companyId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    logger.error('Failed to agree to exchange:', error);
    return res.status(500).json({
      error: 'Failed to agree to exchange',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取交换状态
 *
 * GET /api/relay/exchange/status
 *
 * Query:
 * - studentId: string
 * - companyId: string
 */
export async function getExchangeStatus(req: Request, res: Response) {
  try {
    const { studentId, companyId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!studentId || !companyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 验证用户是否是学生或企业之一
    if (userId !== studentId && userId !== companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const status = await contactExchangeService.getExchangeStatus(
      studentId as string,
      companyId as string
    );

    return res.json({
      success: true,
      data: status,
    });
  } catch (error: unknown) {
    logger.error('Failed to get exchange status:', error);
    return res.status(500).json({
      error: 'Failed to get exchange status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 检查是否可以交换联系方式
 *
 * GET /api/relay/exchange/can-exchange
 *
 * Query:
 * - studentId: string
 * - companyId: string
 */
export async function canExchange(req: Request, res: Response) {
  try {
    const { studentId, companyId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!studentId || !companyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 验证用户是否是学生或企业之一
    if (userId !== studentId && userId !== companyId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const canExchangeResult = await contactExchangeService.canExchange(
      studentId as string,
      companyId as string
    );

    return res.json({
      success: true,
      data: {
        canExchange: canExchangeResult,
      },
    });
  } catch (error: unknown) {
    logger.error('Failed to check exchange eligibility:', error);
    return res.status(500).json({
      error: 'Failed to check exchange eligibility',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
