import mongoose from 'mongoose';
/**
 * 收入和提现服务
 */
export declare class FinancialService {
    /**
     * 获取用户余额（直接从User表读取，已缓存）
     */
    getUserBalance(userId: string): Promise<{
        totalIncome: number;
        totalWithdrawal: number;
        availableBalance: number;
    }>;
    /**
     * 重新计算用户余额（用于对账）
     */
    recalculateUserBalance(userId: string): Promise<{
        totalIncome: number;
        totalWithdrawal: number;
        availableBalance: number;
    }>;
    /**
     * 获取收入记录
     */
    getIncomeRecords(userId: string, options?: {
        status?: string;
        source?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        records: (mongoose.Document<unknown, {}, import("../models/Income").IIncome, {}, {}> & import("../models/Income").IIncome & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * 申请提现
     */
    requestWithdrawal(userId: string, data: {
        amount: number;
        withdrawalMethod: 'wechat' | 'alipay' | 'bank_card';
        withdrawalAccount: string;
    }): Promise<mongoose.Document<unknown, {}, import("../models/Withdrawal").IWithdrawal, {}, {}> & import("../models/Withdrawal").IWithdrawal & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 脱敏账号
     */
    private maskAccount;
    /**
     * 获取提现记录
     */
    getWithdrawalRecords(userId: string, options?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        records: (mongoose.Document<unknown, {}, import("../models/Withdrawal").IWithdrawal, {}, {}> & import("../models/Withdrawal").IWithdrawal & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * 取消提现（仅pending状态）
     */
    cancelWithdrawal(userId: string, withdrawalId: string): Promise<mongoose.Document<unknown, {}, import("../models/Withdrawal").IWithdrawal, {}, {}> & import("../models/Withdrawal").IWithdrawal & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 获取收入统计
     */
    getIncomeStats(userId: string): Promise<{
        totalIncome: number;
        totalCount: number;
        bySource: any;
    }>;
    /**
     * 管理员审核提现（内部接口）
     */
    reviewWithdrawal(withdrawalId: string, action: 'approve' | 'reject', reviewNote?: string, reviewedBy?: string): Promise<mongoose.Document<unknown, {}, import("../models/Withdrawal").IWithdrawal, {}, {}> & import("../models/Withdrawal").IWithdrawal & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 完成提现（内部接口）
     */
    completeWithdrawal(withdrawalId: string, transactionId: string): Promise<mongoose.Document<unknown, {}, import("../models/Withdrawal").IWithdrawal, {}, {}> & import("../models/Withdrawal").IWithdrawal & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
export declare const financialService: FinancialService;
//# sourceMappingURL=financial.service.d.ts.map