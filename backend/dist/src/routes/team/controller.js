"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeam = createTeam;
exports.inviteMember = inviteMember;
exports.getTeamDetail = getTeamDetail;
exports.startTeamTask = startTeamTask;
exports.completeTeamTask = completeTeamTask;
exports.getMyTeams = getMyTeams;
const express_validator_1 = require("express-validator");
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = __importDefault(require("../../utils/logger"));
// ============================================================
// POST /team/create - 创建团队任务
// ============================================================
async function createTeam(req, res, next) {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const userId = req.user.userId;
        const { taskId, maxMembers = 3 } = req.body;
        // 1. 验证任务是否存在且属于该学生
        const assignment = await (0, db_1.queryOne)(`SELECT ta.id, ta.status FROM task_assignments ta
       WHERE ta.task_id = $1 AND ta.student_id = $2 AND ta.status = 'accepted'`, [taskId, userId]);
        if (!assignment) {
            throw new errorHandler_1.AppError(404, '任务不存在或你没有权限创建团队', 'TASK_NOT_FOUND');
        }
        // 2. 检查是否已经创建过团队
        const existingTeam = await (0, db_1.queryOne)('SELECT id FROM team_tasks WHERE task_id = $1 AND deleted_at IS NULL', [taskId]);
        if (existingTeam) {
            throw new errorHandler_1.AppError(400, '该任务已经创建了团队', 'TEAM_EXISTS');
        }
        // 3. 创建团队
        const team = await (0, db_1.withTransaction)(async (client) => {
            // 3a. 创建团队记录
            const teamResult = await client.query(`INSERT INTO team_tasks (task_id, team_leader_id, max_members, current_members, status)
         VALUES ($1, $2, $3, 1, 'recruiting')
         RETURNING id`, [taskId, userId, maxMembers]);
            const teamId = teamResult.rows[0].id;
            // 3b. 添加队长为第一个成员
            await client.query(`INSERT INTO team_members (team_task_id, student_id, role)
         VALUES ($1, $2, 'leader')`, [teamId, userId]);
            return { teamId };
        });
        logger_1.default.info('Team created', { userId, taskId, teamId: team.teamId });
        res.json({
            success: true,
            message: '团队创建成功',
            data: { teamId: team.teamId },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /team/:id/invite - 邀请成员加入团队
// ============================================================
async function inviteMember(req, res, next) {
    try {
        const userId = req.user.userId;
        const { id: teamId } = req.params;
        const { studentId } = req.body;
        // 1. 验证团队是否存在且是队长
        const team = await (0, db_1.queryOne)('SELECT * FROM team_tasks WHERE id = $1 AND deleted_at IS NULL', [teamId]);
        if (!team) {
            throw new errorHandler_1.AppError(404, '团队不存在', 'TEAM_NOT_FOUND');
        }
        if (team.team_leader_id !== userId) {
            throw new errorHandler_1.AppError(403, '只有队长可以邀请成员', 'NOT_TEAM_LEADER');
        }
        if (team.status !== 'recruiting') {
            throw new errorHandler_1.AppError(400, '团队已满或已开始任务', 'TEAM_NOT_RECRUITING');
        }
        if (team.current_members >= team.max_members) {
            throw new errorHandler_1.AppError(400, '团队人数已满', 'TEAM_FULL');
        }
        // 2. 检查被邀请人是否已经在团队中
        const existingMember = await (0, db_1.queryOne)('SELECT id FROM team_members WHERE team_task_id = $1 AND student_id = $2 AND deleted_at IS NULL', [teamId, studentId]);
        if (existingMember) {
            throw new errorHandler_1.AppError(400, '该成员已在团队中', 'MEMBER_EXISTS');
        }
        // 3. 添加成员
        await (0, db_1.withTransaction)(async (client) => {
            await client.query(`INSERT INTO team_members (team_task_id, student_id, role)
         VALUES ($1, $2, 'member')`, [teamId, studentId]);
            await client.query(`UPDATE team_tasks SET current_members = current_members + 1, updated_at = NOW()
         WHERE id = $1`, [teamId]);
            // 如果人数已满，更新状态
            if (team.current_members + 1 >= team.max_members) {
                await client.query(`UPDATE team_tasks SET status = 'full', updated_at = NOW() WHERE id = $1`, [teamId]);
            }
        });
        logger_1.default.info('Member invited', { teamId, studentId });
        res.json({
            success: true,
            message: '成员邀请成功',
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /team/:id - 获取团队详情
// ============================================================
async function getTeamDetail(req, res, next) {
    try {
        const { id: teamId } = req.params;
        const team = await (0, db_1.queryOne)(`SELECT
         tt.*,
         t.title as task_title,
         t.budget_net,
         u.nickname as leader_name
       FROM team_tasks tt
       JOIN tasks t ON tt.task_id = t.id
       JOIN users u ON tt.team_leader_id = u.id
       WHERE tt.id = $1 AND tt.deleted_at IS NULL`, [teamId]);
        if (!team) {
            throw new errorHandler_1.AppError(404, '团队不存在', 'TEAM_NOT_FOUND');
        }
        // 获取成员列表
        const members = await (0, db_1.query)(`SELECT
         tm.id, tm.role, tm.contribution, tm.earnings_share, tm.joined_at,
         u.nickname, u.avatar_url,
         u.current_level, u.current_level, u.track
       FROM team_members tm
       JOIN users u ON tm.student_id = u.id
       LEFT JOIN users u ON u.id = u.id
       WHERE tm.team_task_id = $1 AND tm.deleted_at IS NULL
       ORDER BY tm.role DESC, tm.joined_at ASC`, [teamId]);
        res.json({
            success: true,
            data: {
                team,
                members,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /team/:id/start - 开始团队任务
// ============================================================
async function startTeamTask(req, res, next) {
    try {
        const userId = req.user.userId;
        const { id: teamId } = req.params;
        const team = await (0, db_1.queryOne)('SELECT team_leader_id, status FROM team_tasks WHERE id = $1 AND deleted_at IS NULL', [teamId]);
        if (!team) {
            throw new errorHandler_1.AppError(404, '团队不存在', 'TEAM_NOT_FOUND');
        }
        if (team.team_leader_id !== userId) {
            throw new errorHandler_1.AppError(403, '只有队长可以开始任务', 'NOT_TEAM_LEADER');
        }
        if (team.status === 'in_progress') {
            throw new errorHandler_1.AppError(400, '任务已经开始', 'TASK_ALREADY_STARTED');
        }
        await (0, db_1.query)(`UPDATE team_tasks SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
       WHERE id = $1`, [teamId]);
        logger_1.default.info('Team task started', { teamId });
        res.json({
            success: true,
            message: '团队任务已开始',
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /team/:id/complete - 完成团队任务并分配收益
// ============================================================
async function completeTeamTask(req, res, next) {
    try {
        const userId = req.user.userId;
        const { id: teamId } = req.params;
        const { contributions } = req.body; // { studentId: contribution% }
        // 1. 验证团队和权限
        const team = await (0, db_1.queryOne)(`SELECT tt.*, t.budget_net FROM team_tasks tt
       JOIN tasks t ON tt.task_id = t.id
       WHERE tt.id = $1 AND tt.deleted_at IS NULL`, [teamId]);
        if (!team) {
            throw new errorHandler_1.AppError(404, '团队不存在', 'TEAM_NOT_FOUND');
        }
        if (team.team_leader_id !== userId) {
            throw new errorHandler_1.AppError(403, '只有队长可以完成任务', 'NOT_TEAM_LEADER');
        }
        if (team.status !== 'in_progress') {
            throw new errorHandler_1.AppError(400, '任务未开始或已完成', 'INVALID_STATUS');
        }
        // 2. 验证贡献度总和为100%
        const totalContribution = Object.values(contributions).reduce((sum, val) => sum + val, 0);
        if (Math.abs(totalContribution - 100) > 0.01) {
            throw new errorHandler_1.AppError(400, '贡献度总和必须为100%', 'INVALID_CONTRIBUTION');
        }
        // 3. 分配收益
        await (0, db_1.withTransaction)(async (client) => {
            const taskBudget = team.budget_net;
            for (const [studentId, contribution] of Object.entries(contributions)) {
                const earningsShare = (taskBudget * contribution) / 100;
                // 更新成员贡献度和收益
                await client.query(`UPDATE team_members
           SET contribution = $1, earnings_share = $2
           WHERE team_task_id = $3 AND student_id = $4`, [contribution, earningsShare, teamId, studentId]);
                // 增加学生余额
                await client.query(`UPDATE student_balances
           SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW()
           WHERE user_id = $2`, [earningsShare, studentId]);
                // 创建支付记录
                await client.query(`INSERT INTO payments
           (task_id, student_id, payer, gross_amount, platform_fee, net_amount, status, settled_at)
           VALUES ($1, $2, 'company', $3, 0, $3, 'settled', NOW())`, [team.task_id, studentId, earningsShare]);
            }
            // 更新团队状态
            await client.query(`UPDATE team_tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW()
         WHERE id = $1`, [teamId]);
            // 更新任务状态
            await client.query(`UPDATE tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`, [team.task_id]);
        });
        logger_1.default.info('Team task completed', { teamId, contributions });
        res.json({
            success: true,
            message: '团队任务已完成，收益已分配',
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /team/my - 获取我的团队列表
// ============================================================
async function getMyTeams(req, res, next) {
    try {
        const userId = req.user.userId;
        const teams = await (0, db_1.query)(`SELECT
         tt.*,
         t.title as task_title,
         t.budget_net,
         tm.role as my_role,
         tm.contribution,
         tm.earnings_share
       FROM team_members tm
       JOIN team_tasks tt ON tm.team_task_id = tt.id
       JOIN tasks t ON tt.task_id = t.id
       WHERE tm.student_id = $1 AND tm.deleted_at IS NULL
       ORDER BY tt.created_at DESC`, [userId]);
        res.json({
            success: true,
            data: teams,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map