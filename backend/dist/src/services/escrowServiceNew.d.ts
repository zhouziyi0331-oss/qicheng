/**
 * 支付托管和提现服务（新版）
 *
 * 基于063_escrow_withdrawal_system.sql的完整实现
 */
export interface EscrowAccount {
    id: string;
    user_id: string;
    user_type: string;
    balance: number;
    frozen_balance: number;
    available_balance: number;
    total_income: number;
    total_withdrawal: number;
    status: string;
    is_verified: boolean;
}
export interface WithdrawalRequest {
    id: string;
    user_id: string;
    amount: number;
    fee: number;
    actual_amount: number;
    withdrawal_method: string;
    withdrawal_account: string;
    account_name: string;
    status: string;
}
declare class EscrowServiceNew {
    /**
     * 获取或创建托管账户
     */
    getOrCreateAccount(userId: string, userType: string): Promise<EscrowAccount>;
    /**
     * 托管资金
     */
    depositFunds(taskId: string, payerId: string, payeeId: string, amount: number): Promise<any>;
    /**
     * 释放资金
     */
    releaseFunds(taskId: string): Promise<any>;
    /**
     * 申请提现
     */
    requestWithdrawal(userId: string, amount: number, method: string, account: string, name: string): Promise<WithdrawalRequest>;
    /**
     * 获取账户信息
     */
    getAccount(userId: string): Promise<EscrowAccount | null>;
    /**
     * 获取账户流水
     */
    getTransactions(userId: string, limit?: number, offset?: number): Promise<any>;
    /**
     * 获取提现记录
     */
    getWithdrawals(userId: string, limit?: number, offset?: number): Promise<any>;
}
export declare const escrowServiceNew: EscrowServiceNew;
export { escrowServiceNew as escrowService };
//# sourceMappingURL=escrowServiceNew.d.ts.map