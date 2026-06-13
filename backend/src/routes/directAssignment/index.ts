import express from 'express';
import logger from '../../utils/logger';
import directAssignmentService from '../../services/directAssignmentService';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/direct-assignment/invite
 * 企业创建定向邀请
 */
router.post('/invite', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以发送定向邀请',
      });
    }

    const {
      taskId,
      studentId,
      invitationMessage,
      offeredPrice,
      deadline,
      expiresInHours,
    } = req.body;

    if (!taskId || !studentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: taskId, studentId',
      });
    }

    const invitation = await directAssignmentService.createDirectInvitation({
      taskId,
      companyId,
      studentId,
      invitationMessage,
      offeredPrice,
      deadline: deadline ? new Date(deadline) : undefined,
      expiresInHours,
    });

    res.json({
      success: true,
      data: invitation,
      message: '邀请已发送',
    });
  } catch (error: any) {
    logger.error('创建定向邀请失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建邀请失败',
    });
  }
});

/**
 * POST /api/direct-assignment/invitations/:id/respond
 * 学生响应邀请
 */
router.post('/invitations/:id/respond', authenticate, async (req, res) => {
  try {
    const studentId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: '只有学生用户可以响应邀请',
      });
    }

    const { id: invitationId } = req.params;
    const { accept, message } = req.body;

    if (accept === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: accept',
      });
    }

    const invitation = await directAssignmentService.respondToInvitation(
      invitationId,
      studentId,
      { accept, message }
    );

    res.json({
      success: true,
      data: invitation,
      message: accept ? '已接受邀请' : '已拒绝邀请',
    });
  } catch (error: any) {
    logger.error('响应邀请失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '响应邀请失败',
    });
  }
});

/**
 * DELETE /api/direct-assignment/invitations/:id
 * 企业取消邀请
 */
router.delete('/invitations/:id', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以取消邀请',
      });
    }

    const { id: invitationId } = req.params;

    await directAssignmentService.cancelInvitation(invitationId, companyId);

    res.json({
      success: true,
      message: '邀请已取消',
    });
  } catch (error: any) {
    logger.error('取消邀请失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '取消邀请失败',
    });
  }
});

/**
 * GET /api/direct-assignment/tasks/:taskId/invitations
 * 获取任务的邀请列表
 */
router.get('/tasks/:taskId/invitations', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看任务邀请',
      });
    }

    const { taskId } = req.params;

    const invitations = await directAssignmentService.getTaskInvitations(
      taskId,
      companyId
    );

    res.json({
      success: true,
      data: {
        invitations,
        total: invitations.length,
      },
    });
  } catch (error: any) {
    logger.error('获取任务邀请失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取任务邀请失败',
    });
  }
});

/**
 * GET /api/direct-assignment/my-invitations
 * 学生获取收到的邀请列表
 */
router.get('/my-invitations', authenticate, async (req, res) => {
  try {
    const studentId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: '只有学生用户可以查看邀请',
      });
    }

    const { status } = req.query;

    const invitations = await directAssignmentService.getStudentInvitations(
      studentId,
      status as string | undefined
    );

    res.json({
      success: true,
      data: {
        invitations,
        total: invitations.length,
      },
    });
  } catch (error: any) {
    logger.error('获取学生邀请失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取邀请失败',
    });
  }
});

/**
 * POST /api/direct-assignment/favorites
 * 添加收藏学生
 */
router.post('/favorites', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以收藏学生',
      });
    }

    const { studentId, tags, notes } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: studentId',
      });
    }

    const favorite = await directAssignmentService.addFavoriteStudent(
      companyId,
      studentId,
      { tags, notes }
    );

    res.json({
      success: true,
      data: favorite,
      message: '已添加到收藏',
    });
  } catch (error: any) {
    logger.error('添加收藏失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '添加收藏失败',
    });
  }
});

/**
 * DELETE /api/direct-assignment/favorites/:studentId
 * 移除收藏学生
 */
router.delete('/favorites/:studentId', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以移除收藏',
      });
    }

    const { studentId } = req.params;

    await directAssignmentService.removeFavoriteStudent(companyId, studentId);

    res.json({
      success: true,
      message: '已移除收藏',
    });
  } catch (error: any) {
    logger.error('移除收藏失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '移除收藏失败',
    });
  }
});

/**
 * GET /api/direct-assignment/favorites
 * 获取收藏学生列表
 */
router.get('/favorites', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看收藏',
      });
    }

    const { tags, limit, offset } = req.query;

    const result = await directAssignmentService.getFavoriteStudents(companyId, {
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('获取收藏列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取收藏列表失败',
    });
  }
});

/**
 * GET /api/direct-assignment/stats
 * 获取邀请统计
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看统计',
      });
    }

    const stats = await directAssignmentService.getInvitationStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取邀请统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取统计失败',
    });
  }
});

export default router;
