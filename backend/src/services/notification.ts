/**
 * 消息推送通知服务
 * 支持站内信、短信、邮件、微信模板消息
 */

import { query, QueryResult } from '../utils/db';
import logger from '../utils/logger';
import axios from 'axios';

// 通知类型
export enum NotificationType {
  TASK_MATCHED = 'task_matched',           // 任务匹配成功
  TASK_ACCEPTED = 'task_accepted',         // 任务被接受
  TASK_SUBMITTED = 'task_submitted',       // 任务已提交
  TASK_APPROVED = 'task_approved',         // 任务已通过
  TASK_REJECTED = 'task_rejected',         // 任务被拒绝
  AMENDMENT_CREATED = 'amendment_created', // 追加需求
  AMENDMENT_ACCEPTED = 'amendment_accepted', // 追加需求被接受
  DISPUTE_CREATED = 'dispute_created',     // 申诉创建
  DISPUTE_RESOLVED = 'dispute_resolved',   // 申诉已解决
  PAYMENT_SUCCESS = 'payment_success',     // 支付成功
  WITHDRAWAL_APPROVED = 'withdrawal_approved', // 提现已批准
  LEVEL_UP = 'level_up',                   // 等级提升
  MENTOR_MESSAGE = 'mentor_message',       // AI导师消息
  SYSTEM_ANNOUNCEMENT = 'system_announcement' // 系统公告
}

// 通知渠道
export enum NotificationChannel {
  IN_APP = 'in_app',       // 站内信
  SMS = 'sms',             // 短信
  EMAIL = 'email',         // 邮件
  WECHAT = 'wechat'        // 微信模板消息
}

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  channels: NotificationChannel[];
  data?: any; // 额外数据（如任务ID、金额等）
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

/**
 * 发送通知（多渠道）
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { userId, type, title, content, channels, data, priority = 'normal' } = payload;

  // 1. 保存站内信（所有通知都保存）
  await saveInAppNotification(userId, type, title, content, data, priority);

  // 2. 根据用户偏好和通知类型发送其他渠道
  const userPreferences = await getUserNotificationPreferences(userId);

  for (const channel of channels) {
    if (shouldSendToChannel(channel, type, userPreferences)) {
      try {
        switch (channel) {
          case NotificationChannel.SMS:
            await sendSMS(userId, content);
            break;
          case NotificationChannel.EMAIL:
            await sendEmail(userId, title, content);
            break;
          case NotificationChannel.WECHAT:
            await sendWechatTemplateMessage(userId, type, data);
            break;
        }
      } catch (error) {
        logger.error(`Failed to send ${channel} notification:`, error);
        // 不阻塞其他渠道发送
      }
    }
  }
}

/**
 * 保存站内信
 */
async function saveInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  content: string,
  data: any,
  priority: string
): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, type, title, content, data, priority, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
    [userId, type, title, content, JSON.stringify(data || {}), priority]
  );
}

/**
 * 获取用户通知偏好
 */
async function getUserNotificationPreferences(userId: string): Promise<any> {
  const result = await query(
    `SELECT notification_preferences FROM users WHERE id = $1`,
    [userId]
  );

  if (result.length === 0) {
    return getDefaultPreferences();
  }

  return result[0].notification_preferences || getDefaultPreferences();
}

/**
 * 默认通知偏好
 */
function getDefaultPreferences() {
  return {
    in_app: true,
    sms: {
      task_matched: true,
      task_approved: true,
      payment_success: true,
      withdrawal_approved: true
    },
    email: {
      task_rejected: true,
      dispute_resolved: true,
      system_announcement: true
    },
    wechat: {
      task_matched: true,
      task_submitted: true,
      payment_success: true
    }
  };
}

/**
 * 判断是否应该发送到该渠道
 */
function shouldSendToChannel(
  channel: NotificationChannel,
  type: NotificationType,
  preferences: any
): boolean {
  if (channel === NotificationChannel.IN_APP) {
    return true; // 站内信总是发送
  }

  return preferences[channel]?.[type] !== false;
}

/**
 * 发送短信
 */
async function sendSMS(userId: string, content: string): Promise<void> {
  // 获取用户手机号
  const userResult = await query(
    `SELECT phone FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.length === 0 || !userResult[0].phone) {
    throw new Error('User phone not found');
  }

  const phone = userResult[0].phone;

  // 调用阿里云短信服务（示例）
  // 实际使用时需要配置阿里云AccessKey
  const SMS_API_URL = process.env.SMS_API_URL || 'https://dysmsapi.aliyuncs.com';
  const ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID;
  const ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET;

  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
    logger.warn('SMS credentials not configured, skipping SMS');
    return;
  }

  // 这里简化处理，实际需要使用阿里云SDK
  logger.info(`[SMS] Sending to ${phone}: ${content}`);

  // 记录短信发送日志
  await query(
    `INSERT INTO notification_logs (user_id, channel, phone, content, status, sent_at)
     VALUES ($1, 'sms', $2, $3, 'sent', NOW())`,
    [userId, phone, content]
  );
}

/**
 * 发送邮件
 */
async function sendEmail(userId: string, subject: string, content: string): Promise<void> {
  // 获取用户邮箱
  const userResult = await query(
    `SELECT email FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.length === 0 || !userResult[0].email) {
    throw new Error('User email not found');
  }

  const email = userResult[0].email;

  // 调用邮件服务（示例：使用SendGrid或阿里云邮件推送）
  const EMAIL_API_URL = process.env.EMAIL_API_URL;
  const EMAIL_API_KEY = process.env.EMAIL_API_KEY;

  if (!EMAIL_API_KEY) {
    logger.warn('Email credentials not configured, skipping email');
    return;
  }

  logger.info(`[EMAIL] Sending to ${email}: ${subject}`);

  // 记录邮件发送日志
  await query(
    `INSERT INTO notification_logs (user_id, channel, email, content, status, sent_at)
     VALUES ($1, 'email', $2, $3, 'sent', NOW())`,
    [userId, email, JSON.stringify({ subject, content })]
  );
}

/**
 * 发送微信模板消息
 */
async function sendWechatTemplateMessage(
  userId: string,
  type: NotificationType,
  data: any
): Promise<void> {
  // 获取用户微信openid
  const userResult = await query(
    `SELECT wechat_openid FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.length === 0 || !userResult[0].wechat_openid) {
    throw new Error('User wechat_openid not found');
  }

  const openid = userResult[0].wechat_openid;

  // 获取微信access_token
  const accessToken = await getWechatAccessToken();

  // 根据通知类型选择模板ID
  const templateId = getWechatTemplateId(type);

  // 构造模板消息数据
  const templateData = buildWechatTemplateData(type, data);

  // 调用微信API发送模板消息
  const WECHAT_API_URL = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;

  try {
    const response = await axios.post(WECHAT_API_URL, {
      touser: openid,
      template_id: templateId,
      url: data.url || '', // 点击跳转链接
      data: templateData
    });

    if (response.data.errcode !== 0) {
      throw new Error(`Wechat API error: ${response.data.errmsg}`);
    }

    logger.info(`[WECHAT] Template message sent to ${openid}`);

    // 记录发送日志
    await query(
      `INSERT INTO notification_logs (user_id, channel, wechat_openid, content, status, sent_at)
       VALUES ($1, 'wechat', $2, $3, 'sent', NOW())`,
      [userId, openid, JSON.stringify({ type, data })]
    );
  } catch (error) {
    logger.error('Failed to send wechat template message:', error);
    throw error;
  }
}

/**
 * 获取微信access_token（带缓存）
 */
let cachedAccessToken: string | null = null;
let tokenExpireTime: number = 0;

async function getWechatAccessToken(): Promise<string> {
  const now = Date.now();

  // 如果缓存未过期，直接返回
  if (cachedAccessToken && now < tokenExpireTime) {
    return cachedAccessToken;
  }

  // 重新获取access_token
  const APPID = process.env.WECHAT_APPID;
  const SECRET = process.env.WECHAT_SECRET;

  if (!APPID || !SECRET) {
    throw new Error('Wechat credentials not configured');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;

  const response = await axios.get(url);

  if (response.data.errcode) {
    throw new Error(`Failed to get access_token: ${response.data.errmsg}`);
  }

  cachedAccessToken = response.data.access_token;
  tokenExpireTime = now + (response.data.expires_in - 300) * 1000; // 提前5分钟过期

  return cachedAccessToken!;
}

/**
 * 获取微信模板ID
 */
function getWechatTemplateId(type: NotificationType): string {
  const templates: Record<NotificationType, string> = {
    [NotificationType.TASK_MATCHED]: process.env.WECHAT_TEMPLATE_TASK_MATCHED || '',
    [NotificationType.TASK_SUBMITTED]: process.env.WECHAT_TEMPLATE_TASK_SUBMITTED || '',
    [NotificationType.TASK_APPROVED]: process.env.WECHAT_TEMPLATE_TASK_APPROVED || '',
    [NotificationType.PAYMENT_SUCCESS]: process.env.WECHAT_TEMPLATE_PAYMENT_SUCCESS || '',
    // 其他类型...
    [NotificationType.TASK_ACCEPTED]: '',
    [NotificationType.TASK_REJECTED]: '',
    [NotificationType.AMENDMENT_CREATED]: '',
    [NotificationType.AMENDMENT_ACCEPTED]: '',
    [NotificationType.DISPUTE_CREATED]: '',
    [NotificationType.DISPUTE_RESOLVED]: '',
    [NotificationType.WITHDRAWAL_APPROVED]: '',
    [NotificationType.LEVEL_UP]: '',
    [NotificationType.MENTOR_MESSAGE]: '',
    [NotificationType.SYSTEM_ANNOUNCEMENT]: ''
  };

  return templates[type];
}

/**
 * 构造微信模板消息数据
 */
function buildWechatTemplateData(type: NotificationType, data: any): any {
  switch (type) {
    case NotificationType.TASK_MATCHED:
      return {
        first: { value: '您有新的任务匹配！', color: '#173177' },
        keyword1: { value: data.taskTitle || '未知任务', color: '#173177' },
        keyword2: { value: `¥${data.budget || 0}`, color: '#FF6B35' },
        keyword3: { value: data.deadline || '未设置', color: '#173177' },
        remark: { value: '点击查看任务详情', color: '#999999' }
      };

    case NotificationType.TASK_SUBMITTED:
      return {
        first: { value: '学生已提交任务', color: '#173177' },
        keyword1: { value: data.taskTitle || '未知任务', color: '#173177' },
        keyword2: { value: data.studentName || '未知学生', color: '#173177' },
        keyword3: { value: new Date().toLocaleString('zh-CN'), color: '#173177' },
        remark: { value: '请及时审核', color: '#999999' }
      };

    case NotificationType.PAYMENT_SUCCESS:
      return {
        first: { value: '支付成功', color: '#173177' },
        keyword1: { value: `¥${data.amount || 0}`, color: '#FF6B35' },
        keyword2: { value: data.orderNo || '', color: '#173177' },
        keyword3: { value: new Date().toLocaleString('zh-CN'), color: '#173177' },
        remark: { value: '感谢您的使用', color: '#999999' }
      };

    default:
      return {
        first: { value: data.title || '系统通知', color: '#173177' },
        remark: { value: data.content || '', color: '#999999' }
      };
  }
}

/**
 * 批量发送通知
 */
export async function sendBatchNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  content: string,
  channels: NotificationChannel[],
  data?: any
): Promise<void> {
  const promises = userIds.map(userId =>
    sendNotification({ userId, type, title, content, channels, data })
  );

  await Promise.allSettled(promises);
}

/**
 * 获取用户未读通知数量
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  return parseInt(String(result[0].count), 10);
}

/**
 * 标记通知为已读
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
}
