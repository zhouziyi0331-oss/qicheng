/**
 * P2安全功能：聊天记录加密存储
 *
 * 使用场景：mentor_sessions.message 字段加密
 */
/**
 * 加密聊天消息
 * 使用与手机号相同的加密算法
 */
export declare function encryptMessage(message: string): {
    encrypted: string;
    hash: string;
};
/**
 * 解密聊天消息
 */
export declare function decryptMessage(encrypted: string): string;
/**
 * 迁移脚本：加密已有聊天记录
 * 执行方法：npm run migrate:encrypt-messages
 */
export declare function migrateEncryptMessages(): Promise<void>;
//# sourceMappingURL=messageEncryption.d.ts.map