/**
 * 邀请任务服务
 * 处理邀请任务的创建、发送、响应等核心业务逻辑
 */

import { query as poolQuery } from '../../utils/db';
import { invitationMatchService } from './matchService';
import { activityService } from './activityService';

interface InvitationTask {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string;
  deliverables: string;
  budget: number;
  deadline: Date;
  target_level_min: number;
  target_abilities: Record<string, number>;
  target_tags: string[];
  max_invitations: number;
  status: string;
}

interface InvitationRecord {
  id: string;
  task_id: string;
  student_id: string;
  company_id: string;
  invitation_message: string;
  match_score: number;
  match_reason: any;
  status: string;
  expires_at: Date;
}

export class InvitationTaskService {
  /**
   * 创建邀请任务并自动匹配学生
   */
  async createInvitationTask(
    companyId: string,
    taskData: {
      title: string;
      description: string;
      requirements?: string;
      deliverables?: string;
      budget: number;
      deadline?: Date;
      target_level_min?: number;
      target_abilities?: Record<string, number>;
      target_tags?: string[];
      max_invitations?: number;
      invitation_message?: string;
    }
  ): Promise<{ task: InvitationTask; invitations: InvitationRecord[] }> {
    // 1. 创建邀请任务
    const taskQuery = `
      INSERT INTO invitation_tasks (
        company_id,
        title,
        description,
        requirements,
        deliverables,
        budget,
        deadline,
        target_level_min,
        target_abilities,
        target_tags,
        max_invitations,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *
    `;

    const taskResult = await poolQuery<InvitationTask>(taskQuery, [
      companyId,
      taskData.title,
      taskData.description,
      taskData.requirements || '',
      taskData.deliverables || '',
      taskData.budget,
      taskData.deadline || null,
      taskData.target_level_min || 10,
      JSON.stringify(taskData.target_abilities || {}),
      taskData.target_tags || [],
      taskData.max_invitations || 5,
    ]);

    const task = taskResult[0];

    // 2. 智能匹配学生
    const matches = await invitationMatchService.matchStudentsForTask(companyId, {
      target_level_min: task.target_level_min,
      target_abilities: task.target_abilities,
      target_tags: task.target_tags,
      max_invitations: task.max_invitations,
    });

    // 3. 创建邀请记录
    const invitations: InvitationRecord[] = [];

    for (const match of matches) {
      const invitationQuery = `
        INSERT INTO invitation_records (
          task_id,
          student_id,
          company_id,
          invitation_message,
          match_score,
          match_reason,
          status,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW() + INTERVAL '7 days')
        RETURNING *
      `;

      const invitationResult = await poolQuery<InvitationRecord>(invitationQuery, [
        task.id,
        match.student_id,
        companyId,
        taskData.invitation_message || `您好！我们诚挚邀请您参与「${task.title}」任务。`,
        match.match_score,
        JSON.stringify(match.match_reason),
      ]);

      invitations.push(invitationResult[0]);
    }

    return { task, invitations };
  }

  /**
   * 获取学生收到的邀请列表
   */
  async getStudentInvitations(
    studentId: string,
    status?: string
  ): Promise<Array<InvitationRecord & { task: InvitationTask; company_name: string }>> {
    let queryText = `
      SELECT
        ir.*,
        it.title as task_title,
        it.description as task_description,
        it.budget as task_budget,
        it.deadline as task_deadline,
        u.name as company_name
      FROM invitation_records ir
      JOIN invitation_tasks it ON ir.task_id = it.id
      JOIN users u ON ir.company_id = u.id
      WHERE ir.student_id = $1
    `;

    const params: any[] = [studentId];

    if (status) {
      queryText += ` AND ir.status = $2`;
      params.push(status);
    }

    queryText += ` ORDER BY ir.created_at DESC`;

    const result = await poolQuery<any>(queryText, params);
    return result;
  }

  /**
   * 学生接受邀请
   */
  async acceptInvitation(
    invitationId: string,
    studentId: string,
    responseMessage?: string
  ): Promise<{ invitation: InvitationRecord; taskId: string }> {
    // 1. 更新邀请状态
    const updateQuery = `
      UPDATE invitation_records
      SET
        status = 'accepted',
        student_responded_at = NOW(),
        response_message = $1,
        updated_at = NOW()
      WHERE id = $2 AND student_id = $3 AND status = 'pending'
      RETURNING *
    `;

    const result = await poolQuery<InvitationRecord>(updateQuery, [
      responseMessage || '我很荣幸接受这个邀请！',
      invitationId,
      studentId,
    ]);

    if (result.length === 0) {
      throw new Error('邀请不存在或已过期');
    }

    const invitation = result[0];

    // 2. 创建正式任务
    const taskId = await this.convertToFormalTask(invitation);

    // 3. 记录转换关系
    const conversionQuery = `
      INSERT INTO invitation_task_conversions (
        invitation_record_id,
        task_id,
        original_budget,
        final_budget
      )
      SELECT $1, $2, it.budget, it.budget
      FROM invitation_tasks it
      WHERE it.id = $3
    `;

    await poolQuery(conversionQuery, [invitationId, taskId, invitation.task_id]);

    return { invitation, taskId };
  }

  /**
   * 学生拒绝邀请
   */
  async rejectInvitation(
    invitationId: string,
    studentId: string,
    responseMessage?: string
  ): Promise<void> {
    const queryText = `
      UPDATE invitation_records
      SET
        status = 'rejected',
        student_responded_at = NOW(),
        response_message = $1,
        updated_at = NOW()
      WHERE id = $2 AND student_id = $3 AND status = 'pending'
    `;

    await poolQuery(queryText, [
      responseMessage || '抱歉，我暂时无法接受这个邀请。',
      invitationId,
      studentId,
    ]);
  }

  /**
   * 标记邀请为已查看
   */
  async markAsViewed(invitationId: string, studentId: string): Promise<void> {
    const queryText = `
      UPDATE invitation_records
      SET student_viewed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND student_id = $2 AND student_viewed_at IS NULL
    `;

    await poolQuery(queryText, [invitationId, studentId]);
  }

  /**
   * 将邀请任务转换为正式任务
   */
  private async convertToFormalTask(invitation: InvitationRecord): Promise<string> {
    const queryText = `
      INSERT INTO tasks (
        company_id,
        title,
        description,
        requirements,
        deliverables,
        budget,
        deadline,
        status,
        visibility,
        assigned_student_id
      )
      SELECT
        it.company_id,
        it.title,
        it.description,
        it.requirements,
        it.deliverables,
        it.budget,
        it.deadline,
        'in_progress',
        'private',
        $1
      FROM invitation_tasks it
      WHERE it.id = $2
      RETURNING id
    `;

    const result = await poolQuery<{ id: string }>(queryText, [
      invitation.student_id,
      invitation.task_id,
    ]);

    return result[0].id;
  }

  /**
   * 获取商家发出的邀请列表
   */
  async getCompanyInvitations(
    companyId: string,
    taskId?: string
  ): Promise<Array<InvitationRecord & { student_name: string }>> {
    let queryText = `
      SELECT
        ir.*,
        u.name as student_name,
        sp.level_a as student_level
      FROM invitation_records ir
      JOIN users u ON ir.student_id = u.id
      JOIN student_profiles sp ON ir.student_id = sp.user_id
      WHERE ir.company_id = $1
    `;

    const params: any[] = [companyId];

    if (taskId) {
      queryText += ` AND ir.task_id = $2`;
      params.push(taskId);
    }

    queryText += ` ORDER BY ir.match_score DESC, ir.created_at DESC`;

    const result = await poolQuery<any>(queryText, params);
    return result;
  }

  /**
   * 商家撤回邀请
   */
  async withdrawInvitation(invitationId: string, companyId: string): Promise<void> {
    const queryText = `
      UPDATE invitation_records
      SET status = 'withdrawn', updated_at = NOW()
      WHERE id = $1 AND company_id = $2 AND status = 'pending'
    `;

    await poolQuery(queryText, [invitationId, companyId]);
  }

  /**
   * 自动过期邀请（定时任务调用）
   */
  async expireInvitations(): Promise<number> {
    const queryText = `
      UPDATE invitation_records
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'pending' AND expires_at < NOW()
      RETURNING id
    `;

    const result = await poolQuery<{ id: string }>(queryText);
    return result.length;
  }

  /**
   * 获取邀请任务详情
   */
  async getInvitationTask(taskId: string): Promise<InvitationTask | null> {
    const queryText = `
      SELECT * FROM invitation_tasks WHERE id = $1
    `;

    const result = await poolQuery<InvitationTask>(queryText, [taskId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 更新邀请任务状态
   */
  async updateTaskStatus(
    taskId: string,
    companyId: string,
    status: 'active' | 'paused' | 'closed'
  ): Promise<void> {
    const queryText = `
      UPDATE invitation_tasks
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND company_id = $3
    `;

    await poolQuery(queryText, [status, taskId, companyId]);
  }

  /**
   * 获取邀请统计
   */
  async getInvitationStats(companyId: string): Promise<{
    total_sent: number;
    pending: number;
    accepted: number;
    rejected: number;
    expired: number;
    acceptance_rate: number;
  }> {
    const queryText = `
      SELECT
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        CASE
          WHEN COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected')) > 0
          THEN ROUND(
            COUNT(*) FILTER (WHERE status = 'accepted')::numeric /
            COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected'))::numeric * 100,
            2
          )
          ELSE 0
        END as acceptance_rate
      FROM invitation_records
      WHERE company_id = $1
    `;

    const result = await poolQuery<any>(queryText, [companyId]);
    return result[0];
  }
}

export const invitationTaskService = new InvitationTaskService();
