/**
 * 联系方式交换服务
 *
 * 核心功能：
 * 1. 第3次合作完成后，自动询问双方
 * 2. 双方都同意后，推送联系方式
 * 3. 建立长期合作关系
 */
interface ExchangeRequest {
    id: string;
    studentId: string;
    companyId: string;
    taskId: string;
    studentAgreed: boolean;
    companyAgreed: boolean;
    exchanged: boolean;
    collaborationCount: number;
    createdAt: Date;
}
declare class ContactExchangeService {
    /**
     * 任务完成后检查是否可以交换联系方式
     *
     * 在任务完成时自动调用
     */
    checkAndPromptExchange(studentId: string, companyId: string, taskId: string): Promise<{
        shouldPrompt: boolean;
        reason?: string;
    }>;
    /**
     * 获取合作次数
     */
    private getCollaborationCount;
    /**
     * 检查是否已经交换过
     */
    private hasExchanged;
    /**
     * 获取现有的交换请求
     */
    private getExistingRequest;
    /**
     * 创建交换请求
     */
    private createExchangeRequest;
    /**
     * 询问双方是否愿意交换联系方式
     */
    private promptBothSides;
    /**
     * 获取合作统计
     */
    private getCollaborationStats;
    /**
     * 生成询问消息
     */
    private generatePromptMessage;
    /**
     * 发送询问（集成通知系统）
     */
    private sendPrompt;
    /**
     * 用户同意交换联系方式
     */
    agreeToExchange(userId: string, studentId: string, companyId: string): Promise<{
        success: boolean;
        exchanged: boolean;
        message: string;
    }>;
    /**
     * 执行联系方式交换
     */
    private executeExchange;
    /**
     * 获取联系方式
     */
    private getContactInfo;
    /**
     * 推送联系方式
     */
    private pushContactInfo;
    /**
     * 生成联系方式推送消息
     */
    private generateContactMessage;
    /**
     * 脱敏手机号
     */
    private maskPhone;
    /**
     * 获取用户信息
     */
    private getUser;
    /**
     * 获取交换请求状态
     */
    getExchangeStatus(studentId: string, companyId: string): Promise<ExchangeRequest | null>;
    /**
     * 检查是否可以交换联系方式
     */
    canExchange(studentId: string, companyId: string): Promise<boolean>;
}
export declare const contactExchangeService: ContactExchangeService;
export {};
//# sourceMappingURL=contactExchangeService.d.ts.map