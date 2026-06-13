import { aiServiceClient } from './aiServiceClient';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

interface MatchStudentsRequest {
  taskId: string;
  limit?: number;
}

interface MatchTasksRequest {
  studentId: string;
  limit?: number;
}

interface StudentMatch {
  student_id: string;
  match_score: number;
  score_breakdown: {
    opc_match: number;
    capability_complement: number;
    task_experience: number;
    activity: number;
  };
  reasoning: string;
  recommended_role?: string;
}

interface TaskMatch {
  task_id: string;
  match_score: number;
  score_breakdown: {
    capability_match: number;
    growth_potential: number;
    interest_alignment: number;
    difficulty_fit: number;
  };
  reasoning: string;
  estimated_success_rate: number;
}

interface MatchStudentsResponse {
  task_id: string;
  matches: StudentMatch[];
  created_at: string;
}

interface MatchTasksResponse {
  student_id: string;
  matches: TaskMatch[];
  created_at: string;
}

class InvitationMatchingService {
  /**
   * 为任务匹配合适的学生
   */
  async matchStudentsForTask(taskId: string, limit: number = 10): Promise<MatchStudentsResponse> {
    try {
      const result = await aiServiceClient.matchStudentsForTask({
        task_id: taskId,
        limit,
      });

      return result;
    } catch (error: any) {
      logger.error('Student matching failed:', error);
      throw new AppError(
        error.response?.status || 500,
        error.response?.data?.message || 'Failed to match students'
      );
    }
  }

  /**
   * 为学生匹配合适的任务
   */
  async matchTasksForStudent(studentId: string, limit: number = 10): Promise<MatchTasksResponse> {
    try {
      const result = await aiServiceClient.matchTasksForStudent({
        student_id: studentId,
        limit,
      });

      return result;
    } catch (error: any) {
      logger.error('Task matching failed:', error);
      throw new AppError(
        error.response?.status || 500,
        error.response?.data?.message || 'Failed to match tasks'
      );
    }
  }

  /**
   * 格式化学生匹配结果为前端友好的格式
   */
  formatStudentMatchesForFrontend(response: MatchStudentsResponse) {
    return {
      taskId: response.task_id,
      matches: response.matches.map(match => ({
        studentId: match.student_id,
        matchScore: match.match_score,
        scoreBreakdown: {
          opcMatch: match.score_breakdown.opc_match,
          capabilityComplement: match.score_breakdown.capability_complement,
          taskExperience: match.score_breakdown.task_experience,
          activity: match.score_breakdown.activity,
        },
        reasoning: match.reasoning,
        recommendedRole: match.recommended_role,
      })),
      createdAt: response.created_at,
    };
  }

  /**
   * 格式化任务匹配结果为前端友好的格式
   */
  formatTaskMatchesForFrontend(response: MatchTasksResponse) {
    return {
      studentId: response.student_id,
      matches: response.matches.map(match => ({
        taskId: match.task_id,
        matchScore: match.match_score,
        scoreBreakdown: {
          capabilityMatch: match.score_breakdown.capability_match,
          growthPotential: match.score_breakdown.growth_potential,
          interestAlignment: match.score_breakdown.interest_alignment,
          difficultyFit: match.score_breakdown.difficulty_fit,
        },
        reasoning: match.reasoning,
        estimatedSuccessRate: match.estimated_success_rate,
      })),
      createdAt: response.created_at,
    };
  }

  /**
   * 根据匹配分数获取推荐等级
   */
  getRecommendationLevel(score: number): 'highly_recommended' | 'recommended' | 'suitable' | 'not_recommended' {
    if (score >= 0.8) return 'highly_recommended';
    if (score >= 0.6) return 'recommended';
    if (score >= 0.4) return 'suitable';
    return 'not_recommended';
  }

  /**
   * 发送任务邀请
   */
  async sendInvitation(
    taskId: string,
    studentId: string,
    companyId: string,
    matchScore: number,
    customMessage?: string
  ): Promise<any> {
    try {
      const { pool } = await import('../utils/db');

      // 检查是否已存在待处理的邀请
      const existingResult = await pool.query(
        'SELECT id FROM invitations WHERE task_id = $1 AND student_id = $2 AND status = $3',
        [taskId, studentId, 'pending']
      );

      if (existingResult.rows.length > 0) {
        throw new AppError(400, 'An invitation is already pending for this student');
      }

      // 创建邀请记录
      const invitationId = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期

      const result = await pool.query(
        `INSERT INTO invitations (id, task_id, student_id, company_id, status, custom_message, match_score, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [invitationId, taskId, studentId, companyId, 'pending', customMessage, matchScore, expiresAt]
      );

      const invitation = result.rows[0];

      // TODO: 发送通知给学生（邮件、站内信等）
      // await notificationService.sendInvitationNotification(studentId, invitation);

      return {
        invitationId: invitation.id,
        taskId: invitation.task_id,
        studentId: invitation.student_id,
        companyId: invitation.company_id,
        status: invitation.status,
        customMessage: invitation.custom_message,
        matchScore: invitation.match_score,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to send invitation:', error);
      throw new AppError(500, 'Failed to send invitation');
    }
  }

  /**
   * 获取学生收到的邀请列表
   */
  async getStudentInvitations(studentId: string, status?: string): Promise<any[]> {
    try {
      const { pool } = await import('../utils/db');

      let query = 'SELECT * FROM invitations WHERE student_id = $1';
      const params: any[] = [studentId];

      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);

      return result.rows.map((inv) => ({
        invitationId: inv.id,
        taskId: inv.task_id,
        studentId: inv.student_id,
        companyId: inv.company_id,
        status: inv.status,
        customMessage: inv.custom_message,
        matchScore: inv.match_score,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        respondedAt: inv.responded_at,
      }));
    } catch (error) {
      logger.error('Failed to get student invitations:', error);
      throw new AppError(500, 'Failed to get student invitations');
    }
  }

  /**
   * 更新邀请状态
   */
  async updateInvitationStatus(
    invitationId: string,
    status: 'accepted' | 'declined',
    studentId: string
  ): Promise<any> {
    try {
      const { pool } = await import('../utils/db');

      // 获取邀请
      const invitationResult = await pool.query(
        'SELECT * FROM invitations WHERE id = $1',
        [invitationId]
      );

      if (invitationResult.rows.length === 0) {
        throw new AppError(404, 'Invitation not found');
      }

      const invitation = invitationResult.rows[0];

      // 验证学生只能更新自己的邀请
      if (invitation.student_id !== studentId) {
        throw new AppError(403, 'You can only update your own invitations');
      }

      // 检查邀请是否已过期
      if (new Date() > new Date(invitation.expires_at)) {
        await pool.query(
          'UPDATE invitations SET status = $1 WHERE id = $2',
          ['expired', invitationId]
        );
        throw new AppError(400, 'Invitation has expired');
      }

      // 检查邀请是否已处理
      if (invitation.status !== 'pending') {
        throw new AppError(400, `Invitation is already ${invitation.status}`);
      }

      // 更新邀请状态
      const updateResult = await pool.query(
        'UPDATE invitations SET status = $1, responded_at = NOW() WHERE id = $2 RETURNING *',
        [status, invitationId]
      );

      const updatedInvitation = updateResult.rows[0];

      return {
        invitationId: updatedInvitation.id,
        taskId: updatedInvitation.task_id,
        studentId: updatedInvitation.student_id,
        companyId: updatedInvitation.company_id,
        status: updatedInvitation.status,
        respondedAt: updatedInvitation.responded_at,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update invitation status:', error);
      throw new AppError(500, 'Failed to update invitation status');
    }
  }
}

export const invitationMatchingService = new InvitationMatchingService();
