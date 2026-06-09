import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 组队服务
 * 处理队伍创建、成员管理、任务分配、收入分配
 */

interface CreateTeamParams {
  creatorId: string;
  name: string;
  description: string;
  maxMembers: number;
  requiredSkills: string[];
  track: string;
  projectId?: string;
}

interface TeamInfo {
  id: string;
  name: string;
  creatorId: string;
  status: string;
  currentMembers: number;
  maxMembers: number;
  members: TeamMember[];
}

interface TeamMember {
  userId: string;
  role: string;
  assignedModule?: string;
  revenueSharePercent: number;
}

class TeamService {
  /**
   * 创建队伍（仅Lv.5及以上）
   */
  async createTeam(params: CreateTeamParams): Promise<string> {
    try {
      // 检查创建者等级
      const creator = await queryOne<{
        current_level: number;
        track: string;
      }>(
        `SELECT current_level, track FROM users WHERE id = $1`,
        [params.creatorId]
      );

      if (!creator) {
        throw new Error('Creator not found');
      }

      if (creator.current_level < 6) {
        throw new Error('只有Lv.6（河成者）及以上的学生才能创建队伍');
      }

      // 创建队伍
      const team = await queryOne<{ id: string }>(
        `INSERT INTO teams (
          name, creator_id, project_id, status, max_members,
          required_skills, track, description
        ) VALUES ($1, $2, $3, 'recruiting', $4, $5, $6, $7)
        RETURNING id`,
        [
          params.name,
          params.creatorId,
          params.projectId || null,
          params.maxMembers,
          JSON.stringify(params.requiredSkills),
          params.track,
          params.description,
        ]
      );

      if (!team) {
        throw new Error('Failed to create team');
      }

      // 添加创建者为队长
      await query(
        `INSERT INTO team_members (team_id, user_id, role, status, revenue_share_percent)
         VALUES ($1, $2, 'leader', 'active', 40)`,
        [team.id, params.creatorId]
      );

      logger.info(`Team created: ${team.id} by ${params.creatorId}`);

      return team.id;
    } catch (error) {
      logger.error('Failed to create team:', error);
      throw error;
    }
  }

  /**
   * 申请加入队伍
   */
  async applyToJoinTeam(teamId: string, applicantId: string, message?: string): Promise<void> {
    try {
      // 检查申请者等级
      const applicant = await queryOne<{
        current_level: number;
      }>(
        `SELECT current_level FROM users WHERE id = $1`,
        [applicantId]
      );

      if (!applicant) {
        throw new Error('Applicant not found');
      }

      if (applicant.current_level < 5) {
        throw new Error('只有Lv.5及以上的学生才能加入队伍');
      }

      // 检查队伍状态
      const team = await queryOne<{
        status: string;
        current_members: number;
        max_members: number;
      }>(
        `SELECT status, current_members, max_members FROM teams WHERE id = $1`,
        [teamId]
      );

      if (!team) {
        throw new Error('Team not found');
      }

      if (team.status !== 'recruiting') {
        throw new Error('队伍不在招募状态');
      }

      if (team.current_members >= team.max_members) {
        throw new Error('队伍已满');
      }

      // 检查是否已申请
      const existing = await queryOne(
        `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [teamId, applicantId]
      );

      if (existing) {
        throw new Error('你已经申请过此队伍');
      }

      // 添加申请记录
      await query(
        `INSERT INTO team_members (team_id, user_id, role, status)
         VALUES ($1, $2, 'applicant', 'pending')`,
        [teamId, applicantId]
      );

      // 通知队长
      const teamInfo = await queryOne<{
        creator_id: string;
        name: string;
      }>(
        `SELECT creator_id, name FROM teams WHERE id = $1`,
        [teamId]
      );

      if (teamInfo) {
        // 这里可以发送WebSocket通知或创建通知记录
        logger.info(`New team application: ${applicantId} -> team ${teamId}`);
      }
    } catch (error) {
      logger.error('Failed to apply to join team:', error);
      throw error;
    }
  }

  /**
   * 审核队伍申请
   */
  async reviewTeamApplication(
    teamId: string,
    leaderId: string,
    applicantId: string,
    approved: boolean
  ): Promise<void> {
    try {
      // 验证队长身份
      const leader = await queryOne(
        `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'leader'`,
        [teamId, leaderId]
      );

      if (!leader) {
        throw new Error('只有队长可以审核申请');
      }

      if (approved) {
        // 通过申请
        await query(
          `UPDATE team_members
           SET role = 'member', status = 'active', joined_at = NOW()
           WHERE team_id = $1 AND user_id = $2 AND role = 'applicant'`,
          [teamId, applicantId]
        );

        logger.info(`Team application approved: ${applicantId} joined team ${teamId}`);
      } else {
        // 拒绝申请
        await query(
          `UPDATE team_members
           SET status = 'rejected'
           WHERE team_id = $1 AND user_id = $2 AND role = 'applicant'`,
          [teamId, applicantId]
        );

        logger.info(`Team application rejected: ${applicantId} for team ${teamId}`);
      }
    } catch (error) {
      logger.error('Failed to review team application:', error);
      throw error;
    }
  }

  /**
   * 分配任务模块
   */
  async assignModule(
    teamId: string,
    leaderId: string,
    memberId: string,
    moduleName: string,
    moduleDescription: string,
    revenueSharePercent: number
  ): Promise<void> {
    try {
      // 验证队长身份
      const leader = await queryOne(
        `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'leader'`,
        [teamId, leaderId]
      );

      if (!leader) {
        throw new Error('只有队长可以分配任务');
      }

      // 更新成员任务分配
      await query(
        `UPDATE team_members
         SET assigned_module = $1, module_description = $2, revenue_share_percent = $3
         WHERE team_id = $4 AND user_id = $5`,
        [moduleName, moduleDescription, revenueSharePercent, teamId, memberId]
      );

      logger.info(`Module assigned: ${moduleName} to ${memberId} in team ${teamId}`);
    } catch (error) {
      logger.error('Failed to assign module:', error);
      throw error;
    }
  }

  /**
   * 获取队伍信息
   */
  async getTeamInfo(teamId: string): Promise<TeamInfo | null> {
    try {
      const team = await queryOne<{
        id: string;
        name: string;
        creator_id: string;
        status: string;
        current_members: number;
        max_members: number;
      }>(
        `SELECT id, name, creator_id, status, current_members, max_members
         FROM teams WHERE id = $1`,
        [teamId]
      );

      if (!team) {
        return null;
      }

      // 获取成员列表
      const members = await query<{
        user_id: string;
        role: string;
        assigned_module: string;
        revenue_share_percent: number;
      }>(
        `SELECT user_id, role, assigned_module, revenue_share_percent
         FROM team_members
         WHERE team_id = $1 AND status = 'active'
         ORDER BY
           CASE role
             WHEN 'leader' THEN 1
             WHEN 'member' THEN 2
             ELSE 3
           END`,
        [teamId]
      );

      return {
        id: team.id,
        name: team.name,
        creatorId: team.creator_id,
        status: team.status,
        currentMembers: team.current_members,
        maxMembers: team.max_members,
        members: members.rows.map(m => ({
          userId: m.user_id,
          role: m.role,
          assignedModule: m.assigned_module,
          revenueSharePercent: m.revenue_share_percent,
        })),
      };
    } catch (error) {
      logger.error('Failed to get team info:', error);
      return null;
    }
  }

  /**
   * 分配队伍收入
   */
  async distributeTeamRevenue(orderId: string, teamId: string, totalRevenue: number): Promise<void> {
    try {
      // 获取所有成员的分润比例
      const members = await query<{
        user_id: string;
        revenue_share_percent: number;
      }>(
        `SELECT user_id, revenue_share_percent
         FROM team_members
         WHERE team_id = $1 AND status = 'active' AND role IN ('leader', 'member')`,
        [teamId]
      );

      // 验证分润比例总和
      const totalPercent = members.rows.reduce((sum, m) => sum + m.revenue_share_percent, 0);

      if (Math.abs(totalPercent - 100) > 0.01) {
        throw new Error(`分润比例总和必须为100%，当前为${totalPercent}%`);
      }

      // 创建分润记录
      for (const member of members.rows) {
        const memberAmount = (totalRevenue * member.revenue_share_percent) / 100;

        await query(
          `INSERT INTO team_revenue_distributions (
            order_id, team_id, member_id, total_revenue,
            member_share_percent, member_amount, status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [orderId, teamId, member.user_id, totalRevenue, member.revenue_share_percent, memberAmount]
        );
      }

      logger.info(`Team revenue distributed: order ${orderId}, team ${teamId}, total ${totalRevenue}`);
    } catch (error) {
      logger.error('Failed to distribute team revenue:', error);
      throw error;
    }
  }

  /**
   * 生成邀请链接
   */
  async generateInviteLink(teamId: string, creatorId: string, inviteType: 'internal' | 'external'): Promise<{
    inviteCode: string;
    inviteUrl: string;
  }> {
    try {
      // 验证创建者是队长
      const leader = await queryOne(
        `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'leader'`,
        [teamId, creatorId]
      );

      if (!leader) {
        throw new Error('只有队长可以生成邀请链接');
      }

      // 生成邀请码
      const inviteCode = uuidv4().substring(0, 8);

      // 创建邀请记录
      await query(
        `INSERT INTO team_invitations (
          team_id, created_by, invite_code, invite_type, status, max_uses
        ) VALUES ($1, $2, $3, $4, 'active', 1)`,
        [teamId, creatorId, inviteCode, inviteType]
      );

      const inviteUrl = `https://qicheng.app/team/join?code=${inviteCode}`;

      logger.info(`Invite link generated: ${inviteCode} for team ${teamId}`);

      return {
        inviteCode,
        inviteUrl,
      };
    } catch (error) {
      logger.error('Failed to generate invite link:', error);
      throw error;
    }
  }

  /**
   * 通过邀请码加入队伍
   */
  async joinTeamByInviteCode(inviteCode: string, userId: string): Promise<string> {
    try {
      // 获取邀请信息
      const invitation = await queryOne<{
        id: string;
        team_id: string;
        invite_type: string;
        status: string;
        max_uses: number;
        current_uses: number;
        expires_at: Date;
      }>(
        `SELECT id, team_id, invite_type, status, max_uses, current_uses, expires_at
         FROM team_invitations
         WHERE invite_code = $1`,
        [inviteCode]
      );

      if (!invitation) {
        throw new Error('邀请码无效');
      }

      if (invitation.status !== 'active') {
        throw new Error('邀请码已失效');
      }

      if (invitation.current_uses >= invitation.max_uses) {
        throw new Error('邀请码已达到使用上限');
      }

      if (new Date() > new Date(invitation.expires_at)) {
        throw new Error('邀请码已过期');
      }

      // 检查队伍状态
      const team = await queryOne<{
        status: string;
        current_members: number;
        max_members: number;
      }>(
        `SELECT status, current_members, max_members FROM teams WHERE id = $1`,
        [invitation.team_id]
      );

      if (!team) {
        throw new Error('队伍不存在');
      }

      if (team.current_members >= team.max_members) {
        throw new Error('队伍已满');
      }

      // 添加成员
      const memberRole = invitation.invite_type === 'external' ? 'external' : 'member';

      await query(
        `INSERT INTO team_members (team_id, user_id, role, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [invitation.team_id, userId, memberRole]
      );

      // 更新邀请使用次数
      await query(
        `UPDATE team_invitations
         SET current_uses = current_uses + 1,
             used_at = NOW(),
             status = CASE WHEN current_uses + 1 >= max_uses THEN 'used' ELSE 'active' END
         WHERE id = $1`,
        [invitation.id]
      );

      logger.info(`User ${userId} joined team ${invitation.team_id} via invite code ${inviteCode}`);

      return invitation.team_id;
    } catch (error) {
      logger.error('Failed to join team by invite code:', error);
      throw error;
    }
  }

  /**
   * 离开队伍
   */
  async leaveTeam(teamId: string, userId: string): Promise<void> {
    try {
      // 检查是否是队长
      const member = await queryOne<{
        role: string;
      }>(
        `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [teamId, userId]
      );

      if (!member) {
        throw new Error('你不在此队伍中');
      }

      if (member.role === 'leader') {
        throw new Error('队长不能离开队伍，请先转让队长或解散队伍');
      }

      // 更新成员状态
      await query(
        `UPDATE team_members
         SET status = 'left', left_at = NOW()
         WHERE team_id = $1 AND user_id = $2`,
        [teamId, userId]
      );

      logger.info(`User ${userId} left team ${teamId}`);
    } catch (error) {
      logger.error('Failed to leave team:', error);
      throw error;
    }
  }

  /**
   * 解散队伍
   */
  async disbandTeam(teamId: string, leaderId: string): Promise<void> {
    try {
      // 验证队长身份
      const leader = await queryOne(
        `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'leader'`,
        [teamId, leaderId]
      );

      if (!leader) {
        throw new Error('只有队长可以解散队伍');
      }

      // 检查是否有进行中的项目
      const team = await queryOne<{
        status: string;
        project_id: string;
      }>(
        `SELECT status, project_id FROM teams WHERE id = $1`,
        [teamId]
      );

      if (team?.status === 'active' && team.project_id) {
        throw new Error('队伍有进行中的项目，无法解散');
      }

      // 更新队伍状态
      await query(
        `UPDATE teams SET status = 'disbanded', updated_at = NOW() WHERE id = $1`,
        [teamId]
      );

      logger.info(`Team ${teamId} disbanded by ${leaderId}`);
    } catch (error) {
      logger.error('Failed to disband team:', error);
      throw error;
    }
  }
}

export default new TeamService();
