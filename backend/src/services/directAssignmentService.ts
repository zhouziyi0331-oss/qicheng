import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface DirectInvitation {
  id: string;
  task_id: string;
  company_id: string;
  student_id: string;
  invitation_message?: string;
  offered_price?: number;
  deadline?: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  student_response?: string;
  responded_at?: Date;
  created_at: Date;
  expires_at: Date;
}

interface FavoriteStudent {
  id: string;
  company_id: string;
  student_id: string;
  tags: string[];
  notes?: string;
  total_tasks: number;
  avg_rating?: number;
  last_collaborated_at?: Date;
  created_at: Date;
}

interface InvitationStats {
  total_invitations: number;
  accepted_count: number;
  declined_count: number;
  pending_count: number;
  acceptance_rate: number;
}

/**
 * E-08: 定向指定学生服务
 * 企业直接邀请指定学生接单
 */
class DirectAssignmentService {
  /**
   * 创建定向邀请
   */
  async createDirectInvitation(data: {
    taskId: string;
    companyId: string;
    studentId: string;
    invitationMessage?: string;
    offeredPrice?: number;
    deadline?: Date;
    expiresInHours?: number;
  }): Promise<DirectInvitation> {
    const {
      taskId,
      companyId,
      studentId,
      invitationMessage,
      offeredPrice,
      deadline,
      expiresInHours = 72, // 默认72小时过期
    } = data;

    // 检查学生是否存在
    const studentCheck = await pool.query(
      `SELECT id, role FROM users WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (studentCheck.rows.length === 0) {
      throw new Error('学生不存在');
    }

    // 检查任务是否存在且属于该企业
    const taskCheck = await pool.query(
      `SELECT id, company_id, status FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      throw new Error('任务不存在');
    }

    if (taskCheck.rows[0].company_id !== companyId) {
      throw new Error('无权操作该任务');
    }

    if (taskCheck.rows[0].status !== 'published') {
      throw new Error('任务状态不允许发送邀请');
    }

    // 检查是否已有有效邀请
    const existingCheck = await pool.query(
      `SELECT id FROM direct_invitations
       WHERE task_id = $1 AND student_id = $2 AND status = 'pending'`,
      [taskId, studentId]
    );

    if (existingCheck.rows.length > 0) {
      throw new Error('已向该学生发送过邀请');
    }

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // 创建邀请
    const result = await pool.query(
      `INSERT INTO direct_invitations
       (id, task_id, company_id, student_id, invitation_message,
        offered_price, deadline, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING *`,
      [
        uuidv4(),
        taskId,
        companyId,
        studentId,
        invitationMessage,
        offeredPrice,
        deadline,
        expiresAt,
      ]
    );

    // TODO: 发送通知给学生

    return result.rows[0];
  }

  /**
   * 学生响应邀请
   */
  async respondToInvitation(
    invitationId: string,
    studentId: string,
    response: {
      accept: boolean;
      message?: string;
    }
  ): Promise<DirectInvitation> {
    const { accept, message } = response;

    // 获取邀请信息
    const invitation = await pool.query(
      `SELECT * FROM direct_invitations WHERE id = $1`,
      [invitationId]
    );

    if (invitation.rows.length === 0) {
      throw new Error('邀请不存在');
    }

    const inv = invitation.rows[0];

    if (inv.student_id !== studentId) {
      throw new Error('无权响应该邀请');
    }

    if (inv.status !== 'pending') {
      throw new Error('邀请已处理或已过期');
    }

    if (new Date(inv.expires_at) < new Date()) {
      // 邀请已过期
      await pool.query(
        `UPDATE direct_invitations SET status = 'expired' WHERE id = $1`,
        [invitationId]
      );
      throw new Error('邀请已过期');
    }

    // 更新邀请状态
    const newStatus = accept ? 'accepted' : 'declined';
    const result = await pool.query(
      `UPDATE direct_invitations
       SET status = $1,
           student_response = $2,
           responded_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newStatus, message, invitationId]
    );

    if (accept) {
      // 创建任务分配记录
      await pool.query(
        `INSERT INTO task_assignments
         (id, task_id, student_id, status, assigned_at)
         VALUES ($1, $2, $3, 'assigned', NOW())
         ON CONFLICT (task_id) DO NOTHING`,
        [uuidv4(), inv.task_id, studentId]
      );

      // 更新任务状态
      await pool.query(
        `UPDATE tasks SET status = 'assigned', student_id = $1 WHERE id = $2`,
        [studentId, inv.task_id]
      );

      // 取消其他待处理的邀请
      await pool.query(
        `UPDATE direct_invitations
         SET status = 'cancelled'
         WHERE task_id = $1 AND id != $2 AND status = 'pending'`,
        [inv.task_id, invitationId]
      );
    }

    // TODO: 发送通知给企业

    return result.rows[0];
  }

  /**
   * 企业取消邀请
   */
  async cancelInvitation(invitationId: string, companyId: string): Promise<void> {
    const invitation = await pool.query(
      `SELECT * FROM direct_invitations WHERE id = $1`,
      [invitationId]
    );

    if (invitation.rows.length === 0) {
      throw new Error('邀请不存在');
    }

    if (invitation.rows[0].company_id !== companyId) {
      throw new Error('无权取消该邀请');
    }

    if (invitation.rows[0].status !== 'pending') {
      throw new Error('只能取消待处理的邀请');
    }

    await pool.query(
      `UPDATE direct_invitations SET status = 'cancelled' WHERE id = $1`,
      [invitationId]
    );
  }

  /**
   * 获取任务的邀请列表
   */
  async getTaskInvitations(taskId: string, companyId: string): Promise<DirectInvitation[]> {
    // 验证任务归属
    const taskCheck = await pool.query(
      `SELECT company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskCheck.rows.length === 0 || taskCheck.rows[0].company_id !== companyId) {
      throw new Error('无权查看该任务的邀请');
    }

    const result = await pool.query(
      `SELECT di.*,
              u.name as student_name,
              u.avatar as student_avatar
       FROM direct_invitations di
       JOIN users u ON di.student_id = u.id
       WHERE di.task_id = $1
       ORDER BY di.created_at DESC`,
      [taskId]
    );

    return result.rows;
  }

  /**
   * 获取学生收到的邀请列表
   */
  async getStudentInvitations(
    studentId: string,
    status?: string
  ): Promise<DirectInvitation[]> {
    let query = `
      SELECT di.*,
             t.title as task_title,
             t.description as task_description,
             t.budget as task_budget,
             c.company_name,
             c.avatar as company_avatar
      FROM direct_invitations di
      JOIN tasks t ON di.task_id = t.id
      JOIN users c ON di.company_id = c.id
      WHERE di.student_id = $1
    `;

    const params: any[] = [studentId];

    if (status) {
      query += ` AND di.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY di.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 添加收藏学生
   */
  async addFavoriteStudent(
    companyId: string,
    studentId: string,
    data: {
      tags?: string[];
      notes?: string;
    }
  ): Promise<FavoriteStudent> {
    const { tags = [], notes } = data;

    // 检查学生是否存在
    const studentCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (studentCheck.rows.length === 0) {
      throw new Error('学生不存在');
    }

    const result = await pool.query(
      `INSERT INTO company_favorite_students
       (id, company_id, student_id, tags, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (company_id, student_id) DO UPDATE
       SET tags = EXCLUDED.tags,
           notes = EXCLUDED.notes,
           updated_at = NOW()
       RETURNING *`,
      [uuidv4(), companyId, studentId, tags, notes]
    );

    return result.rows[0];
  }

  /**
   * 移除收藏学生
   */
  async removeFavoriteStudent(companyId: string, studentId: string): Promise<void> {
    await pool.query(
      `DELETE FROM company_favorite_students
       WHERE company_id = $1 AND student_id = $2`,
      [companyId, studentId]
    );
  }

  /**
   * 获取收藏学生列表
   */
  async getFavoriteStudents(
    companyId: string,
    options: {
      tags?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ students: any[]; total: number }> {
    const { tags, limit = 20, offset = 0 } = options;

    let query = `
      SELECT cfs.*,
             u.name as student_name,
             u.avatar as student_avatar,
             u.level as student_level,
             sc.skills as student_skills
      FROM company_favorite_students cfs
      JOIN users u ON cfs.student_id = u.id
      LEFT JOIN student_capabilities sc ON u.id = sc.student_id
      WHERE cfs.company_id = $1
    `;

    const params: any[] = [companyId];
    let paramIndex = 2;

    if (tags && tags.length > 0) {
      query += ` AND cfs.tags && $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      query.replace('SELECT cfs.*', 'SELECT COUNT(*)'),
      params.slice(0, paramIndex - 1)
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // 获取列表
    query += ` ORDER BY cfs.last_collaborated_at DESC NULLS LAST, cfs.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      students: result.rows,
      total,
    };
  }

  /**
   * 获取邀请统计
   */
  async getInvitationStats(companyId: string): Promise<InvitationStats> {
    const result = await pool.query(
      `SELECT * FROM direct_invitation_stats WHERE company_id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return {
        total_invitations: 0,
        accepted_count: 0,
        declined_count: 0,
        pending_count: 0,
        acceptance_rate: 0,
      };
    }

    return result.rows[0];
  }

  /**
   * 过期待处理邀请（定时任务调用）
   */
  async expirePendingInvitations(): Promise<number> {
    const result = await pool.query(
      `UPDATE direct_invitations
       SET status = 'expired'
       WHERE status = 'pending' AND expires_at < NOW()
       RETURNING id`
    );

    return result.rows.length;
  }
}

export default new DirectAssignmentService();
