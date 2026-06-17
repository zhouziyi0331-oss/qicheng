"use strict";
/**
 * AI导师主动预警服务
 * 场景：T-06 主动风险预警
 *
 * 功能：
 * 1. 定时扫描风险条件（接高难度项目、连续同类打回、截止时间紧迫、方向偏差）
 * 2. 触发预警消息
 * 3. 调用AI-06生成个性化预警内容
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
class MentorAlertService {
    /**
     * 扫描所有进行中的订单，检测风险条件并触发预警
     */
    async scanAndTriggerAlerts() {
        try {
            logger_1.default.info('[MentorAlert] 开始扫描风险条件');
            // 获取所有激活的预警规则
            const rules = await this.getActiveRules();
            // 获取所有进行中的订单
            const activeOrders = await this.getActiveOrders();
            logger_1.default.info(`[MentorAlert] 找到 ${activeOrders.length} 个进行中的订单`);
            for (const order of activeOrders) {
                // 检查每种预警类型
                await this.checkLevelGapAlerts(order, rules);
                await this.checkRepeatedRejectionAlerts(order, rules);
                await this.checkDeadlinePressureAlerts(order, rules);
                await this.checkDirectionMismatchAlerts(order, rules);
            }
            logger_1.default.info('[MentorAlert] 风险扫描完成');
        }
        catch (error) {
            logger_1.default.error('[MentorAlert] 扫描失败:', error);
            throw error;
        }
    }
    /**
     * 获取所有激活的预警规则
     */
    async getActiveRules() {
        const result = await database_1.pool.query(`SELECT * FROM mentor_alert_rules WHERE is_active = true ORDER BY priority ASC`);
        return result.rows;
    }
    /**
     * 获取所有进行中的订单
     */
    async getActiveOrders() {
        const result = await database_1.pool.query(`
      SELECT
        o.id as order_id,
        o.student_id,
        o.project_id,
        o.status,
        o.accepted_at,
        o.deadline_at,
        o.last_activity_at,
        u.current_level as student_level,
        p.required_level as project_level,
        p.title as project_title,
        p.description as project_description
      FROM orders o
      JOIN users u ON o.student_id = u.id
      JOIN projects p ON o.project_id = p.id
      WHERE o.status IN ('accepted', 'in_progress', 'submitted')
        AND o.accepted_at > NOW() - INTERVAL '30 days'
    `);
        return result.rows;
    }
    /**
     * 检查等级跨度预警
     * 条件：接了比当前等级高2级及以上的项目，且接单后30分钟内
     */
    async checkLevelGapAlerts(order, rules) {
        const rule = rules.find(r => r.rule_type === 'level_gap');
        if (!rule)
            return;
        const levelGap = order.project_level - order.student_level;
        const condition = rule.trigger_condition;
        // 检查是否满足触发条件
        if (levelGap < condition.level_gap)
            return;
        // 检查是否在接单后30分钟到2小时之间（避免太早或太晚）
        const minutesSinceAccepted = (Date.now() - new Date(order.accepted_at).getTime()) / 1000 / 60;
        if (minutesSinceAccepted < 30 || minutesSinceAccepted > 120)
            return;
        // 检查是否已发送过此类预警（24小时内不重复）
        const alreadySent = await this.hasRecentAlert(order.student_id, order.order_id, 'level_gap', 24);
        if (alreadySent)
            return;
        // 触发预警
        const triggerData = {
            level_gap: levelGap,
            task_level: order.project_level,
            student_level: order.student_level
        };
        await this.triggerAlert(order.student_id, order.order_id, rule, triggerData);
    }
    /**
     * 检查连续同类问题打回预警
     * 条件：连续2次提交被同一类问题打回，且在72小时内
     */
    async checkRepeatedRejectionAlerts(order, rules) {
        const rule = rules.find(r => r.rule_type === 'repeated_rejection');
        if (!rule)
            return;
        // 获取该订单最近的提交记录
        const submissions = await database_1.pool.query(`
      SELECT
        id,
        version,
        revision_feedback,
        ai_review_json,
        created_at
      FROM order_submissions
      WHERE order_id = $1
        AND created_at > NOW() - INTERVAL '72 hours'
      ORDER BY version DESC
      LIMIT 3
    `, [order.order_id]);
        if (submissions.rows.length < 2)
            return;
        // 分析是否存在连续同类问题
        const issues = submissions.rows.map(s => {
            if (!s.ai_review_json || !s.ai_review_json.issues)
                return [];
            return s.ai_review_json.issues.map((issue) => issue.category || issue.type);
        });
        // 找出连续出现的问题类型
        const repeatedIssue = this.findRepeatedIssue(issues);
        if (!repeatedIssue)
            return;
        // 检查是否已发送过此类预警
        const alreadySent = await this.hasRecentAlert(order.student_id, order.order_id, 'repeated_rejection', 24);
        if (alreadySent)
            return;
        // 触发预警
        const triggerData = {
            rejection_count: 2,
            issue_category: repeatedIssue
        };
        await this.triggerAlert(order.student_id, order.order_id, rule, triggerData);
    }
    /**
     * 检查截止时间紧迫预警
     * 条件：剩余时间不足总时间的30%，且尚未提交
     */
    async checkDeadlinePressureAlerts(order, rules) {
        const rule = rules.find(r => r.rule_type === 'deadline_pressure');
        if (!rule)
            return;
        // 只对进行中的订单检查（已提交的不需要）
        if (order.status === 'submitted')
            return;
        const now = Date.now();
        const acceptedTime = new Date(order.accepted_at).getTime();
        const deadlineTime = new Date(order.deadline_at).getTime();
        const totalDuration = deadlineTime - acceptedTime;
        const remainingTime = deadlineTime - now;
        const remainingPercent = (remainingTime / totalDuration) * 100;
        const condition = rule.trigger_condition;
        // 检查是否满足触发条件
        if (remainingPercent > condition.time_remaining_percent)
            return;
        if (remainingTime < 0)
            return; // 已过期不预警
        // 检查是否已发送过此类预警（12小时内不重复）
        const alreadySent = await this.hasRecentAlert(order.student_id, order.order_id, 'deadline_pressure', 12);
        if (alreadySent)
            return;
        // 触发预警
        const hoursRemaining = Math.floor(remainingTime / 1000 / 60 / 60);
        const triggerData = {
            hours_remaining: hoursRemaining,
            time_remaining_percent: Math.floor(remainingPercent)
        };
        await this.triggerAlert(order.student_id, order.order_id, rule, triggerData);
    }
    /**
     * 检查方向偏差预警
     * 条件：AI-03审核检测到交付物和需求有结构性偏差
     */
    async checkDirectionMismatchAlerts(order, rules) {
        const rule = rules.find(r => r.rule_type === 'direction_mismatch');
        if (!rule)
            return;
        // 获取最近一次提交的AI审核结果
        const submission = await database_1.pool.query(`
      SELECT ai_review_json
      FROM order_submissions
      WHERE order_id = $1
      ORDER BY version DESC
      LIMIT 1
    `, [order.order_id]);
        if (submission.rows.length === 0)
            return;
        const aiReview = submission.rows[0].ai_review_json;
        if (!aiReview || !aiReview.mismatch_score)
            return;
        const condition = rule.trigger_condition;
        // 检查是否满足触发条件
        if (aiReview.mismatch_score < condition.ai_review_mismatch_score)
            return;
        // 检查是否已发送过此类预警（24小时内不重复）
        const alreadySent = await this.hasRecentAlert(order.student_id, order.order_id, 'direction_mismatch', 24);
        if (alreadySent)
            return;
        // 触发预警
        const triggerData = {
            mismatch_type: aiReview.mismatch_type || '方向偏差',
            mismatch_score: aiReview.mismatch_score
        };
        await this.triggerAlert(order.student_id, order.order_id, rule, triggerData);
    }
    /**
     * 触发预警：创建预警记录并调用AI-06生成个性化消息
     */
    async triggerAlert(studentId, orderId, rule, triggerData) {
        try {
            // 生成预警消息（使用模板 + AI-06个性化）
            const alertMessage = await this.generateAlertMessage(studentId, orderId, rule, triggerData);
            // 创建预警记录
            const alertId = (0, uuid_1.v4)();
            await database_1.pool.query(`
        INSERT INTO mentor_alerts (
          id, student_id, order_id, rule_id, rule_type,
          alert_message, trigger_data, is_sent, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
      `, [
                alertId,
                studentId,
                orderId,
                rule.id,
                rule.rule_type,
                alertMessage,
                JSON.stringify(triggerData)
            ]);
            // 同时写入mentor_sessions（导师对话记录）
            await database_1.pool.query(`
        INSERT INTO mentor_sessions (
          id, user_id, order_id, trigger_type, sender_type,
          message, context_snapshot, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
                (0, uuid_1.v4)(),
                studentId,
                orderId,
                'risk_alert',
                'ai',
                alertMessage,
                JSON.stringify({ rule_type: rule.rule_type, trigger_data: triggerData })
            ]);
            logger_1.default.info(`[MentorAlert] 预警已触发: ${rule.rule_type} for student ${studentId}, order ${orderId}`);
            // TODO: 通过WebSocket推送给前端
            // await this.pushAlertToFrontend(studentId, orderId, alertMessage);
        }
        catch (error) {
            logger_1.default.error('[MentorAlert] 触发预警失败:', error);
            throw error;
        }
    }
    /**
     * 生成个性化预警消息
     * 使用规则模板 + AI-06个性化处理
     */
    async generateAlertMessage(studentId, orderId, rule, triggerData) {
        // 先用模板生成基础消息
        let baseMessage = rule.alert_template;
        // 替换模板变量
        Object.keys(triggerData).forEach(key => {
            const value = triggerData[key];
            baseMessage = baseMessage.replace(`{${key}}`, value);
        });
        // 调用AI-06进行个性化处理（可选，如果需要更自然的语言）
        // 这里简化处理，直接返回模板消息
        // 如果需要AI个性化，可以调用 addAITask(AITaskType.MENTOR_GUIDANCE, ...)
        return baseMessage;
    }
    /**
     * 检查是否在指定小时内已发送过同类预警
     */
    async hasRecentAlert(studentId, orderId, ruleType, hoursWindow) {
        const result = await database_1.pool.query(`
      SELECT COUNT(*) as count
      FROM mentor_alerts
      WHERE student_id = $1
        AND order_id = $2
        AND rule_type = $3
        AND created_at > NOW() - INTERVAL '${hoursWindow} hours'
    `, [studentId, orderId, ruleType]);
        return parseInt(result.rows[0].count) > 0;
    }
    /**
     * 找出连续出现的问题类型
     */
    findRepeatedIssue(issuesArray) {
        if (issuesArray.length < 2)
            return null;
        // 找出最近两次提交中都出现的问题类型
        const [latest, previous] = issuesArray;
        const commonIssues = latest.filter(issue => previous.includes(issue));
        return commonIssues.length > 0 ? commonIssues[0] : null;
    }
    /**
     * 获取学生的未读预警列表
     */
    async getUnreadAlerts(studentId) {
        const result = await database_1.pool.query(`
      SELECT
        ma.*,
        mar.rule_name,
        o.project_id,
        p.title as project_title
      FROM mentor_alerts ma
      JOIN mentor_alert_rules mar ON ma.rule_id = mar.id
      LEFT JOIN orders o ON ma.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE ma.student_id = $1
        AND ma.student_viewed = false
      ORDER BY ma.created_at DESC
    `, [studentId]);
        return result.rows;
    }
    /**
     * 标记预警为已读
     */
    async markAlertAsViewed(alertId, studentId) {
        await database_1.pool.query(`
      UPDATE mentor_alerts
      SET student_viewed = true, viewed_at = NOW()
      WHERE id = $1 AND student_id = $2
    `, [alertId, studentId]);
    }
    /**
     * 标记预警为已响应
     */
    async markAlertAsResponded(alertId, studentId) {
        await database_1.pool.query(`
      UPDATE mentor_alerts
      SET student_responded = true, responded_at = NOW()
      WHERE id = $1 AND student_id = $2
    `, [alertId, studentId]);
    }
    /**
     * 获取预警统计数据（用于监控和分析）
     */
    async getAlertStats(days = 7) {
        const result = await database_1.pool.query(`
      SELECT
        rule_type,
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN student_viewed THEN 1 END) as viewed_count,
        COUNT(CASE WHEN student_responded THEN 1 END) as responded_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (viewed_at - created_at)) / 60), 2) as avg_view_time_minutes
      FROM mentor_alerts
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY rule_type
      ORDER BY total_alerts DESC
    `);
        return result.rows;
    }
}
exports.default = new MentorAlertService();
//# sourceMappingURL=mentorAlertService.js.map