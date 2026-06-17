import { Router, Request, Response } from 'express';
import mentorAutoTriggerService from '../services/mentorAutoTriggerService';
import { mentorTriggerCronService } from '../services/mentorTriggerCronService';
import { authenticate } from '../middleware/auth';
import { pool } from '../config/database';

const router = Router();

/**
 * 手动触发T-01（接单后引导）
 * POST /api/v1/mentor-trigger/t01/:orderId
 */
router.post('/t01/:orderId', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const messageId = await mentorAutoTriggerService.triggerT01(orderId);

    res.json({
      success: true,
      data: {
        messageId,
        message: 'T-01触发成功'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'T-01触发失败'
    });
  }
});

/**
 * 手动触发T-03（打回后引导）
 * POST /api/v1/mentor-trigger/t03/:orderId
 */
router.post('/t03/:orderId', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const messageId = await mentorAutoTriggerService.triggerT03(orderId);

    res.json({
      success: true,
      data: {
        messageId,
        message: 'T-03触发成功'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'T-03触发失败'
    });
  }
});

/**
 * 手动触发T-05（完成后庆祝）
 * POST /api/v1/mentor-trigger/t05/:orderId
 */
router.post('/t05/:orderId', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const messageId = await mentorAutoTriggerService.triggerT05(orderId);

    res.json({
      success: true,
      data: {
        messageId,
        message: 'T-05触发成功'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'T-05触发失败'
    });
  }
});

/**
 * 获取订单的所有自动触发消息
 * GET /api/v1/mentor-trigger/messages/:orderId
 */
router.get('/messages/:orderId', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      `SELECT
         mm.id,
         mm.role,
         mm.content,
         mm.context,
         mm.triggered_by,
         mm.auto_triggered,
         mm.student_viewed,
         mm.viewed_at,
         mm.student_replied,
         mm.replied_at,
         mm.created_at
       FROM mentor_messages mm
       JOIN tasks t ON mm.task_id = t.id
       WHERE t.order_id = $1
       ORDER BY mm.created_at ASC`,
      [orderId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取消息失败'
    });
  }
});

/**
 * 获取触发日志
 * GET /api/v1/mentor-trigger/logs/:orderId
 */
router.get('/logs/:orderId', authenticate, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await pool.query(
      `SELECT
         id,
         trigger_type,
         status,
         scheduled_at,
         triggered_at,
         message_id,
         error_message,
         created_at,
         updated_at
       FROM mentor_trigger_logs
       WHERE order_id = $1
       ORDER BY created_at DESC`,
      [orderId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取日志失败'
    });
  }
});

/**
 * 获取待处理的触发任务数量
 * GET /api/v1/mentor-trigger/pending-count
 */
router.get('/pending-count', authenticate, async (req: Request, res: Response) => {
  try {
    const count = await mentorTriggerCronService.getPendingCount();

    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取待处理数量失败'
    });
  }
});

/**
 * 获取触发统计信息（最近24小时）
 * GET /api/v1/mentor-trigger/stats
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await mentorTriggerCronService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取统计信息失败'
    });
  }
});

/**
 * 手动触发定时任务处理（用于测试）
 * POST /api/v1/mentor-trigger/process-now
 */
router.post('/process-now', authenticate, async (req: Request, res: Response) => {
  try {
    await mentorTriggerCronService.processNow();

    res.json({
      success: true,
      message: '手动处理完成'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '手动处理失败'
    });
  }
});

/**
 * 标记消息为已查看
 * POST /api/v1/mentor-trigger/messages/:messageId/viewed
 */
router.post('/messages/:messageId/viewed', authenticate, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    await pool.query(
      `UPDATE mentor_messages
       SET student_viewed = true,
           viewed_at = NOW()
       WHERE id = $1`,
      [messageId]
    );

    res.json({
      success: true,
      message: '已标记为已查看'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '标记失败'
    });
  }
});

/**
 * 标记消息为已回复
 * POST /api/v1/mentor-trigger/messages/:messageId/replied
 */
router.post('/messages/:messageId/replied', authenticate, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    await pool.query(
      `UPDATE mentor_messages
       SET student_replied = true,
           replied_at = NOW()
       WHERE id = $1`,
      [messageId]
    );

    res.json({
      success: true,
      message: '已标记为已回复'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '标记失败'
    });
  }
});

export default router;
