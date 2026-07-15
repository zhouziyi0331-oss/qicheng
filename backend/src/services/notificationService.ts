/**
 * 通知消息服务
 *
 * 提供完整的消息推送、管理和统计功能
 */

import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================

export interface Notification {
  id: string;
  user_id: string;
  user_type: string;
  type: string;
  category: string;
  title: string;
  content: string;
  icon?: string;
  data?: any;
  actions?: any[];
  priority: string;
  channels: string[];
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
  expires_at?: Date;
}

export interface NotificationTemplate {
  id: string;
  template_key: string;
  template_name: string;
  title_template: string;
  content_template: string;
  icon?: string;
  user_type: string;
  type: string;
  category: string;
  priority: string;
  default_channels: string[];
  actions_template: any[];
  variables: string[];
}

export interface SendNotificationParams {
  userId: string;
  templateKey: string;
  variables?: Record<string, any>;
  relatedTaskId?: string;
  relatedUserId?: string;
  scheduledAt?: Date;
}

export interface NotificationSettings {
  user_id: string;
  in_app_enabled: boolean;
  wechat_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  mentor_messages_enabled: boolean;
  task_updates_enabled: boolean;
  milestones_enabled: boolean;
  warnings_enabled: boolean;
  recommendations_enabled: boolean;
}

// =====================================================
// 通知服务类
// =====================================================

class NotificationService {
  /**
   * 发送通知（基于模板）
   */
  async sendNotification(params: SendNotificationParams): Promise<Notification> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 检查用户通知设置
      const settings = await this.getUserSettings(params.userId);
      if (!this.shouldSendNotification(params.templateKey, settings)) {
        logger.info('Notification blocked by user settings', { userId: params.userId, templateKey: params.templateKey });
        await client.query('ROLLBACK');
        return null as any;
      }

      // 使用数据库函数发送通知
      const result = await client.query(
        `SELECT send_notification($1, $2, $3) as notification_id`,
        [params.userId, params.templateKey, JSON.stringify(params.variables || {})]
      );

      const notificationId = result.rows[0].notification_id;

      // 更新关联信息
      if (params.relatedTaskId || params.relatedUserId || params.scheduledAt) {
        await client.query(
          `UPDATE notifications
           SET related_task_id = $1, related_user_id = $2, scheduled_at = $3
           WHERE id = $4`,
          [params.relatedTaskId, params.relatedUserId, params.scheduledAt, notificationId]
        );
      }

      // 获取完整通知信息
      const notification = await client.query(
        `SELECT * FROM notifications WHERE id = $1`,
        [notificationId]
      );

      await client.query('COMMIT');

      // 异步推送到各个渠道
      this.pushToChannels(notification.rows[0]).catch(error => {
        logger.error('Failed to push notification', { error, notificationId });
      });

      logger.info('Notification sent', { notificationId, userId: params.userId, templateKey: params.templateKey });
      return notification.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 批量发送通知
   */
  async sendBulkNotifications(notifications: SendNotificationParams[]): Promise<Notification[]> {
    const results: Notification[] = [];

    for (const params of notifications) {
      try {
        const notification = await this.sendNotification(params);
        if (notification) {
          results.push(notification);
        }
      } catch (error: any) {
        logger.error('Failed to send notification in bulk', { error, params });
      }
    }

    return results;
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(
    userId: string,
    options: {
      isRead?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const client = await pool.connect();
    try {
      let query = `SELECT * FROM notifications WHERE user_id = $1`;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (options.isRead !== undefined) {
        query += ` AND is_read = $${paramIndex}`;
        params.push(options.isRead);
        paramIndex++;
      }

      if (options.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(options.category);
        paramIndex++;
      }

      query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
      query += ` ORDER BY created_at DESC`;

      if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(options.limit);
        paramIndex++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(options.offset);
      }

      const result = await client.query(query, params);

      // 获取总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = $2`,
        [userId, options.isRead !== undefined ? options.isRead : false]
      );

      return {
        notifications: result.rows,
        total: parseInt(countResult.rows[0].count),
      };
    } finally {
      client.release();
    }
  }

  /**
   * 获取未读消息统计
   */
  async getUnreadCount(userId: string): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM user_unread_notifications WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0] || {
        unread_count: 0,
        urgent_count: 0,
        high_count: 0,
        chat_count: 0,
        progress_count: 0,
        achievement_count: 0,
        alert_count: 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * 标记通知已读
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT mark_notification_read($1) as success`,
        [notificationId]
      );

      return result.rows[0].success;
    } finally {
      client.release();
    }
  }

  /**
   * 批量标记已读
   */
  async markAllAsRead(userId: string): Promise<number> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT mark_all_notifications_read($1) as count`,
        [userId]
      );

      return result.rows[0].count;
    } finally {
      client.release();
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM notifications WHERE id = $1`,
        [notificationId]
      );

      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  /**
   * 获取用户通知设置
   */
  async getUserSettings(userId: string): Promise<NotificationSettings> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM user_notification_settings WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        // 创建默认设置
        const createResult = await client.query(
          `INSERT INTO user_notification_settings (user_id)
           VALUES ($1)
           RETURNING *`,
          [userId]
        );
        return createResult.rows[0];
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 更新用户通知设置
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const client = await pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(settings).forEach(([key, value]) => {
        if (key !== 'user_id' && value !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (fields.length === 0) {
        return this.getUserSettings(userId);
      }

      values.push(userId);
      const result = await client.query(
        `UPDATE user_notification_settings
         SET ${fields.join(', ')}, updated_at = NOW()
         WHERE user_id = $${paramIndex}
         RETURNING *`,
        values
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 检查是否应该发送通知
   */
  private shouldSendNotification(templateKey: string, settings: NotificationSettings): boolean {
    // 检查分类开关
    if (templateKey.includes('mentor') && !settings.mentor_messages_enabled) {
      return false;
    }
    if (templateKey.includes('task') && !settings.task_updates_enabled) {
      return false;
    }
    if (templateKey.includes('milestone') && !settings.milestones_enabled) {
      return false;
    }
    if (templateKey.includes('warning') && !settings.warnings_enabled) {
      return false;
    }
    if (templateKey.includes('recommendation') && !settings.recommendations_enabled) {
      return false;
    }

    return true;
  }

  /**
   * 推送到各个渠道
   */
  private async pushToChannels(notification: Notification): Promise<void> {
    const channels = notification.channels || ['in_app'];

    for (const channel of channels) {
      try {
        await this.pushToChannel(channel, notification);
      } catch (error: any) {
        logger.error('Failed to push to channel', { error, channel, notificationId: notification.id });
      }
    }
  }

  /**
   * 推送到具体渠道
   */
  private async pushToChannel(channel: string, notification: Notification): Promise<void> {
    const client = await pool.connect();
    try {
      // 记录推送日志
      await client.query(
        `INSERT INTO notification_push_logs (notification_id, channel, status)
         VALUES ($1, $2, 'pending')`,
        [notification.id, channel]
      );

      switch (channel) {
        case 'in_app':
          await this.pushInApp(notification);
          break;
        case 'wechat':
          await this.pushWechat(notification);
          break;
        case 'sms':
          await this.pushSMS(notification);
          break;
        case 'email':
          await this.pushEmail(notification);
          break;
      }

      // 更新推送状态
      await client.query(
        `UPDATE notification_push_logs
         SET status = 'sent', sent_at = NOW()
         WHERE notification_id = $1 AND channel = $2`,
        [notification.id, channel]
      );
    } catch (error: any) {
      // 记录失败
      await client.query(
        `UPDATE notification_push_logs
         SET status = 'failed', failed_at = NOW(), error_message = $3
         WHERE notification_id = $1 AND channel = $2`,
        [notification.id, channel, error instanceof Error ? error.message : 'Unknown error']
      );
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 小程序内推送（WebSocket）
   */
  private async pushInApp(notification: Notification): Promise<void> {
    // TODO: 实现WebSocket推送
    logger.info('Push in-app notification', { notificationId: notification.id });
  }

  /**
   * 微信服务号推送
   */
  private async pushWechat(notification: Notification): Promise<void> {
    // TODO: 实现微信模板消息推送
    logger.info('Push wechat notification', { notificationId: notification.id });
  }

  /**
   * 短信推送
   */
  private async pushSMS(notification: Notification): Promise<void> {
    // TODO: 实现短信推送
    logger.info('Push SMS notification', { notificationId: notification.id });
  }

  /**
   * 邮件推送
   */
  private async pushEmail(notification: Notification): Promise<void> {
    // TODO: 实现邮件推送
    logger.info('Push email notification', { notificationId: notification.id });
  }

  /**
   * 获取通知模板
   */
  async getTemplate(templateKey: string): Promise<NotificationTemplate | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM notification_templates WHERE template_key = $1 AND is_active = true`,
        [templateKey]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * 获取所有模板
   */
  async getAllTemplates(userType?: string): Promise<NotificationTemplate[]> {
    const client = await pool.connect();
    try {
      let query = `SELECT * FROM notification_templates WHERE is_active = true`;
      const params: any[] = [];

      if (userType) {
        query += ` AND user_type = $1`;
        params.push(userType);
      }

      query += ` ORDER BY user_type, type, template_key`;

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

export const notificationService = new NotificationService();
