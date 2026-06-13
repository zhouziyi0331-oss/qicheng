import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../utils/db';
import { config } from '../../../config';

/**
 * 管理员登录
 */
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // 查询管理员账号
    const result = await query<any>(
      `SELECT au.*, ar.role_name, ar.role_code, ar.permissions
       FROM admin_users au
       LEFT JOIN admin_roles ar ON au.role_id = ar.id
       WHERE au.username = $1 AND au.status = 'active'`,
      [username]
    );

    if (result.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const admin = result[0];

    // 验证密码
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 更新最后登录时间和IP
    await query(
      `UPDATE admin_users
       SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = $1
       WHERE id = $2`,
      [req.ip, admin.id]
    );

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: admin.id,
        id: admin.id,
        username: admin.username,
        role: 'admin',
        adminRole: admin.role_code === 'super_admin' ? 'super' : admin.role_code,
        type: 'admin'
      },
      config.jwt.accessSecret,
      { expiresIn: '8h' }
    );

    // 返回前端期望的格式
    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        realName: admin.real_name,
        role: {
          code: admin.role_code,
          name: admin.role_name,
          permissions: admin.permissions || []
        }
      }
    });
  } catch (error) {
    logger.error('管理员登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
}

/**
 * 获取当前管理员信息
 */
export async function getCurrentAdmin(req: Request, res: Response) {
  try {
    const adminId = (req as any).user?.id;

    const result = await query<any>(
      `SELECT au.*, ar.role_name, ar.role_code, ar.permissions
       FROM admin_users au
       LEFT JOIN admin_roles ar ON au.role_id = ar.id
       WHERE au.id = $1`,
      [adminId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }

    const admin = result[0];

    res.json({
      id: admin.id,
      username: admin.username,
      realName: admin.real_name,
      email: admin.email,
      phone: admin.phone,
      role: {
        code: admin.role_code,
        name: admin.role_name,
        permissions: admin.permissions || []
      },
      lastLoginAt: admin.last_login_at,
      createdAt: admin.created_at
    });
  } catch (error) {
    logger.error('获取管理员信息失败:', error);
    res.status(500).json({ error: '获取信息失败' });
  }
}

/**
 * 修改密码
 */
export async function changePassword(req: Request, res: Response) {
  try {
    const adminId = (req as any).user?.id;
    const { oldPassword, newPassword } = req.body;

    // 验证旧密码
    const result = await query<any>(
      'SELECT password_hash FROM admin_users WHERE id = $1',
      [adminId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }

    const isValid = await bcrypt.compare(oldPassword, result[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '原密码错误' });
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, adminId]
    );

    res.json({ message: '密码修改成功' });
  } catch (error) {
    logger.error('修改密码失败:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
}
