/**
 * 联系方式解锁服务
 *
 * 功能：
 * 1. 申请解锁联系方式
 * 2. 同意/拒绝解锁申请
 * 3. 查看已解锁的联系方式
 * 4. 检查解锁状态
 */

import pool from '../utils/db';
import dataAccessLogService from './dataAccessLogService';

interface UnlockRequest {
  studentId: string;
  companyId: string;
  taskId: string;
  requestedBy: 'student' | 'company';
}

interface UnlockResponse {
  id: string;
  studentId: string;
  companyId: string;
  studentAgreed: boolean;
  companyAgreed: boolean;
  exchanged: boolean;
  canUnlock: boolean;
  collaborationCount: number;
}

interface ContactInfo {
  phone?: string;
  wechat?: string;
  email?: string;
  qq?: string;
}

class ContactUnlockService {
  /**
   * 申请解锁联系方式
   */
  async requestUnlock(params: UnlockRequest): Promise<UnlockResponse> {
    const { studentId, companyId, taskId, requestedBy } = params;

    // 1. 检查是否满足解锁条件（完成2单）
    const canUnlock = await this.canUnlock(studentId, companyId);
    if (!canUnlock.eligible) {
      throw new Error(`还需完成 ${2 - canUnlock.completedCount} 单才能解锁联系方式`);
    }

    // 2. 检查是否已有解锁请求
    const existingRequest = await pool.query(
      `SELECT * FROM contact_exchange_requests
       WHERE student_id = $1 AND company_id = $2`,
      [studentId, companyId]
    );

    let result;

    if (existingRequest.rows.length > 0) {
      // 更新现有请求
      const existing = existingRequest.rows[0];

      if (existing.exchanged) {
        throw new Error('联系方式已解锁');
      }

      const updateField = requestedBy === 'student' ? 'student_agreed' : 'company_agreed';
      const updateTimeField = requestedBy === 'student' ? 'student_agreed_at' : 'company_agreed_at';

      result = await pool.query(
        `UPDATE contact_exchange_requests
         SET ${updateField} = true,
             ${updateTimeField} = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [existing.id]
      );
    } else {
      // 创建新请求
      const studentAgreed = requestedBy === 'student';
      const companyAgreed = requestedBy === 'company';

      result = await pool.query(
        `INSERT INTO contact_exchange_requests (
          student_id, company_id, task_id,
          student_agreed, company_agreed,
          student_agreed_at, company_agreed_at,
          collaboration_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          studentId,
          companyId,
          taskId,
          studentAgreed,
          companyAgreed,
          studentAgreed ? new Date() : null,
          companyAgreed ? new Date() : null,
          canUnlock.completedCount
        ]
      );
    }

    const request = result.rows[0];

    // 3. 检查是否双方都同意，如果是则自动解锁
    if (request.student_agreed && request.company_agreed && !request.exchanged) {
      await this.executeUnlock(request.id);
      request.exchanged = true;
      request.exchanged_at = new Date();
    }

    return this.formatUnlockResponse(request, canUnlock);
  }

  /**
   * 同意解锁申请
   */
  async approveUnlock(studentId: string, companyId: string, approvedBy: 'student' | 'company'): Promise<UnlockResponse> {
    // 检查是否有待处理的请求
    const result = await pool.query(
      `SELECT * FROM contact_exchange_requests
       WHERE student_id = $1 AND company_id = $2`,
      [studentId, companyId]
    );

    if (result.rows.length === 0) {
      throw new Error('未找到解锁申请');
    }

    const request = result.rows[0];

    if (request.exchanged) {
      throw new Error('联系方式已解锁');
    }

    // 更新同意状态
    const updateField = approvedBy === 'student' ? 'student_agreed' : 'company_agreed';
    const updateTimeField = approvedBy === 'student' ? 'student_agreed_at' : 'company_agreed_at';

    const updated = await pool.query(
      `UPDATE contact_exchange_requests
       SET ${updateField} = true,
           ${updateTimeField} = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [request.id]
    );

    const updatedRequest = updated.rows[0];

    // 如果双方都同意，执行解锁
    if (updatedRequest.student_agreed && updatedRequest.company_agreed) {
      await this.executeUnlock(updatedRequest.id);
      updatedRequest.exchanged = true;
      updatedRequest.exchanged_at = new Date();
    }

    const canUnlock = await this.canUnlock(studentId, companyId);
    return this.formatUnlockResponse(updatedRequest, canUnlock);
  }

  /**
   * 拒绝解锁申请
   */
  async rejectUnlock(studentId: string, companyId: string, rejectedBy: 'student' | 'company'): Promise<void> {
    // 删除解锁请求
    await pool.query(
      `DELETE FROM contact_exchange_requests
       WHERE student_id = $1 AND company_id = $2 AND exchanged = false`,
      [studentId, companyId]
    );
  }

  /**
   * 执行解锁（双方都同意后）
   */
  private async executeUnlock(requestId: string): Promise<void> {
    await pool.query(
      `UPDATE contact_exchange_requests
       SET exchanged = true,
           exchanged_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [requestId]
    );
  }

  /**
   * 获取已解锁的联系方式
   */
  async getUnlockedContact(
    studentId: string,
    companyId: string,
    requestedBy: 'student' | 'company',
    requesterId: string
  ): Promise<ContactInfo> {
    // 1. 检查是否已解锁
    const unlockStatus = await this.getUnlockStatus(studentId, companyId);
    if (!unlockStatus.exchanged) {
      throw new Error('联系方式未解锁');
    }

    // 2. 获取对方的联系方式
    const targetUserId = requestedBy === 'student' ? companyId : studentId;
    const targetUserType = requestedBy === 'student' ? 'company' : 'student';

    const result = await pool.query(
      `SELECT phone, wechat, email FROM users WHERE id = $1`,
      [targetUserId]
    );

    if (result.rows.length === 0) {
      throw new Error('用户不存在');
    }

    const contact = result.rows[0];

    // 3. 记录访问日志
    await dataAccessLogService.logAccess({
      userId: requesterId,
      userType: requestedBy,
      resourceType: 'contact_info',
      resourceId: targetUserId,
      action: 'view',
      success: true,
      decryptionPerformed: false
    });

    return {
      phone: contact.phone,
      wechat: contact.wechat,
      email: contact.email
    };
  }

  /**
   * 获取解锁状态
   */
  async getUnlockStatus(studentId: string, companyId: string): Promise<UnlockResponse> {
    const result = await pool.query(
      `SELECT * FROM contact_exchange_requests
       WHERE student_id = $1 AND company_id = $2`,
      [studentId, companyId]
    );

    const canUnlock = await this.canUnlock(studentId, companyId);

    if (result.rows.length === 0) {
      return {
        id: '',
        studentId,
        companyId,
        studentAgreed: false,
        companyAgreed: false,
        exchanged: false,
        canUnlock: canUnlock.eligible,
        collaborationCount: canUnlock.completedCount
      };
    }

    return this.formatUnlockResponse(result.rows[0], canUnlock);
  }

  /**
   * 检查是否可以解锁
   */
  async canUnlock(studentId: string, companyId: string): Promise<{ eligible: boolean; completedCount: number }> {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM collaboration_history
       WHERE student_id = $1 AND company_id = $2 AND status = 'completed'`,
      [studentId, companyId]
    );

    const completedCount = parseInt(result.rows[0].count, 10);
    return {
      eligible: completedCount >= 2,
      completedCount
    };
  }

  /**
   * 获取用户的所有解锁请求
   */
  async getUserUnlockRequests(userId: string, userType: 'student' | 'company'): Promise<UnlockResponse[]> {
    const field = userType === 'student' ? 'student_id' : 'company_id';

    const result = await pool.query(
      `SELECT * FROM contact_exchange_requests
       WHERE ${field} = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const requests = await Promise.all(
      result.rows.map(async (row) => {
        const canUnlock = await this.canUnlock(row.student_id, row.company_id);
        return this.formatUnlockResponse(row, canUnlock);
      })
    );

    return requests;
  }

  /**
   * 格式化解锁响应
   */
  private formatUnlockResponse(request: any, canUnlock: { eligible: boolean; completedCount: number }): UnlockResponse {
    return {
      id: request.id,
      studentId: request.student_id,
      companyId: request.company_id,
      studentAgreed: request.student_agreed,
      companyAgreed: request.company_agreed,
      exchanged: request.exchanged,
      canUnlock: canUnlock.eligible,
      collaborationCount: canUnlock.completedCount
    };
  }
}

export default new ContactUnlockService();
