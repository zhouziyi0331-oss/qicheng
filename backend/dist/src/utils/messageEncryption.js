"use strict";
/**
 * P2安全功能：聊天记录加密存储
 *
 * 使用场景：mentor_sessions.message 字段加密
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptMessage = encryptMessage;
exports.decryptMessage = decryptMessage;
exports.migrateEncryptMessages = migrateEncryptMessages;
const encryption_1 = require("./encryption");
/**
 * 加密聊天消息
 * 使用与手机号相同的加密算法
 */
function encryptMessage(message) {
    return (0, encryption_1.encryptPhone)(message); // 复用加密逻辑
}
/**
 * 解密聊天消息
 */
function decryptMessage(encrypted) {
    return (0, encryption_1.decryptPhone)(encrypted); // 复用解密逻辑
}
/**
 * 迁移脚本：加密已有聊天记录
 * 执行方法：npm run migrate:encrypt-messages
 */
async function migrateEncryptMessages() {
    const { query } = await Promise.resolve().then(() => __importStar(require('./db')));
    const logger = (await Promise.resolve().then(() => __importStar(require('./logger')))).default;
    logger.info('🔐 开始加密聊天记录...');
    try {
        // 1. 添加加密字段（如果还没有）
        await query(`
      ALTER TABLE mentor_sessions
      ADD COLUMN IF NOT EXISTS message_encrypted TEXT,
      ADD COLUMN IF NOT EXISTS message_hash VARCHAR(64)
    `);
        // 2. 获取所有未加密的消息
        const sessions = await query(`SELECT id, message
       FROM mentor_sessions
       WHERE message IS NOT NULL
       AND message_encrypted IS NULL
       LIMIT 1000` // 分批处理，每次1000条
        );
        logger.info(`找到 ${sessions.length} 条未加密消息`);
        // 3. 逐条加密
        for (const session of sessions) {
            const { encrypted, hash } = encryptMessage(session.message);
            await query(`UPDATE mentor_sessions
         SET message_encrypted = $1, message_hash = $2
         WHERE id = $3`, [encrypted, hash, session.id]);
        }
        logger.info(`✅ 成功加密 ${sessions.length} 条消息`);
    }
    catch (error) {
        logger.error('❌ 加密聊天记录失败:', error);
        throw error;
    }
}
//# sourceMappingURL=messageEncryption.js.map