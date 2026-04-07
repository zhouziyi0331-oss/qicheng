/**
 * UnlockService - 解锁服务
 *
 * 核心功能：
 * 1. 创建解锁支付订单
 * 2. 处理支付回调
 * 3. 解密商家联系方式
 * 4. 创建解锁记录
 */
export declare class UnlockService {
    private static readonly ENCRYPTION_KEY;
    private static readonly UNLOCK_PRICE_FEN;
    /**
     * 创建解锁支付订单
     */
    static createUnlockPayment(studentId: string, sessionId: string): Promise<{
        paymentId: string;
        outTradeNo: string;
        amountFen: number;
    }>;
    /**
     * 处理支付成功回调
     */
    static handlePaymentSuccess(outTradeNo: string, transactionId: string): Promise<{
        unlockRecordId: string;
        contact: any;
    }>;
    /**
     * 加密联系方式
     */
    static encrypt(text: string): string;
    /**
     * 解密联系方式
     */
    static decrypt(encryptedText: string): string;
    /**
     * 获取解锁记录
     */
    static getUnlockRecord(studentId: string, companyId: string): Promise<any>;
    /**
     * 记录学生查看联系方式
     */
    static recordContactViewed(unlockRecordId: string): Promise<void>;
    /**
     * 收集反馈
     */
    static collectFeedback(unlockRecordId: string, studentContacted: boolean, merchantContacted: boolean): Promise<void>;
}
//# sourceMappingURL=unlockService.d.ts.map