"use strict";
/**
 * P2安全功能：防刷单风控系统
 *
 * 功能：
 * 1. 检测异常交易模式
 * 2. 限制交易频率
 * 3. 风险评分
 * 4. 自动/人工审核
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTransactionRisk = checkTransactionRisk;
exports.recordRiskEvent = recordRiskEvent;
exports.addToBlacklist = addToBlacklist;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const redis_1 = __importDefault(require("../utils/redis"));
/**
 * 检查交易风险
 */
async function checkTransactionRisk(studentId, enterpriseId, taskId) {
    const reasons = [];
    let riskScore = 0;
    // 1. 检查同一对学生-企业的交易频率
    const recentTransactions = await (0, db_1.query)(`SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1
     AND client_id = $2
     AND created_at > NOW() - INTERVAL '24 hours'`, [studentId, enterpriseId]);
    if (recentTransactions[0].count >= 1) {
        riskScore += 50;
        reasons.push('同一对学生-企业24小时内已有交易');
    }
    // 2. 检查学生短时间内接单数量
    const studentOrders = await (0, db_1.query)(`SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1
     AND created_at > NOW() - INTERVAL '1 hour'`, [studentId]);
    if (studentOrders[0].count >= 3) {
        riskScore += 30;
        reasons.push('学生1小时内接单超过3个');
    }
    // 3. 检查企业短时间内发单数量
    const enterpriseOrders = await (0, db_1.query)(`SELECT COUNT(*) as count
     FROM orders
     WHERE client_id = $1
     AND created_at > NOW() - INTERVAL '1 hour'`, [enterpriseId]);
    if (enterpriseOrders[0].count >= 5) {
        riskScore += 30;
        reasons.push('企业1小时内发单超过5个');
    }
    // 4. 检查是否有异常评分模式
    const quickFinishOrders = await (0, db_1.query)(`SELECT COUNT(*) as count
     FROM orders
     WHERE student_id = $1
     AND client_id = $2
     AND status = 'completed'
     AND completed_at - accepted_at < INTERVAL '1 hour'`, [studentId, enterpriseId]);
    if (quickFinishOrders[0].count >= 2) {
        riskScore += 40;
        reasons.push('存在多个1小时内完成的订单');
    }
    // 5. 检查Redis黑名单
    const isBlacklisted = await redis_1.default.sismember('risk:blacklist', studentId);
    if (isBlacklisted) {
        riskScore = 100;
        reasons.push('用户在风控黑名单中');
    }
    // 决策
    let action;
    if (riskScore >= 80) {
        action = 'block';
    }
    else if (riskScore >= 50) {
        action = 'review';
    }
    else {
        action = 'allow';
    }
    logger_1.default.info('交易风控检查:', {
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
async function recordRiskEvent(studentId, enterpriseId, taskId, riskCheck) {
    await (0, db_1.query)(`INSERT INTO risk_events (student_id, enterprise_id, task_id, risk_score, reasons, action, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [studentId, enterpriseId, taskId, riskCheck.riskScore, JSON.stringify(riskCheck.reasons), riskCheck.action]);
}
/**
 * 添加到黑名单
 */
async function addToBlacklist(userId, reason, durationDays = 30) {
    await redis_1.default.sadd('risk:blacklist', userId);
    await redis_1.default.expire('risk:blacklist', durationDays * 24 * 60 * 60);
    logger_1.default.warn('用户加入黑名单:', { userId, reason, durationDays });
}
//# sourceMappingURL=riskControl.js.map