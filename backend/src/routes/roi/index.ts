import express from 'express';
import roiAnalyticsService from '../../services/roiAnalyticsService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * GET /api/roi/dashboard
 * 获取ROI看板数据
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看ROI看板',
      });
    }

    const { period } = req.query;

    const dashboard = await roiAnalyticsService.getROIDashboard(
      companyId,
      (period as 'monthly' | 'quarterly' | 'yearly') || 'monthly'
    );

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    logger.error('获取ROI看板失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取ROI看板失败',
    });
  }
});

/**
 * GET /api/roi/financial-stats
 * 获取财务统计
 */
router.get('/financial-stats', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看财务统计',
      });
    }

    const { year, month } = req.query;

    const now = new Date();
    const targetYear = year ? parseInt(year as string, 10) : now.getFullYear();
    const targetMonth = month ? parseInt(month as string, 10) : now.getMonth() + 1;

    const stats = await roiAnalyticsService.getFinancialStats(
      companyId,
      targetYear,
      targetMonth
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取财务统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取财务统计失败',
    });
  }
});

/**
 * GET /api/roi/historical-stats
 * 获取历史统计数据
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

    const stats = await roiAnalyticsService.getHistoricalStats(
      companyId,
      months ? parseInt(months as string, 10) : 6
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
 * POST /api/roi/cost-comparison
 * 创建成本对比分析
 */
router.post('/cost-comparison', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以创建成本对比',
      });
    }

    const { period, startDate, endDate } = req.body;

    if (!period || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: period, startDate, endDate',
      });
    }

    const analysis = await roiAnalyticsService.createCostComparisonAnalysis(
      companyId,
      period,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: analysis,
      message: '成本对比分析创建成功',
    });
  } catch (error: any) {
    logger.error('创建成本对比失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建成本对比失败',
    });
  }
});

/**
 * GET /api/roi/market-benchmarks
 * 获取市场价格基准
 */
router.get('/market-benchmarks', authenticateToken, async (req, res) => {
  try {
    const benchmarks = await roiAnalyticsService.getMarketBenchmarks();

    res.json({
      success: true,
      data: {
        benchmarks,
        total: benchmarks.length,
      },
    });
  } catch (error: any) {
    logger.error('获取市场基准失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取市场基准失败',
    });
  }
});

/**
 * POST /api/roi/refresh-stats
 * 刷新财务统计（手动）
 */
router.post('/refresh-stats', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户或管理员可以刷新统计',
      });
    }

    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: year, month',
      });
    }

    await roiAnalyticsService.refreshFinancialStats(companyId, year, month);

    res.json({
      success: true,
      message: '财务统计已刷新',
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
