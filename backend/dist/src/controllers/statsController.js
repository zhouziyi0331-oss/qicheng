"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentValuation = exports.getTrackStats = exports.getPersonalityStats = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 统计API控制器
 *
 * 核心原则：所有展示给用户的统计数字，必须来自数据库实时查询
 * 禁止：在前端写死任何数字
 */
/**
 * 获取人格标签统计
 * GET /api/v1/stats/personality/:tag
 *
 * 返回该人格标签的真实统计数据，用于消除"12,843个和你一样"的固定文案
 */
const getPersonalityStats = async (req, res) => {
    const { tag } = req.params;
    try {
        // 1. 查询同类人数
        const countResult = await (0, db_1.query)(`SELECT COUNT(DISTINCT user_id) as count
       FROM user_opc_results
       WHERE personality_tag = $1`, [tag]);
        const totalCount = parseInt(countResult[0]?.count || '0');
        if (totalCount === 0) {
            return res.json({
                total_count: 0,
                first_task_completion_rate: 0,
                avg_first_task_days: null,
                message: '目前还没有这个人格标签的数据'
            });
        }
        // 2. 查询已完成首单的人数和比例
        const completionResult = await (0, db_1.query)(`SELECT
         COUNT(DISTINCT uor.user_id) FILTER (WHERE u.task_count >= 1) as completed_count,
         AVG(EXTRACT(DAY FROM (first_order.completed_at - first_order.accepted_at))) as avg_days
       FROM user_opc_results uor
       JOIN users u ON uor.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT completed_at, accepted_at
         FROM orders
         WHERE student_id = u.id AND status = 'completed'
         ORDER BY completed_at ASC
         LIMIT 1
       ) first_order ON true
       WHERE uor.personality_tag = $1`, [tag]);
        const completedCount = parseInt(completionResult[0]?.completed_count || '0');
        const completionRate = totalCount > 0
            ? Math.round((completedCount / totalCount) * 100)
            : 0;
        const avgDays = completionResult[0]?.avg_days
            ? Math.round(completionResult[0].avg_days)
            : null;
        // 3. 查询最快完成首单的天数（用于鼓励）
        const fastestResult = await (0, db_1.query)(`SELECT MIN(EXTRACT(DAY FROM (o.completed_at - o.accepted_at))) as fastest_days
       FROM orders o
       JOIN users u ON o.student_id = u.id
       JOIN user_opc_results uor ON u.id = uor.user_id
       WHERE uor.personality_tag = $1
         AND o.status = 'completed'
         AND o.completed_at IS NOT NULL`, [tag]);
        const fastestDays = fastestResult[0]?.fastest_days
            ? Math.ceil(fastestResult[0].fastest_days)
            : null;
        res.json({
            personality_tag: tag,
            total_count: totalCount,
            first_task_completion_rate: completionRate,
            completed_count: completedCount,
            avg_first_task_days: avgDays,
            fastest_first_task_days: fastestDays
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get personality stats:', error);
        res.status(500).json({
            error: '获取统计数据失败',
            message: error.message
        });
    }
};
exports.getPersonalityStats = getPersonalityStats;
/**
 * 获取赛道统计
 * GET /api/v1/stats/track/:track
 *
 * 返回该赛道的市场数据，用于能力估值
 */
const getTrackStats = async (req, res) => {
    const { track } = req.params;
    try {
        // 1. 该赛道完成订单数
        const orderCountResult = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM orders o
       JOIN tasks t ON o.task_id = t.id
       WHERE t.track = $1 AND o.status = 'completed'`, [track]);
        // 2. 该赛道市场均价（中位数）
        const medianPriceResult = await (0, db_1.query)(`SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY budget_gross) as median_price
       FROM tasks
       WHERE track = $1 AND status = 'active'`, [track]);
        // 3. 该赛道平均评分
        const avgRatingResult = await (0, db_1.query)(`SELECT AVG(o.client_rating) as avg_rating
       FROM orders o
       JOIN tasks t ON o.task_id = t.id
       WHERE t.track = $1 AND o.status = 'completed' AND o.client_rating IS NOT NULL`, [track]);
        res.json({
            track,
            total_completed_orders: parseInt(orderCountResult[0]?.count || '0'),
            median_market_price: Math.round(medianPriceResult[0]?.median_price || 0),
            avg_client_rating: parseFloat((avgRatingResult[0]?.avg_rating || 0).toFixed(1))
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get track stats:', error);
        res.status(500).json({
            error: '获取赛道统计失败',
            message: error.message
        });
    }
};
exports.getTrackStats = getTrackStats;
/**
 * 获取学生的能力估值
 * GET /api/v1/stats/student-valuation
 *
 * 基于学生的真实订单历史计算市场估值
 */
const getStudentValuation = async (req, res) => {
    const studentId = req.user?.id;
    if (!studentId) {
        return res.status(401).json({ error: '未登录' });
    }
    try {
        // 1. 统计学生各赛道的完成订单数和平均收入
        const trackStats = await (0, db_1.query)(`SELECT
         t.track,
         COUNT(o.id) as order_count,
         AVG(t.budget_gross) as avg_income,
         AVG(o.client_rating) as avg_rating
       FROM orders o
       JOIN tasks t ON o.task_id = t.id
       WHERE o.student_id = $1 AND o.status = 'completed'
       GROUP BY t.track`, [studentId]);
        if (trackStats.length === 0) {
            return res.json({
                message: '完成第一单后，这里会出现你的市场估值',
                skills: [],
                estimated_monthly_income: null
            });
        }
        // 2. 计算每个赛道的估值
        const skills = trackStats.map(stat => ({
            track: stat.track,
            order_count: parseInt(stat.order_count.toString()),
            avg_income: Math.round(stat.avg_income),
            avg_rating: parseFloat((stat.avg_rating || 0).toFixed(1)),
            proficiency_level: stat.order_count >= 5 ? '熟练' : stat.order_count >= 2 ? '入门' : '新手'
        }));
        // 3. 估算月收入（假设每月完成4单）
        const estimatedMonthlyIncome = skills.reduce((sum, skill) => {
            return sum + (skill.avg_income * 4);
        }, 0);
        res.json({
            skills,
            estimated_monthly_income: Math.round(estimatedMonthlyIncome / skills.length)
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get student valuation:', error);
        res.status(500).json({
            error: '获取能力估值失败',
            message: error.message
        });
    }
};
exports.getStudentValuation = getStudentValuation;
//# sourceMappingURL=statsController.js.map