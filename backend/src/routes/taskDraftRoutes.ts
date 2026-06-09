/**
 * 任务草稿箱路由
 *
 * 定义任务草稿相关的API路由
 */

import express from 'express';
import * as taskDraftController from '../controllers/taskDraftController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticate);

// =====================================================
// 草稿CRUD路由
// =====================================================

/**
 * 创建新草稿
 * POST /api/v1/task-drafts
 */
router.post('/', taskDraftController.createDraft);

/**
 * 获取草稿列表
 * GET /api/v1/task-drafts
 */
router.get('/', taskDraftController.getDrafts);

/**
 * 获取草稿详情
 * GET /api/v1/task-drafts/:id
 */
router.get('/:id', taskDraftController.getDraft);

/**
 * 更新草稿
 * PUT /api/v1/task-drafts/:id
 */
router.put('/:id', taskDraftController.updateDraft);

/**
 * 删除草稿
 * DELETE /api/v1/task-drafts/:id
 */
router.delete('/:id', taskDraftController.deleteDraft);

/**
 * 复制草稿
 * POST /api/v1/task-drafts/:id/duplicate
 */
router.post('/:id/duplicate', taskDraftController.duplicateDraft);

// =====================================================
// AI辅助路由
// =====================================================

/**
 * AI审核草稿
 * POST /api/v1/task-drafts/:id/review
 */
router.post('/:id/review', taskDraftController.reviewDraft);

/**
 * 获取AI定价建议
 * POST /api/v1/task-drafts/:id/pricing-suggestion
 */
router.post('/:id/pricing-suggestion', taskDraftController.getPricingSuggestion);

// =====================================================
// 发布和历史路由
// =====================================================

/**
 * 发布草稿为正式任务
 * POST /api/v1/task-drafts/:id/publish
 */
router.post('/:id/publish', taskDraftController.publishDraft);

/**
 * 获取草稿历史版本
 * GET /api/v1/task-drafts/:id/history
 */
router.get('/:id/history', taskDraftController.getDraftHistory);

/**
 * 恢复到历史版本
 * POST /api/v1/task-drafts/:id/restore/:historyId
 */
router.post('/:id/restore/:historyId', taskDraftController.restoreDraftVersion);

export default router;
