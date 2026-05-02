"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escrowService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class EscrowService {
    /**
     * 获取用户托管账户
     */
    async getAccount(userId, userType) {
        const result = await db_1.pool.query(`SELECT id, user_id, user_type, total_balance, frozen_balance,
              available_balance, pending_settlement, total_income, total_withdrawal
       FROM escrow_accounts
       WHERE user_id = $1 AND user_type = $2`, [userId, userType]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            userType: row.user_type,
            totalBalance: row.total_balance,
            frozenBalance: row.frozen_balance,
            availableBalance: row.available_balance,
            pendingSettlement: row.pending_settlement,
            totalIncome: row.total_income,
            totalWithdrawal: row.total_withdrawal,
        };
    }
    /**
     * 创建任务报价
     */
    async createQuote(taskId, studentId, companyId, quotedAmount, platformFeeRate = 0.05) {
        const platformFee = Math.floor(quotedAmount * platformFeeRate);
        const studentNetIncome = quotedAmount - platformFee;
        const result = await db_1.pool.query(`INSERT INTO task_quotes
       (task_id, student_id, company_id, quoted_amount, platform_fee_rate, platform_fee, student_net_income, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`, [taskId, studentId, companyId, quotedAmount, platformFeeRate, platformFee, studentNetIncome]);
        const row = result.rows[0];
        return {
            id: row.id,
            taskId: row.task_id,
            studentId: row.student_id,
            companyId: row.company_id,
            quotedAmount: row.quoted_amount,
            platformFeeRate: row.platform_fee_rate,
            platformFee: row.platform_fee,
            studentNetIncome: row.student_net_income,
            status: row.status,
        };
    }
    /**
     * 学生接受报价
     */
    async acceptQuote(quoteId, studentId) {
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 检查报价是否存在且属于该学生
            const quoteResult = await client.query('SELECT * FROM task_quotes WHERE id = $1 AND student_id = $2 AND status = $3', [quoteId, studentId, 'pending']);
            if (quoteResult.rows.length === 0) {
                throw new Error('报价不存在或已处理');
            }
            // 更新报价状态
            await client.query(`UPDATE task_quotes
         SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [quoteId]);
            // 更新任务状态为待支付
            await client.query(`UPDATE tasks
         SET status = 'awaiting_payment'
         WHERE id = $1`, [quoteResult.rows[0].task_id]);
            await client.query('COMMIT');
            logger_1.default.info(`Quote ${quoteId} accepted by student ${studentId}`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 企业支付并进入托管
     */
    async payAndEscrow(quoteId, companyId, paymentMethod) {
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 获取报价信息
            const quoteResult = await client.query('SELECT * FROM task_quotes WHERE id = $1 AND company_id = $2 AND status = $3', [quoteId, companyId, 'accepted']);
            if (quoteResult.rows.length === 0) {
                throw new Error('报价不存在或状态不正确');
            }
            const quote = quoteResult.rows[0];
            // 创建支付订单
            const orderResult = await client.query(`INSERT INTO payment_orders
         (company_id, task_id, quote_id, amount, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, 'completed')
         RETURNING id`, [companyId, quote.task_id, quoteId, quote.quoted_amount, paymentMethod]);
            // 更新报价状态为已支付
            await client.query(`UPDATE task_quotes
         SET status = 'paid', paid_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [quoteId]);
            // 更新任务状态和托管金额
            await client.query(`UPDATE tasks
         SET status = 'in_progress',
             payment_status = 'in_escrow',
             escrow_amount = $1
         WHERE id = $2`, [quote.student_net_income, quote.task_id]);
            // 冻结学生账户金额（虽然钱还没到，但预留位置）
            await client.query(`UPDATE escrow_accounts
         SET frozen_balance = frozen_balance + $1
         WHERE user_id = $2 AND user_type = 'student'`, [quote.student_net_income, quote.student_id]);
            // 记录交易流水
            await this.logTransaction(client, {
                userId: quote.student_id,
                userType: 'student',
                transactionType: 'escrow',
                amount: quote.student_net_income,
                balanceBefore: 0,
                balanceAfter: 0,
                taskId: quote.task_id,
                quoteId: quoteId,
                description: `任务 #${quote.task_id} 资金进入托管`,
            });
            await client.query('COMMIT');
            logger_1.default.info(`Payment completed for quote ${quoteId}, amount: ${quote.quoted_amount}`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 任务完成，进入待结算（7天后可提现）
     */
    async completeTaskAndSettle(taskId, quoteId) {
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 获取报价信息
            const quoteResult = await client.query('SELECT * FROM task_quotes WHERE id = $1 AND task_id = $2 AND status = $3', [quoteId, taskId, 'paid']);
            if (quoteResult.rows.length === 0) {
                throw new Error('报价不存在或状态不正确');
            }
            const quote = quoteResult.rows[0];
            const settlementDate = new Date();
            settlementDate.setDate(settlementDate.getDate() + 7); // 7天后
            // 更新报价状态
            await client.query(`UPDATE task_quotes
         SET status = 'completed', completed_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [quoteId]);
            // 更新任务状态
            await client.query(`UPDATE tasks
         SET payment_status = 'in_settlement',
             settlement_date = $1
         WHERE id = $2`, [settlementDate, taskId]);
            // 从冻结转到待结算
            await client.query(`UPDATE escrow_accounts
         SET frozen_balance = frozen_balance - $1,
             pending_settlement = pending_settlement + $1,
             total_balance = total_balance + $1,
             total_income = total_income + $1
         WHERE user_id = $2 AND user_type = 'student'`, [quote.student_net_income, quote.student_id]);
            // 记录交易流水
            const accountResult = await client.query('SELECT total_balance FROM escrow_accounts WHERE user_id = $1 AND user_type = $2', [quote.student_id, 'student']);
            await this.logTransaction(client, {
                userId: quote.student_id,
                userType: 'student',
                transactionType: 'settlement',
                amount: quote.student_net_income,
                balanceBefore: accountResult.rows[0].total_balance - quote.student_net_income,
                balanceAfter: accountResult.rows[0].total_balance,
                taskId: taskId,
                quoteId: quoteId,
                description: `任务 #${taskId} 完成，进入待结算（7天后可提现）`,
            });
            await client.query('COMMIT');
            logger_1.default.info(`Task ${taskId} completed, entering settlement period`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 释放待结算资金到可提现（7天后自动执行）
     */
    async releaseSettlement(taskId, quoteId) {
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 获取报价信息
            const quoteResult = await client.query('SELECT * FROM task_quotes WHERE id = $1 AND task_id = $2 AND status = $3', [quoteId, taskId, 'completed']);
            if (quoteResult.rows.length === 0) {
                throw new Error('报价不存在或状态不正确');
            }
            const quote = quoteResult.rows[0];
            // 检查是否已过结算期
            const taskResult = await client.query('SELECT settlement_date FROM tasks WHERE id = $1', [taskId]);
            if (taskResult.rows.length === 0) {
                throw new Error('任务不存在');
            }
            const settlementDate = new Date(taskResult.rows[0].settlement_date);
            if (settlementDate > new Date()) {
                throw new Error('尚未到达结算日期');
            }
            // 更新报价状态
            await client.query(`UPDATE task_quotes
         SET status = 'released', released_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [quoteId]);
            // 更新任务状态
            await client.query(`UPDATE tasks
         SET payment_status = 'released'
         WHERE id = $1`, [taskId]);
            // 从待结算转到可提现
            await client.query(`UPDATE escrow_accounts
         SET pending_settlement = pending_settlement - $1,
             available_balance = available_balance + $1
         WHERE user_id = $2 AND user_type = 'student'`, [quote.student_net_income, quote.student_id]);
            // 记录交易流水
            const accountResult = await client.query('SELECT available_balance FROM escrow_accounts WHERE user_id = $1 AND user_type = $2', [quote.student_id, 'student']);
            await this.logTransaction(client, {
                userId: quote.student_id,
                userType: 'student',
                transactionType: 'release',
                amount: quote.student_net_income,
                balanceBefore: accountResult.rows[0].available_balance - quote.student_net_income,
                balanceAfter: accountResult.rows[0].available_balance,
                taskId: taskId,
                quoteId: quoteId,
                description: `任务 #${taskId} 资金已释放，可提现`,
            });
            await client.query('COMMIT');
            logger_1.default.info(`Settlement released for task ${taskId}`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 记录交易流水
     */
    async logTransaction(client, log) {
        await client.query(`INSERT INTO transaction_logs
       (user_id, user_type, transaction_type, amount, balance_before, balance_after,
        task_id, quote_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            log.userId,
            log.userType,
            log.transactionType,
            log.amount,
            log.balanceBefore,
            log.balanceAfter,
            log.taskId,
            log.quoteId,
            log.description,
        ]);
    }
    /**
     * 获取交易流水
     */
    async getTransactionLogs(userId, userType, limit = 50, offset = 0) {
        const result = await db_1.pool.query(`SELECT * FROM transaction_logs
       WHERE user_id = $1 AND user_type = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`, [userId, userType, limit, offset]);
        return result.rows;
    }
}
exports.escrowService = new EscrowService();
//# sourceMappingURL=escrowService.js.map