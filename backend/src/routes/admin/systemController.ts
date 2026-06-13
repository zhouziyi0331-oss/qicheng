import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { query } from '../../utils/db';
import bcrypt from 'bcrypt';

/**
 * 获取管理员列表
 */
export async function getAdminList(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(a.username LIKE $${paramIndex} OR a.name LIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM admin_users a
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].total);

    params.push(Number(pageSize), offset);
    const admins = await query<any>(
      `SELECT
        a.id,
        a.username,
        a.name,
        a.email,
        a.role_id as role,
        a.status,
        a.last_login_at,
        a.created_at
       FROM admin_users a
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: admins,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('获取管理员列表失败:', error);
    res.status(500).json({ message: '获取管理员列表失败' });
  }
}

/**
 * 创建管理员
 */
export async function createAdmin(req: Request, res: Response) {
  try {
    const { username, password, name, email, role } = req.body;

    // 检查用户名是否已存在
    const existing = await query<any>(
      `SELECT id FROM admin_users WHERE username = $1`,
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query<any>(
      `INSERT INTO admin_users (username, password, name, email, role_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id`,
      [username, hashedPassword, name, email, role]
    );

    res.json({ id: result[0].id, message: '管理员创建成功' });
  } catch (error) {
    logger.error('创建管理员失败:', error);
    res.status(500).json({ message: '创建管理员失败' });
  }
}

/**
 * 更新管理员
 */
export async function updateAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    await query(
      `UPDATE admin_users
       SET name = $1,
           email = $2,
           role_id = $3,
           status = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [name, email, role, status, id]
    );

    res.json({ message: '管理员更新成功' });
  } catch (error) {
    logger.error('更新管理员失败:', error);
    res.status(500).json({ message: '更新管理员失败' });
  }
}

/**
 * 重置管理员密码
 */
export async function resetAdminPassword(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      `UPDATE admin_users
       SET password = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, id]
    );

    res.json({ message: '密码重置成功' });
  } catch (error) {
    logger.error('重置密码失败:', error);
    res.status(500).json({ message: '重置密码失败' });
  }
}

/**
 * 删除管理员
 */
export async function deleteAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await query(
      `DELETE FROM admin_users WHERE id = $1`,
      [id]
    );

    res.json({ message: '管理员删除成功' });
  } catch (error) {
    logger.error('删除管理员失败:', error);
    res.status(500).json({ message: '删除管理员失败' });
  }
}

/**
 * 获取操作日志列表
 */
export async function getOperationLogs(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, adminId, action, startDate, endDate } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (adminId) {
      conditions.push(`ol.admin_id = $${paramIndex}`);
      params.push(adminId);
      paramIndex++;
    }

    if (action) {
      conditions.push(`ol.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`ol.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`ol.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM admin_operation_logs ol
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].total);

    params.push(Number(pageSize), offset);
    const logs = await query<any>(
      `SELECT
        ol.id,
        ol.admin_id,
        ol.action,
        ol.module as resource_type,
        ol.target_id as resource_id,
        ol.description as details,
        ol.ip_address,
        ol.created_at,
        ol.admin_username,
        a.name as admin_name
       FROM admin_operation_logs ol
       LEFT JOIN admin_users a ON ol.admin_id = a.id
       ${whereClause}
       ORDER BY ol.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: logs,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('获取操作日志失败:', error);
    res.status(500).json({ message: '获取操作日志失败' });
  }
}

/**
 * 获取系统配置
 */
export async function getSystemConfig(req: Request, res: Response) {
  try {
    const configs = await query<any>(
      `SELECT
        key,
        value,
        description,
        updated_at
       FROM system_configs
       ORDER BY key`
    );

    res.json({ configs });
  } catch (error) {
    logger.error('获取系统配置失败:', error);
    res.status(500).json({ message: '获取系统配置失败' });
  }
}

/**
 * 更新系统配置
 */
export async function updateSystemConfig(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const { value } = req.body;

    await query(
      `UPDATE system_configs
       SET value = $1,
           updated_at = NOW()
       WHERE key = $2`,
      [value, key]
    );

    res.json({ message: '系统配置更新成功' });
  } catch (error) {
    logger.error('更新系统配置失败:', error);
    res.status(500).json({ message: '更新系统配置失败' });
  }
}
