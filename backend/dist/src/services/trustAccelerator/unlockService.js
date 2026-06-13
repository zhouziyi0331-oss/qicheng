"use strict";
/**
 * UnlockService - 解锁服务
 *
 * 核心功能：
 * 1. 创建解锁支付订单
 * 2. 处理支付回调
 * 3. 解密商家联系方式
 * 4. 创建解锁记录
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnlockService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../utils/db");
class UnlockService {
    /**
     * 创建解锁支付订单
     */
    static async createUnlockPayment(studentId, sessionId) {
        return (0, db_1.withTransaction)(async (client) => {
            // 检查会话状态
            const sessionResult = await client.query(`SELECT * FROM verify_sessions
         WHERE id = $1 AND student_id = $2 AND deleted_at IS NULL`, [sessionId, studentId]);
            if (sessionResult.rows.length === 0) {
                throw new Error('验证会话不存在');
            }
            const session = sessionResult.rows[0];
            if (session.status !== 'all_pass') {
                throw new Error('验证未通过，无法解锁');
            }
            // 检查是否已支付
            const existingPayment = await client.query(`SELECT id FROM unlock_payments
         WHERE session_id = $1 AND status = 'paid' AND deleted_at IS NULL`, [sessionId]);
            if (existingPayment.rows.length > 0) {
                throw new Error('已支付，请勿重复支付');
            }
            // 生成商户订单号
            const outTradeNo = `UNLOCK_${Date.now()}_${studentId.substring(0, 8)}`;
            // 创建支付记录
            const paymentResult = await client.query(`INSERT INTO unlock_payments
         (student_id, session_id, amount_fen, wx_out_trade_no, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id`, [studentId, sessionId, this.UNLOCK_PRICE_FEN, outTradeNo]);
            logger.info(`[UnlockService] 创建解锁支付订单: ${paymentResult.rows[0].id}`);
            return {
                paymentId: paymentResult.rows[0].id,
                outTradeNo,
                amountFen: this.UNLOCK_PRICE_FEN
            };
        });
    }
    /**
     * 处理支付成功回调
     */
    static async handlePaymentSuccess(outTradeNo, transactionId) {
        return (0, db_1.withTransaction)(async (client) => {
            // 查询支付记录
            const paymentResult = await client.query(`SELECT * FROM unlock_payments
         WHERE wx_out_trade_no = $1 AND deleted_at IS NULL`, [outTradeNo]);
            if (paymentResult.rows.length === 0) {
                throw new Error('支付记录不存在');
            }
            const payment = paymentResult.rows[0];
            // 幂等检查
            if (payment.status === 'paid') {
                logger.info(`[UnlockService] 支付已处理，跳过: ${payment.id}`);
                const existingUnlock = await client.query(`SELECT id FROM unlock_records WHERE payment_id = $1`, [payment.id]);
                return {
                    unlockRecordId: existingUnlock.rows[0].id,
                    contact: null
                };
            }
            // 更新支付状态
            await client.query(`UPDATE unlock_payments
         SET status = 'paid', wx_transaction_id = $2, paid_at = NOW(), updated_at = NOW()
         WHERE id = $1`, [payment.id, transactionId]);
            // 获取会话和商家信息
            const sessionResult = await client.query(`SELECT vs.*, scm.company_id
         FROM verify_sessions vs
         JOIN student_company_matches scm ON vs.match_id = scm.id
         WHERE vs.id = $1`, [payment.session_id]);
            const session = sessionResult.rows[0];
            // 解密商家联系方式
            const contactResult = await client.query(`SELECT * FROM merchant_contacts
         WHERE company_id = $1 AND is_active = true AND deleted_at IS NULL`, [session.company_id]);
            if (contactResult.rows.length === 0) {
                throw new Error('商家联系方式不存在');
            }
            const encryptedContact = contactResult.rows[0];
            // 检查解锁次数限制
            if (encryptedContact.current_unlocks >= encryptedContact.max_unlocks) {
                throw new Error('该商家联系方式已达解锁上限');
            }
            // 解密
            const contact = {
                name: this.decrypt(encryptedContact.contact_name_enc),
                phone: this.decrypt(encryptedContact.contact_phone_enc),
                wechat: encryptedContact.contact_wechat_enc ? this.decrypt(encryptedContact.contact_wechat_enc) : null,
                email: encryptedContact.contact_email_enc ? this.decrypt(encryptedContact.contact_email_enc) : null
            };
            // 创建解锁记录
            const unlockResult = await client.query(`INSERT INTO unlock_records
         (student_id, company_id, session_id, payment_id, contact_name, contact_phone, contact_wechat, contact_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`, [
                payment.student_id,
                session.company_id,
                payment.session_id,
                payment.id,
                contact.name,
                contact.phone,
                contact.wechat,
                contact.email
            ]);
            // 更新商家联系方式解锁次数
            await client.query(`UPDATE merchant_contacts
         SET current_unlocks = current_unlocks + 1, updated_at = NOW()
         WHERE id = $1`, [encryptedContact.id]);
            // 更新验证会话状态
            await client.query(`UPDATE verify_sessions
         SET status = 'paid_unlocked', updated_at = NOW()
         WHERE id = $1`, [payment.session_id]);
            // 更新匹配记录状态
            await client.query(`UPDATE student_company_matches
         SET status = 'unlocked', updated_at = NOW()
         WHERE id = $1`, [session.match_id]);
            logger.info(`[UnlockService] 解锁成功: ${unlockResult.rows[0].id}`);
            return {
                unlockRecordId: unlockResult.rows[0].id,
                contact
            };
        });
    }
    /**
     * 加密联系方式
     */
    static encrypt(text) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv('aes-256-cbc', Buffer.from(this.ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    /**
     * 解密联系方式
     */
    static decrypt(encryptedText) {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', Buffer.from(this.ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * 获取解锁记录
     */
    static async getUnlockRecord(studentId, companyId) {
        const result = await (0, db_1.query)(`SELECT ur.*, cp.company_name
       FROM unlock_records ur
       LEFT JOIN company_profiles cp ON ur.company_id = cp.user_id
       WHERE ur.student_id = $1 AND ur.company_id = $2 AND ur.deleted_at IS NULL
       ORDER BY ur.created_at DESC
       LIMIT 1`, [studentId, companyId]);
        return result[0] || null;
    }
    /**
     * 记录学生查看联系方式
     */
    static async recordContactViewed(unlockRecordId) {
        await (0, db_1.query)(`UPDATE unlock_records
       SET contact_viewed_at = NOW()
       WHERE id = $1 AND contact_viewed_at IS NULL`, [unlockRecordId]);
    }
    /**
     * 收集反馈
     */
    static async collectFeedback(unlockRecordId, studentContacted, merchantContacted) {
        await (0, db_1.query)(`UPDATE unlock_records
       SET student_contacted = $2,
           merchant_contacted = $3,
           feedback_collected_at = NOW()
       WHERE id = $1`, [unlockRecordId, studentContacted, merchantContacted]);
    }
}
exports.UnlockService = UnlockService;
UnlockService.ENCRYPTION_KEY = process.env.CONTACT_ENCRYPTION_KEY || 'default-32-char-encryption-key!!';
UnlockService.UNLOCK_PRICE_FEN = 1900; // ¥19
//# sourceMappingURL=unlockService.js.map