/**
 * ✅ P2安全: 用户服务 - 数据删除规则（符合GDPR/个保法）
 *
 * 关键原则：
 * 1. 个人信息真删除或匿名化
 * 2. 交易记录保留但去关联
 * 3. 用户注销后所有Token失效
 */
export declare class UserService {
    /**
     * ✅ P2安全: 注销账号 - 符合GDPR/个保法
     *
     * 删除策略：
     * - 个人信息（手机号、昵称、头像、openid）: 真删除
     * - 交易记录（订单金额、时间）: 保留但匿名化
     * - AI对话记录: 替换为"已注销用户"
     * - 作品集: 标记为不公开
     */
    deleteAccount(userId: string): Promise<void>;
    /**
     * ✅ P2安全: 导出个人数据（符合GDPR要求）
     *
     * 用户有权下载自己的所有数据
     */
    exportUserData(userId: string): Promise<any>;
    /**
     * 检查用户是否可以注销
     */
    canDeleteAccount(userId: string): Promise<{
        canDelete: boolean;
        reason?: string;
    }>;
}
export declare const userService: UserService;
//# sourceMappingURL=userService.d.ts.map