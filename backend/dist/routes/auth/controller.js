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
exports.sendVerificationCode = sendVerificationCode;
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../utils/db");
const redis_1 = __importStar(require("../../utils/redis"));
const auth_1 = require("../../middleware/auth");
const errorHandler_1 = require("../../middleware/errorHandler");
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
// ============================================================
// POST /auth/send-code
// ============================================================
async function sendVerificationCode(req, res, next) {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { phone } = req.body;
        // Rate limit: max 3 codes per phone per 10 minutes
        const rateKey = `sms:rate:${phone}`;
        const count = await redis_1.default.incr(rateKey);
        if (count === 1)
            await redis_1.default.expire(rateKey, 600);
        if (count > 3) {
            throw new errorHandler_1.AppError(429, '验证码发送过于频繁，请10分钟后重试', 'SMS_RATE_LIMIT');
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await (0, redis_1.storeSmsCode)(phone, code);
        // TODO: 集成真实短信服务 (阿里云/腾讯云短信)
        logger_1.default.info('Verification code sent', { phone: phone.slice(0, 3) + '****' + phone.slice(-4) });
        if (config_1.config.env !== 'production') {
            // 开发环境返回验证码（生产环境不返回）
            res.json({ success: true, message: '验证码已发送', _dev_code: code });
            return;
        }
        res.json({ success: true, message: '验证码已发送，60秒内有效' });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /auth/register
// ============================================================
async function register(req, res, next) {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { phone, code, role, password, deviceType, sourceChannel } = req.body;
        // 1. 验证码校验
        const codeValid = await (0, redis_1.verifySmsCode)(phone, code);
        if (!codeValid) {
            throw new errorHandler_1.AppError(400, '验证码错误或已过期', 'INVALID_CODE');
        }
        // 2. 检查手机号是否已注册
        const existing = await (0, db_1.queryOne)('SELECT id, role FROM users WHERE phone = $1 AND deleted_at IS NULL', [phone]);
        if (existing) {
            throw new errorHandler_1.AppError(409, '该手机号已注册', 'PHONE_EXISTS');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const userId = (0, uuid_1.v4)();
        await (0, db_1.withTransaction)(async (client) => {
            // 3. 创建用户
            await client.query(`INSERT INTO users (id, role, phone, password_hash, device_type, source_channel)
         VALUES ($1, $2, $3, $4, $5, $6)`, [userId, role, phone, passwordHash, deviceType || null, sourceChannel || 'direct']);
            if (role === 'student') {
                // 4a. 创建学生档案
                await client.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [userId]);
                // 4b. 创建余额账户
                await client.query('INSERT INTO student_balances (user_id) VALUES ($1)', [userId]);
                // 4c. 初始化 Onboarding 状态
                await client.query('INSERT INTO onboarding_status (user_id) VALUES ($1)', [userId]);
                // 4d. 记录成长时间线: journey_start
                await client.query(`INSERT INTO growth_timeline (user_id, event_type, event_title, event_desc)
           VALUES ($1, 'journey_start', '开始OPC旅程', '你正在开始一段OPC旅程')`, [userId]);
            }
            else {
                // 4b. 创建企业档案 (需后台审核)
                const { companyName, contactName } = req.body;
                if (!companyName || !contactName) {
                    throw new errorHandler_1.AppError(400, '企业名称和联系人姓名必填', 'MISSING_FIELDS');
                }
                await client.query(`INSERT INTO company_profiles (user_id, company_name, contact_name)
           VALUES ($1, $2, $3)`, [userId, companyName, contactName]);
            }
        });
        const payload = { userId, role };
        const tokens = (0, auth_1.generateTokens)(payload);
        // 存储 refresh token hash
        const tokenHash = crypto_1.default.createHash('sha256').update(tokens.refreshToken).digest('hex');
        await (0, db_1.query)(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + interval '7 days')`, [userId, tokenHash]);
        logger_1.default.info('User registered', { userId, role });
        res.status(201).json({
            success: true,
            data: {
                userId,
                role,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                // 学生注册后进入 Onboarding，不直接返回首页
                nextStep: role === 'student' ? 'onboarding' : 'pending_review',
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /auth/login
// ============================================================
async function login(req, res, next) {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { phone, password, code } = req.body;
        const user = await (0, db_1.queryOne)(`SELECT u.id, u.role, u.password_hash, u.is_active
       FROM users u
       WHERE u.phone = $1 AND u.deleted_at IS NULL`, [phone]);
        if (!user) {
            throw new errorHandler_1.AppError(401, '手机号或密码错误', 'INVALID_CREDENTIALS');
        }
        if (!user.is_active) {
            throw new errorHandler_1.AppError(403, '账号已被禁用，请联系客服', 'ACCOUNT_DISABLED');
        }
        // 支持密码或验证码登录
        if (code) {
            const codeValid = await (0, redis_1.verifySmsCode)(phone, code);
            if (!codeValid)
                throw new errorHandler_1.AppError(401, '验证码错误或已过期', 'INVALID_CODE');
        }
        else if (password) {
            const passwordValid = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!passwordValid)
                throw new errorHandler_1.AppError(401, '手机号或密码错误', 'INVALID_CREDENTIALS');
        }
        else {
            throw new errorHandler_1.AppError(400, '请提供密码或验证码', 'MISSING_AUTH');
        }
        // 更新最后登录时间 + 触发情绪信号检测
        await (0, db_1.query)('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
        // 检查是否3天未登录 (cooling 信号)
        await checkAndUpdateEmotionOnLogin(user.id);
        const payload = { userId: user.id, role: user.role };
        const tokens = (0, auth_1.generateTokens)(payload);
        const tokenHash = crypto_1.default.createHash('sha256').update(tokens.refreshToken).digest('hex');
        await (0, db_1.query)(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + interval '7 days')
       ON CONFLICT DO NOTHING`, [user.id, tokenHash]);
        res.json({
            success: true,
            data: {
                userId: user.id,
                role: user.role,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /auth/refresh
// ============================================================
async function refreshToken(req, res, next) {
    try {
        const { refreshToken: token } = req.body;
        if (!token)
            throw new errorHandler_1.AppError(400, '请提供 refreshToken', 'MISSING_TOKEN');
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
        }
        catch {
            throw new errorHandler_1.AppError(401, 'Refresh token 无效或已过期', 'TOKEN_INVALID');
        }
        const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const stored = await (0, db_1.queryOne)(`SELECT id FROM refresh_tokens
       WHERE token_hash = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > NOW()`, [tokenHash, payload.userId]);
        if (!stored)
            throw new errorHandler_1.AppError(401, 'Refresh token 已被撤销', 'TOKEN_REVOKED');
        const newTokens = (0, auth_1.generateTokens)({ userId: payload.userId, role: payload.role });
        const newTokenHash = crypto_1.default.createHash('sha256').update(newTokens.refreshToken).digest('hex');
        // Rotate: revoke old, issue new
        await (0, db_1.query)('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
        await (0, db_1.query)(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + interval '7 days')`, [payload.userId, newTokenHash]);
        res.json({
            success: true,
            data: { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /auth/logout
// ============================================================
async function logout(req, res, next) {
    try {
        const { refreshToken: token } = req.body;
        if (token) {
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            await (0, db_1.query)('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
        }
        res.json({ success: true, message: '已成功登出' });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// 辅助: 登录时检测情绪信号
// ============================================================
async function checkAndUpdateEmotionOnLogin(userId) {
    try {
        const user = await (0, db_1.queryOne)('SELECT last_login_at FROM users WHERE id = $1', [userId]);
        if (!user?.last_login_at)
            return;
        const daysSinceLogin = (Date.now() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLogin >= 3) {
            // cooling signal: 3天未登录
            await (0, db_1.query)(`INSERT INTO emotion_signals (user_id, signal_type, signal_value, trigger_event)
         VALUES ($1, 'cooling', $2, 'inactive_days')
         ON CONFLICT DO NOTHING`, [userId, Math.min(10, Math.floor(daysSinceLogin))]);
        }
        else {
            // Check if they completed a task in the last 24h (excited signal)
            const recentTask = await (0, db_1.queryOne)(`SELECT id FROM task_assignments
         WHERE student_id = $1 AND status = 'completed'
         AND completed_at > NOW() - interval '24 hours'`, [userId]);
            if (recentTask) {
                await (0, db_1.query)(`INSERT INTO emotion_signals (user_id, signal_type, signal_value, trigger_event)
           VALUES ($1, 'excited', 8, 'recent_task_completed')
           ON CONFLICT DO NOTHING`, [userId]);
            }
        }
    }
    catch (err) {
        logger_1.default.error('Error checking emotion signal on login', { userId, error: err.message });
    }
}
//# sourceMappingURL=controller.js.map