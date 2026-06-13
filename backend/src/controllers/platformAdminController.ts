/**
 * 平台管理增强控制器
 *
 * 处理提现审核、用户认证、任务审核、风险预警等管理功能的HTTP请求
 */

import { Request, Response } from 'express';
import { platformAdminService } from '../services/platformAdminService';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// =====================================================
// 提现审核
// =====================================================

/**
 * 获取待审核提现列表
 * GET /api/v1/admin/platform/withdrawals/pending
 */
export async function getPendingWithdrawals(req: AuthRequest, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await platformAdminService.getPendingWithdrawals(limit, offset);

    return res.json({
      success: true,
      data: result.withdrawals,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: unknown) {
    logger.error('Failed to get pending withdrawals', { error });
    return res.status(500).json({
      error: 'Failed to get pending withdrawals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 批准提现
 * POST /api/v1/admin/platform/withdrawals/:id/approve
 */
export async function approveWithdrawal(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await platformAdminService.approveWithdrawal(id, adminId, reason);

    return res.json({
      success: true,
      data: result,
      message: 'Withdrawal approved successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to approve withdrawal', { error });
    return res.status(500).json({
      error: 'Failed to approve withdrawal',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 拒绝提现
 * POST /api/v1/admin/platform/withdrawals/:id/reject
 */
export async function rejectWithdrawal(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { reason, risk_level } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const result = await platformAdminService.rejectWithdrawal(id, adminId, reason, risk_level);

    return res.json({
      success: true,
      data: result,
      message: 'Withdrawal rejected successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to reject withdrawal', { error });
    return res.status(500).json({
      error: 'Failed to reject withdrawal',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 用户认证审核
// =====================================================

/**
 * 获取待审核用户认证列表
 * GET /api/v1/admin/platform/verifications/pending
 */
export async function getPendingVerifications(req: AuthRequest, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await platformAdminService.getPendingVerifications(limit, offset);

    return res.json({
      success: true,
      data: result.verifications,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: unknown) {
    logger.error('Failed to get pending verifications', { error });
    return res.status(500).json({
      error: 'Failed to get pending verifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 批准用户认证
 * POST /api/v1/admin/platform/verifications/:id/approve
 */
export async function approveVerification(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { note } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await platformAdminService.approveUserVerification(id, adminId, note);

    return res.json({
      success: true,
      data: result,
      message: 'User verification approved successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to approve verification', { error });
    return res.status(500).json({
      error: 'Failed to approve verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 拒绝用户认证
 * POST /api/v1/admin/platform/verifications/:id/reject
 */
export async function rejectVerification(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const result = await platformAdminService.rejectUserVerification(id, adminId, reason);

    return res.json({
      success: true,
      data: result,
      message: 'User verification rejected successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to reject verification', { error });
    return res.status(500).json({
      error: 'Failed to reject verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 任务审核
// =====================================================

/**
 * 审核任务
 * POST /api/v1/admin/platform/tasks/:id/review
 */
export async function reviewTask(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { review_type, status, issues, note } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!review_type || !status) {
      return res.status(400).json({ error: 'review_type and status are required' });
    }

    const result = await platformAdminService.reviewTask(
      id,
      adminId,
      review_type,
      status,
      issues,
      note
    );

    return res.json({
      success: true,
      data: result,
      message: `Task ${status} successfully`,
    });
  } catch (error: unknown) {
    logger.error('Failed to review task', { error });
    return res.status(500).json({
      error: 'Failed to review task',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 评价管理
// =====================================================

/**
 * 隐藏评价
 * POST /api/v1/admin/platform/ratings/:id/hide
 */
export async function hideRating(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const result = await platformAdminService.hideRating(id, adminId, reason);

    return res.json({
      success: true,
      data: result,
      message: 'Rating hidden successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to hide rating', { error });
    return res.status(500).json({
      error: 'Failed to hide rating',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 风险预警
// =====================================================

/**
 * 创建风险预警
 * POST /api/v1/admin/platform/risk-alerts
 */
export async function createRiskAlert(req: AuthRequest, res: Response) {
  try {
    const { alert_type, severity, entity_type, entity_id, reason, data } = req.body;

    if (!alert_type || !severity || !entity_type || !entity_id || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await platformAdminService.createRiskAlert(
      alert_type,
      severity,
      entity_type,
      entity_id,
      reason,
      data
    );

    return res.json({
      success: true,
      data: result,
      message: 'Risk alert created successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to create risk alert', { error });
    return res.status(500).json({
      error: 'Failed to create risk alert',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取风险预警列表
 * GET /api/v1/admin/platform/risk-alerts
 */
export async function getRiskAlerts(req: AuthRequest, res: Response) {
  try {
    const status = req.query.status as string;
    const severity = req.query.severity as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await platformAdminService.getRiskAlerts(status, severity, limit, offset);

    return res.json({
      success: true,
      data: result.alerts,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: unknown) {
    logger.error('Failed to get risk alerts', { error });
    return res.status(500).json({
      error: 'Failed to get risk alerts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 平台指标
// =====================================================

/**
 * 获取平台指标
 * GET /api/v1/admin/platform/metrics
 */
export async function getPlatformMetrics(req: AuthRequest, res: Response) {
  try {
    const startDate = new Date(req.query.start_date as string);
    const endDate = new Date(req.query.end_date as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const metrics = await platformAdminService.getPlatformMetrics(startDate, endDate);

    return res.json({
      success: true,
      data: metrics,
    });
  } catch (error: unknown) {
    logger.error('Failed to get platform metrics', { error });
    return res.status(500).json({
      error: 'Failed to get platform metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 计算每日指标
 * POST /api/v1/admin/platform/metrics/calculate
 */
export async function calculateDailyMetrics(req: AuthRequest, res: Response) {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    await platformAdminService.calculateDailyMetrics(targetDate);

    return res.json({
      success: true,
      message: 'Daily metrics calculated successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to calculate daily metrics', { error });
    return res.status(500).json({
      error: 'Failed to calculate daily metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 系统配置
// =====================================================

/**
 * 获取系统配置
 * GET /api/v1/admin/platform/config/:key
 */
export async function getSystemConfig(req: AuthRequest, res: Response) {
  try {
    const { key } = req.params;

    const config = await platformAdminService.getSystemConfig(key);

    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }

    return res.json({
      success: true,
      data: config,
    });
  } catch (error: unknown) {
    logger.error('Failed to get system config', { error });
    return res.status(500).json({
      error: 'Failed to get system config',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 更新系统配置
 * PUT /api/v1/admin/platform/config/:key
 */
export async function updateSystemConfig(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user?.id;
    const { key } = req.params;
    const { value } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const result = await platformAdminService.updateSystemConfig(key, value, adminId);

    return res.json({
      success: true,
      data: result,
      message: 'System config updated successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to update system config', { error });
    return res.status(500).json({
      error: 'Failed to update system config',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 待审核项目汇总
// =====================================================

/**
 * 获取所有待审核项目
 * GET /api/v1/admin/platform/pending-reviews
 */
export async function getPendingReviews(req: AuthRequest, res: Response) {
  try {
    const reviews = await platformAdminService.getPendingReviews();

    return res.json({
      success: true,
      data: reviews,
      total: reviews.length,
    });
  } catch (error: unknown) {
    logger.error('Failed to get pending reviews', { error });
    return res.status(500).json({
      error: 'Failed to get pending reviews',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
