/**
 * 任务追加需求路由
 *
 * 定义任务追加需求相关的API路由
 */

import express from 'express';
import * as taskAmendmentController from '../controllers/taskAmendmentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticateToken);

// =====================================================
// 追加需求CRUD路由
// =====================================================

/**
 * 创建追加需求（企业）
 * POST /api/v1/task-amendments
 */
router.post('/', taskAmendmentController.createAmendment);

/**
 * 学生响应追加需求
 * POST /api/v1/task-amendments/:id/respond
 */
router.post('/:id/respond', taskAmendmentController.studentRespond);

/**
 * 企业最终决定（协商后）
 * POST /api/v1/task-amendments/:id/decide
 */
router.post('/:id/decide', taskAmendmentController.companyDecide);

/**
 * 取消追加需求（企业主动取消）
 * POST /api/v1/task-amendments/:id/cancel
 */
router.post('/:id/cancel', taskAmendmentController.cancelAmendment);

// =====================================================
// 查询路由
// =====================================================

/**
 * 获取任务的所有追加需求
 * GET /api/v1/task-amendments/task/:taskId
 */
router.get('/task/:taskId', taskAmendmentController.getTaskAmendments);

/**
 * 获取追加需求详情
 * GET /api/v1/task-amendments/:id
 */
router.get('/:id', taskAmendmentController.getAmendment);

// =====================================================
// AI辅助路由
// =====================================================

/**
 * AI评估追加需求的合理性
 * POST /api/v1/task-amendments/:id/analyze
 */
router.post('/:id/analyze', taskAmendmentController.analyzeAmendment);

export default router;
