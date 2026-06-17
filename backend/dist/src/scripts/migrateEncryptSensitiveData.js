"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateEncryptSensitiveData = migrateEncryptSensitiveData;
const db_1 = require("../utils/db");
const encryption_1 = require("../utils/encryption");
const logger_1 = __importDefault(require("../utils/logger"));
async function migrateEncryptSensitiveData() {
    logger_1.default.info('🔐 开始加密敏感数据迁移...');
    try {
        // 1. 获取所有需要加密的用户
        const users = await (0, db_1.query)(`SELECT id, phone, wechat_openid, wechat_unionid
       FROM users
       WHERE (phone IS NOT NULL AND phone_encrypted IS NULL)
          OR (wechat_openid IS NOT NULL AND wechat_openid_encrypted IS NULL)
          OR (wechat_unionid IS NOT NULL AND wechat_unionid_encrypted IS NULL)`);
        logger_1.default.info(`📊 找到 ${users.length} 个用户需要加密`);
        if (users.length === 0) {
            logger_1.default.info('✅ 没有需要迁移的数据');
            return;
        }
        // 2. 逐个加密并更新
        let successCount = 0;
        let errorCount = 0;
        for (const user of users) {
            try {
                const updates = [];
                const params = [];
                let paramIndex = 1;
                // 加密手机号
                if (user.phone && user.phone.trim()) {
                    const { encrypted, hash } = (0, encryption_1.encryptPhone)(user.phone);
                    updates.push(`phone_encrypted = $${paramIndex++}`);
                    updates.push(`phone_hash = $${paramIndex++}`);
                    params.push(encrypted, hash);
                }
                // 加密微信openid
                if (user.wechat_openid && user.wechat_openid.trim()) {
                    const { encrypted, hash } = (0, encryption_1.encryptOpenid)(user.wechat_openid);
                    updates.push(`wechat_openid_encrypted = $${paramIndex++}`);
                    updates.push(`wechat_openid_hash = $${paramIndex++}`);
                    params.push(encrypted, hash);
                }
                // 加密微信unionid
                if (user.wechat_unionid && user.wechat_unionid.trim()) {
                    const { encrypted, hash } = (0, encryption_1.encryptOpenid)(user.wechat_unionid);
                    updates.push(`wechat_unionid_encrypted = $${paramIndex++}`);
                    updates.push(`wechat_unionid_hash = $${paramIndex++}`);
                    params.push(encrypted, hash);
                }
                if (updates.length > 0) {
                    params.push(user.id);
                    await (0, db_1.query)(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
                    successCount++;
                    if (successCount % 100 === 0) {
                        logger_1.default.info(`✅ 已加密 ${successCount}/${users.length} 个用户`);
                    }
                }
            }
            catch (error) {
                errorCount++;
                logger_1.default.error(`❌ 加密用户 ${user.id} 失败:`, error);
            }
        }
        logger_1.default.info(`\n📊 迁移完成统计:`);
        logger_1.default.info(`   ✅ 成功: ${successCount}`);
        logger_1.default.info(`   ❌ 失败: ${errorCount}`);
        logger_1.default.info(`   📈 总计: ${users.length}`);
        // 3. 验证加密数据
        logger_1.default.info('\n🔍 验证加密数据...');
        const sampleUser = await (0, db_1.query)(`SELECT phone, phone_encrypted, phone_hash
       FROM users
       WHERE phone_encrypted IS NOT NULL
       LIMIT 1`);
        if (sampleUser.length > 0) {
            const { decryptPhone } = await Promise.resolve().then(() => __importStar(require('../utils/encryption')));
            const decrypted = decryptPhone(sampleUser[0].phone_encrypted);
            const match = decrypted === sampleUser[0].phone;
            if (match) {
                logger_1.default.info('✅ 加密验证通过：解密后的数据与原始数据一致');
            }
            else {
                logger_1.default.error('❌ 加密验证失败：解密后的数据与原始数据不一致！');
                throw new Error('Encryption verification failed');
            }
        }
        logger_1.default.info('\n✅ 敏感数据加密迁移完成！');
        logger_1.default.info('\n⚠️  下一步：');
        logger_1.default.info('1. 验证应用功能正常（登录、注册等）');
        logger_1.default.info('2. 更新代码使用加密字段');
        logger_1.default.info('3. 测试1-2周后，可以删除明文字段：');
        logger_1.default.info('   ALTER TABLE users DROP COLUMN phone;');
        logger_1.default.info('   ALTER TABLE users DROP COLUMN wechat_openid;');
        logger_1.default.info('   ALTER TABLE users DROP COLUMN wechat_unionid;');
    }
    catch (error) {
        logger_1.default.error('❌ 迁移失败:', error);
        throw error;
    }
}
// 如果直接运行此脚本
if (require.main === module) {
    migrateEncryptSensitiveData()
        .then(() => {
        logger_1.default.info('✅ 脚本执行完成');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrateEncryptSensitiveData.js.map