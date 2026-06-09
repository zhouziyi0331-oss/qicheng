import { Request, Response, NextFunction } from 'express';
import teamService from '../../services/teamService';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

/**
 * 组队控制器
 */

// POST /api/v1/teams - 创建队伍
export async function createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const creatorId = req.user!.userId;
    const { name, description, maxMembers, requiredSkills, track, projectId } = req.body;

    if (!name || !description || !maxMembers || !track) {
      throw new AppError(400, '队伍名称、描述、最大成员数和赛道为必填项', 'MISSING_FIELDS');
    }

    const teamId = await teamService.createTeam({
      creatorId,
      name,
      description,
      maxMembers,
      requiredSkills: requiredSkills || [],
      track,
      projectId,
    });

    res.status(201).json({
      success: true,
      message: '队伍创建成功',
      data: { teamId },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/teams/:teamId - 获取队伍信息
export async function getTeamInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;

    const teamInfo = await teamService.getTeamInfo(teamId);

    if (!teamInfo) {
      throw new AppError(404, '队伍不存在', 'TEAM_NOT_FOUND');
    }

    res.json({
      success: true,
      data: teamInfo,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/teams/:teamId/apply - 申请加入队伍
export async function applyToJoinTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    const applicantId = req.user!.userId;
    const { message } = req.body;

    await teamService.applyToJoinTeam(teamId, applicantId, message);

    res.json({
      success: true,
      message: '申请已提交，等待队长审核',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/teams/:teamId/review-application - 审核申请
export async function reviewApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    const leaderId = req.user!.userId;
    const { applicantId, approved } = req.body;

    if (!applicantId || approved === undefined) {
      throw new AppError(400, '申请人ID和审核结果为必填项', 'MISSING_FIELDS');
    }

    await teamService.reviewTeamApplication(teamId, leaderId, applicantId, approved);

    res.json({
      success: true,
      message: approved ? '申请已通过' : '申请已拒绝',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/teams/:teamId/assign-module - 分配任务模块
export async function assignModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    const leaderId = req.user!.userId;
    const { memberId, moduleName, moduleDescription, revenueSharePercent } = req.body;

    if (!memberId || !moduleName || revenueSharePercent === undefined) {
      throw new AppError(400, '成员ID、模块名称和分润比例为必填项', 'MISSING_FIELDS');
    }

    await teamService.assignModule(
      teamId,
      leaderId,
      memberId,
      moduleName,
      moduleDescription,
      revenueSharePercent
    );

    res.json({
      success: true,
      message: '任务模块分配成功',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/teams/:teamId/generate-invite - 生成邀请链接
export async function generateInviteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    const creatorId = req.user!.userId;
    const { inviteType } = req.body;

    if (!inviteType || !['internal', 'external'].includes(inviteType)) {
      throw new AppError(400, '邀请类型必须为internal或external', 'INVALID_INVITE_TYPE');
    }

    const invite = await teamService.generateInviteLink(teamId, creatorId, inviteType);

    res.json({
      success: true,
      data: invite,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/teams/join-by-code - 通过邀请码加入
export async function joinByInviteCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      throw new AppError(400, '邀请码为必填项', 'MISSING_INVITE_CODE');
    }

    const teamId = await teamService.joinTeamByInviteCode(inviteCode, userId);

    res.json({
      success: true,
      message: '成功加入队伍',
      data: { teamId },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/teams/:teamId/leave - 离开队伍
export async function leaveTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    const userId = req.user!.userId;

    await teamService.leaveTeam(teamId, userId);

    res.json({
      success: true,
      message: '已离开队伍',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/teams/:teamId/disband - 解散队伍
export async function disbandTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    const leaderId = req.user!.userId;

    await teamService.disbandTeam(teamId, leaderId);

    res.json({
      success: true,
      message: '队伍已解散',
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/teams/my-teams - 获取我的队伍列表
export async function getMyTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const { query } = require('../../utils/db');
    const teams = await query(
      `SELECT
        t.*,
        tm.role as my_role,
        tm.assigned_module,
        tm.revenue_share_percent
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND tm.status = 'active'
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: teams.rows,
    });
  } catch (err) {
    next(err);
  }
}
