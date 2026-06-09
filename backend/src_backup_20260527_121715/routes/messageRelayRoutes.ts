/**
 * 消息中转路由
 *
 * 定义消息中转和联系方式交换的API路由
 */

import express from 'express';
import * as messageRelayController from '../controllers/messageRelayController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticateToken);

// =====================================================
// 消息中转路由
// =====================================================

/**
 * 发送消息（通过AI中转）
 * POST /api/relay/send
 */
router.post('/send', messageRelayController.sendMessage);

/**
 * 获取任务的中转消息
 * GET /api/relay/messages/:taskId
 */
router.get('/messages/:taskId', messageRelayController.getMessages);

/**
 * 获取消息统计（仅平台管理员）
 * GET /api/relay/statistics
 */
router.get('/statistics', messageRelayController.getStatistics);

/**
 * 获取违规记录（仅平台管理员）
 * GET /api/relay/violations
 */
router.get('/violations', messageRelayController.getViolations);

// =====================================================
// 联系方式交换路由
// =====================================================

/**
 * 同意交换联系方式
 * POST /api/relay/exchange/agree
 */
router.post('/exchange/agree', messageRelayController.agreeToExchange);

/**
 * 获取交换状态
 * GET /api/relay/exchange/status
 */
router.get('/exchange/status', messageRelayController.getExchangeStatus);

/**
 * 检查是否可以交换联系方式
 * GET /api/relay/exchange/can-exchange
 */
router.get('/exchange/can-exchange', messageRelayController.canExchange);

export default router;
