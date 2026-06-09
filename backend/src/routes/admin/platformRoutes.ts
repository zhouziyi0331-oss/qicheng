/**
 * 平台管理增强路由
 *
 * 定义提现审核、用户认证、任务审核、风险预警等管理功能的API路由
 */

import express from 'express';
import * as platformAdminController from '../../controllers/platformAdminController';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要管理员认证
// =====================================================
router.use(authenticate);

// =====================================================
// 提现审核路由
// =====================================================

/**
 * 获取待审核提现列表
 * GET /api/v1/admin/platform/withdrawals/pending
 */
router.get('/withdrawals/pending', platformAdminController.getPendingWithdrawals);

/**
 * 批准提现
 * POST /api/v1/admin/platform/withdrawals/:id/approve
 */
router.post('/withdrawals/:id/approve', platformAdminController.approveWithdrawal);

/**
 * 拒绝提现
 * POST /api/v1/admin/platform/withdrawals/:id/reject
 */
router.post('/withdrawals/:id/reject', platformAdminController.rejectWithdrawal);

// =====================================================
// 用户认证审核路由
// =====================================================

/**
 * 获取待审核用户认证列表
 * GET /api/v1/admin/platform/verifications/pending
 */
router.get('/verifications/pending', platformAdminController.getPendingVerifications);

/**
 * 批准用户认证
 * POST /api/v1/admin/platform/verifications/:id/approve
 */
router.post('/verifications/:id/approve', platformAdminController.approveVerification);

/**
 * 拒绝用户认证
 * POST /api/v1/admin/platform/verifications/:id/reject
 */
router.post('/verifications/:id/reject', platformAdminController.rejectVerification);

// =====================================================
// 任务审核路由
// =====================================================

/**
 * 审核任务
 * POST /api/v1/admin/platform/tasks/:id/review
 */
router.post('/tasks/:id/review', platformAdminController.reviewTask);

// =====================================================
// 评价管理路由
// =====================================================

/**
 * 隐藏评价
 * POST /api/v1/admin/platform/ratings/:id/hide
 */
router.post('/ratings/:id/hide', platformAdminController.hideRating);

// =====================================================
// 风险预警路由
// =====================================================

/**
 * 创建风险预警
 * POST /api/v1/admin/platform/risk-alerts
 */
router.post('/risk-alerts', platformAdminController.createRiskAlert);

/**
 * 获取风险预警列表
 * GET /api/v1/admin/platform/risk-alerts
 */
router.get('/risk-alerts', platformAdminController.getRiskAlerts);

// =====================================================
// 平台指标路由
// =====================================================

/**
 * 获取平台指标
 * GET /api/v1/admin/platform/metrics
 */
router.get('/metrics', platformAdminController.getPlatformMetrics);

/**
 * 计算每日指标
 * POST /api/v1/admin/platform/metrics/calculate
 */
router.post('/metrics/calculate', platformAdminController.calculateDailyMetrics);

// =====================================================
// 系统配置路由
// =====================================================

/**
 * 获取系统配置
 * GET /api/v1/admin/platform/config/:key
 */
router.get('/config/:key', platformAdminController.getSystemConfig);

/**
 * 更新系统配置
 * PUT /api/v1/admin/platform/config/:key
 */
router.put('/config/:key', platformAdminController.updateSystemConfig);

// =====================================================
// 待审核项目汇总路由
// =====================================================

/**
 * 获取所有待审核项目
 * GET /api/v1/admin/platform/pending-reviews
 */
router.get('/pending-reviews', platformAdminController.getPendingReviews);

export default router;
