"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlliance = createAlliance;
exports.inviteMember = inviteMember;
exports.respondToInvitation = respondToInvitation;
exports.getStudentAlliances = getStudentAlliances;
exports.getAllianceDetail = getAllianceDetail;
exports.createProject = createProject;
exports.getInvitations = getInvitations;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
// ============================================================
// POST /alliances/create
// 创建联合体
// ============================================================
async function createAlliance(req, res, next) {
    try {
        const userId = req.user.userId;
        const { name, description, vision } = req.body;
        if (!name) {
            throw new errorHandler_1.AppError(400, '联合体名称不能为空', 'NAME_REQUIRED');
        }
        // 检查用户是否已经是其他联合体的创始人
        const existingAlliance = await (0, db_1.queryOne)('SELECT id FROM alliances WHERE founder_id = $1 AND status = $2', [userId, 'active']);
        if (existingAlliance) {
            throw new errorHandler_1.AppError(400, '您已经创建了一个联合体', 'ALLIANCE_EXISTS');
        }
        // 创建联合体
        const alliance = await (0, db_1.queryOne)(`INSERT INTO alliances (name, founder_id, description, vision, member_ids, status)
       VALUES ($1, $2, $3, $4, ARRAY[$2]::UUID[], 'active')
       RETURNING id`, [name, userId, description, vision]);
        // 添加创始人为成员
        await (0, db_1.query)(`INSERT INTO alliance_members (alliance_id, student_id, role, joined_at)
       VALUES ($1, $2, 'founder', NOW())`, [alliance?.id, userId]);
        res.json({
            success: true,
            data: {
                allianceId: alliance?.id,
                message: '联合体创建成功',
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /alliances/invite
// 邀请成员加入联合体
// ============================================================
async function inviteMember(req, res, next) {
    try {
        const userId = req.user.userId;
        const { allianceId, inviteeId, invitationMessage } = req.body;
        if (!allianceId || !inviteeId) {
            throw new errorHandler_1.AppError(400, '缺少必要参数', 'MISSING_PARAMS');
        }
        // 检查联合体是否存在
        const alliance = await (0, db_1.queryOne)('SELECT founder_id, status FROM alliances WHERE id = $1', [allianceId]);
        if (!alliance) {
            throw new errorHandler_1.AppError(404, '联合体不存在', 'ALLIANCE_NOT_FOUND');
        }
        if (alliance.status !== 'active') {
            throw new errorHandler_1.AppError(400, '联合体已解散', 'ALLIANCE_DISBANDED');
        }
        // 检查是否有权限邀请（创始人或核心成员）
        const member = await (0, db_1.queryOne)('SELECT role FROM alliance_members WHERE alliance_id = $1 AND student_id = $2', [allianceId, userId]);
        if (!member || (member.role !== 'founder' && member.role !== 'core')) {
            throw new errorHandler_1.AppError(403, '只有创始人或核心成员可以邀请新成员', 'FORBIDDEN');
        }
        // 检查被邀请人是否已经是成员
        const existingMember = await (0, db_1.queryOne)('SELECT id FROM alliance_members WHERE alliance_id = $1 AND student_id = $2', [allianceId, inviteeId]);
        if (existingMember) {
            throw new errorHandler_1.AppError(400, '该用户已经是联合体成员', 'ALREADY_MEMBER');
        }
        // 检查是否已有待处理的邀请
        const existingInvitation = await (0, db_1.queryOne)(`SELECT id FROM alliance_invitations
       WHERE alliance_id = $1 AND invitee_id = $2 AND status = 'pending'`, [allianceId, inviteeId]);
        if (existingInvitation) {
            throw new errorHandler_1.AppError(400, '已有待处理的邀请', 'INVITATION_EXISTS');
        }
        // 创建邀请
        const invitation = await (0, db_1.queryOne)(`INSERT INTO alliance_invitations (alliance_id, inviter_id, invitee_id, invitation_message, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`, [allianceId, userId, inviteeId, invitationMessage]);
        // 创建通知
        await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, content, related_id, created_at)
       VALUES ($1, 'alliance_invite', '联合体邀请', $2, $3, NOW())`, [inviteeId, `您收到了一个联合体邀请`, invitation?.id]).catch(() => {
            // 忽略通知创建失败
        });
        res.json({
            success: true,
            data: {
                invitationId: invitation?.id,
                message: '邀请已发送',
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /alliances/respond
// 响应联合体邀请
// ============================================================
async function respondToInvitation(req, res, next) {
    try {
        const userId = req.user.userId;
        const { invitationId, accept } = req.body;
        if (!invitationId || accept === undefined) {
            throw new errorHandler_1.AppError(400, '缺少必要参数', 'MISSING_PARAMS');
        }
        // 查找邀请
        const invitation = await (0, db_1.queryOne)(`SELECT id, alliance_id, invitee_id, status
       FROM alliance_invitations
       WHERE id = $1`, [invitationId]);
        if (!invitation) {
            throw new errorHandler_1.AppError(404, '邀请不存在', 'INVITATION_NOT_FOUND');
        }
        if (invitation.invitee_id !== userId) {
            throw new errorHandler_1.AppError(403, '无权响应此邀请', 'FORBIDDEN');
        }
        if (invitation.status !== 'pending') {
            throw new errorHandler_1.AppError(400, '邀请已处理', 'INVITATION_PROCESSED');
        }
        if (accept) {
            // 接受邀请
            await (0, db_1.query)(`UPDATE alliance_invitations
         SET status = 'accepted', responded_at = NOW()
         WHERE id = $1`, [invitationId]);
            // 添加为成员
            await (0, db_1.query)(`INSERT INTO alliance_members (alliance_id, student_id, role, joined_at)
         VALUES ($1, $2, 'member', NOW())`, [invitation.alliance_id, userId]);
            // 更新联合体的 member_ids 数组
            await (0, db_1.query)(`UPDATE alliances
         SET member_ids = array_append(member_ids, $1::UUID)
         WHERE id = $2`, [userId, invitation.alliance_id]);
            res.json({
                success: true,
                data: {
                    message: '已加入联合体',
                    allianceId: invitation.alliance_id,
                },
            });
        }
        else {
            // 拒绝邀请
            await (0, db_1.query)(`UPDATE alliance_invitations
         SET status = 'rejected', responded_at = NOW()
         WHERE id = $1`, [invitationId]);
            res.json({
                success: true,
                data: {
                    message: '已拒绝邀请',
                },
            });
        }
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /alliances/student/:studentId
// 获取学生的联合体信息
// ============================================================
async function getStudentAlliances(req, res, next) {
    try {
        const { studentId } = req.params;
        const userId = req.user.userId;
        // 权限检查：只能查看自己的联合体
        if (userId !== studentId && req.user.role !== 'admin') {
            throw new errorHandler_1.AppError(403, '无权查看该学生的联合体', 'FORBIDDEN');
        }
        // 查询学生参与的所有联合体
        const alliances = await (0, db_1.query)(`SELECT a.id, a.name, a.description, a.vision, a.status,
              am.role, am.joined_at,
              u.username as founder_name,
              (SELECT COUNT(*) FROM alliance_members WHERE alliance_id = a.id) as member_count
       FROM alliance_members am
       JOIN alliances a ON am.alliance_id = a.id
       JOIN users u ON a.founder_id = u.id
       WHERE am.student_id = $1
       ORDER BY am.joined_at DESC`, [studentId]);
        res.json({
            success: true,
            data: {
                alliances,
                totalCount: alliances.length,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /alliances/:allianceId
// 获取联合体详情
// ============================================================
async function getAllianceDetail(req, res, next) {
    try {
        const { allianceId } = req.params;
        const userId = req.user.userId;
        // 查询联合体基本信息
        const alliance = await (0, db_1.queryOne)(`SELECT id, name, founder_id, description, vision, status, created_at
       FROM alliances
       WHERE id = $1`, [allianceId]);
        if (!alliance) {
            throw new errorHandler_1.AppError(404, '联合体不存在', 'ALLIANCE_NOT_FOUND');
        }
        // 检查用户是否是成员
        const isMember = await (0, db_1.queryOne)('SELECT id FROM alliance_members WHERE alliance_id = $1 AND student_id = $2', [allianceId, userId]);
        if (!isMember && req.user.role !== 'admin') {
            throw new errorHandler_1.AppError(403, '只有成员可以查看联合体详情', 'FORBIDDEN');
        }
        // 查询成员列表
        const members = await (0, db_1.query)(`SELECT am.id, am.student_id, am.role, am.skills, am.joined_at,
              u.username, u.avatar_url,
              sp.opc_label, u.current_level, u.current_level
       FROM alliance_members am
       JOIN users u ON am.student_id = u.id
       LEFT JOIN users u ON am.student_id = u.id
       WHERE am.alliance_id = $1
       ORDER BY
         CASE am.role
           WHEN 'founder' THEN 1
           WHEN 'core' THEN 2
           WHEN 'member' THEN 3
         END,
         am.joined_at ASC`, [allianceId]);
        // 查询项目列表
        const projects = await (0, db_1.query)(`SELECT id, project_name, project_description, status, created_at
       FROM alliance_projects
       WHERE alliance_id = $1
       ORDER BY created_at DESC`, [allianceId]);
        res.json({
            success: true,
            data: {
                ...alliance,
                members,
                projects,
                memberCount: members.length,
                projectCount: projects.length,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /alliances/project
// 创建联合体项目
// ============================================================
async function createProject(req, res, next) {
    try {
        const userId = req.user.userId;
        const { allianceId, projectName, projectDescription, assignedMembers, revenueShare } = req.body;
        if (!allianceId || !projectName) {
            throw new errorHandler_1.AppError(400, '缺少必要参数', 'MISSING_PARAMS');
        }
        // 检查是否是联合体成员
        const member = await (0, db_1.queryOne)('SELECT role FROM alliance_members WHERE alliance_id = $1 AND student_id = $2', [allianceId, userId]);
        if (!member) {
            throw new errorHandler_1.AppError(403, '只有联合体成员可以创建项目', 'FORBIDDEN');
        }
        // 创建项目
        const project = await (0, db_1.queryOne)(`INSERT INTO alliance_projects
       (alliance_id, project_name, project_description, assigned_members, revenue_share, status)
       VALUES ($1, $2, $3, $4, $5, 'planning')
       RETURNING id`, [allianceId, projectName, projectDescription, JSON.stringify(assignedMembers || []), JSON.stringify(revenueShare || {})]);
        res.json({
            success: true,
            data: {
                projectId: project?.id,
                message: '项目创建成功',
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /alliances/invitations/:studentId
// 获取学生收到的联合体邀请
// ============================================================
async function getInvitations(req, res, next) {
    try {
        const { studentId } = req.params;
        const userId = req.user.userId;
        // 权限检查
        if (userId !== studentId && req.user.role !== 'admin') {
            throw new errorHandler_1.AppError(403, '无权查看该学生的邀请', 'FORBIDDEN');
        }
        const invitations = await (0, db_1.query)(`SELECT ai.id, ai.alliance_id, ai.invitation_message, ai.status, ai.created_at,
              a.name as alliance_name, a.description as alliance_description,
              u.username as inviter_name, u.avatar_url as inviter_avatar
       FROM alliance_invitations ai
       JOIN alliances a ON ai.alliance_id = a.id
       JOIN users u ON ai.inviter_id = u.id
       WHERE ai.invitee_id = $1
       ORDER BY ai.created_at DESC`, [studentId]);
        res.json({
            success: true,
            data: {
                invitations,
                pendingCount: invitations.filter((inv) => inv.status === 'pending').length,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map