import express from 'express';
import talentLockService from '../../services/talentLockService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/talent-lock/calculate-fee
 * 计算锁定费用
 */
router.post('/calculate-fee', authenticateToken, async (req, res) => {
  try {
    const { lock_type, student_level, duration_months } = req.body;

    if (!lock_type || !student_level || !duration_months) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: lock_type, student_level, duration_months',
      });
    }

    const fee = await talentLockService.calculateLockFee(
      lock_type,
      student_level,
      duration_months
    );

    res.json({
      success: true,
      data: fee,
    });
  } catch (error: any) {
    logger.error('计算费用失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '计算费用失败',
    });
  }
});

/**
 * POST /api/talent-lock/apply
 * 创建锁定申请
 */
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以申请锁定',
      });
    }

    const { student_id, lock_type, duration_months, monthly_fee, benefits, application_reason } =
      req.body;

    if (!student_id || !lock_type || !duration_months || !monthly_fee) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: student_id, lock_type, duration_months, monthly_fee',
      });
    }

    const application = await talentLockService.createLockApplication({
      company_id: companyId,
      student_id,
      lock_type,
      duration_months,
      monthly_fee,
      benefits,
      application_reason,
    });

    res.json({
      success: true,
      data: application,
      message: '申请已提交，等待学生确认',
    });
  } catch (error: any) {
    logger.error('创建锁定申请失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建锁定申请失败',
    });
  }
});

/**
 * GET /api/talent-lock/applications
 * 获取锁定申请列表
 */
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const applications = await talentLockService.getApplications(userId, userRole);

    res.json({
      success: true,
      data: {
        applications,
        total: applications.length,
      },
    });
  } catch (error: any) {
    logger.error('获取申请列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取申请列表失败',
    });
  }
});

/**
 * POST /api/talent-lock/applications/:id/respond
 * 学生响应锁定申请
 */
router.post('/applications/:id/respond', authenticateToken, async (req, res) => {
  try {
    const studentId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { id } = req.params;
    const { status, response } = req.body;

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: '只有学生可以响应申请',
      });
    }

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status必须是accepted或rejected',
      });
    }

    const application = await talentLockService.respondToApplication(
      id,
      studentId,
      status,
      response
    );

    res.json({
      success: true,
      data: application,
      message: status === 'accepted' ? '已接受锁定' : '已拒绝锁定',
    });
  } catch (error: any) {
    logger.error('响应申请失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '响应申请失败',
    });
  }
});

/**
 * GET /api/talent-lock/list
 * 获取锁定列表
 */
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { status } = req.query;

    let locks;
    if (userRole === 'company') {
      locks = await talentLockService.getCompanyLocks(userId, status as string);
    } else if (userRole === 'student') {
      locks = await talentLockService.getStudentLocks(userId, status as string);
    } else {
      return res.status(403).json({
        success: false,
        message: '无权查看锁定列表',
      });
    }

    res.json({
      success: true,
      data: {
        locks,
        total: locks.length,
      },
    });
  } catch (error: any) {
    logger.error('获取锁定列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取锁定列表失败',
    });
  }
});

/**
 * GET /api/talent-lock/:id
 * 获取锁定详情
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const lock = await talentLockService.getLockById(id);

    res.json({
      success: true,
      data: lock,
    });
  } catch (error: any) {
    logger.error('获取锁定详情失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取锁定详情失败',
    });
  }
});

/**
 * POST /api/talent-lock/:id/renew
 * 续约锁定
 */
router.post('/:id/renew', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { additional_months } = req.body;

    if (!additional_months || additional_months < 1) {
      return res.status(400).json({
        success: false,
        message: '续约月数必须大于0',
      });
    }

    const lock = await talentLockService.renewLock(id, additional_months);

    res.json({
      success: true,
      data: lock,
      message: '续约成功',
    });
  } catch (error: any) {
    logger.error('续约失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '续约失败',
    });
  }
});

/**
 * POST /api/talent-lock/:id/cancel
 * 取消锁定
 */
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { reason } = req.body;

    await talentLockService.cancelLock(id, userId, reason);

    res.json({
      success: true,
      message: '锁定已取消',
    });
  } catch (error: any) {
    logger.error('取消锁定失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '取消锁定失败',
    });
  }
});

/**
 * POST /api/talent-lock/:id/pause
 * 暂停锁定
 */
router.post('/:id/pause', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { reason } = req.body;

    const lock = await talentLockService.updateLockStatus(id, 'paused', userId, reason);

    res.json({
      success: true,
      data: lock,
      message: '锁定已暂停',
    });
  } catch (error: any) {
    logger.error('暂停锁定失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '暂停锁定失败',
    });
  }
});

/**
 * POST /api/talent-lock/:id/resume
 * 恢复锁定
 */
router.post('/:id/resume', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const lock = await talentLockService.updateLockStatus(id, 'active', userId);

    res.json({
      success: true,
      data: lock,
      message: '锁定已恢复',
    });
  } catch (error: any) {
    logger.error('恢复锁定失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '恢复锁定失败',
    });
  }
});

/**
 * GET /api/talent-lock/student/:studentId/status
 * 检查学生是否被锁定
 */
router.get('/student/:studentId/status', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const companyId = (req as any).user.id;

    const status = await talentLockService.isStudentLocked(studentId, companyId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('检查锁定状态失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '检查锁定状态失败',
    });
  }
});

/**
 * GET /api/talent-lock/stats
 * 获取锁定统计
 */
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以查看统计',
      });
    }

    const stats = await talentLockService.getLockStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取锁定统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取锁定统计失败',
    });
  }
});

/**
 * GET /api/talent-lock/pricing
 * 获取价格配置
 */
router.get('/pricing/config', async (req, res) => {
  try {
    const { lock_type, student_level } = req.query;

    if (!lock_type || !student_level) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: lock_type, student_level',
      });
    }

    const pricing = await talentLockService.getPricing(
      lock_type as string,
      parseInt(student_level as string, 10)
    );

    res.json({
      success: true,
      data: pricing,
    });
  } catch (error: any) {
    logger.error('获取价格配置失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取价格配置失败',
    });
  }
});

export default router;
