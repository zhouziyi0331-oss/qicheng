/**
 * 加密手机号
 * @param phone 明文手机号
 * @returns { encrypted: string, hash: string }
 */
export declare function encryptPhone(phone: string): {
    encrypted: string;
    hash: string;
};
/**
 * 解密手机号
 * @param encrypted 加密后的手机号（格式：iv:encrypted:authTag）
 * @returns 明文手机号
 */
export declare function decryptPhone(encrypted: string): string;
/**
 * 加密微信openid
 * @param openid 明文openid
 * @returns { encrypted: string, hash: string }
 */
export declare function encryptOpenid(openid: string): {
    encrypted: string;
    hash: string;
};
/**
 * 解密微信openid
 * @param encrypted 加密后的openid
 * @returns 明文openid
 */
export declare function decryptOpenid(encrypted: string): string;
/**
 * 生成字符串的SHA256哈希（用于索引）
 * @param value 原始字符串
 * @returns SHA256哈希
 */
export declare function hashValue(value: string): string;
/**
 * 验证加密密钥是否配置正确
 */
export declare function validateEncryptionKey(): boolean;
//# sourceMappingURL=encryption.d.ts.map