/**
 * P2安全功能：聊天记录加密存储
 *
 * 使用场景：mentor_sessions.message 字段加密
 */

import { encryptPhone, decryptPhone } from './encryption';

/**
 * 加密聊天消息
 * 使用与手机号相同的加密算法
 */
export function encryptMessage(message: string): { encrypted: string; hash: string } {
  return encryptPhone(message); // 复用加密逻辑
}

/**
 * 解密聊天消息
 */
export function decryptMessage(encrypted: string): string {
  return decryptPhone(encrypted); // 复用解密逻辑
}

/**
 * 迁移脚本：加密已有聊天记录
 * 执行方法：npm run migrate:encrypt-messages
 */
export async function migrateEncryptMessages() {
  const { query } = await import('./db');
  const logger = (await import('./logger')).default;

  logger.info('🔐 开始加密聊天记录...');

  try {
    // 1. 添加加密字段（如果还没有）
    await query(`
      ALTER TABLE mentor_sessions
      ADD COLUMN IF NOT EXISTS message_encrypted TEXT,
      ADD COLUMN IF NOT EXISTS message_hash VARCHAR(64)
    `);

    // 2. 获取所有未加密的消息
    const sessions = await query<any>(
      `SELECT id, message
       FROM mentor_sessions
       WHERE message IS NOT NULL
       AND message_encrypted IS NULL
       LIMIT 1000` // 分批处理，每次1000条
    );

    logger.info(`找到 ${sessions.length} 条未加密消息`);

    // 3. 逐条加密
    for (const session of sessions) {
      const { encrypted, hash } = encryptMessage(session.message);
      await query(
        `UPDATE mentor_sessions
         SET message_encrypted = $1, message_hash = $2
         WHERE id = $3`,
        [encrypted, hash, session.id]
      );
    }

    logger.info(`✅ 成功加密 ${sessions.length} 条消息`);
  } catch (error) {
    logger.error('❌ 加密聊天记录失败:', error);
    throw error;
  }
}
