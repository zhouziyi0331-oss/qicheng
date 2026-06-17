/**
 * 数据迁移脚本：加密已有的手机号和微信信息
 *
 * 执行方法：
 * npm run migrate:encrypt-sensitive-data
 *
 * ⚠️ 重要：
 * 1. 执行前请先备份数据库！
 * 2. 在测试环境验证后再在生产环境执行
 * 3. 建议在业务低峰期执行
 */

import { query } from '../utils/db';
import { encryptPhone, encryptOpenid, hashValue } from '../utils/encryption';
import logger from '../utils/logger';

interface User {
  id: string;
  phone: string | null;
  wechat_openid: string | null;
  wechat_unionid: string | null;
}

async function migrateEncryptSensitiveData() {
  logger.info('🔐 开始加密敏感数据迁移...');

  try {
    // 1. 获取所有需要加密的用户
    const users = await query<User>(
      `SELECT id, phone, wechat_openid, wechat_unionid
       FROM users
       WHERE (phone IS NOT NULL AND phone_encrypted IS NULL)
          OR (wechat_openid IS NOT NULL AND wechat_openid_encrypted IS NULL)
          OR (wechat_unionid IS NOT NULL AND wechat_unionid_encrypted IS NULL)`
    );

    logger.info(`📊 找到 ${users.length} 个用户需要加密`);

    if (users.length === 0) {
      logger.info('✅ 没有需要迁移的数据');
      return;
    }

    // 2. 逐个加密并更新
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // 加密手机号
        if (user.phone && user.phone.trim()) {
          const { encrypted, hash } = encryptPhone(user.phone);
          updates.push(`phone_encrypted = $${paramIndex++}`);
          updates.push(`phone_hash = $${paramIndex++}`);
          params.push(encrypted, hash);
        }

        // 加密微信openid
        if (user.wechat_openid && user.wechat_openid.trim()) {
          const { encrypted, hash } = encryptOpenid(user.wechat_openid);
          updates.push(`wechat_openid_encrypted = $${paramIndex++}`);
          updates.push(`wechat_openid_hash = $${paramIndex++}`);
          params.push(encrypted, hash);
        }

        // 加密微信unionid
        if (user.wechat_unionid && user.wechat_unionid.trim()) {
          const { encrypted, hash } = encryptOpenid(user.wechat_unionid);
          updates.push(`wechat_unionid_encrypted = $${paramIndex++}`);
          updates.push(`wechat_unionid_hash = $${paramIndex++}`);
          params.push(encrypted, hash);
        }

        if (updates.length > 0) {
          params.push(user.id);
          await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            params
          );
          successCount++;

          if (successCount % 100 === 0) {
            logger.info(`✅ 已加密 ${successCount}/${users.length} 个用户`);
          }
        }
      } catch (error) {
        errorCount++;
        logger.error(`❌ 加密用户 ${user.id} 失败:`, error);
      }
    }

    logger.info(`\n📊 迁移完成统计:`);
    logger.info(`   ✅ 成功: ${successCount}`);
    logger.info(`   ❌ 失败: ${errorCount}`);
    logger.info(`   📈 总计: ${users.length}`);

    // 3. 验证加密数据
    logger.info('\n🔍 验证加密数据...');
    const sampleUser = await query<any>(
      `SELECT phone, phone_encrypted, phone_hash
       FROM users
       WHERE phone_encrypted IS NOT NULL
       LIMIT 1`
    );

    if (sampleUser.length > 0) {
      const { decryptPhone } = await import('../utils/encryption');
      const decrypted = decryptPhone(sampleUser[0].phone_encrypted);
      const match = decrypted === sampleUser[0].phone;

      if (match) {
        logger.info('✅ 加密验证通过：解密后的数据与原始数据一致');
      } else {
        logger.error('❌ 加密验证失败：解密后的数据与原始数据不一致！');
        throw new Error('Encryption verification failed');
      }
    }

    logger.info('\n✅ 敏感数据加密迁移完成！');
    logger.info('\n⚠️  下一步：');
    logger.info('1. 验证应用功能正常（登录、注册等）');
    logger.info('2. 更新代码使用加密字段');
    logger.info('3. 测试1-2周后，可以删除明文字段：');
    logger.info('   ALTER TABLE users DROP COLUMN phone;');
    logger.info('   ALTER TABLE users DROP COLUMN wechat_openid;');
    logger.info('   ALTER TABLE users DROP COLUMN wechat_unionid;');

  } catch (error) {
    logger.error('❌ 迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateEncryptSensitiveData()
    .then(() => {
      logger.info('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { migrateEncryptSensitiveData };
