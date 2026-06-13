"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-20: 资金托管透明化服务
 * 可视化展示托管流程和资金流水
 */
class EscrowTransparencyService {
    /**
     * 获取任务的完整托管流程概览
     */
    async getEscrowFlowOverview(taskId) {
        // 并行查询所有数据
        const [nodesResult, transactionsResult, balanceResult] = await Promise.all([
            database_1.pool.query(`SELECT * FROM escrow_flow_nodes
         WHERE task_id = $1
         ORDER BY sequence_order ASC`, [taskId]),
            database_1.pool.query(`SELECT * FROM escrow_transactions
         WHERE task_id = $1
         ORDER BY initiated_at DESC`, [taskId]),
            database_1.pool.query(`SELECT * FROM escrow_balances WHERE task_id = $1`, [taskId]),
        ]);
        const flowNodes = nodesResult.rows;
        const transactions = transactionsResult.rows;
        const balance = balanceResult.rows[0] || this.getEmptyBalance(taskId);
        // 计算进度
        const completedNodes = flowNodes.filter((n) => n.status === 'completed').length;
        const currentNode = flowNodes.find((n) => n.status === 'in_progress' || n.status === 'pending');
        return {
            flow_nodes: flowNodes,
            transactions,
            balance,
            progress: {
                total_nodes: flowNodes.length,
                completed_nodes: completedNodes,
                current_node: currentNode,
                completion_rate: flowNodes.length > 0 ? completedNodes / flowNodes.length : 0,
            },
        };
    }
    /**
     * 更新流程节点状态
     */
    async updateFlowNodeStatus(nodeId, status, actorId, actorRole, metadata) {
        const updates = ['status = $2'];
        const params = [nodeId, status];
        let paramIndex = 3;
        if (status === 'in_progress' && actorId) {
            updates.push(`started_at = NOW()`);
            updates.push(`actor_id = $${paramIndex}`);
            params.push(actorId);
            paramIndex++;
            if (actorRole) {
                updates.push(`actor_role = $${paramIndex}`);
                params.push(actorRole);
                paramIndex++;
            }
        }
        if (status === 'completed') {
            updates.push(`completed_at = NOW()`);
        }
        if (metadata) {
            updates.push(`metadata = $${paramIndex}`);
            params.push(JSON.stringify(metadata));
            paramIndex++;
        }
        const result = await database_1.pool.query(`UPDATE escrow_flow_nodes
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING *`, params);
        return result.rows[0];
    }
    /**
     * 记录托管交易
     */
    async recordTransaction(data) {
        const { taskId, flowNodeId, transactionType, amount, fromParty, toParty, description, externalTransactionId, } = data;
        const result = await database_1.pool.query(`INSERT INTO escrow_transactions
       (id, task_id, flow_node_id, transaction_type, amount,
        from_party, to_party, description, external_transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`, [
            (0, uuid_1.v4)(),
            taskId,
            flowNodeId,
            transactionType,
            amount,
            fromParty,
            toParty,
            description,
            externalTransactionId,
        ]);
        // 更新余额
        await this.updateBalance(taskId, transactionType, amount);
        return result.rows[0];
    }
    /**
     * 更新托管账户余额
     */
    async updateBalance(taskId, transactionType, amount) {
        let updateQuery = '';
        switch (transactionType) {
            case 'deposit':
                updateQuery = `
          UPDATE escrow_balances
          SET total_amount = total_amount + $2,
              status = 'deposited',
              last_transaction_at = NOW(),
              updated_at = NOW()
          WHERE task_id = $1
        `;
                break;
            case 'lock':
                updateQuery = `
          UPDATE escrow_balances
          SET locked_amount = locked_amount + $2,
              status = 'locked',
              last_transaction_at = NOW(),
              updated_at = NOW()
          WHERE task_id = $1
        `;
                break;
            case 'release':
                updateQuery = `
          UPDATE escrow_balances
          SET released_amount = released_amount + $2,
              locked_amount = locked_amount - $2,
              status = CASE
                WHEN (locked_amount - $2) <= 0 THEN 'released'
                ELSE 'releasing'
              END,
              last_transaction_at = NOW(),
              updated_at = NOW()
          WHERE task_id = $1
        `;
                break;
            case 'refund':
                updateQuery = `
          UPDATE escrow_balances
          SET refunded_amount = refunded_amount + $2,
              locked_amount = GREATEST(locked_amount - $2, 0),
              status = 'refunded',
              last_transaction_at = NOW(),
              updated_at = NOW()
          WHERE task_id = $1
        `;
                break;
            case 'fee_deduction':
                updateQuery = `
          UPDATE escrow_balances
          SET fee_amount = fee_amount + $2,
              last_transaction_at = NOW(),
              updated_at = NOW()
          WHERE task_id = $1
        `;
                break;
            default:
                return;
        }
        await database_1.pool.query(updateQuery, [taskId, amount]);
    }
    /**
     * 企业充值到托管账户
     */
    async depositFunds(taskId, companyId, amount, externalTransactionId) {
        // 记录交易
        const transaction = await this.recordTransaction({
            taskId,
            transactionType: 'deposit',
            amount,
            fromParty: 'company',
            toParty: 'escrow',
            description: '企业充值到托管账户',
            externalTransactionId,
        });
        // 更新"企业发起支付"节点
        const nodeResult = await database_1.pool.query(`UPDATE escrow_flow_nodes
       SET status = 'completed',
           completed_at = NOW(),
           actor_id = $2,
           actor_role = 'company'
       WHERE task_id = $1 AND node_type = 'payment_initiated'
       RETURNING *`, [taskId, companyId]);
        // 更新"资金锁定"节点
        await database_1.pool.query(`UPDATE escrow_flow_nodes
       SET status = 'in_progress'
       WHERE task_id = $1 AND node_type = 'funds_locked'`, [taskId]);
        return {
            transaction,
            node: nodeResult.rows[0],
        };
    }
    /**
     * 锁定资金
     */
    async lockFunds(taskId, amount) {
        // 记录交易
        await this.recordTransaction({
            taskId,
            transactionType: 'lock',
            amount,
            fromParty: 'escrow',
            toParty: 'escrow',
            description: '资金锁定',
        });
        // 更新"资金锁定"节点
        await database_1.pool.query(`UPDATE escrow_flow_nodes
       SET status = 'completed',
           completed_at = NOW(),
           actor_role = 'system'
       WHERE task_id = $1 AND node_type = 'funds_locked'`, [taskId]);
        // 更新"任务开始"节点
        await database_1.pool.query(`UPDATE escrow_flow_nodes
       SET status = 'in_progress'
       WHERE task_id = $1 AND node_type = 'task_started'`, [taskId]);
    }
    /**
     * 释放资金给学生
     */
    async releaseFunds(taskId, studentId, amount, feeAmount) {
        // 扣除平台手续费
        await this.recordTransaction({
            taskId,
            transactionType: 'fee_deduction',
            amount: feeAmount,
            fromParty: 'escrow',
            toParty: 'platform',
            description: `平台手续费 (${((feeAmount / amount) * 100).toFixed(1)}%)`,
        });
        // 释放资金给学生
        const netAmount = amount - feeAmount;
        await this.recordTransaction({
            taskId,
            transactionType: 'release',
            amount: netAmount,
            fromParty: 'escrow',
            toParty: 'student',
            description: '任务款项释放给学生',
        });
        // 更新"资金释放中"节点
        await database_1.pool.query(`UPDATE escrow_flow_nodes
       SET status = 'completed',
           completed_at = NOW(),
           actor_role = 'system'
       WHERE task_id = $1 AND node_type = 'funds_releasing'`, [taskId]);
        // 更新"资金已释放"节点
        await database_1.pool.query(`UPDATE escrow_flow_nodes
       SET status = 'completed',
           completed_at = NOW(),
           actor_id = $2,
           actor_role = 'student'
       WHERE task_id = $1 AND node_type = 'funds_released'`, [taskId, studentId]);
    }
    /**
     * 退款给企业
     */
    async refundToCompany(taskId, companyId, amount, reason) {
        await this.recordTransaction({
            taskId,
            transactionType: 'refund',
            amount,
            fromParty: 'escrow',
            toParty: 'company',
            description: `退款给企业: ${reason}`,
        });
        // 标记所有未完成的节点为跳过
        await database_1.pool.query(`UPDATE escrow_flow_nodes
       SET status = 'skipped'
       WHERE task_id = $1 AND status IN ('pending', 'in_progress')`, [taskId]);
    }
    /**
     * 获取空余额对象
     */
    getEmptyBalance(taskId) {
        return {
            task_id: taskId,
            total_amount: 0,
            locked_amount: 0,
            released_amount: 0,
            refunded_amount: 0,
            fee_amount: 0,
            available_balance: 0,
            status: 'empty',
        };
    }
    /**
     * 完成交易（支付成功后调用）
     */
    async completeTransaction(transactionId) {
        await database_1.pool.query(`UPDATE escrow_transactions
       SET status = 'completed',
           completed_at = NOW()
       WHERE id = $1`, [transactionId]);
    }
    /**
     * 交易失败
     */
    async failTransaction(transactionId, reason) {
        await database_1.pool.query(`UPDATE escrow_transactions
       SET status = 'failed',
           metadata = jsonb_set(COALESCE(metadata, '{}'), '{failure_reason}', $2)
       WHERE id = $1`, [transactionId, JSON.stringify(reason)]);
    }
}
exports.default = new EscrowTransparencyService();
//# sourceMappingURL=escrowTransparencyService.js.map