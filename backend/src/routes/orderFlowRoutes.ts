import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import orderStatusService, { OrderStatus } from '../services/orderStatusService';
import logger from '../utils/logger';
import { query, queryOne } from '../utils/db';

const router = Router();

/**
 * 学生接单
 * POST /api/v1/orders/:orderId/accept
 */
router.post('/:orderId/accept', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = (req as any).user?.id;

    // 验证订单
    const order = await queryOne(
      `SELECT id, student_id, status FROM orders WHERE id = $1`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.student_id !== userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    if (order.status !== OrderStatus.PENDING) {
      return res.status(400).json({ error: '订单状态不允许此操作' });
    }

    // 更新订单状态（自动触发T-01）
    await orderStatusService.updateOrderStatus(orderId, OrderStatus.ACCEPTED);

    logger.info(`Order accepted: ${orderId} by student ${userId}`);

    res.json({
      success: true,
      message: '接单成功，启程老师将为你提供引导'
    });

  } catch (error: unknown) {
    logger.error('Failed to accept order:', error);
    res.status(500).json({ error: '接单失败' });
  }
});

/**
 * 学生提交交付物
 * POST /api/v1/orders/:orderId/submit
 */
router.post('/:orderId/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { submissionContent, submissionFiles } = req.body;
    const userId = (req as any).user?.id;

    // 验证订单
    const order = await queryOne(
      `SELECT id, student_id, status FROM orders WHERE id = $1`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.student_id !== userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    // 保存提交物
    await query(
      `INSERT INTO order_submissions (order_id, submission_content, submission_files, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [orderId, submissionContent, submissionFiles]
    );

    // 更新订单状态（自动触发AI-03预审核）
    await orderStatusService.updateOrderStatus(
      orderId,
      OrderStatus.SUBMITTED,
      { submissionContent, submissionFiles }
    );

    logger.info(`Order submitted: ${orderId} by student ${userId}`);

    res.json({
      success: true,
      message: '提交成功，正在进行预审核'
    });

  } catch (error: unknown) {
    logger.error('Failed to submit order:', error);
    res.status(500).json({ error: '提交失败' });
  }
});

/**
 * 企业打回修改
 * POST /api/v1/orders/:orderId/request-revision
 */
router.post('/:orderId/request-revision', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { feedback } = req.body;
    const userId = (req as any).user?.id;

    // 验证订单
    const order = await queryOne(
      `SELECT o.id, o.status, t.company_id
       FROM orders o
       JOIN tasks t ON o.task_id = t.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.company_id !== userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    if (order.status !== OrderStatus.SUBMITTED) {
      return res.status(400).json({ error: '订单状态不允许此操作' });
    }

    // 保存反馈
    await query(
      `UPDATE order_submissions
       SET revision_feedback = $1, revision_requested_at = NOW()
       WHERE order_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [feedback, orderId]
    );

    // 更新订单状态（自动触发T-03）
    await orderStatusService.updateOrderStatus(
      orderId,
      OrderStatus.REVISION_REQUESTED,
      { companyFeedback: feedback }
    );

    logger.info(`Revision requested for order: ${orderId} by company ${userId}`);

    res.json({
      success: true,
      message: '已发送修改建议，启程老师将帮助学生理解'
    });

  } catch (error: unknown) {
    logger.error('Failed to request revision:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

/**
 * 企业确认完成
 * POST /api/v1/orders/:orderId/complete
 */
router.post('/:orderId/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;
    const userId = (req as any).user?.id;

    // 验证订单
    const order = await queryOne(
      `SELECT o.id, o.status, t.company_id
       FROM orders o
       JOIN tasks t ON o.task_id = t.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.company_id !== userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    if (order.status !== OrderStatus.SUBMITTED) {
      return res.status(400).json({ error: '订单状态不允许此操作' });
    }

    // 保存评价
    if (rating || review) {
      await query(
        `INSERT INTO order_reviews (order_id, rating, review, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [orderId, rating, review]
      );
    }

    // 更新订单状态（自动触发AI-04成长报告 + T-05里程碑见证）
    await orderStatusService.updateOrderStatus(orderId, OrderStatus.COMPLETED);

    logger.info(`Order completed: ${orderId} by company ${userId}`);

    res.json({
      success: true,
      message: '订单已完成，学生的成长报告正在生成'
    });

  } catch (error: unknown) {
    logger.error('Failed to complete order:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

/**
 * 记录学生活动
 * POST /api/v1/orders/:orderId/activity
 */
router.post('/:orderId/activity', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = (req as any).user?.id;

    // 验证订单
    const order = await queryOne(
      `SELECT id, student_id FROM orders WHERE id = $1`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.student_id !== userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    // 记录活动
    await orderStatusService.recordStudentActivity(orderId);

    res.json({
      success: true
    });

  } catch (error: unknown) {
    logger.error('Failed to record activity:', error);
    res.status(500).json({ error: '记录失败' });
  }
});

export default router;
