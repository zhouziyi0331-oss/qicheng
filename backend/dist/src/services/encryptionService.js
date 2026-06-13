"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = __importDefault(require("../utils/db"));
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
    }
    /**
     * 获取加密密钥（从环境变量）
     */
    getEncryptionKey(keyId) {
        const keyEnvVar = `ENCRYPTION_KEY_${keyId.toUpperCase().replace(/-/g, '_')}`;
        const keyHex = process.env[keyEnvVar] || process.env.ENCRYPTION_KEY_DEFAULT;
        if (!keyHex) {
            throw new Error(`Encryption key not found for keyId: ${keyId}`);
        }
        return Buffer.from(keyHex, 'hex');
    }
    /**
     * 加密数据
     */
    async encrypt(plaintext, keyId = 'platform-key-v1') {
        try {
            const key = this.getEncryptionKey(keyId);
            const iv = crypto_1.default.randomBytes(16); // 128-bit IV for GCM
            const cipher = crypto_1.default.createCipheriv(this.algorithm, key, iv);
            let encrypted = cipher.update(plaintext, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            const authTag = cipher.getAuthTag();
            // 更新密钥使用统计
            await this.updateKeyUsage(keyId);
            return {
                encryptedData: encrypted,
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
                keyId,
            };
        }
        catch (error) {
            logger_1.default.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }
    /**
     * 解密数据
     */
    async decrypt(params) {
        try {
            const key = this.getEncryptionKey(params.keyId);
            const iv = Buffer.from(params.iv, 'base64');
            const authTag = Buffer.from(params.authTag, 'base64');
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(params.encryptedData, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.default.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }
    /**
     * 加密交付物
     */
    async encryptDeliverable(deliverableId, deliverableType, fields, userId) {
        const encryptedFields = {};
        const encryptedFieldsMetadata = {};
        let iv = '';
        let authTag = '';
        const keyId = 'platform-key-v1';
        // 加密每个字段
        for (const [fieldName, fieldValue] of Object.entries(fields)) {
            if (fieldValue) {
                const result = await this.encrypt(fieldValue, keyId);
                encryptedFields[fieldName] = result.encryptedData;
                encryptedFieldsMetadata[fieldName] = true;
                // 所有字段使用相同的IV和authTag（简化管理）
                if (!iv) {
                    iv = result.iv;
                    authTag = result.authTag;
                }
            }
        }
        // 保存加密元数据
        await db_1.default.query(`INSERT INTO deliverable_encryption_metadata
       (deliverable_id, deliverable_type, encryption_algorithm, encryption_key_id,
        iv, auth_tag, encrypted_fields, encrypted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            deliverableId,
            deliverableType,
            this.algorithm,
            keyId,
            iv,
            authTag,
            JSON.stringify(encryptedFieldsMetadata),
            userId,
        ]);
        logger_1.default.info(`Encrypted deliverable ${deliverableId} with ${Object.keys(fields).length} fields`);
        return encryptedFields;
    }
    /**
     * 解密交付物
     */
    async decryptDeliverable(deliverableId, deliverableType, encryptedFields) {
        // 获取加密元数据
        const result = await db_1.default.query(`SELECT * FROM deliverable_encryption_metadata
       WHERE deliverable_id = $1 AND deliverable_type = $2
       ORDER BY created_at DESC LIMIT 1`, [deliverableId, deliverableType]);
        if (result.rows.length === 0) {
            throw new Error('Encryption metadata not found');
        }
        const metadata = result.rows[0];
        const decryptedFields = {};
        // 解密每个字段
        for (const [fieldName, encryptedValue] of Object.entries(encryptedFields)) {
            if (encryptedValue && metadata.encrypted_fields[fieldName]) {
                const decrypted = await this.decrypt({
                    encryptedData: encryptedValue,
                    iv: metadata.iv,
                    authTag: metadata.auth_tag,
                    keyId: metadata.encryption_key_id,
                });
                decryptedFields[fieldName] = decrypted;
            }
            else {
                decryptedFields[fieldName] = encryptedValue;
            }
        }
        return decryptedFields;
    }
    /**
     * 更新密钥使用统计
     */
    async updateKeyUsage(keyId) {
        try {
            await db_1.default.query(`UPDATE encryption_keys
         SET encryption_count = encryption_count + 1,
             last_used_at = NOW()
         WHERE key_id = $1`, [keyId]);
        }
        catch (error) {
            // 忽略错误，不影响主流程
            logger_1.default.error('Failed to update key usage:', error);
        }
    }
    /**
     * 检查用户是否有权限解密
     */
    async canDecrypt(userId, userRole, deliverableId, taskId) {
        // 企业只能解密自己任务的交付物
        if (userRole === 'company') {
            const result = await db_1.default.query(`SELECT company_id FROM tasks WHERE id = $1`, [taskId]);
            return result.rows.length > 0 && result.rows[0].company_id === userId;
        }
        // 学生只能解密自己提交的交付物
        if (userRole === 'student') {
            const result = await db_1.default.query(`SELECT accepted_student_id FROM tasks WHERE id = $1`, [taskId]);
            return result.rows.length > 0 && result.rows[0].accepted_student_id === userId;
        }
        // 平台管理员可以解密
        if (userRole === 'platform_admin' || userRole === 'admin') {
            return true;
        }
        return false;
    }
    /**
     * 生成新的加密密钥（用于密钥轮换）
     */
    generateKey() {
        return crypto_1.default.randomBytes(this.keyLength).toString('hex');
    }
}
exports.default = new EncryptionService();
//# sourceMappingURL=encryptionService.js.map