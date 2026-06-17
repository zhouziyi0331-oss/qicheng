"use strict";
/**
 * ✅ P2安全: 用户服务 - 数据删除规则（符合GDPR/个保法）
 *
 * 关键原则：
 * 1. 个人信息真删除或匿名化
 * 2. 交易记录保留但去关联
 * 3. 用户注销后所有Token失效
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const db_1 = require("../utils/db");
const redis_1 = __importDefault(require("../utils/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
const uuid_1 = require("uuid");
class UserService {
    /**
     * ✅ P2安全: 注销账号 - 符合GDPR/个保法
     *
     * 删除策略：
     * - 个人信息（手机号、昵称、头像、openid）: 真删除
     * - 交易记录（订单金额、时间）: 保留但匿名化
     * - AI对话记录: 替换为"已注销用户"
     * - 作品集: 标记为不公开
     */
    async deleteAccount(userId) {
        logger_1.default.info(`用户注销开始: ${userId}`);
        const anonymousId = `deleted_${(0, uuid_1.v4)()}`;
        try {
            // 使用事务确保数据一致性
            await (0, db_1.query)('BEGIN');
            // ✅ 1. 真删除个人信息
            await (0, db_1.query)(`
        UPDATE users SET
          phone = NULL,
          phone_encrypted = NULL,
          phone_hash = NULL,
          wechat_openid = NULL,
          wechat_openid_encrypted = NULL,
          wechat_unionid = NULL,
          nickname = '已注销用户',
          avatar_url = NULL,
          password_hash = NULL,
          status = 'deleted',
          deleted_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `, [userId]);
            // ✅ 2. 保留订单记录但匿名化（财务审计需要）
            await (0, db_1.query)(`
        UPDATE orders SET
          student_id = NULL,
          anonymous_student_id = $1,
          updated_at = NOW()
        WHERE student_id = $2
      `, [anonymousId, userId]);
            // 企业的订单也要匿名化
            await (0, db_1.query)(`
        UPDATE orders SET
          client_id = NULL,
          anonymous_client_id = $1,
          updated_at = NOW()
        WHERE client_id = $2
      `, [anonymousId, userId]);
            // ✅ 3. AI导师对话记录匿名化
            await (0, db_1.query)(`
        UPDATE mentor_sessions SET
          user_id = NULL,
          anonymous_user_id = $1,
          updated_at = NOW()
        WHERE user_id = $2
      `, [anonymousId, userId]);
            // 将对话中的用户消息替换为"已注销用户"
            await (0, db_1.query)(`
        UPDATE mentor_messages SET
          content = '[用户已注销]',
          updated_at = NOW()
        WHERE session_id IN (
          SELECT id FROM mentor_sessions WHERE anonymous_user_id = $1
        )
        AND role = 'user'
      `, [anonymousId]);
            // ✅ 4. 作品集标记为不公开
            await (0, db_1.query)(`
        UPDATE portfolio SET
          is_public = false,
          status = 'deleted',
          updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);
            // ✅ 5. 删除收货地址等其他个人信息
            await (0, db_1.query)('DELETE FROM user_addresses WHERE user_id = $1', [userId]);
            await (0, db_1.query)('DELETE FROM user_bank_cards WHERE user_id = $1', [userId]);
            await (0, db_1.query)('COMMIT');
            // ✅ 6. 清除所有Token和Session
            await redis_1.default.del(`user_tokens:${userId}`);
            await (0, db_1.query)('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
            // ✅ 7. 将该用户所有活跃JWT加入黑名单
            await redis_1.default.setex(`user_revoked:${userId}`, 7200, '1'); // 2小时
            logger_1.default.info(`用户注销完成: ${userId} -> ${anonymousId}`);
        }
        catch (error) {
            await (0, db_1.query)('ROLLBACK');
            logger_1.default.error('用户注销失败:', { userId, error });
            throw error;
        }
    }
    /**
     * ✅ P2安全: 导出个人数据（符合GDPR要求）
     *
     * 用户有权下载自己的所有数据
     */
    async exportUserData(userId) {
        logger_1.default.info(`导出个人数据: ${userId}`);
        const userData = await (0, db_1.query)('SELECT * FROM users WHERE id = $1', [userId]);
        const orders = await (0, db_1.query)('SELECT * FROM orders WHERE student_id = $1 OR client_id = $1', [userId]);
        const mentorSessions = await (0, db_1.query)('SELECT * FROM mentor_sessions WHERE user_id = $1', [userId]);
        const portfolio = await (0, db_1.query)('SELECT * FROM portfolio WHERE user_id = $1', [userId]);
        return {
            user: userData[0],
            orders,
            mentorSessions,
            portfolio,
            exportedAt: new Date().toISOString(),
        };
    }
    /**
     * 检查用户是否可以注销
     */
    async canDeleteAccount(userId) {
        // 检查是否有未完成的订单
        const pendingOrders = await (0, db_1.query)(`
      SELECT COUNT(*) as count FROM orders
      WHERE (student_id = $1 OR client_id = $1)
      AND status IN ('pending', 'in_progress', 'accepted')
    `, [userId]);
        if (parseInt(pendingOrders[0].count) > 0) {
            return {
                canDelete: false,
                reason: '您还有未完成的订单，请完成后再注销账号'
            };
        }
        // 检查是否有未提现的余额
        const user = await (0, db_1.query)('SELECT balance FROM users WHERE id = $1', [userId]);
        if (user[0] && parseFloat(user[0].balance) > 0) {
            return {
                canDelete: false,
                reason: '您还有未提现的余额，请先提现'
            };
        }
        return { canDelete: true };
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=userService.js.map