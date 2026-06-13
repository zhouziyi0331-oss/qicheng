/**
 * 账号隔离 - 注册控制器
 * 实现学生端和企业端的独立注册接口
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../utils/db';
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';

/**
 * 学生注册
 * POST /api/v1/auth/register/student
 */
export async function registerStudent(req: Request, res: Response) {
  const { phone, password, sms_code, nickname } = req.body;

  try {
    // 1. 验证短信验证码
    // TODO: 实现短信验证码验证逻辑
    // if (!verifySmsCode(phone, sms_code)) {
    //   return res.status(400).json({ success: false, message: '验证码错误' });
    // }

    // 2. 检查手机号是否已被企业账号注册
    const existingUser = await pool.query(
      'SELECT id, account_type FROM users WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      const accountType = existingUser.rows[0].account_type;

      if (accountType === 'enterprise') {
        return res.status(409).json({
          success: false,
          code: 'PHONE_REGISTERED_AS_ENTERPRISE',
          message: '该手机号已注册为企业账号，请使用其他手机号'
        });
      }

      // 如果已经是学生账号，提示已注册
      return res.status(409).json({
        success: false,
        code: 'PHONE_ALREADY_REGISTERED',
        message: '该手机号已注册，请直接登录'
      });
    }

    // 3. 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. 创建学生账号
    const result = await pool.query(
      `INSERT INTO users (
        phone, password_hash, nickname, role, account_type, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, phone, nickname, role, account_type, created_at`,
      [phone, passwordHash, nickname, 'student', 'student', true]
    );

    const user = result.rows[0];

    // 5. 生成JWT token
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role
    });

    logger.info('Student registered successfully', { userId: user.id, phone });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          role: user.role,
          accountType: user.account_type
        },
        token
      }
    });

  } catch (error: unknown) {
    logger.error('Student registration failed', { error, phone });
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
}

/**
 * 企业注册
 * POST /api/v1/auth/register/enterprise
 */
export async function registerEnterprise(req: Request, res: Response) {
  const { phone, password, sms_code, company_name, contact_name } = req.body;

  try {
    // 1. 验证短信验证码
    // TODO: 实现短信验证码验证逻辑
    // if (!verifySmsCode(phone, sms_code)) {
    //   return res.status(400).json({ success: false, message: '验证码错误' });
    // }

    // 2. 检查手机号是否已被学生账号注册
    const existingUser = await pool.query(
      'SELECT id, account_type FROM users WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      const accountType = existingUser.rows[0].account_type;

      if (accountType === 'student') {
        return res.status(409).json({
          success: false,
          code: 'PHONE_REGISTERED_AS_STUDENT',
          message: '该手机号已注册为学生账号，请使用其他手机号'
        });
      }

      // 如果已经是企业账号，提示已注册
      return res.status(409).json({
        success: false,
        code: 'PHONE_ALREADY_REGISTERED',
        message: '该手机号已注册，请直接登录'
      });
    }

    // 3. 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. 创建企业账号
    const result = await pool.query(
      `INSERT INTO users (
        phone, password_hash, nickname, role, account_type, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, phone, nickname, role, account_type, created_at`,
      [phone, passwordHash, contact_name, 'company', 'enterprise', true]
    );

    const user = result.rows[0];

    // 5. 创建企业信息记录（如果有企业信息表）
    // TODO: 如果有单独的企业信息表，在这里插入
    // await pool.query(
    //   'INSERT INTO company_profiles (user_id, company_name, contact_name) VALUES ($1, $2, $3)',
    //   [user.id, company_name, contact_name]
    // );

    // 6. 生成JWT token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      accountType: 'enterprise'
    });

    logger.info('Enterprise registered successfully', { userId: user.id, phone, company_name });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          role: user.role,
          accountType: user.account_type,
          companyName: company_name
        },
        token
      }
    });

  } catch (error: unknown) {
    logger.error('Enterprise registration failed', { error, phone });
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
}

/**
 * 学生登录
 * POST /api/v1/auth/login/student
 */
export async function loginStudent(req: Request, res: Response) {
  const { phone, password } = req.body;

  try {
    // 1. 查询用户
    const result = await pool.query(
      `SELECT id, phone, password_hash, nickname, role, account_type, selected_track
       FROM users
       WHERE phone = $1 AND deleted_at IS NULL`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: '手机号或密码错误'
      });
    }

    const user = result.rows[0];

    // 2. 检查账号类型
    if (user.account_type === 'enterprise') {
      return res.status(403).json({
        success: false,
        code: 'WRONG_ACCOUNT_TYPE',
        message: '该账号为企业账号，请使用企业端登录'
      });
    }

    // 3. 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: '手机号或密码错误'
      });
    }

    // 4. 生成JWT token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      accountType: 'student'
    });

    // 5. 更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    logger.info('Student logged in successfully', { userId: user.id, phone });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          role: user.role,
          accountType: user.account_type,
          selectedTrack: user.selected_track
        },
        token
      }
    });

  } catch (error: unknown) {
    logger.error('Student login failed', { error, phone });
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
}

/**
 * 企业登录
 * POST /api/v1/auth/login/enterprise
 */
export async function loginEnterprise(req: Request, res: Response) {
  const { phone, password } = req.body;

  try {
    // 1. 查询用户
    const result = await pool.query(
      `SELECT id, phone, password_hash, nickname, role, account_type
       FROM users
       WHERE phone = $1 AND deleted_at IS NULL`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: '手机号或密码错误'
      });
    }

    const user = result.rows[0];

    // 2. 检查账号类型
    if (user.account_type === 'student') {
      return res.status(403).json({
        success: false,
        code: 'WRONG_ACCOUNT_TYPE',
        message: '该账号为学生账号，请使用学生端登录'
      });
    }

    // 3. 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: '手机号或密码错误'
      });
    }

    // 4. 生成JWT token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      accountType: 'enterprise'
    });

    // 5. 更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    logger.info('Enterprise logged in successfully', { userId: user.id, phone });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          role: user.role,
          accountType: user.account_type
        },
        token
      }
    });

  } catch (error: unknown) {
    logger.error('Enterprise login failed', { error, phone });
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
}
