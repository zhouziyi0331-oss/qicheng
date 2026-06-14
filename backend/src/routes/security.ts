/**
 * 安全相关路由
 *
 * 功能：
 * 1. 获取安全承诺列表
 * 2. 获取合作进度
 * 3. 获取访问日志
 */

import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import encryptionService from '../services/encryptionService';
import dataAccessLogService from '../services/dataAccessLogService';
import collaborationProgressService from '../services/collaborationProgressService';
import contactUnlockService from '../services/contactUnlockService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * 获取安全承诺列表
 * GET /api/security/commitments
 */
router.get('/commitments', async (req: Request, res: Response) => {
  try {
    const pool = require('../utils/db').default;
    const result = await pool.query(
      `SELECT id, title, content, category, display_order
       FROM security_commitments
       WHERE is_active = true
       ORDER BY display_order ASC, created_at ASC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Failed to get security commitments:', error);
    res.status(500).json({
      success: false,
      message: '获取安全承诺失败',
    });
  }
});

/**
 * 获取合作进度
 * GET /api/security/collaboration-progress/:studentId/:companyId
 */
router.get(
  '/collaboration-progress/:studentId/:companyId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { studentId, companyId } = req.params;
      const user = (req as any).user;

      // 权限检查：只能查看自己相关的合作进度
      if (user.role === 'student' && user.id !== studentId) {
        return res.status(403).json({
          success: false,
          message: '无权查看此合作进度',
        });
      }

      if (user.role === 'company' && user.id !== companyId) {
        return res.status(403).json({
          success: false,
          message: '无权查看此合作进度',
        });
      }

      const progress = await collaborationProgressService.getProgress(studentId, companyId);
      const hint = collaborationProgressService.getProgressHint(progress, user.role);
      const percentage = collaborationProgressService.getProgressPercentage(progress.completedCount);
      const status = collaborationProgressService.getProgressStatus(progress);

      res.json({
        success: true,
        data: {
          ...progress,
          hint,
          percentage,
          status,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get collaboration progress:', error);
      res.status(500).json({
        success: false,
        message: '获取合作进度失败',
      });
    }
  }
);

/**
 * 获取用户的所有合作进度
 * GET /api/security/my-collaborations
 */
router.get('/my-collaborations', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let collaborations;

    if (user.role === 'student') {
      collaborations = await collaborationProgressService.getStudentCollaborations(user.id);
    } else if (user.role === 'company') {
      collaborations = await collaborationProgressService.getCompanyCollaborations(user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: '无权访问',
      });
    }

    // 为每个合作添加提示文案
    const enrichedCollaborations = collaborations.map((collab) => ({
      ...collab,
      hint: collaborationProgressService.getProgressHint(collab, user.role),
      percentage: collaborationProgressService.getProgressPercentage(collab.completedCount),
      status: collaborationProgressService.getProgressStatus(collab),
    }));

    res.json({
      success: true,
      data: enrichedCollaborations,
    });
  } catch (error: any) {
    logger.error('Failed to get collaborations:', error);
    res.status(500).json({
      success: false,
      message: '获取合作列表失败',
    });
  }
});

/**
 * 获取资源访问日志
 * GET /api/security/access-logs/:resourceType/:resourceId
 */
router.get(
  '/access-logs/:resourceType/:resourceId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { resourceType, resourceId } = req.params;
      const user = (req as any).user;
      const limit = parseInt(req.query.limit as string) || 50;

      // 权限检查：只有管理员或资源所有者可以查看访问日志
      if (user.role !== 'admin' && user.role !== 'platform_admin') {
        // TODO: 检查用户是否是资源所有者
        return res.status(403).json({
          success: false,
          message: '无权查看访问日志',
        });
      }

      const logs = await dataAccessLogService.getAccessHistory(resourceType, resourceId, limit);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      logger.error('Failed to get access logs:', error);
      res.status(500).json({
        success: false,
        message: '获取访问日志失败',
      });
    }
  }
);

/**
 * 获取用户访问历史
 * GET /api/security/my-access-logs
 */
router.get('/my-access-logs', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await dataAccessLogService.getUserAccessHistory(user.id, limit);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    logger.error('Failed to get user access logs:', error);
    res.status(500).json({
      success: false,
      message: '获取访问历史失败',
    });
  }
});

/**
 * 生成加密密钥（仅管理员）
 * POST /api/security/generate-key
 */
router.post('/generate-key', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'admin' && user.role !== 'platform_admin') {
      return res.status(403).json({
        success: false,
        message: '无权生成密钥',
      });
    }

    const key = encryptionService.generateKey();

    res.json({
      success: true,
      data: {
        key,
        message: '请将此密钥保存到环境变量 ENCRYPTION_KEY_DEFAULT 中',
      },
    });
  } catch (error: any) {
    logger.error('Failed to generate key:', error);
    res.status(500).json({
      success: false,
      message: '生成密钥失败',
    });
  }
});

/**
 * 申请解锁联系方式
 * POST /api/security/unlock-contact/request
 */
router.post('/unlock-contact/request', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentId, companyId, taskId } = req.body;

    // 权限检查：只能申请自己相关的解锁
    if (user.role === 'student' && user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权申请此解锁',
      });
    }

    if (user.role === 'company' && user.id !== companyId) {
      return res.status(403).json({
        success: false,
        message: '无权申请此解锁',
      });
    }

    const result = await contactUnlockService.requestUnlock({
      studentId,
      companyId,
      taskId,
      requestedBy: user.role,
    });

    res.json({
      success: true,
      data: result,
      message: result.exchanged ? '联系方式已解锁' : '申请已发送，等待对方确认',
    });
  } catch (error: any) {
    logger.error('Failed to request unlock:', error);
    res.status(400).json({
      success: false,
      message: error.message || '申请解锁失败',
    });
  }
});

/**
 * 同意解锁申请
 * POST /api/security/unlock-contact/approve
 */
router.post('/unlock-contact/approve', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentId, companyId } = req.body;

    // 权限检查
    if (user.role === 'student' && user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权同意此解锁',
      });
    }

    if (user.role === 'company' && user.id !== companyId) {
      return res.status(403).json({
        success: false,
        message: '无权同意此解锁',
      });
    }

    const result = await contactUnlockService.approveUnlock(studentId, companyId, user.role);

    res.json({
      success: true,
      data: result,
      message: result.exchanged ? '联系方式已解锁' : '已同意，等待对方确认',
    });
  } catch (error: any) {
    logger.error('Failed to approve unlock:', error);
    res.status(400).json({
      success: false,
      message: error.message || '同意解锁失败',
    });
  }
});

/**
 * 拒绝解锁申请
 * POST /api/security/unlock-contact/reject
 */
router.post('/unlock-contact/reject', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentId, companyId } = req.body;

    // 权限检查
    if (user.role === 'student' && user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权拒绝此解锁',
      });
    }

    if (user.role === 'company' && user.id !== companyId) {
      return res.status(403).json({
        success: false,
        message: '无权拒绝此解锁',
      });
    }

    await contactUnlockService.rejectUnlock(studentId, companyId, user.role);

    res.json({
      success: true,
      message: '已拒绝解锁申请',
    });
  } catch (error: any) {
    logger.error('Failed to reject unlock:', error);
    res.status(400).json({
      success: false,
      message: error.message || '拒绝解锁失败',
    });
  }
});

/**
 * 获取已解锁的联系方式
 * GET /api/security/unlock-contact/:studentId/:companyId
 */
router.get('/unlock-contact/:studentId/:companyId', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentId, companyId } = req.params;

    // 权限检查
    if (user.role === 'student' && user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此联系方式',
      });
    }

    if (user.role === 'company' && user.id !== companyId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此联系方式',
      });
    }

    const contact = await contactUnlockService.getUnlockedContact(
      studentId,
      companyId,
      user.role,
      user.id
    );

    res.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    logger.error('Failed to get unlocked contact:', error);
    res.status(400).json({
      success: false,
      message: error.message || '获取联系方式失败',
    });
  }
});

/**
 * 获取解锁状态
 * GET /api/security/unlock-status/:studentId/:companyId
 */
router.get('/unlock-status/:studentId/:companyId', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentId, companyId } = req.params;

    // 权限检查
    if (user.role === 'student' && user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此解锁状态',
      });
    }

    if (user.role === 'company' && user.id !== companyId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此解锁状态',
      });
    }

    const status = await contactUnlockService.getUnlockStatus(studentId, companyId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('Failed to get unlock status:', error);
    res.status(500).json({
      success: false,
      message: '获取解锁状态失败',
    });
  }
});

/**
 * 获取用户的所有解锁请求
 * GET /api/security/my-unlock-requests
 */
router.get('/my-unlock-requests', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'student' && user.role !== 'company') {
      return res.status(403).json({
        success: false,
        message: '无权访问',
      });
    }

    const requests = await contactUnlockService.getUserUnlockRequests(user.id, user.role);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    logger.error('Failed to get unlock requests:', error);
    res.status(500).json({
      success: false,
      message: '获取解锁请求失败',
    });
  }
});

export default router;
