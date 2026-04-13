"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingInvitations = exports.createAllianceProject = exports.getAllianceDetail = exports.getStudentAlliances = exports.respondToInvitation = exports.inviteMember = exports.createAlliance = void 0;
const db_1 = __importDefault(require("../utils/db"));
/**
 * 联合体组建 Controller
 *
 * 核心理念：孵化计划学生可以组建联合体，一起接大项目
 * - 创始人发起联合体
 * - 邀请其他孵化学生加入
 * - 一起接项目，分配收益
 */
// 创建联合体
const createAlliance = async (req, res) => {
    try {
        const { founderId, name, description, vision } = req.body;
        // 检查是否在孵化计划中
        const incubation = await db_1.default.query(`SELECT * FROM opc_incubation WHERE student_id = $1 AND status = 'incubating'`, [founderId]);
        if (incubation.rows.length === 0) {
            return res.status(400).json({ error: '只有孵化计划学生可以创建联合体' });
        }
        // 创建联合体
        const alliance = await db_1.default.query(`INSERT INTO alliances (name, founder_id, description, vision, member_ids)
       VALUES ($1, $2, $3, $4, ARRAY[$2])
       RETURNING *`, [name, founderId, description, vision]);
        // 添加创始人为成员
        await db_1.default.query(`INSERT INTO alliance_members (alliance_id, student_id, role)
       VALUES ($1, $2, 'founder')`, [alliance.rows[0].id, founderId]);
        res.json({
            success: true,
            message: '联合体创建成功',
            alliance: alliance.rows[0]
        });
    }
    catch (error) {
        console.error('创建联合体失败:', error);
        res.status(500).json({ error: '创建联合体失败' });
    }
};
exports.createAlliance = createAlliance;
// 邀请成员加入联合体
const inviteMember = async (req, res) => {
    try {
        const { allianceId, inviterId, inviteeId, invitationMessage } = req.body;
        // 检查被邀请人是否在孵化计划中
        const incubation = await db_1.default.query(`SELECT * FROM opc_incubation WHERE student_id = $1 AND status = 'incubating'`, [inviteeId]);
        if (incubation.rows.length === 0) {
            return res.status(400).json({ error: '只能邀请孵化计划学生' });
        }
        // 检查是否已经是成员
        const existing = await db_1.default.query(`SELECT * FROM alliance_members WHERE alliance_id = $1 AND student_id = $2`, [allianceId, inviteeId]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: '该学生已经是成员' });
        }
        // 创建邀请
        const invitation = await db_1.default.query(`INSERT INTO alliance_invitations (alliance_id, inviter_id, invitee_id, invitation_message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [allianceId, inviterId, inviteeId, invitationMessage]);
        res.json({
            success: true,
            message: '邀请已发送',
            invitation: invitation.rows[0]
        });
    }
    catch (error) {
        console.error('邀请成员失败:', error);
        res.status(500).json({ error: '邀请成员失败' });
    }
};
exports.inviteMember = inviteMember;
// 响应联合体邀请
const respondToInvitation = async (req, res) => {
    try {
        const { invitationId, accept } = req.body;
        const invitation = await db_1.default.query(`SELECT * FROM alliance_invitations WHERE id = $1 AND status = 'pending'`, [invitationId]);
        if (invitation.rows.length === 0) {
            return res.status(404).json({ error: '邀请不存在或已处理' });
        }
        if (accept) {
            // 接受邀请
            await db_1.default.query(`UPDATE alliance_invitations
         SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [invitationId]);
            // 添加为成员
            await db_1.default.query(`INSERT INTO alliance_members (alliance_id, student_id, role)
         VALUES ($1, $2, 'member')`, [invitation.rows[0].alliance_id, invitation.rows[0].invitee_id]);
            // 更新联合体成员列表
            await db_1.default.query(`UPDATE alliances
         SET member_ids = array_append(member_ids, $1)
         WHERE id = $2`, [invitation.rows[0].invitee_id, invitation.rows[0].alliance_id]);
            res.json({
                success: true,
                message: '已加入联合体'
            });
        }
        else {
            // 拒绝邀请
            await db_1.default.query(`UPDATE alliance_invitations
         SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [invitationId]);
            res.json({
                success: true,
                message: '已拒绝邀请'
            });
        }
    }
    catch (error) {
        console.error('响应邀请失败:', error);
        res.status(500).json({ error: '响应邀请失败' });
    }
};
exports.respondToInvitation = respondToInvitation;
// 获取学生的联合体
const getStudentAlliances = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await db_1.default.query(`SELECT a.*, am.role
       FROM alliances a
       JOIN alliance_members am ON a.id = am.alliance_id
       WHERE am.student_id = $1 AND a.status = 'active'
       ORDER BY a.created_at DESC`, [studentId]);
        res.json({
            alliances: result.rows
        });
    }
    catch (error) {
        console.error('获取联合体失败:', error);
        res.status(500).json({ error: '获取联合体失败' });
    }
};
exports.getStudentAlliances = getStudentAlliances;
// 获取联合体详情
const getAllianceDetail = async (req, res) => {
    try {
        const { allianceId } = req.params;
        // 获取联合体信息
        const alliance = await db_1.default.query(`SELECT * FROM alliances WHERE id = $1`, [allianceId]);
        if (alliance.rows.length === 0) {
            return res.status(404).json({ error: '联合体不存在' });
        }
        // 获取成员列表
        const members = await db_1.default.query(`SELECT am.*, u.nickname, u.avatar, u.level
       FROM alliance_members am
       JOIN users u ON am.student_id = u.id
       WHERE am.alliance_id = $1
       ORDER BY
         CASE am.role
           WHEN 'founder' THEN 1
           WHEN 'core' THEN 2
           WHEN 'member' THEN 3
         END`, [allianceId]);
        // 获取项目列表
        const projects = await db_1.default.query(`SELECT * FROM alliance_projects
       WHERE alliance_id = $1
       ORDER BY created_at DESC`, [allianceId]);
        res.json({
            alliance: alliance.rows[0],
            members: members.rows,
            projects: projects.rows
        });
    }
    catch (error) {
        console.error('获取联合体详情失败:', error);
        res.status(500).json({ error: '获取联合体详情失败' });
    }
};
exports.getAllianceDetail = getAllianceDetail;
// 创建联合体项目
const createAllianceProject = async (req, res) => {
    try {
        const { allianceId, projectName, projectDescription, assignedMembers, revenueShare } = req.body;
        const result = await db_1.default.query(`INSERT INTO alliance_projects
       (alliance_id, project_name, project_description, assigned_members, revenue_share)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [allianceId, projectName, projectDescription, assignedMembers, JSON.stringify(revenueShare)]);
        res.json({
            success: true,
            message: '项目创建成功',
            project: result.rows[0]
        });
    }
    catch (error) {
        console.error('创建项目失败:', error);
        res.status(500).json({ error: '创建项目失败' });
    }
};
exports.createAllianceProject = createAllianceProject;
// 获取学生的待处理邀请
const getPendingInvitations = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await db_1.default.query(`SELECT i.*, a.name as alliance_name, u.nickname as inviter_name
       FROM alliance_invitations i
       JOIN alliances a ON i.alliance_id = a.id
       JOIN users u ON i.inviter_id = u.id
       WHERE i.invitee_id = $1 AND i.status = 'pending'
       ORDER BY i.created_at DESC`, [studentId]);
        res.json({
            invitations: result.rows
        });
    }
    catch (error) {
        console.error('获取邀请失败:', error);
        res.status(500).json({ error: '获取邀请失败' });
    }
};
exports.getPendingInvitations = getPendingInvitations;
//# sourceMappingURL=allianceController.js.map