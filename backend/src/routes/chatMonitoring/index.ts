import express from 'express';
import chatScopeMonitoringService from '../../services/chatScopeMonitoringService';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/chat-monitoring/monitor
 * 监测消息（实时）
 */
router.post('/monitor', authenticate, async (req, res) => {
  try {
    const senderId = (req as any).user.id;
    const senderRole = (req as any).user.role;

    const { taskId, messageContent, taskContext } = req.body;

    if (!taskId || !messageContent) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: taskId, messageContent',
      });
    }

    const alert = await chatScopeMonitoringService.monitorMessage({
      taskId,
      senderId,
      senderRole,
      messageContent,
      taskContext,
    });

    res.json({
      success: true,
      data: {
        has_alert: !!alert,
        alert,
      },
    });
  } catch (error: any) {
    logger.error('监测消息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '监测消息失败',
    });
  }
});

/**
 * GET /api/chat-monitoring/tasks/:taskId/alerts
 * 获取任务的警报列表
 */
router.get('/tasks/:taskId/alerts', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.query;
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
        message: '无权查看警报',
      });
    }

    const alerts = await chatScopeMonitoringService.getTaskAlerts(
      taskId,
      status as string | undefined
    );

    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
      },
    });
  } catch (error: any) {
    logger.error('获取警报失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取警报失败',
    });
  }
});

/**
 * POST /api/chat-monitoring/alerts/:alertId/acknowledge
 * 用户确认警报
 */
router.post('/alerts/:alertId/acknowledge', authenticate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = (req as any).user.id;
    const { action } = req.body;

    if (!action || !['accepted', 'ignored', 'reported'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action必须是: accepted, ignored, 或 reported',
      });
    }

    // 验证警报归属（可选，取决于业务需求）
    const alertCheck = await req.app.locals.pool.query(
      `SELECT csa.*, t.company_id, t.student_id
       FROM chat_scope_alerts csa
       JOIN tasks t ON csa.task_id = t.id
       WHERE csa.id = $1`,
      [alertId]
    );

    if (alertCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '警报不存在',
      });
    }

    const alert = alertCheck.rows[0];
    const hasAccess = alert.company_id === userId || alert.student_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权操作该警报',
      });
    }

    await chatScopeMonitoringService.acknowledgeAlert(alertId, userId, action);

    res.json({
      success: true,
      message: '警报已确认',
    });
  } catch (error: any) {
    logger.error('确认警报失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '确认警报失败',
    });
  }
});

/**
 * GET /api/chat-monitoring/tasks/:taskId/stats
 * 获取任务的监测统计
 */
router.get('/tasks/:taskId/stats', authenticate, async (req, res) => {
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
        message: '无权查看统计',
      });
    }

    const stats = await chatScopeMonitoringService.getMonitoringStats(taskId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取监测统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取统计失败',
    });
  }
});

/**
 * GET /api/chat-monitoring/rules
 * 获取监测规则
 */
router.get('/rules', authenticate, async (req, res) => {
  try {
    const rules = await chatScopeMonitoringService.getMonitoringRules();

    res.json({
      success: true,
      data: {
        rules,
        total: rules.length,
      },
    });
  } catch (error: any) {
    logger.error('获取监测规则失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取规则失败',
    });
  }
});

export default router;
