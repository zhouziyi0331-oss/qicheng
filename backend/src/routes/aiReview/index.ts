import express from 'express';
import aiReviewService from '../../services/aiReviewService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/ai-review/tasks/:taskId/review
 * AI审核任务交付物
 */
router.post('/tasks/:taskId/review', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      taskTitle,
      taskDescription,
      deliverableDescription,
      deliverableFiles,
      deliverableUrl,
      requirements,
    } = req.body;

    if (!taskTitle || !taskDescription || !deliverableDescription) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: taskTitle, taskDescription, deliverableDescription',
      });
    }

    const report = await aiReviewService.reviewTaskDeliverable({
      taskId,
      taskTitle,
      taskDescription,
      deliverableDescription,
      deliverableFiles,
      deliverableUrl,
      requirements,
    });

    res.json({
      success: true,
      data: report,
      message: 'AI审核完成',
    });
  } catch (error: any) {
    logger.error('AI审核失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI审核失败',
    });
  }
});

/**
 * GET /api/ai-review/tasks/:taskId/reports
 * 获取任务的审核历史
 */
router.get('/tasks/:taskId/reports', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // 权限检查：企业、学生或管理员
    const taskCheck = await req.app.locals.pool.query(
      `SELECT company_id, student_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    const task = taskCheck.rows[0];
    const hasAccess =
      userRole === 'admin' ||
      task.company_id === userId ||
      task.student_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权查看审核报告',
      });
    }

    const reports = await aiReviewService.getReviewHistory(taskId);

    res.json({
      success: true,
      data: {
        reports,
        total: reports.length,
      },
    });
  } catch (error: any) {
    logger.error('获取审核历史失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取审核历史失败',
    });
  }
});

/**
 * POST /api/ai-review/tasks/:taskId/revision-guide
 * 企业驳回后生成改进指引
 */
router.post('/tasks/:taskId/revision-guide', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以生成改进指引',
      });
    }

    const { rejectionReason, rejectionDetails, reviewReportId } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: rejectionReason',
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

    const guide = await aiReviewService.generateRevisionGuide({
      taskId,
      rejectionReason,
      rejectionDetails,
      reviewReportId,
      companyId,
    });

    res.json({
      success: true,
      data: guide,
      message: 'AI改进指引生成成功',
    });
  } catch (error: any) {
    logger.error('生成改进指引失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成改进指引失败',
    });
  }
});

/**
 * GET /api/ai-review/tasks/:taskId/revision-guides
 * 获取任务的改进指引列表
 */
router.get('/tasks/:taskId/revision-guides', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // 权限检查
    const taskCheck = await req.app.locals.pool.query(
      `SELECT company_id, student_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    const task = taskCheck.rows[0];
    const hasAccess =
      userRole === 'admin' ||
      task.company_id === userId ||
      task.student_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权查看改进指引',
      });
    }

    const guides = await aiReviewService.getRevisionGuides(taskId);

    res.json({
      success: true,
      data: {
        guides,
        total: guides.length,
      },
    });
  } catch (error: any) {
    logger.error('获取改进指引失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取改进指引失败',
    });
  }
});

/**
 * PUT /api/ai-review/revision-guides/:guideId/viewed
 * 学生标记已查看改进指引
 */
router.put('/revision-guides/:guideId/viewed', authenticateToken, async (req, res) => {
  try {
    const { guideId } = req.params;
    const studentId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: '只有学生用户可以标记查看',
      });
    }

    await aiReviewService.markGuideAsViewed(guideId, studentId);

    res.json({
      success: true,
      message: '已标记为已查看',
    });
  } catch (error: any) {
    logger.error('标记查看失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '标记查看失败',
    });
  }
});

/**
 * POST /api/ai-review/revision-guides/:guideId/rate
 * 学生对改进指引评分
 */
router.post('/revision-guides/:guideId/rate', authenticateToken, async (req, res) => {
  try {
    const { guideId } = req.params;
    const { rating, feedback } = req.body;
    const userRole = (req as any).user.role;

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: '只有学生用户可以评分',
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间',
      });
    }

    await aiReviewService.rateGuideHelpfulness(guideId, rating, feedback);

    res.json({
      success: true,
      message: '评分成功',
    });
  } catch (error: any) {
    logger.error('评分失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '评分失败',
    });
  }
});

export default router;
