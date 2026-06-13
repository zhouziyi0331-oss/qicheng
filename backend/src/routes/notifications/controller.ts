/**
 * 通知控制器
 */

import { Request, Response } from 'express';
import { query } from '../../utils/db';
import { AuthRequest } from '../../middleware/auth';
import {
  sendNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  NotificationType,
  NotificationChannel
} from '../../services/notification';

/**
 * 获取用户通知列表
 */
export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, type, isRead } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let queryStr = `
      SELECT id, type, title, content, data, priority, is_read, created_at, read_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      queryStr += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (isRead !== undefined) {
      queryStr += ` AND is_read = $${paramIndex}`;
      params.push(isRead === 'true');
      paramIndex++;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await query(queryStr, params);

    let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE user_id = $1`;
    const countParams: any[] = [userId];
    let countParamIndex = 2;

    if (type) {
      countQuery += ` AND type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }

    if (isRead !== undefined) {
      countQuery += ` AND is_read = $${countParamIndex}`;
      countParams.push(isRead === 'true');
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(String(countResult[0].total), 10);

    res.json({
      success: true,
      data: {
        notifications: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: '获取通知列表失败' });
  }
}

export async function getUnreadCountHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    const count = await getUnreadCount(userId);
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: '获取未读数量失败' });
  }
}

export async function markNotificationAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    await markAsRead(notificationId, userId);
    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: '标记失败' });
  }
}

export async function markAllNotificationsAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    await markAllAsRead(userId);
    res.json({ success: true, message: '已全部标记为已读' });
  } catch (error) {
    logger.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: '标记失败' });
  }
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    await query(`DELETE FROM notifications WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
}

export async function updateNotificationPreferences(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { preferences } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ success: false, message: '无效的偏好设置' });
    }
    await query(`UPDATE users SET notification_preferences = $1 WHERE id = $2`, [JSON.stringify(preferences), userId]);
    res.json({ success: true, message: '偏好设置已更新' });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
}

export async function getNotificationPreferences(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    const result = await query(`SELECT notification_preferences FROM users WHERE id = $1`, [userId]);
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    const preferences = result[0].notification_preferences || {
      in_app: true,
      sms: { task_matched: true, task_approved: true, payment_success: true, withdrawal_approved: true },
      email: { task_rejected: true, dispute_resolved: true, system_announcement: true },
      wechat: { task_matched: true, task_submitted: true, payment_success: true }
    };
    res.json({ success: true, data: { preferences } });
  } catch (error) {
    logger.error('Get preferences error:', error);
    res.status(500).json({ success: false, message: '获取偏好设置失败' });
  }
}
