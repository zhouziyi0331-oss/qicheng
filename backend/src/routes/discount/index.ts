import express from 'express';
import tieredDiscountService from '../../services/tieredDiscountService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * GET /api/discount/tiers
 * 获取所有折扣阶梯
 */
router.get('/tiers', authenticateToken, async (req, res) => {
  try {
    const tiers = await tieredDiscountService.getAllTiers();

    res.json({
      success: true,
      data: {
        tiers,
        total: tiers.length,
      },
    });
  } catch (error: any) {
    logger.error('获取折扣阶梯失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取折扣阶梯失败',
    });
  }
});

/**
 * GET /api/discount/my-tier
 * 获取企业当前阶梯信息
 */
router.get('/my-tier', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看阶梯信息',
      });
    }

    const tierInfo = await tieredDiscountService.getCompanyTierInfo(companyId);

    res.json({
      success: true,
      data: tierInfo,
    });
  } catch (error: any) {
    logger.error('获取阶梯信息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取阶梯信息失败',
    });
  }
});

/**
 * GET /api/discount/my-progress
 * 获取企业折扣进度（包含详细信息用于UI展示）
 */
router.get('/my-progress', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看进度',
      });
    }

    const progress = await tieredDiscountService.getDiscountProgress(companyId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    logger.error('获取折扣进度失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取进度失败',
    });
  }
});

/**
 * GET /api/discount/monthly-stats
 * 获取企业月度统计
 */
router.get('/monthly-stats', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看统计',
      });
    }

    const { year, month } = req.query;

    const stats = await tieredDiscountService.getMonthlyStats(
      companyId,
      year ? parseInt(year as string, 10) : undefined,
      month ? parseInt(month as string, 10) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取月度统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取统计失败',
    });
  }
});

/**
 * POST /api/discount/calculate
 * 计算折扣金额（不保存）
 */
router.post('/calculate', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以计算折扣',
      });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '金额必须大于0',
      });
    }

    const discount = await tieredDiscountService.calculateDiscount(
      companyId,
      amount
    );

    res.json({
      success: true,
      data: discount,
    });
  } catch (error: any) {
    logger.error('计算折扣失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '计算折扣失败',
    });
  }
});

/**
 * POST /api/discount/apply
 * 应用折扣到任务
 */
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以应用折扣',
      });
    }

    const { taskId, originalAmount } = req.body;

    if (!taskId || !originalAmount) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: taskId, originalAmount',
      });
    }

    // 验证任务归属
    const taskCheck = await req.app.locals.pool.query(
      `SELECT company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    if (taskCheck.rows[0].company_id !== companyId) {
      return res.status(403).json({
        success: false,
        message: '无权操作该任务',
      });
    }

    const application = await tieredDiscountService.applyDiscountToTask(
      taskId,
      companyId,
      originalAmount
    );

    res.json({
      success: true,
      data: application,
      message: '折扣已应用',
    });
  } catch (error: any) {
    logger.error('应用折扣失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '应用折扣失败',
    });
  }
});

/**
 * GET /api/discount/history
 * 获取企业折扣历史
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看历史',
      });
    }

    const { limit, offset } = req.query;

    const history = await tieredDiscountService.getDiscountHistory(
      companyId,
      limit ? parseInt(limit as string, 10) : undefined,
      offset ? parseInt(offset as string, 10) : undefined
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    logger.error('获取折扣历史失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取历史失败',
    });
  }
});

/**
 * GET /api/discount/historical-stats
 * 获取企业历史月度统计
 */
router.get('/historical-stats', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看历史统计',
      });
    }

    const { months } = req.query;

    const stats = await tieredDiscountService.getHistoricalStats(
      companyId,
      months ? parseInt(months as string, 10) : undefined
    );

    res.json({
      success: true,
      data: {
        stats,
        total: stats.length,
      },
    });
  } catch (error: any) {
    logger.error('获取历史统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取历史统计失败',
    });
  }
});

/**
 * POST /api/discount/refresh-stats
 * 手动刷新月度统计（管理员功能）
 */
router.post('/refresh-stats', authenticateToken, async (req, res) => {
  try {
    const userRole = (req as any).user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以刷新统计',
      });
    }

    const { companyId, year, month } = req.body;

    if (!companyId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: companyId, year, month',
      });
    }

    await tieredDiscountService.refreshMonthlyStats(companyId, year, month);

    res.json({
      success: true,
      message: '统计已刷新',
    });
  } catch (error: any) {
    logger.error('刷新统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '刷新统计失败',
    });
  }
});

export default router;
