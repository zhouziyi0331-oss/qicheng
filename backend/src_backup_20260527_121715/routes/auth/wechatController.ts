import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../../utils/db';
import { generateTokens, JwtPayload } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../../config';
import logger from '../../utils/logger';

/**
 * 微信登录控制器
 *
 * 流程：
 * 1. 小程序调用 wx.login() 获取 code
 * 2. 发送 code 到后端
 * 3. 后端用 code 换取 openid 和 session_key
 * 4. 如果是新用户，创建账号并同步微信昵称头像
 * 5. 如果是老用户，直接登录
 * 6. 支持绑定手机号（微信登录后可选绑定手机）
 */

interface WechatSessionResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

// ============================================
// POST /auth/wechat/login
// 微信小程序登录
// ============================================
export async function wechatLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, userType, userInfo } = req.body;

    if (!code) {
      throw new AppError(400, '缺少微信登录code', 'MISSING_CODE');
    }

    if (!userType || !['student', 'company'].includes(userType)) {
      throw new AppError(400, '请选择用户身份（学生或企业）', 'INVALID_USER_TYPE');
    }

    // 1. 调用微信接口换取 openid
    const wxAppId = userType === 'student' ? config.wechat.studentAppId : config.wechat.companyAppId;
    const wxAppSecret = userType === 'student' ? config.wechat.studentAppSecret : config.wechat.companyAppSecret;

    const wxResponse = await axios.get<WechatSessionResponse>(
      'https://api.weixin.qq.com/sns/jscode2session',
      {
        params: {
          appid: wxAppId,
          secret: wxAppSecret,
          js_code: code,
          grant_type: 'authorization_code',
        },
      }
    );

    if (wxResponse.data.errcode) {
      logger.error('WeChat login failed', { errcode: wxResponse.data.errcode, errmsg: wxResponse.data.errmsg });
      throw new AppError(400, `微信登录失败: ${wxResponse.data.errmsg}`, 'WECHAT_ERROR');
    }

    const { openid, session_key, unionid } = wxResponse.data;

    // 2. 查找是否已有该微信用户
    let user = await queryOne<{ id: string; role: string; user_type: string; is_active: boolean; nickname: string; avatar: string; phone?: string }>(
      `SELECT id, role, user_type, is_active, nickname, avatar, phone
       FROM users
       WHERE wechat_openid = $1 AND deleted_at IS NULL`,
      [openid]
    );

    let userId: string;
    let isNewUser = false;

    if (user) {
      // 老用户，直接登录
      if (!user.is_active) {
        throw new AppError(403, '账号已被禁用，请联系客服', 'ACCOUNT_DISABLED');
      }

      userId = user.id;

      // 更新最后登录时间和session_key
      await query(
        'UPDATE users SET last_login_at = NOW(), wechat_session_key = $1 WHERE id = $2',
        [session_key, userId]
      );

      // 如果用户提供了新的昵称头像，更新
      if (userInfo?.nickName && userInfo?.avatarUrl) {
        await query(
          'UPDATE users SET nickname = $1, avatar = $2 WHERE id = $3',
          [userInfo.nickName, userInfo.avatarUrl, userId]
        );
      }

      // 记录学生活跃度
      if (user.user_type === 'student') {
        await query(
          `INSERT INTO student_activity_logs (student_id, activity_type, activity_data)
           VALUES ($1, 'login', '{"method": "wechat"}')`,
          [userId]
        ).catch(() => {});
      }
    } else {
      // 新用户，创建账号
      isNewUser = true;
      userId = uuidv4();
      const role = userType === 'student' ? 'student' : 'company';

      await withTransaction(async (client) => {
        // 创建用户，同步微信昵称和头像
        await client.query(
          `INSERT INTO users (
            id, role, user_type, wechat_openid, wechat_unionid, wechat_session_key,
            nickname, avatar, source_channel
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            userId,
            role,
            userType,
            openid,
            unionid || null,
            session_key,
            userInfo?.nickName || '微信用户',
            userInfo?.avatarUrl || '',
            'wechat_miniapp',
          ]
        );

        if (userType === 'student') {
          // 创建学生档案（旧系统，保持兼容）
          await client.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [userId]);
          // 初始化新等级系统字段
          await client.query(
            `UPDATE users SET track = 'content', current_level = 0 WHERE id = $1`,
            [userId]
          );
          // 初始化学生能力画像
          await client.query(
            `INSERT INTO student_capabilities (student_id, skills, tasks_completed)
             VALUES ($1, '{}'::jsonb, 0)`,
            [userId]
          );
          // 创建余额账户
          await client.query('INSERT INTO student_balances (user_id) VALUES ($1)', [userId]);
          // 初始化 Onboarding 状态
          await client.query('INSERT INTO onboarding_status (user_id) VALUES ($1)', [userId]);
          // 记录成长时间线
          await client.query(
            `INSERT INTO growth_timeline (user_id, event_type, event_title, event_desc)
             VALUES ($1, 'journey_start', '开始OPC旅程', '你正在开始一段OPC旅程')`,
            [userId]
          );
          // 初始化活跃度记录
          await client.query(
            `INSERT INTO student_activity_logs (student_id, activity_type, activity_data)
             VALUES ($1, 'register', '{"method": "wechat"}')`,
            [userId]
          );
        } else {
          // 创建企业档案（需要后续完善信息）
          await client.query(
            `INSERT INTO company_profiles (user_id, company_name, contact_name)
             VALUES ($1, $2, $3)`,
            [userId, userInfo?.nickName || '待完善', '待完善']
          );
        }
      });

      logger.info('New user registered via WeChat', { userId, userType });
    }

    // 3. 生成JWT token
    const payload: JwtPayload = { userId, role: userType === 'student' ? 'student' : 'company' };
    const tokens = generateTokens(payload);

    // 存储 refresh token
    const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + interval '7 days')
       ON CONFLICT DO NOTHING`,
      [userId, tokenHash]
    );

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
  } catch (err) {
    next(err);
  }
}

// ============================================
// POST /auth/wechat/bind-phone
// 微信登录后绑定手机号
// ============================================
export async function bindPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, code } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }

    if (!phone || !code) {
      throw new AppError(400, '手机号和验证码为必填项', 'MISSING_FIELDS');
    }

    // 验证验证码
    const { verifySmsCode } = await import('../../utils/redis');
    const codeValid = await verifySmsCode(phone, code);
    if (!codeValid) {
      throw new AppError(400, '验证码错误或已过期', 'INVALID_CODE');
    }

    // 检查手机号是否已被其他用户使用
    const existing = await queryOne(
      'SELECT id FROM users WHERE phone = $1 AND id != $2 AND deleted_at IS NULL',
      [phone, userId]
    );
    if (existing) {
      throw new AppError(409, '该手机号已被其他账号绑定', 'PHONE_EXISTS');
    }

    // 绑定手机号
    await query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);

    logger.info('Phone bound to WeChat user', { userId, phone: phone.slice(0, 3) + '****' + phone.slice(-4) });

    res.json({
      success: true,
      message: '手机号绑定成功',
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// POST /auth/wechat/decrypt-phone
// 解密微信手机号（使用微信提供的加密数据）
// ============================================
export async function decryptWechatPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { encryptedData, iv } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }

    if (!encryptedData || !iv) {
      throw new AppError(400, '缺少加密数据', 'MISSING_DATA');
    }

    // 获取用户的 session_key
    const user = await queryOne<{ wechat_session_key: string }>(
      'SELECT wechat_session_key FROM users WHERE id = $1',
      [userId]
    );

    if (!user?.wechat_session_key) {
      throw new AppError(400, '会话已过期，请重新登录', 'SESSION_EXPIRED');
    }

    // 解密手机号
    const sessionKey = Buffer.from(user.wechat_session_key, 'base64');
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, ivBuffer);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encryptedDataBuffer, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    const phoneData = JSON.parse(decrypted);
    const phone = phoneData.purePhoneNumber;

    if (!phone) {
      throw new AppError(400, '解密手机号失败', 'DECRYPT_FAILED');
    }

    // 检查手机号是否已被其他用户使用
    const existing = await queryOne(
      'SELECT id FROM users WHERE phone = $1 AND id != $2 AND deleted_at IS NULL',
      [phone, userId]
    );
    if (existing) {
      throw new AppError(409, '该手机号已被其他账号绑定', 'PHONE_EXISTS');
    }

    // 绑定手机号
    await query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);

    logger.info('WeChat phone decrypted and bound', { userId, phone: phone.slice(0, 3) + '****' + phone.slice(-4) });

    res.json({
      success: true,
      message: '手机号绑定成功',
      data: { phone },
    });
  } catch (err) {
    next(err);
  }
}
