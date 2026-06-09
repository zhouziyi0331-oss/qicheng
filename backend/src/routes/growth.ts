/**
 * 学生成长数据闭环 - API路由
 * 包含三个模块的所有接口
 */

import express from 'express';
import instantGrowthSummaryService from '../services/instantGrowthSummaryService';
import abilityDimensionUpdateService from '../services/abilityDimensionUpdateService';
import graduationReportService from '../services/graduationReportService';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// ============================================
// 模块一：即时成长总结
// ============================================

/**
 * 获取学生的即时成长总结列表
 * GET /api/v1/growth/summaries
 */
router.get('/summaries', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const summaries = await instantGrowthSummaryService.getStudentSummaries(
      userId,
      limit
    );

    res.json({
      success: true,
      data: summaries,
    });
  } catch (error) {
    console.error('获取成长总结失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成长总结失败',
      error: error.message,
    });
  }
});

/**
 * 获取单个订单的成长总结
 * GET /api/v1/growth/summaries/:orderId
 */
router.get('/summaries/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    // 生成或获取缓存的总结
    const summary = await instantGrowthSummaryService.generateInstantSummary(
      orderId
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('获取订单成长总结失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单成长总结失败',
      error: error.message,
    });
  }
});

/**
 * 标记成长总结为已查看
 * POST /api/v1/growth/summaries/:summaryId/view
 */
router.post('/summaries/:summaryId/view', authenticate, async (req, res) => {
  try {
    const { summaryId } = req.params;

    await instantGrowthSummaryService.markAsViewed(summaryId);

    res.json({
      success: true,
      message: '已标记为已查看',
    });
  } catch (error) {
    console.error('标记已查看失败:', error);
    res.status(500).json({
      success: false,
      message: '标记已查看失败',
      error: error.message,
    });
  }
});

/**
 * 提交成长总结反馈
 * POST /api/v1/growth/summaries/:summaryId/feedback
 */
router.post('/summaries/:summaryId/feedback', authenticate, async (req, res) => {
  try {
    const { summaryId } = req.params;
    const { feedback } = req.body;

    if (!['helpful', 'not_helpful', 'neutral'].includes(feedback)) {
      return res.status(400).json({
        success: false,
        message: '无效的反馈类型',
      });
    }

    await instantGrowthSummaryService.submitFeedback(summaryId, feedback);

    res.json({
      success: true,
      message: '反馈提交成功',
    });
  } catch (error) {
    console.error('提交反馈失败:', error);
    res.status(500).json({
      success: false,
      message: '提交反馈失败',
      error: error.message,
    });
  }
});

// ============================================
// 模块二：六维能力动态更新
// ============================================

/**
 * 获取学生的能力变化历史
 * GET /api/v1/growth/ability-history
 */
router.get('/ability-history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await abilityDimensionUpdateService.getAbilityHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('获取能力历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取能力历史失败',
      error: error.message,
    });
  }
});

/**
 * 获取学生的所有画像版本
 * GET /api/v1/growth/profile-versions
 */
router.get('/profile-versions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const versions = await abilityDimensionUpdateService.getProfileVersions(userId);

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('获取画像版本失败:', error);
    res.status(500).json({
      success: false,
      message: '获取画像版本失败',
      error: error.message,
    });
  }
});

/**
 * 手动触发能力更新（管理员或测试用）
 * POST /api/v1/growth/ability-update/:orderId
 */
router.post('/ability-update/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await abilityDimensionUpdateService.updateAbilityAfterOrder(
      orderId
    );

    res.json({
      success: true,
      data: result,
      message: '能力更新成功',
    });
  } catch (error) {
    console.error('能力更新失败:', error);
    res.status(500).json({
      success: false,
      message: '能力更新失败',
      error: error.message,
    });
  }
});

// ============================================
// 模块三：Lv.6毕业报告
// ============================================

/**
 * 生成毕业报告（学生达到Lv.6后调用）
 * POST /api/v1/growth/graduation-report/generate
 */
router.post('/graduation-report/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const reportId = await graduationReportService.generateGraduationReport(userId);

    res.json({
      success: true,
      data: {
        reportId,
      },
      message: '毕业报告生成成功',
    });
  } catch (error) {
    console.error('生成毕业报告失败:', error);
    res.status(500).json({
      success: false,
      message: '生成毕业报告失败',
      error: error.message,
    });
  }
});

/**
 * 获取毕业报告预览
 * GET /api/v1/growth/graduation-report/preview
 */
router.get('/graduation-report/preview', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const preview = await graduationReportService.getReportPreview(userId);

    if (!preview) {
      return res.status(404).json({
        success: false,
        message: '尚未生成毕业报告',
      });
    }

    res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    console.error('获取报告预览失败:', error);
    res.status(500).json({
      success: false,
      message: '获取报告预览失败',
      error: error.message,
    });
  }
});

/**
 * 获取完整毕业报告（需要已付费）
 * GET /api/v1/growth/graduation-report/:reportId
 */
router.get('/graduation-report/:reportId', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await graduationReportService.getFullReport(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '报告不存在',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error.message === '报告尚未付费解锁') {
      return res.status(403).json({
        success: false,
        message: '报告尚未付费解锁',
      });
    }

    console.error('获取完整报告失败:', error);
    res.status(500).json({
      success: false,
      message: '获取完整报告失败',
      error: error.message,
    });
  }
});

/**
 * 处理毕业报告付费
 * POST /api/v1/growth/graduation-report/:reportId/pay
 */
router.post('/graduation-report/:reportId/pay', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    const { paymentMethod, transactionId, pointsUsed } = req.body;

    if (!paymentMethod || !transactionId) {
      return res.status(400).json({
        success: false,
        message: '缺少支付信息',
      });
    }

    await graduationReportService.processPayment(
      reportId,
      userId,
      paymentMethod,
      transactionId,
      pointsUsed || 0
    );

    res.json({
      success: true,
      message: '付费成功，报告已解锁',
    });
  } catch (error) {
    console.error('处理付费失败:', error);
    res.status(500).json({
      success: false,
      message: '处理付费失败',
      error: error.message,
    });
  }
});

/**
 * 检查是否需要更新报告
 * GET /api/v1/growth/graduation-report/check-update
 */
router.get('/graduation-report/check-update', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const needUpdate = await graduationReportService.checkNeedUpdate(userId);

    res.json({
      success: true,
      data: {
        needUpdate,
      },
    });
  } catch (error) {
    console.error('检查更新失败:', error);
    res.status(500).json({
      success: false,
      message: '检查更新失败',
      error: error.message,
    });
  }
});

/**
 * 更新毕业报告
 * POST /api/v1/growth/graduation-report/:reportId/update
 */
router.post('/graduation-report/:reportId/update', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    await graduationReportService.updateReport(reportId, userId);

    res.json({
      success: true,
      message: '报告更新成功',
    });
  } catch (error) {
    console.error('更新报告失败:', error);
    res.status(500).json({
      success: false,
      message: '更新报告失败',
      error: error.message,
    });
  }
});

// ============================================
// 综合接口：学生成长概览
// ============================================

/**
 * 获取学生成长概览（包含所有模块的摘要信息）
 * GET /api/v1/growth/overview
 */
router.get('/overview', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 并行获取各模块数据
    const [summaries, profileVersions, reportPreview] = await Promise.all([
      instantGrowthSummaryService.getStudentSummaries(userId, 5),
      abilityDimensionUpdateService.getProfileVersions(userId),
      graduationReportService.getReportPreview(userId),
    ]);

    // 获取当前画像
    const currentProfile = profileVersions.find((p) => p.is_current);

    // 获取初始画像
    const initialProfile = profileVersions.find((p) => p.version === 1);

    res.json({
      success: true,
      data: {
        // 最近的成长总结
        recentSummaries: summaries,

        // 能力画像
        currentProfile,
        initialProfile,
        totalVersions: profileVersions.length,

        // 毕业报告
        graduationReport: reportPreview
          ? {
              exists: true,
              isPaid: reportPreview.is_paid,
              reportId: reportPreview.id,
            }
          : {
              exists: false,
            },
      },
    });
  } catch (error) {
    console.error('获取成长概览失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成长概览失败',
      error: error.message,
    });
  }
});

export default router;
