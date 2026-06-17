import crypto from 'crypto';
import { config } from '../../config';

/**
 * 敏感数据加密工具类
 * 使用AES-256-GCM对称加密
 */

// 从环境变量读取加密密钥（32字节hex）
const ENCRYPTION_KEY = Buffer.from(
  config.encryption?.key || process.env.ENCRYPTION_KEY_DEFAULT || '',
  'hex'
);

const IV_LENGTH = 16; // AES-GCM的IV长度

/**
 * 加密手机号
 * @param phone 明文手机号
 * @returns { encrypted: string, hash: string }
 */
export function encryptPhone(phone: string): { encrypted: string; hash: string } {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // 生成随机IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // 创建加密器
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  // 加密
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 获取认证标签
  const authTag = cipher.getAuthTag();

  // 生成SHA256哈希用于索引查找
  const hash = crypto.createHash('sha256').update(phone).digest('hex');

  // 格式：iv:encrypted:authTag
  return {
    encrypted: `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`,
    hash
  };
}

/**
 * 解密手机号
 * @param encrypted 加密后的手机号（格式：iv:encrypted:authTag）
 * @returns 明文手机号
 */
export function decryptPhone(encrypted: string): string {
  if (!encrypted) {
    throw new Error('Encrypted phone is required');
  }

  try {
    // 解析格式
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted phone format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    // 创建解密器
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    // 解密
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt phone: ${(error as Error).message}`);
  }
}

/**
 * 加密微信openid
 * @param openid 明文openid
 * @returns { encrypted: string, hash: string }
 */
export function encryptOpenid(openid: string): { encrypted: string; hash: string } {
  if (!openid) {
    throw new Error('Openid is required');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(openid, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  const hash = crypto.createHash('sha256').update(openid).digest('hex');

  return {
    encrypted: `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`,
    hash
  };
}

/**
 * 解密微信openid
 * @param encrypted 加密后的openid
 * @returns 明文openid
 */
export function decryptOpenid(encrypted: string): string {
  if (!encrypted) {
    throw new Error('Encrypted openid is required');
  }

  try {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted openid format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt openid: ${(error as Error).message}`);
  }
}

/**
 * 生成字符串的SHA256哈希（用于索引）
 * @param value 原始字符串
 * @returns SHA256哈希
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * 验证加密密钥是否配置正确
 */
export function validateEncryptionKey(): boolean {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('⚠️  Encryption key is not properly configured! Expected 32 bytes.');
    return false;
  }
  return true;
}

// 启动时验证密钥
if (!validateEncryptionKey()) {
  console.warn('⚠️  WARNING: Encryption is not properly configured. Sensitive data will not be encrypted!');
}
