"use strict";
/**
 * 任务追加需求服务
 *
 * 处理任务进行中的需求变更、价格调整、协商等功能
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskAmendmentService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const config_1 = require("../../config");
const anthropic = new sdk_1.default({
    apiKey: config_1.config.anthropicApiKey,
});
// =====================================================
// 追加需求服务类
// =====================================================
class TaskAmendmentService {
    /**
     * 创建追加需求
     */
    async createAmendment(params) {
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 验证任务状态（只有进行中的任务可以追加需求）
            const taskResult = await client.query(`SELECT status, company_id, accepted_student_id
         FROM tasks
         WHERE id = $1`, [params.task_id]);
            if (taskResult.rows.length === 0) {
                throw new Error('Task not found');
            }
            const task = taskResult.rows[0];
            if (task.company_id !== params.company_id) {
                throw new Error('Unauthorized: not task owner');
            }
            if (task.status !== 'in_progress') {
                throw new Error('Can only add amendments to in-progress tasks');
            }
            if (task.accepted_student_id !== params.student_id) {
                throw new Error('Student ID mismatch');
            }
            // 创建追加需求
            const result = await client.query(`INSERT INTO task_amendments (
          task_id, company_id, student_id, amendment_type,
          title, description, original_requirement, new_requirement,
          price_adjustment, adjustment_reason, deadline_extension_days, new_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`, [
                params.task_id,
                params.company_id,
                params.student_id,
                params.amendment_type,
                params.title,
                params.description,
                params.original_requirement,
                params.new_requirement,
                params.price_adjustment || 0,
                params.adjustment_reason,
                params.deadline_extension_days || 0,
                params.new_deadline,
            ]);
            const amendment = result.rows[0];
            // 发送通知给学生
            await client.query(`INSERT INTO notifications (
          user_id, user_type, type, title, content, related_task_id, amendment_id
        ) VALUES ($1, 'student', 'amendment_created', $2, $3, $4, $5)`, [
                params.student_id,
                '企业提出追加需求',
                `企业对任务提出了追加需求：${params.title}。请查看详情并回复。`,
                params.task_id,
                amendment.id,
            ]);
            await client.query('COMMIT');
            logger_1.default.info('Amendment created', {
                amendmentId: amendment.id,
                taskId: params.task_id,
                type: params.amendment_type,
            });
            return amendment;
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Failed to create amendment', { error, params });
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 学生响应追加需求
     */
    async studentRespond(params) {
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 获取追加需求
            const amendmentResult = await client.query(`SELECT * FROM task_amendments WHERE id = $1`, [params.amendment_id]);
            if (amendmentResult.rows.length === 0) {
                throw new Error('Amendment not found');
            }
            const amendment = amendmentResult.rows[0];
            if (amendment.student_id !== params.student_id) {
                throw new Error('Unauthorized: not the assigned student');
            }
            if (amendment.status !== 'pending' && amendment.status !== 'negotiating') {
                throw new Error('Amendment is not in pending or negotiating status');
            }
            // 更新状态
            let newStatus = amendment.status;
            if (params.action === 'accept') {
                newStatus = 'accepted';
            }
            else if (params.action === 'reject') {
                newStatus = 'rejected';
            }
            else if (params.action === 'negotiate') {
                newStatus = 'negotiating';
            }
            // 添加到协商历史
            const negotiationHistory = amendment.negotiation_history || [];
            negotiationHistory.push({
                actor: 'student',
                action: params.action,
                message: params.response,
                counter_offer: params.counter_offer,
                timestamp: new Date().toISOString(),
            });
            // 更新追加需求
            const result = await client.query(`UPDATE task_amendments
         SET status = $1,
             student_response = $2,
             student_counter_offer = $3,
             student_responded_at = NOW(),
             negotiation_history = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`, [
                newStatus,
                params.response,
                params.counter_offer,
                JSON.stringify(negotiationHistory),
                params.amendment_id,
            ]);
            // 如果接受，更新任务
            if (params.action === 'accept') {
                await this.applyAmendmentToTask(client, amendment);
            }
            // 通知企业
            await client.query(`INSERT INTO notifications (
          user_id, user_type, type, title, content, related_task_id, amendment_id
        ) VALUES ($1, 'company', 'amendment_responded', $2, $3, $4, $5)`, [
                amendment.company_id,
                `学生${params.action === 'accept' ? '接受' : params.action === 'reject' ? '拒绝' : '协商'}追加需求`,
                `学生已回复追加需求：${params.response}`,
                amendment.task_id,
                params.amendment_id,
            ]);
            await client.query('COMMIT');
            logger_1.default.info('Student responded to amendment', {
                amendmentId: params.amendment_id,
                action: params.action,
            });
            return result.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Failed to respond to amendment', { error, params });
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 企业最终决定（在协商后）
     */
    async companyFinalDecision(params) {
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 获取追加需求
            const amendmentResult = await client.query(`SELECT * FROM task_amendments WHERE id = $1`, [params.amendment_id]);
            if (amendmentResult.rows.length === 0) {
                throw new Error('Amendment not found');
            }
            const amendment = amendmentResult.rows[0];
            if (amendment.company_id !== params.company_id) {
                throw new Error('Unauthorized: not the task owner');
            }
            if (amendment.status !== 'negotiating') {
                throw new Error('Amendment is not in negotiating status');
            }
            // 更新状态
            let newStatus = amendment.status;
            if (params.decision === 'accept_student_offer') {
                newStatus = 'accepted';
            }
            else if (params.decision === 'cancel') {
                newStatus = 'rejected';
            }
            // 添加到协商历史
            const negotiationHistory = amendment.negotiation_history || [];
            negotiationHistory.push({
                actor: 'company',
                decision: params.decision,
                comment: params.comment,
                timestamp: new Date().toISOString(),
            });
            // 更新追加需求
            const result = await client.query(`UPDATE task_amendments
         SET status = $1,
             company_final_decision = $2,
             company_final_comment = $3,
             negotiation_history = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`, [
                newStatus,
                params.decision,
                params.comment,
                JSON.stringify(negotiationHistory),
                params.amendment_id,
            ]);
            // 如果接受学生还价，更新任务
            if (params.decision === 'accept_student_offer' && amendment.student_counter_offer) {
                const updatedAmendment = { ...amendment, price_adjustment: amendment.student_counter_offer };
                await this.applyAmendmentToTask(client, updatedAmendment);
            }
            // 通知学生
            await client.query(`INSERT INTO notifications (
          user_id, user_type, type, title, content, related_task_id, amendment_id
        ) VALUES ($1, 'student', 'amendment_decided', $2, $3, $4, $5)`, [
                amendment.student_id,
                '企业做出最终决定',
                `企业对追加需求做出决定：${params.decision === 'accept_student_offer' ? '接受你的还价' : '取消追加需求'}`,
                amendment.task_id,
                params.amendment_id,
            ]);
            await client.query('COMMIT');
            logger_1.default.info('Company made final decision', {
                amendmentId: params.amendment_id,
                decision: params.decision,
            });
            return result.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Failed to make final decision', { error, params });
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 应用追加需求到任务（内部方法）
     */
    async applyAmendmentToTask(client, amendment) {
        // 更新任务的价格和截止日期
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (amendment.price_adjustment !== 0) {
            updates.push(`budget_max = budget_max + $${paramIndex}`);
            values.push(amendment.price_adjustment);
            paramIndex++;
        }
        if (amendment.new_deadline) {
            updates.push(`deadline = $${paramIndex}`);
            values.push(amendment.new_deadline);
            paramIndex++;
        }
        else if (amendment.deadline_extension_days > 0) {
            updates.push(`deadline = deadline + INTERVAL '${amendment.deadline_extension_days} days'`);
        }
        if (updates.length > 0) {
            values.push(amendment.task_id);
            await client.query(`UPDATE tasks
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}`, values);
        }
        // 标记追加需求为已完成
        await client.query(`UPDATE task_amendments
       SET completed = true, completed_at = NOW()
       WHERE id = $1`, [amendment.id]);
        logger_1.default.info('Amendment applied to task', {
            amendmentId: amendment.id,
            taskId: amendment.task_id,
            priceAdjustment: amendment.price_adjustment,
        });
    }
    /**
     * AI评估追加需求的合理性
     */
    async analyzeAmendmentFairness(amendmentId) {
        const client = await db_1.pool.connect();
        try {
            // 获取追加需求和原任务信息
            const result = await client.query(`SELECT
           a.*,
           t.title as task_title,
           t.description as task_description,
           t.budget_min,
           t.budget_max,
           t.deadline as original_deadline
         FROM task_amendments a
         JOIN tasks t ON a.task_id = t.id
         WHERE a.id = $1`, [amendmentId]);
            if (result.rows.length === 0) {
                throw new Error('Amendment not found');
            }
            const data = result.rows[0];
            // 构建AI prompt
            const prompt = `你是一个公正的任务需求评估专家。请评估以下追加需求的合理性。

原任务信息：
- 标题：${data.task_title}
- 描述：${data.task_description}
- 原预算：${data.budget_min}-${data.budget_max} 元
- 原截止日期：${data.original_deadline}

追加需求：
- 类型：${data.amendment_type}
- 标题：${data.title}
- 描述：${data.description}
- 原需求：${data.original_requirement || '无'}
- 新需求：${data.new_requirement || '无'}
- 价格调整：${data.price_adjustment} 元
- 调整理由：${data.adjustment_reason || '无'}
- 延期天数：${data.deadline_extension_days} 天

请以JSON格式返回评估结果：
{
  "fairness_score": 75,
  "is_reasonable": true,
  "suggested_price": 300,
  "analysis": "详细分析追加需求的合理性",
  "concerns": ["可能存在的问题1", "问题2"],
  "recommendations": ["给学生的建议1", "建议2"]
}

fairness_score: 0-100分，80分以上表示非常合理，60-80合理，40-60需要协商，40以下不合理`;
            const message = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 2000,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse AI response');
            }
            const analysis = JSON.parse(jsonMatch[0]);
            // 保存AI分析结果
            await client.query(`UPDATE task_amendments
         SET ai_fairness_score = $1,
             ai_suggested_price = $2,
             ai_analysis = $3
         WHERE id = $4`, [
                analysis.fairness_score,
                analysis.suggested_price,
                analysis.analysis,
                amendmentId,
            ]);
            logger_1.default.info('Amendment fairness analyzed', {
                amendmentId,
                fairnessScore: analysis.fairness_score,
            });
            return analysis;
        }
        catch (error) {
            logger_1.default.error('Failed to analyze amendment fairness', { error, amendmentId });
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取任务的所有追加需求
     */
    async getTaskAmendments(taskId, userId) {
        const client = await db_1.pool.connect();
        try {
            // 验证用户是否有权限查看
            const taskResult = await client.query(`SELECT company_id, accepted_student_id FROM tasks WHERE id = $1`, [taskId]);
            if (taskResult.rows.length === 0) {
                throw new Error('Task not found');
            }
            const task = taskResult.rows[0];
            if (task.company_id !== userId && task.accepted_student_id !== userId) {
                throw new Error('Unauthorized');
            }
            const result = await client.query(`SELECT * FROM task_amendments
         WHERE task_id = $1
         ORDER BY created_at DESC`, [taskId]);
            return result.rows;
        }
        catch (error) {
            logger_1.default.error('Failed to get task amendments', { error, taskId });
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取追加需求详情
     */
    async getAmendment(amendmentId, userId) {
        const client = await db_1.pool.connect();
        try {
            const result = await client.query(`SELECT * FROM task_amendments
         WHERE id = $1 AND (company_id = $2 OR student_id = $2)`, [amendmentId, userId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.default.error('Failed to get amendment', { error, amendmentId });
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 取消追加需求（企业主动取消）
     */
    async cancelAmendment(amendmentId, companyId, reason) {
        const client = await db_1.pool.connect();
        try {
            const result = await client.query(`UPDATE task_amendments
         SET status = 'rejected',
             company_final_decision = 'cancel',
             company_final_comment = $1,
             updated_at = NOW()
         WHERE id = $2 AND company_id = $3 AND status = 'pending'
         RETURNING student_id, task_id`, [reason || '企业取消了追加需求', amendmentId, companyId]);
            if (result.rows.length === 0) {
                throw new Error('Amendment not found or cannot be cancelled');
            }
            // 通知学生
            await client.query(`INSERT INTO notifications (
          user_id, user_type, type, title, content, related_task_id, amendment_id
        ) VALUES ($1, 'student', 'amendment_cancelled', '追加需求已取消', $2, $3, $4)`, [
                result.rows[0].student_id,
                reason || '企业取消了追加需求',
                result.rows[0].task_id,
                amendmentId,
            ]);
            logger_1.default.info('Amendment cancelled', { amendmentId, companyId });
        }
        catch (error) {
            logger_1.default.error('Failed to cancel amendment', { error, amendmentId });
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.taskAmendmentService = new TaskAmendmentService();
//# sourceMappingURL=taskAmendmentService.js.map