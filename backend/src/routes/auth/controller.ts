import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query, queryOne, withTransaction } from '../../utils/db';
import redis, { storeSmsCode, verifySmsCode } from '../../utils/redis';
import { generateTokens, JwtPayload } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../../config';
import logger from '../../utils/logger';
import { sendSMS } from '../../utils/sms';

// ============================================================
// POST /auth/send-code
// ============================================================
export async function sendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    const { phone } = req.body;

    // Rate limit: max 3 codes per phone per 10 minutes
    const rateKey = `sms:rate:${phone}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 600);
    if (count > 3) {
      throw new AppError(429, '验证码发送过于频繁，请10分钟后重试', 'SMS_RATE_LIMIT');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await storeSmsCode(phone, code);

    // 发送短信
    await sendSMS(phone, code);
    logger.info('Verification code sent', { phone: phone.slice(0, 3) + '****' + phone.slice(-4) });

    if (config.env !== 'production') {
      // 开发环境返回验证码（生产环境不返回）
      res.json({ success: true, message: '验证码已发送', _dev_code: code });
      return;
    }
    res.json({ success: true, message: '验证码已发送，60秒内有效' });
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================
// POST /auth/register
// ============================================================
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { phone, code, deviceType, sourceChannel, userType } = req.body;

    // 1. 验证userType必填且有效
    if (!userType || !['student', 'company'].includes(userType)) {
      throw new AppError(400, '请选择用户身份（学生或企业）', 'INVALID_USER_TYPE');
    }

    // 2. 根据userType自动设置role
    const role = userType;

    // 3. 验证码校验
    const codeValid = await verifySmsCode(phone, code);
    if (!codeValid) {
      throw new AppError(400, '验证码错误或已过期', 'INVALID_CODE');
    }

    // 4. 检查手机号是否已注册
    const existing = await queryOne('SELECT id, role, user_type FROM users WHERE phone = $1 AND deleted_at IS NULL', [phone]);
    if (existing) {
      throw new AppError(409, '该手机号已注册', 'PHONE_EXISTS');
    }

    const userId = uuidv4();

    await withTransaction(async (client) => {
      // 5. 创建用户（不再需要密码）
      await client.query(
        `INSERT INTO users (id, role, user_type, phone, device_type, source_channel, profile_completed)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
        [userId, role, userType, phone, deviceType || null, sourceChannel || 'direct']
      );

      if (userType === 'student') {
        // 6a. 创建学生档案（旧系统，保持兼容）
        await client.query(
          "INSERT INTO student_capabilities (student_id, skills, tasks_completed) VALUES ($1, '{}'::jsonb, 0)",
          [userId]
        );
        // 6a-new. 初始化新等级系统字段
        await client.query(
          `UPDATE users SET track = 'content', current_level = 0 WHERE id = $1`,
          [userId]
        );
        // 6a-new2. 初始化学生能力画像
        await client.query(
          `INSERT INTO student_capabilities (student_id, skills, tasks_completed)
           VALUES ($1, '{}'::jsonb, 0)`,
          [userId]
        );
        // 6b. 创建余额账户
        await client.query(
          'INSERT INTO student_balances (user_id) VALUES ($1)',
          [userId]
        );
        // 6c. 初始化 Onboarding 状态
        await client.query(
          'INSERT INTO onboarding_status (user_id) VALUES ($1)',
          [userId]
        );
        // 6d. 记录成长时间线: journey_start
        await client.query(
          `INSERT INTO growth_timeline (user_id, event_type, event_title, event_desc)
           VALUES ($1, 'journey_start', '开始OPC旅程', '你正在开始一段OPC旅程')`,
          [userId]
        );
        // 6e. 初始化活跃度记录（用于邀请任务系统）
        await client.query(
          `INSERT INTO student_activity_logs (student_id, activity_type, activity_data)
           VALUES ($1, 'register', '{}')`,
          [userId]
        );
      } else {
        // 6b. 创建企业档案 (需后台审核)
        const { companyName, contactName } = req.body;
        if (!companyName || !contactName) {
          throw new AppError(400, '企业名称和联系人姓名必填', 'MISSING_FIELDS');
        }
        await client.query(
          `INSERT INTO company_profiles (user_id, company_name, contact_name)
           VALUES ($1, $2, $3)`,
          [userId, companyName, contactName]
        );
      }
    });

    const payload: JwtPayload = { userId, role };
    const tokens = generateTokens(payload);

    // 存储 refresh token hash
    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + interval '7 days')`,
      [userId, tokenHash]
    );

    logger.info('User registered', { userId, role });

    res.status(201).json({
      success: true,
      data: {
        userId,
        role,
        userType,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        // 注册后需要完善资料
        nextStep: 'complete_profile',
        profileCompleted: false,
      },
    });
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================
// POST /auth/login
// ============================================================
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { phone, code } = req.body;

    const user = await queryOne<{ id: string; role: string; user_type: string; is_active: boolean; profile_completed: boolean }>(
      `SELECT u.id, u.role, u.user_type, u.is_active, u.profile_completed
       FROM users u
       WHERE u.phone = $1 AND u.deleted_at IS NULL`,
      [phone]
    );

    if (!user) {
      throw new AppError(401, '手机号未注册', 'USER_NOT_FOUND');
    }

    if (!user.is_active) {
      throw new AppError(403, '账号已被禁用，请联系客服', 'ACCOUNT_DISABLED');
    }

    // 仅支持验证码登录
    if (!code) {
      throw new AppError(400, '请提供验证码', 'MISSING_CODE');
    }

    const codeValid = await verifySmsCode(phone, code);
    if (!codeValid) {
      throw new AppError(401, '验证码错误或已过期', 'INVALID_CODE');
    }

    // 更新最后登录时间 + 触发情绪信号检测
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // 如果是学生，记录活跃度（用于邀请任务系统）
    if (user.user_type === 'student') {
      await query(
        `INSERT INTO student_activity_logs (student_id, activity_type, activity_data)
         VALUES ($1, 'login', '{}')`,
        [user.id]
      ).catch(() => {}); // 忽略错误，不影响登录流程
    }

    // 检查是否3天未登录 (cooling 信号)
    await checkAndUpdateEmotionOnLogin(user.id);

    const payload: JwtPayload = { userId: user.id, role: user.role as 'student' | 'company' };
    const tokens = generateTokens(payload);

    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + interval '7 days')
       ON CONFLICT DO NOTHING`,
      [user.id, tokenHash]
    );

    res.json({
      success: true,
      data: {
        userId: user.id,
        role: user.role,
        userType: user.user_type,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        profileCompleted: user.profile_completed || false,
        nextStep: user.profile_completed ? 'home' : 'complete_profile',
      },
    });
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================
// POST /auth/refresh
// ============================================================
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError(400, '请提供 refreshToken', 'MISSING_TOKEN');

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      throw new AppError(401, 'Refresh token 无效或已过期', 'TOKEN_INVALID');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await queryOne(
      `SELECT id FROM refresh_tokens
       WHERE token_hash = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > NOW()`,
      [tokenHash, payload.userId]
    );
    if (!stored) throw new AppError(401, 'Refresh token 已被撤销', 'TOKEN_REVOKED');

    const newTokens = generateTokens({ userId: payload.userId, role: payload.role });
    const newTokenHash = crypto.createHash('sha256').update(newTokens.refreshToken).digest('hex');

    // Rotate: revoke old, issue new
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + interval '7 days')`,
      [payload.userId, newTokenHash]
    );

    res.json({
      success: true,
      data: { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken },
    });
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================
// POST /auth/logout
// ============================================================
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
    }
    res.json({ success: true, message: '已成功登出' });
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================
// 辅助: 登录时检测情绪信号
// ============================================================
async function checkAndUpdateEmotionOnLogin(userId: string): Promise<void> {
  try {
    const user = await queryOne<{ last_login_at: Date | null }>(
      'SELECT last_login_at FROM users WHERE id = $1',
      [userId]
    );
    if (!user?.last_login_at) return;

    const daysSinceLogin = (Date.now() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLogin >= 3) {
      // cooling signal: 3天未登录
      await query(
        `INSERT INTO emotion_signals (user_id, signal_type, signal_value, trigger_event)
         VALUES ($1, 'cooling', $2, 'inactive_days')
         ON CONFLICT DO NOTHING`,
        [userId, Math.min(10, Math.floor(daysSinceLogin))]
      );
    } else {
      // Check if they completed a task in the last 24h (excited signal)
      const recentTask = await queryOne(
        `SELECT id FROM task_assignments
         WHERE student_id = $1 AND status = 'completed'
         AND completed_at > NOW() - interval '24 hours'`,
        [userId]
      );
      if (recentTask) {
        await query(
          `INSERT INTO emotion_signals (user_id, signal_type, signal_value, trigger_event)
           VALUES ($1, 'excited', 8, 'recent_task_completed')
           ON CONFLICT DO NOTHING`,
          [userId]
        );
      }
    }
  } catch (err: unknown) {
    logger.error('Error checking emotion signal on login', { userId, error: (err as Error).message });
  }
}

// ============================================================
// GET /auth/me
// ============================================================
export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const user = await queryOne<{
      id: string;
      phone: string;
      role: string;
      user_type: string;
      created_at: Date;
      last_login_at: Date | null;
    }>(
      `SELECT id, phone, role, user_type, created_at, last_login_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (!user) {
      throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
    }

    // 根据用户类型获取额外信息
    let profile: any = null;
    if (user.user_type === 'student') {
      profile = await queryOne(
        `SELECT u.current_level as level_a, u.current_level as level_b, sc.opc_label, sc.life_question,
                u.track, sc.total_earnings, sc.tasks_completed as task_count,
                u.nickname, u.avatar_url
         FROM users u
         LEFT JOIN student_capabilities sc ON u.id = sc.student_id
         WHERE u.id = $1`,
        [userId]
      );
    } else if (user.user_type === 'company') {
      profile = await queryOne(
        `SELECT company_name, contact_name, contact_phone, industry
         FROM company_profiles
         WHERE user_id = $1`,
        [userId]
      );
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        userType: user.user_type,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        profile,
      },
    });
  } catch (err: unknown) {
    next(err);
  }
}
