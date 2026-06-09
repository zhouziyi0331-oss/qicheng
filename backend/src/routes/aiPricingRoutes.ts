/**
 * AI智能定价路由
 *
 * 定义AI智能定价相关的API路由
 */

import express from 'express';
import * as aiPricingController from '../controllers/aiPricingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticate);

// =====================================================
// 定价建议路由
// =====================================================

/**
 * 获取智能定价建议
 * POST /api/v1/ai-pricing/suggest
 */
router.post('/suggest', aiPricingController.getPricingSuggestion);

/**
 * 保存定价历史（任务发布时调用）
 * POST /api/v1/ai-pricing/save-history
 */
router.post('/save-history', aiPricingController.savePricingHistory);

/**
 * 记录定价调整
 * POST /api/v1/ai-pricing/record-adjustment
 */
router.post('/record-adjustment', aiPricingController.recordAdjustment);

// =====================================================
// 分析和统计路由（管理员）
// =====================================================

/**
 * 获取定价准确度分析
 * GET /api/v1/ai-pricing/accuracy
 */
router.get('/accuracy', aiPricingController.getPricingAccuracy);

/**
 * 手动更新市场基准价格
 * POST /api/v1/ai-pricing/update-benchmarks
 */
router.post('/update-benchmarks', aiPricingController.updateBenchmarks);

export default router;
