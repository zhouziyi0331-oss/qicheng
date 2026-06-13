interface EscrowFlowNode {
    id: string;
    task_id: string;
    node_type: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    amount?: number;
    actor_id?: string;
    actor_role?: string;
    expected_at?: Date;
    started_at?: Date;
    completed_at?: Date;
    sequence_order: number;
    metadata?: any;
}
interface EscrowTransaction {
    id: string;
    task_id: string;
    flow_node_id?: string;
    transaction_type: string;
    amount: number;
    from_party: string;
    to_party: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    description?: string;
    external_transaction_id?: string;
    initiated_at: Date;
    completed_at?: Date;
}
interface EscrowBalance {
    task_id: string;
    total_amount: number;
    locked_amount: number;
    released_amount: number;
    refunded_amount: number;
    fee_amount: number;
    available_balance: number;
    status: string;
    last_transaction_at?: Date;
}
interface EscrowFlowOverview {
    flow_nodes: EscrowFlowNode[];
    transactions: EscrowTransaction[];
    balance: EscrowBalance;
    progress: {
        total_nodes: number;
        completed_nodes: number;
        current_node?: EscrowFlowNode;
        completion_rate: number;
    };
}
/**
 * E-20: 资金托管透明化服务
 * 可视化展示托管流程和资金流水
 */
declare class EscrowTransparencyService {
    /**
     * 获取任务的完整托管流程概览
     */
    getEscrowFlowOverview(taskId: string): Promise<EscrowFlowOverview>;
    /**
     * 更新流程节点状态
     */
    updateFlowNodeStatus(nodeId: string, status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped', actorId?: string, actorRole?: string, metadata?: any): Promise<EscrowFlowNode>;
    /**
     * 记录托管交易
     */
    recordTransaction(data: {
        taskId: string;
        flowNodeId?: string;
        transactionType: string;
        amount: number;
        fromParty: string;
        toParty: string;
        description?: string;
        externalTransactionId?: string;
    }): Promise<EscrowTransaction>;
    /**
     * 更新托管账户余额
     */
    updateBalance(taskId: string, transactionType: string, amount: number): Promise<void>;
    /**
     * 企业充值到托管账户
     */
    depositFunds(taskId: string, companyId: string, amount: number, externalTransactionId: string): Promise<{
        transaction: EscrowTransaction;
        node: EscrowFlowNode;
    }>;
    /**
     * 锁定资金
     */
    lockFunds(taskId: string, amount: number): Promise<void>;
    /**
     * 释放资金给学生
     */
    releaseFunds(taskId: string, studentId: string, amount: number, feeAmount: number): Promise<void>;
    /**
     * 退款给企业
     */
    refundToCompany(taskId: string, companyId: string, amount: number, reason: string): Promise<void>;
    /**
     * 获取空余额对象
     */
    private getEmptyBalance;
    /**
     * 完成交易（支付成功后调用）
     */
    completeTransaction(transactionId: string): Promise<void>;
    /**
     * 交易失败
     */
    failTransaction(transactionId: string, reason: string): Promise<void>;
}
declare const _default: EscrowTransparencyService;
export default _default;
//# sourceMappingURL=escrowTransparencyService.d.ts.map