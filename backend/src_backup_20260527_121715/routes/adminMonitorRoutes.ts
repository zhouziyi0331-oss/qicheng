import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getQueueStats } from '../services/aiTaskQueue';
import websocketService from '../services/websocketService';
import logger from '../utils/logger';

const router = Router();

/**
 * 获取AI任务队列统计
 * GET /api/v1/admin/queue-stats
 */
router.get('/queue-stats', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // 只允许管理员访问
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const stats = await getQueueStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    res.status(500).json({ error: '获取队列统计失败' });
  }
});

/**
 * 获取WebSocket连接统计
 * GET /api/v1/admin/websocket-stats
 */
router.get('/websocket-stats', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const stats = {
      onlineUserCount: websocketService.getOnlineUserCount(),
      onlineUsers: websocketService.getOnlineUsers()
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get WebSocket stats:', error);
    res.status(500).json({ error: '获取WebSocket统计失败' });
  }
});

/**
 * 测试WebSocket推送
 * POST /api/v1/admin/test-websocket
 */
router.post('/test-websocket', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: '无权访问' });
    }

    const { userId, event, data } = req.body;

    if (!userId || !event) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    websocketService.pushToUser(userId, event, data || {});

    res.json({
      success: true,
      message: `已推送消息给用户 ${userId}`
    });
  } catch (error) {
    logger.error('Failed to test WebSocket:', error);
    res.status(500).json({ error: '测试WebSocket失败' });
  }
});

export default router;
