export interface WithdrawalRequest {
    id: number;
    userId: number;
    amount: number;
    withdrawalMethod: 'wechat' | 'alipay';
    accountName: string;
    accountNumber: string;
    status: string;
    createdAt: Date;
}
declare class WithdrawalService {
    /**
     * 创建提现申请
     */
    createWithdrawal(userId: number, amount: number, withdrawalMethod: 'wechat' | 'alipay', accountName: string, accountNumber: string): Promise<WithdrawalRequest>;
    /**
     * 审核提现申请（管理员）
     */
    reviewWithdrawal(withdrawalId: number, reviewerId: number, approved: boolean, rejectReason?: string): Promise<void>;
    /**
     * 完成提现（第三方支付成功后调用）
     */
    completeWithdrawal(withdrawalId: number, paymentOrderId: string): Promise<void>;
    /**
     * 提现失败（第三方支付失败后调用）
     */
    failWithdrawal(withdrawalId: number, reason: string): Promise<void>;
    /**
     * 获取用户提现记录
     */
    getUserWithdrawals(userId: number, limit?: number, offset?: number): Promise<any[]>;
    /**
     * 获取待审核提现列表（管理员）
     */
    getPendingWithdrawals(limit?: number, offset?: number): Promise<any[]>;
    /**
     * 获取提现统计
     */
    getWithdrawalStats(userId: number): Promise<any>;
}
export declare const withdrawalService: WithdrawalService;
export {};
//# sourceMappingURL=withdrawalService.d.ts.map