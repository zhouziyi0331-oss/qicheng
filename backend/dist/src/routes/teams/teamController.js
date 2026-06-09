"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeam = createTeam;
exports.getTeamInfo = getTeamInfo;
exports.applyToJoinTeam = applyToJoinTeam;
exports.reviewApplication = reviewApplication;
exports.assignModule = assignModule;
exports.generateInviteLink = generateInviteLink;
exports.joinByInviteCode = joinByInviteCode;
exports.leaveTeam = leaveTeam;
exports.disbandTeam = disbandTeam;
exports.getMyTeams = getMyTeams;
const teamService_1 = __importDefault(require("../../services/teamService"));
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * 组队控制器
 */
// POST /api/v1/teams - 创建队伍
async function createTeam(req, res, next) {
    try {
        const creatorId = req.user.userId;
        const { name, description, maxMembers, requiredSkills, track, projectId } = req.body;
        if (!name || !description || !maxMembers || !track) {
            throw new errorHandler_1.AppError(400, '队伍名称、描述、最大成员数和赛道为必填项', 'MISSING_FIELDS');
        }
        const teamId = await teamService_1.default.createTeam({
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
    }
    catch (err) {
        next(err);
    }
}
// GET /api/v1/teams/:teamId - 获取队伍信息
async function getTeamInfo(req, res, next) {
    try {
        const { teamId } = req.params;
        const teamInfo = await teamService_1.default.getTeamInfo(teamId);
        if (!teamInfo) {
            throw new errorHandler_1.AppError(404, '队伍不存在', 'TEAM_NOT_FOUND');
        }
        res.json({
            success: true,
            data: teamInfo,
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/teams/:teamId/apply - 申请加入队伍
async function applyToJoinTeam(req, res, next) {
    try {
        const { teamId } = req.params;
        const applicantId = req.user.userId;
        const { message } = req.body;
        await teamService_1.default.applyToJoinTeam(teamId, applicantId, message);
        res.json({
            success: true,
            message: '申请已提交，等待队长审核',
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/teams/:teamId/review-application - 审核申请
async function reviewApplication(req, res, next) {
    try {
        const { teamId } = req.params;
        const leaderId = req.user.userId;
        const { applicantId, approved } = req.body;
        if (!applicantId || approved === undefined) {
            throw new errorHandler_1.AppError(400, '申请人ID和审核结果为必填项', 'MISSING_FIELDS');
        }
        await teamService_1.default.reviewTeamApplication(teamId, leaderId, applicantId, approved);
        res.json({
            success: true,
            message: approved ? '申请已通过' : '申请已拒绝',
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/teams/:teamId/assign-module - 分配任务模块
async function assignModule(req, res, next) {
    try {
        const { teamId } = req.params;
        const leaderId = req.user.userId;
        const { memberId, moduleName, moduleDescription, revenueSharePercent } = req.body;
        if (!memberId || !moduleName || revenueSharePercent === undefined) {
            throw new errorHandler_1.AppError(400, '成员ID、模块名称和分润比例为必填项', 'MISSING_FIELDS');
        }
        await teamService_1.default.assignModule(teamId, leaderId, memberId, moduleName, moduleDescription, revenueSharePercent);
        res.json({
            success: true,
            message: '任务模块分配成功',
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/teams/:teamId/generate-invite - 生成邀请链接
async function generateInviteLink(req, res, next) {
    try {
        const { teamId } = req.params;
        const creatorId = req.user.userId;
        const { inviteType } = req.body;
        if (!inviteType || !['internal', 'external'].includes(inviteType)) {
            throw new errorHandler_1.AppError(400, '邀请类型必须为internal或external', 'INVALID_INVITE_TYPE');
        }
        const invite = await teamService_1.default.generateInviteLink(teamId, creatorId, inviteType);
        res.json({
            success: true,
            data: invite,
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/teams/join-by-code - 通过邀请码加入
async function joinByInviteCode(req, res, next) {
    try {
        const userId = req.user.userId;
        const { inviteCode } = req.body;
        if (!inviteCode) {
            throw new errorHandler_1.AppError(400, '邀请码为必填项', 'MISSING_INVITE_CODE');
        }
        const teamId = await teamService_1.default.joinTeamByInviteCode(inviteCode, userId);
        res.json({
            success: true,
            message: '成功加入队伍',
            data: { teamId },
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/teams/:teamId/leave - 离开队伍
async function leaveTeam(req, res, next) {
    try {
        const { teamId } = req.params;
        const userId = req.user.userId;
        await teamService_1.default.leaveTeam(teamId, userId);
        res.json({
            success: true,
            message: '已离开队伍',
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/teams/:teamId/disband - 解散队伍
async function disbandTeam(req, res, next) {
    try {
        const { teamId } = req.params;
        const leaderId = req.user.userId;
        await teamService_1.default.disbandTeam(teamId, leaderId);
        res.json({
            success: true,
            message: '队伍已解散',
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /api/v1/teams/my-teams - 获取我的队伍列表
async function getMyTeams(req, res, next) {
    try {
        const userId = req.user.userId;
        const { query } = require('../../utils/db');
        const teams = await query(`SELECT
        t.*,
        tm.role as my_role,
        tm.assigned_module,
        tm.revenue_share_percent
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND tm.status = 'active'
       ORDER BY t.created_at DESC`, [userId]);
        res.json({
            success: true,
            data: teams.rows,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=teamController.js.map