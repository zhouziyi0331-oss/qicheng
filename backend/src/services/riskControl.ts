/**
 * P2安全功能：防刷单风控系统
 *
 * 功能：
 * 1. 检测异常交易模式
 * 2. 限制交易频率
 * 3. 风险评分
 * 4. 自动/人工审核
 */

import { query } from '../utils/db';
import logger from '../utils/logger';
import redis from '../utils/redis';

export interface RiskCheckResult {
  allowed: boolean;
  riskScore: number; // 0-100，越高越危险
  reasons: string[];
  action: 'allow' | 'review' | 'block';
}

/**
 * 检查交易风险
 */
export async function checkTransactionRisk(
  studentId: string,
  enterpriseId: string,
  taskId: string
): Promise<RiskCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  // 1. 检查同一对学生-企业的交易频率
  const recentTransactions = await query<any>(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1
     AND client_id = $2
     AND created_at > NOW() - INTERVAL '24 hours'`,
    [studentId, enterpriseId]
  );

  if (recentTransactions[0].count >= 1) {
    riskScore += 50;
    reasons.push('同一对学生-企业24小时内已有交易');
  }

  // 2. 检查学生短时间内接单数量
  const studentOrders = await query<any>(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1
     AND created_at > NOW() - INTERVAL '1 hour'`,
    [studentId]
  );

  if (studentOrders[0].count >= 3) {
    riskScore += 30;
    reasons.push('学生1小时内接单超过3个');
  }

  // 3. 检查企业短时间内发单数量
  const enterpriseOrders = await query<any>(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE client_id = $1
     AND created_at > NOW() - INTERVAL '1 hour'`,
    [enterpriseId]
  );

  if (enterpriseOrders[0].count >= 5) {
    riskScore += 30;
    reasons.push('企业1小时内发单超过5个');
  }

  // 4. 检查是否有异常评分模式
  const quickFinishOrders = await query<any>(
    `SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1
     AND client_id = $2
     AND status = 'completed'
     AND completed_at - accepted_at < INTERVAL '1 hour'`,
    [studentId, enterpriseId]
  );

  if (quickFinishOrders[0].count >= 2) {
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
 * 记录风险事件
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
}

/**
 * 添加到黑名单
 */
export async function addToBlacklist(userId: string, reason: string, durationDays: number = 30) {
  await redis.sadd('risk:blacklist', userId);
  await redis.expire('risk:blacklist', durationDays * 24 * 60 * 60);

  logger.warn('用户加入黑名单:', { userId, reason, durationDays });
}
