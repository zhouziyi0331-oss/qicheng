/**
 * 数据访问日志服务
 *
 * 功能：
 * 1. 记录所有数据访问行为
 * 2. 记录解密操作
 * 3. 查询访问历史
 */

import pool from '../utils/db';
import logger from '../utils/logger';

interface AccessLogParams {
  userId: string;
  userType: string;
  resourceType: string;
  resourceId: string;
  action: string;
  accessMethod?: string;
  success?: boolean;
  failureReason?: string;
  decryptionPerformed?: boolean;
  decryptedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  accessDurationMs?: number;
}

interface AccessLog {
  id: string;
  userId: string;
  userType: string;
  resourceType: string;
  resourceId: string;
  action: string;
  accessMethod: string;
  success: boolean;
  failureReason?: string;
  decryptionPerformed: boolean;
  decryptedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  accessDurationMs?: number;
  createdAt: Date;
}

class DataAccessLogService {
  /**
   * 记录数据访问
   */
  async logAccess(params: AccessLogParams): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO data_access_logs
         (user_id, user_type, resource_type, resource_id, action, access_method,
          success, failure_reason, decryption_performed, decrypted_fields,
          ip_address, user_agent, access_duration_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          params.userId,
          params.userType,
          params.resourceType,
          params.resourceId,
          params.action,
          params.accessMethod || 'api',
          params.success !== false,
          params.failureReason || null,
          params.decryptionPerformed || false,
          params.decryptedFields ? JSON.stringify(params.decryptedFields) : null,
          params.ipAddress || null,
          params.userAgent || null,
          params.accessDurationMs || null,
        ]
      );

      logger.info(
        `Logged access: ${params.action} on ${params.resourceType}:${params.resourceId} by ${params.userId}`
      );
    } catch (error: unknown) {
      logger.error('Failed to log access:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取资源访问历史
   */
  async getAccessHistory(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AccessLog[]> {
    const result = await pool.query(
      `SELECT
         dal.*,
         u.name as user_name,
         u.role as user_role
       FROM data_access_logs dal
       LEFT JOIN users u ON dal.user_id = u.id
       WHERE dal.resource_type = $1 AND dal.resource_id = $2
       ORDER BY dal.created_at DESC
       LIMIT $3`,
      [resourceType, resourceId, limit]
    );

    return result.rows;
  }

  /**
   * 获取用户访问历史
   */
  async getUserAccessHistory(userId: string, limit: number = 50): Promise<AccessLog[]> {
    const result = await pool.query(
      `SELECT * FROM data_access_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * 获取解密操作历史
   */
  async getDecryptionHistory(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AccessLog[]> {
    const result = await pool.query(
      `SELECT
         dal.*,
         u.name as user_name,
         u.role as user_role
       FROM data_access_logs dal
       LEFT JOIN users u ON dal.user_id = u.id
       WHERE dal.resource_type = $1
         AND dal.resource_id = $2
         AND dal.decryption_performed = true
       ORDER BY dal.created_at DESC
       LIMIT $3`,
      [resourceType, resourceId, limit]
    );

    return result.rows;
  }

  /**
   * 统计访问次数
   */
  async getAccessCount(resourceType: string, resourceId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM data_access_logs
       WHERE resource_type = $1 AND resource_id = $2`,
      [resourceType, resourceId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * 获取最近访问时间
   */
  async getLastAccessTime(resourceType: string, resourceId: string): Promise<Date | null> {
    const result = await pool.query(
      `SELECT created_at
       FROM data_access_logs
       WHERE resource_type = $1 AND resource_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [resourceType, resourceId]
    );

    return result.rows.length > 0 ? result.rows[0].created_at : null;
  }

  /**
   * 从请求对象提取访问信息
   */
  extractAccessInfo(req: any): { ipAddress?: string; userAgent?: string } {
    return {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    };
  }
}

export default new DataAccessLogService();
