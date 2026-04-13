"use strict";
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
exports.wechatLogin = wechatLogin;
exports.bindPhone = bindPhone;
exports.decryptWechatPhone = decryptWechatPhone;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const db_1 = require("../../utils/db");
const auth_1 = require("../../middleware/auth");
const errorHandler_1 = require("../../middleware/errorHandler");
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
// ============================================
// POST /auth/wechat/login
// 微信小程序登录
// ============================================
async function wechatLogin(req, res, next) {
    try {
        const { code, userType, userInfo } = req.body;
        if (!code) {
            throw new errorHandler_1.AppError(400, '缺少微信登录code', 'MISSING_CODE');
        }
        if (!userType || !['student', 'company'].includes(userType)) {
            throw new errorHandler_1.AppError(400, '请选择用户身份（学生或企业）', 'INVALID_USER_TYPE');
        }
        // 1. 调用微信接口换取 openid
        const wxAppId = userType === 'student' ? config_1.config.wechat.studentAppId : config_1.config.wechat.companyAppId;
        const wxAppSecret = userType === 'student' ? config_1.config.wechat.studentAppSecret : config_1.config.wechat.companyAppSecret;
        const wxResponse = await axios_1.default.get('https://api.weixin.qq.com/sns/jscode2session', {
            params: {
                appid: wxAppId,
                secret: wxAppSecret,
                js_code: code,
                grant_type: 'authorization_code',
            },
        });
        if (wxResponse.data.errcode) {
            logger_1.default.error('WeChat login failed', { errcode: wxResponse.data.errcode, errmsg: wxResponse.data.errmsg });
            throw new errorHandler_1.AppError(400, `微信登录失败: ${wxResponse.data.errmsg}`, 'WECHAT_ERROR');
        }
        const { openid, session_key, unionid } = wxResponse.data;
        // 2. 查找是否已有该微信用户
        let user = await (0, db_1.queryOne)(`SELECT id, role, user_type, is_active, nickname, avatar
       FROM users
       WHERE wechat_openid = $1 AND deleted_at IS NULL`, [openid]);
        let userId;
        let isNewUser = false;
        if (user) {
            // 老用户，直接登录
            if (!user.is_active) {
                throw new errorHandler_1.AppError(403, '账号已被禁用，请联系客服', 'ACCOUNT_DISABLED');
            }
            userId = user.id;
            // 更新最后登录时间和session_key
            await (0, db_1.query)('UPDATE users SET last_login_at = NOW(), wechat_session_key = $1 WHERE id = $2', [session_key, userId]);
            // 如果用户提供了新的昵称头像，更新
            if (userInfo?.nickName && userInfo?.avatarUrl) {
                await (0, db_1.query)('UPDATE users SET nickname = $1, avatar = $2 WHERE id = $3', [userInfo.nickName, userInfo.avatarUrl, userId]);
            }
            // 记录学生活跃度
            if (user.user_type === 'student') {
                await (0, db_1.query)(`INSERT INTO student_activity_logs (student_id, activity_type, activity_data)
           VALUES ($1, 'login', '{"method": "wechat"}')`, [userId]).catch(() => { });
            }
        }
        else {
            // 新用户，创建账号
            isNewUser = true;
            userId = (0, uuid_1.v4)();
            const role = userType === 'student' ? 'student' : 'company';
            await (0, db_1.withTransaction)(async (client) => {
                // 创建用户，同步微信昵称和头像
                await client.query(`INSERT INTO users (
            id, role, user_type, wechat_openid, wechat_unionid, wechat_session_key,
            nickname, avatar, source_channel
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                    userId,
                    role,
                    userType,
                    openid,
                    unionid || null,
                    session_key,
                    userInfo?.nickName || '微信用户',
                    userInfo?.avatarUrl || '',
                    'wechat_miniapp',
                ]);
                if (userType === 'student') {
                    // 创建学生档案
                    await client.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [userId]);
                    // 创建余额账户
                    await client.query('INSERT INTO student_balances (user_id) VALUES ($1)', [userId]);
                    // 初始化 Onboarding 状态
                    await client.query('INSERT INTO onboarding_status (user_id) VALUES ($1)', [userId]);
                    // 记录成长时间线
                    await client.query(`INSERT INTO growth_timeline (user_id, event_type, event_title, event_desc)
             VALUES ($1, 'journey_start', '开始OPC旅程', '你正在开始一段OPC旅程')`, [userId]);
                    // 初始化活跃度记录
                    await client.query(`INSERT INTO student_activity_logs (student_id, activity_type, activity_data)
             VALUES ($1, 'register', '{"method": "wechat"}')`, [userId]);
                }
                else {
                    // 创建企业档案（需要后续完善信息）
                    await client.query(`INSERT INTO company_profiles (user_id, company_name, contact_name)
             VALUES ($1, $2, $3)`, [userId, userInfo?.nickName || '待完善', '待完善']);
                }
            });
            logger_1.default.info('New user registered via WeChat', { userId, userType });
        }
        // 3. 生成JWT token
        const payload = { userId, role: userType === 'student' ? 'student' : 'company' };
        const tokens = (0, auth_1.generateTokens)(payload);
        // 存储 refresh token
        const tokenHash = crypto_1.default.createHash('sha256').update(tokens.refreshToken).digest('hex');
        await (0, db_1.query)(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + interval '7 days')
       ON CONFLICT DO NOTHING`, [userId, tokenHash]);
        res.json({
            success: true,
            data: {
                userId,
                role: userType === 'student' ? 'student' : 'company',
                userType,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                isNewUser,
                needBindPhone: !user?.phone, // 是否需要绑定手机号
                nextStep: isNewUser && userType === 'student' ? 'onboarding' : 'home',
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================
// POST /auth/wechat/bind-phone
// 微信登录后绑定手机号
// ============================================
async function bindPhone(req, res, next) {
    try {
        const { phone, code } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.AppError(401, '请先登录', 'UNAUTHORIZED');
        }
        if (!phone || !code) {
            throw new errorHandler_1.AppError(400, '手机号和验证码为必填项', 'MISSING_FIELDS');
        }
        // 验证验证码
        const { verifySmsCode } = await Promise.resolve().then(() => __importStar(require('../../utils/redis')));
        const codeValid = await verifySmsCode(phone, code);
        if (!codeValid) {
            throw new errorHandler_1.AppError(400, '验证码错误或已过期', 'INVALID_CODE');
        }
        // 检查手机号是否已被其他用户使用
        const existing = await (0, db_1.queryOne)('SELECT id FROM users WHERE phone = $1 AND id != $2 AND deleted_at IS NULL', [phone, userId]);
        if (existing) {
            throw new errorHandler_1.AppError(409, '该手机号已被其他账号绑定', 'PHONE_EXISTS');
        }
        // 绑定手机号
        await (0, db_1.query)('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
        logger_1.default.info('Phone bound to WeChat user', { userId, phone: phone.slice(0, 3) + '****' + phone.slice(-4) });
        res.json({
            success: true,
            message: '手机号绑定成功',
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================
// POST /auth/wechat/decrypt-phone
// 解密微信手机号（使用微信提供的加密数据）
// ============================================
async function decryptWechatPhone(req, res, next) {
    try {
        const { encryptedData, iv } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.AppError(401, '请先登录', 'UNAUTHORIZED');
        }
        if (!encryptedData || !iv) {
            throw new errorHandler_1.AppError(400, '缺少加密数据', 'MISSING_DATA');
        }
        // 获取用户的 session_key
        const user = await (0, db_1.queryOne)('SELECT wechat_session_key FROM users WHERE id = $1', [userId]);
        if (!user?.wechat_session_key) {
            throw new errorHandler_1.AppError(400, '会话已过期，请重新登录', 'SESSION_EXPIRED');
        }
        // 解密手机号
        const sessionKey = Buffer.from(user.wechat_session_key, 'base64');
        const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
        const ivBuffer = Buffer.from(iv, 'base64');
        const decipher = crypto_1.default.createDecipheriv('aes-128-cbc', sessionKey, ivBuffer);
        decipher.setAutoPadding(true);
        let decrypted = decipher.update(encryptedDataBuffer, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        const phoneData = JSON.parse(decrypted);
        const phone = phoneData.purePhoneNumber;
        if (!phone) {
            throw new errorHandler_1.AppError(400, '解密手机号失败', 'DECRYPT_FAILED');
        }
        // 检查手机号是否已被其他用户使用
        const existing = await (0, db_1.queryOne)('SELECT id FROM users WHERE phone = $1 AND id != $2 AND deleted_at IS NULL', [phone, userId]);
        if (existing) {
            throw new errorHandler_1.AppError(409, '该手机号已被其他账号绑定', 'PHONE_EXISTS');
        }
        // 绑定手机号
        await (0, db_1.query)('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
        logger_1.default.info('WeChat phone decrypted and bound', { userId, phone: phone.slice(0, 3) + '****' + phone.slice(-4) });
        res.json({
            success: true,
            message: '手机号绑定成功',
            data: { phone },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=wechatController.js.map