export interface EscrowAccount {
    id: number;
    userId: number;
    userType: 'student' | 'company';
    totalBalance: number;
    frozenBalance: number;
    availableBalance: number;
    pendingSettlement: number;
    totalIncome: number;
    totalWithdrawal: number;
}
export interface TaskQuote {
    id: number;
    taskId: number;
    studentId: number;
    companyId: number;
    quotedAmount: number;
    platformFeeRate: number;
    platformFee: number;
    studentNetIncome: number;
    status: string;
}
export interface TransactionLog {
    userId: number;
    userType: 'student' | 'company';
    transactionType: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    taskId?: number;
    quoteId?: number;
    description?: string;
}
declare class EscrowService {
    /**
     * 获取用户托管账户
     */
    getAccount(userId: number, userType: 'student' | 'company'): Promise<EscrowAccount | null>;
    /**
     * 创建任务报价
     */
    createQuote(taskId: number, studentId: number, companyId: number, quotedAmount: number, platformFeeRate?: number): Promise<TaskQuote>;
    /**
     * 学生接受报价
     */
    acceptQuote(quoteId: number, studentId: number): Promise<void>;
    /**
     * 企业支付并进入托管
     */
    payAndEscrow(quoteId: number, companyId: number, paymentMethod: string): Promise<void>;
    /**
     * 任务完成，进入待结算（7天后可提现）
     */
    completeTaskAndSettle(taskId: number, quoteId: number): Promise<void>;
    /**
     * 释放待结算资金到可提现（7天后自动执行）
     */
    releaseSettlement(taskId: number, quoteId: number): Promise<void>;
    /**
     * 记录交易流水
     */
    private logTransaction;
    /**
     * 获取交易流水
     */
    getTransactionLogs(userId: number, userType: 'student' | 'company', limit?: number, offset?: number): Promise<any[]>;
}
export declare const escrowService: EscrowService;
export {};
//# sourceMappingURL=escrowService.d.ts.map