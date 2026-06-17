/**
 * AI导师P1功能API路由扩展
 *
 * 新增功能：
 * 1. 项目复盘相关接口
 * 2. 范例展示统计接口
 */

import express from 'express';
import mentorRetrospectiveService from '../services/mentorRetrospectiveService';
import mentorExampleService from '../services/mentorExampleService';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// ============================================
// 项目复盘相关路由
// ============================================

/**
 * GET /api/v1/mentor/retrospectives/pending
 * 获取待完成的复盘
 */
router.get('/retrospectives/pending', authenticate, async (req, res) => {
  try {
    const studentId = req.user!.userId;

    const retrospectives = await mentorRetrospectiveService.getPendingRetrospectives(studentId);

    res.json({
      success: true,
      data: {
        retrospectives,
        count: retrospectives.length
      }
    });
  } catch (error: any) {
    logger.error('[MentorAPI] 获取待完成复盘失败:', error);
    res.status(500).json({
      success: false,
      message: '获取待完成复盘失败'
    });
  }
});

/**
 * POST /api/v1/mentor/retrospectives/:id/submit
 * 提交复盘回答
 */
router.post('/retrospectives/:id/submit', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { answer1, answer2, answer3 } = req.body;
    const studentId = req.user!.userId;

    // 验证必填字段
    if (!answer1 || !answer2 || !answer3) {
      return res.status(400).json({
        success: false,
        message: '请回答所有问题'
      });
    }

    // 验证复盘归属
    const retrospective = await mentorRetrospectiveService.getPendingRetrospectives(studentId);
    const found = retrospective.find(r => r.id === id);

    if (!found) {
      return res.status(404).json({
        success: false,
        message: '复盘不存在或已完成'
      });
    }

    // 保存回答
    await mentorRetrospectiveService.saveAnswers(id, {
      answer1,
      answer2,
      answer3
    });

    res.json({
      success: true,
      message: '复盘已提交，感谢你的分享！'
    });
  } catch (error: any) {
    logger.error('[MentorAPI] 提交复盘失败:', error);
    res.status(500).json({
      success: false,
      message: '提交复盘失败'
    });
  }
});

/**
 * POST /api/v1/mentor/retrospectives/:id/skip
 * 跳过复盘
 */
router.post('/retrospectives/:id/skip', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.userId;

    // 验证复盘归属
    const retrospective = await mentorRetrospectiveService.getPendingRetrospectives(studentId);
    const found = retrospective.find(r => r.id === id);

    if (!found) {
      return res.status(404).json({
        success: false,
        message: '复盘不存在或已完成'
      });
    }

    // 跳过复盘
    await mentorRetrospectiveService.skipRetrospective(id);

    res.json({
      success: true,
      message: '已跳过复盘'
    });
  } catch (error: any) {
    logger.error('[MentorAPI] 跳过复盘失败:', error);
    res.status(500).json({
      success: false,
      message: '跳过复盘失败'
    });
  }
});

/**
 * GET /api/v1/mentor/retrospectives/history
 * 获取历史复盘
 */
router.get('/retrospectives/history', authenticate, async (req, res) => {
  try {
    const studentId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const retrospectives = await mentorRetrospectiveService.getRetrospectiveHistory(
      studentId,
      limit
    );

    res.json({
      success: true,
      data: {
        retrospectives,
        count: retrospectives.length
      }
    });
  } catch (error: any) {
    logger.error('[MentorAPI] 获取历史复盘失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史复盘失败'
    });
  }
});

// ============================================
// 管理员路由（P1功能）
// ============================================

/**
 * POST /api/v1/mentor/admin/batch-trigger-retrospectives
 * 批量触发复盘（管理员）
 */
router.post('/admin/batch-trigger-retrospectives', authenticate, async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供订单ID数组'
      });
    }

    // 异步批量触发
    let successCount = 0;
    let failCount = 0;

    for (const orderId of orderIds) {
      try {
        // 获取订单的学生ID
        const order = await pool.query(
          'SELECT student_id FROM orders WHERE id = $1',
          [orderId]
        );

        if (order.rows.length > 0) {
          await mentorRetrospectiveService.triggerRetrospective(
            order.rows[0].student_id,
            orderId
          );
          successCount++;
        }
      } catch (error: any) {
        logger.error(`[MentorAPI] 触发复盘失败: ${orderId}`, error);
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `批量触发完成：成功${successCount}个，失败${failCount}个`,
      data: {
        successCount,
        failCount
      }
    });
  } catch (error: any) {
    logger.error('[MentorAPI] 批量触发复盘失败:', error);
    res.status(500).json({
      success: false,
      message: '批量触发复盘失败'
    });
  }
});

/**
 * GET /api/v1/mentor/admin/retrospective-stats
 * 获取复盘统计（管理员）
 */
router.get('/admin/retrospective-stats', authenticate, async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    const days = parseInt(req.query.days as string) || 7;
    const stats = await mentorRetrospectiveService.getRetrospectiveStats(days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('[MentorAPI] 获取复盘统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取复盘统计失败'
    });
  }
});

/**
 * GET /api/v1/mentor/admin/example-stats
 * 获取范例展示统计（管理员）
 */
router.get('/admin/example-stats', authenticate, async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    const days = parseInt(req.query.days as string) || 7;
    const stats = await mentorExampleService.getExampleStats(days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('[MentorAPI] 获取范例统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取范例统计失败'
    });
  }
});

export default router;
