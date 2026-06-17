/**
 * P2安全功能：防刷单风控系统
 * 真实实现 - 所有数据真实保存到数据库和Redis
 */

import { query } from '../utils/db';
import logger from '../utils/logger';
import redis from '../utils/redis';

export interface RiskCheckResult {
  allowed: boolean;
  riskScore: number;
  reasons: string[];
  action: 'allow' | 'review' | 'block';
}

/**
 * 检查交易风险 - 真实查询数据库
 */
export async function checkTransactionRisk(
  studentId: string,
  enterpriseId: string,
  taskId: string
): Promise<RiskCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  // 1. 检查同一对学生-企业的24小时内交易
  const recentTransactions = await query<any>(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1 AND client_id = $2
     AND created_at > NOW() - INTERVAL '24 hours'`,
    [studentId, enterpriseId]
  );

  if (parseInt(recentTransactions[0].count) >= 1) {
    riskScore += 50;
    reasons.push('同一对学生-企业24小时内已有交易');
  }

  // 2. 检查学生1小时内接单数
  const studentOrders = await query<any>(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [studentId]
  );

  if (parseInt(studentOrders[0].count) >= 3) {
    riskScore += 30;
    reasons.push('学生1小时内接单超过3个');
  }

  // 3. 检查企业1小时内发单数
  const enterpriseOrders = await query<any>(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE client_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [enterpriseId]
  );

  if (parseInt(enterpriseOrders[0].count) >= 5) {
    riskScore += 30;
    reasons.push('企业1小时内发单超过5个');
  }

  // 4. 检查是否有快速完成的订单
  const quickFinishOrders = await query<any>(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1 AND client_id = $2
     AND status = 'completed'
     AND completed_at - accepted_at < INTERVAL '1 hour'`,
    [studentId, enterpriseId]
  );

  if (parseInt(quickFinishOrders[0].count) >= 2) {
    riskScore += 40;
    reasons.push('存在多个1小时内完成的订单');
  }

  // 5. 检查Redis黑名单
  const isBlacklisted = await redis.sismember('risk:blacklist', studentId);
  if (isBlacklisted) {
    riskScore = 100;
    reasons.push('用户在风控黑名单中');
  }

  // 决策
  let action: 'allow' | 'review' | 'block';
  if (riskScore >= 80) {
    action = 'block';
  } else if (riskScore >= 50) {
    action = 'review';
  } else {
    action = 'allow';
  }

  logger.info('交易风控检查:', {
    studentId,
    enterpriseId,
    taskId,
    riskScore,
    action,
    reasons,
  });

  return {
    allowed: action === 'allow',
    riskScore,
    reasons,
    action,
  };
}

/**
 * 记录风险事件到数据库 - 真实保存
 */
export async function recordRiskEvent(
  studentId: string,
  enterpriseId: string,
  taskId: string,
  riskCheck: RiskCheckResult
) {
  await query(
    `INSERT INTO risk_events (student_id, enterprise_id, task_id, risk_score, reasons, action, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [studentId, enterpriseId, taskId, riskCheck.riskScore, JSON.stringify(riskCheck.reasons), riskCheck.action]
  );

  logger.info('风险事件已记录:', { studentId, enterpriseId, taskId, action: riskCheck.action });
}

/**
 * 添加到黑名单 - 真实保存到Redis
 */
export async function addToBlacklist(userId: string, reason: string, durationDays: number = 30) {
  await redis.sadd('risk:blacklist', userId);
  await redis.expire(`risk:blacklist:${userId}`, durationDays * 24 * 60 * 60);

  // 同时记录到数据库
  await query(
    `INSERT INTO risk_blacklist (user_id, reason, duration_days, created_at, expires_at)
     VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '${durationDays} days')`,
    [userId, reason, durationDays]
  );

  logger.warn('用户已加入黑名单:', { userId, reason, durationDays });
}

/**
 * 从黑名单移除 - 真实删除
 */
export async function removeFromBlacklist(userId: string) {
  await redis.srem('risk:blacklist', userId);
  await query(
    `UPDATE risk_blacklist SET removed_at = NOW() WHERE user_id = $1 AND removed_at IS NULL`,
    [userId]
  );

  logger.info('用户已从黑名单移除:', { userId });
}
