/**
 * 加密服务
 *
 * 功能：
 * 1. 交付物内容加密/解密
 * 2. 密钥管理
 * 3. 加密元数据管理
 *
 * 使用 AES-256-GCM 加密算法
 */
interface EncryptionResult {
    encryptedData: string;
    iv: string;
    authTag: string;
    keyId: string;
}
interface DecryptionParams {
    encryptedData: string;
    iv: string;
    authTag: string;
    keyId: string;
}
interface EncryptedFields {
    [key: string]: string;
}
declare class EncryptionService {
    private readonly algorithm;
    private readonly keyLength;
    /**
     * 获取加密密钥（从环境变量）
     */
    private getEncryptionKey;
    /**
     * 加密数据
     */
    encrypt(plaintext: string, keyId?: string): Promise<EncryptionResult>;
    /**
     * 解密数据
     */
    decrypt(params: DecryptionParams): Promise<string>;
    /**
     * 加密交付物
     */
    encryptDeliverable(deliverableId: string, deliverableType: 'task_deliverable' | 'pbl_deliverable', fields: EncryptedFields, userId: string): Promise<EncryptedFields>;
    /**
     * 解密交付物
     */
    decryptDeliverable(deliverableId: string, deliverableType: 'task_deliverable' | 'pbl_deliverable', encryptedFields: EncryptedFields): Promise<EncryptedFields>;
    /**
     * 更新密钥使用统计
     */
    private updateKeyUsage;
    /**
     * 检查用户是否有权限解密
     */
    canDecrypt(userId: string, userRole: string, deliverableId: string, taskId: string): Promise<boolean>;
    /**
     * 生成新的加密密钥（用于密钥轮换）
     */
    generateKey(): string;
}
declare const _default: EncryptionService;
export default _default;
//# sourceMappingURL=encryptionService.d.ts.map