"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const teamService_1 = __importDefault(require("../services/teamService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 创建队伍（仅Lv.6可用）
 * POST /api/v1/teams
 * Body: { name, taskId?, maxMembers, requiredSkills, description, track }
 */
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const creatorId = req.user.userId;
        const { name, taskId, maxMembers, requiredSkills, description, track } = req.body;
        if (!name || !maxMembers || !description || !track) {
            return res.status(400).json({
                success: false,
                error: 'name, maxMembers, description, and track are required',
            });
        }
        const teamId = await teamService_1.default.createTeam({
            creatorId,
            name,
            taskId,
            maxMembers,
            requiredSkills: requiredSkills || [],
            description,
            track,
        });
        logger_1.default.info('Team created via API', { teamId, creatorId, name });
        res.json({
            success: true,
            data: { teamId },
            message: '队伍创建成功',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取队伍详情
 * GET /api/v1/teams/:id
 */
router.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const team = await teamService_1.default.getTeamDetails(id);
        res.json({
            success: true,
            data: team,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 申请加入队伍（Lv.5+可用）
 * POST /api/v1/teams/:id/apply
 * Body: { message? }
 */
router.post('/:id/apply', auth_1.authenticate, async (req, res, next) => {
    try {
        const teamId = req.params.id;
        const applicantId = req.user.userId;
        const { message } = req.body;
        await teamService_1.default.applyToTeam({
            teamId,
            applicantId,
            message,
        });
        logger_1.default.info('Team application submitted via API', { teamId, applicantId });
        res.json({
            success: true,
            message: '申请已提交，等待队长审核',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 审核入队申请（仅队长可用）
 * POST /api/v1/teams/:id/review-application
 * Body: { applicationId, approved, assignedModule? }
 */
router.post('/:id/review-application', auth_1.authenticate, async (req, res, next) => {
    try {
        const teamId = req.params.id;
        const reviewerId = req.user.userId;
        const { applicationId, approved, assignedModule } = req.body;
        if (!applicationId || typeof approved !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'applicationId and approved are required',
            });
        }
        await teamService_1.default.reviewTeamApplication({
            applicationId,
            teamId,
            reviewerId,
            approved,
            assignedModule,
        });
        logger_1.default.info('Team application reviewed via API', {
            teamId,
            applicationId,
            approved,
            reviewerId,
        });
        res.json({
            success: true,
            message: approved ? '申请已通过' : '申请已拒绝',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 分配任务模块
 * POST /api/v1/teams/:id/assign-module
 * Body: { memberId, moduleName, moduleDescription }
 */
router.post('/:id/assign-module', auth_1.authenticate, async (req, res, next) => {
    try {
        const teamId = req.params.id;
        const { memberId, moduleName, moduleDescription } = req.body;
        if (!memberId || !moduleName) {
            return res.status(400).json({
                success: false,
                error: 'memberId and moduleName are required',
            });
        }
        await teamService_1.default.assignModule({
            teamId,
            memberId,
            moduleName,
            moduleDescription,
        });
        logger_1.default.info('Module assigned via API', { teamId, memberId, moduleName });
        res.json({
            success: true,
            message: '模块分配成功',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 生成外部成员邀请链接
 * GET /api/v1/teams/:id/invite-link
 */
router.get('/:id/invite-link', auth_1.authenticate, async (req, res, next) => {
    try {
        const teamId = req.params.id;
        const creatorId = req.user.userId;
        const inviteToken = await teamService_1.default.generateExternalInvite(teamId, creatorId);
        res.json({
            success: true,
            data: {
                inviteToken,
                inviteUrl: `${process.env.FRONTEND_URL}/teams/join/${inviteToken}`,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取队伍列表（用于社区招募）
 * GET /api/v1/teams
 * Query: track?, requiredSkills?, limit?, offset?
 */
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { track, requiredSkills, limit, offset } = req.query;
        const teams = await teamService_1.default.getRecruitingTeams({
            track: track,
            requiredSkills: requiredSkills ? requiredSkills.split(',') : undefined,
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0,
        });
        res.json({
            success: true,
            data: teams,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=teamRoutes.js.map