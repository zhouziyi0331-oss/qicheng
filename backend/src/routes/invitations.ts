/**
 * 任务邀约路由
 *
 * 定向邀约系统的API端点
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as invitationController from '../controllers/invitationController';

const router = Router();

// ==========================================
// 学生端接口
// ==========================================

/**
 * 获取我的邀约列表
 * GET /api/v1/invitations/my-invitations
 */
router.get('/my-invitations', authenticate, invitationController.getMyInvitations);

/**
 * 获取邀约详情
 * GET /api/v1/invitations/:invitationId
 */
router.get('/:invitationId', authenticate, invitationController.getInvitationDetail);

/**
 * 接受邀约
 * POST /api/v1/invitations/:invitationId/accept
 */
router.post('/:invitationId/accept', authenticate, invitationController.acceptInvitation);

/**
 * AI能力核验
 * POST /api/v1/invitations/:invitationId/verify
 */
router.post('/:invitationId/verify', authenticate, invitationController.verifyCapability);

/**
 * 拒绝邀约
 * POST /api/v1/invitations/:invitationId/decline
 */
router.post('/:invitationId/decline', authenticate, invitationController.declineInvitation);

// ==========================================
// 管理员接口
// ==========================================

/**
 * 手动触发过期检查
 * POST /api/v1/invitations/expire-old
 */
router.post('/expire-old', authenticate, invitationController.expireOldInvitations);

// ==========================================
// 内部接口（供匹配引擎调用）
// ==========================================

/**
 * 创建单个邀约
 * POST /api/v1/invitations/create
 */
router.post('/create', authenticate, invitationController.createInvitation);

/**
 * 批量创建邀约
 * POST /api/v1/invitations/batch-create
 */
router.post('/batch-create', authenticate, invitationController.batchCreateInvitations);

export default router;
