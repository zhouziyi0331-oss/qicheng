import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * 异常监控和告警中间件
 *
 * 功能：
 * 1. 捕获所有未处理的错误
 * 2. 记录详细错误日志
 * 3. 监控错误率
 * 4. 发送告警通知
 */

// 错误统计
let errorStats = {
  count: 0,
  lastReset: Date.now(),
  errors: [] as Array<{ timestamp: number; message: string; path: string; statusCode: number }>,
};

// 每小时重置错误统计
setInterval(() => {
  const errorRate = errorStats.count;

  // 如果错误率过高，发送告警
  if (errorRate > 100) {
    sendAlert('high_error_rate', `过去1小时有${errorRate}个错误`);
  }

  // 重置统计
  errorStats = {
    count: 0,
    lastReset: Date.now(),
    errors: [],
  };
}, 60 * 60 * 1000); // 1小时

/**
 * 发送告警通知
 */
async function sendAlert(type: string, message: string): Promise<void> {
  logger.error(`🚨 [ALERT] ${type}: ${message}`);

  // TODO: 集成企业微信/钉钉机器人
  // 示例：企业微信机器人
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: `🚨 启程项目告警\n\n类型: ${type}\n消息: ${message}\n时间: ${new Date().toLocaleString('zh-CN')}`,
        },
      }),
    });

    if (!response.ok) {
      logger.error('发送告警失败:', response.statusText);
    }
  } catch (error) {
    logger.error('发送告警异常:', error);
  }
}

/**
 * 全局错误处理中间件
 */
export function errorMonitor(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 记录错误统计
  errorStats.count++;
  errorStats.errors.push({
    timestamp: Date.now(),
    message: err.message || 'Unknown error',
    path: req.path,
    statusCode: err.statusCode || 500,
  });

  // 记录详细日志
  logger.error('API Error:', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    user: req.user?.userId,
    ip: req.ip,
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      code: err.code,
    },
  });

  // 检查是否需要立即告警
  const recentErrors = errorStats.errors.filter(
    e => Date.now() - e.timestamp < 5 * 60 * 1000 // 5分钟内
  );

  // 5分钟内超过50个500错误，立即告警
  const critical500Errors = recentErrors.filter(e => e.statusCode >= 500);
  if (critical500Errors.length > 50) {
    sendAlert('critical_error_rate', `5分钟内有${critical500Errors.length}个500错误！`);
  }

  // 返回错误响应
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 获取错误统计
 */
export function getErrorStats() {
  const now = Date.now();
  const uptimeHours = (now - errorStats.lastReset) / (60 * 60 * 1000);

  return {
    totalErrors: errorStats.count,
    errorRate: Math.round(errorStats.count / uptimeHours),
    recentErrors: errorStats.errors.slice(-10), // 最近10个错误
    lastReset: new Date(errorStats.lastReset).toISOString(),
  };
}
