"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordInteraction = exports.getCompanyPartnerships = exports.getStudentPartnerships = exports.respondToInvitation = exports.invitePartner = exports.updateCollaborationCount = exports.getPartnership = void 0;
const db_1 = __importDefault(require("../utils/db"));
/**
 * 合伙人关系系统 Controller
 *
 * 核心理念：从雇佣关系到合伙人关系的自然演进
 * - 第1次合作：雇佣关系（hired）
 * - 第2次合作：建立信任（trusted）
 * - 第3次合作后：可以邀请成为合伙人（partner）
 */
// 获取企业与学生的合伙关系
const getPartnership = async (req, res) => {
    try {
        const { companyId, studentId } = req.params;
        const result = await db_1.default.query(`SELECT * FROM partnerships
       WHERE company_id = $1 AND student_id = $2`, [companyId, studentId]);
        if (result.rows.length === 0) {
            return res.json({
                exists: false,
                relationship_level: null,
                collaboration_count: 0
            });
        }
        res.json({
            exists: true,
            ...result.rows[0]
        });
    }
    catch (error) {
        console.error('获取合伙关系失败:', error);
        res.status(500).json({ error: '获取合伙关系失败' });
    }
};
exports.getPartnership = getPartnership;
// 更新合作次数（任务完成后自动调用）
const updateCollaborationCount = async (req, res) => {
    try {
        const { companyId, studentId } = req.body;
        // 查找或创建合伙关系
        let partnership = await db_1.default.query(`SELECT * FROM partnerships
       WHERE company_id = $1 AND student_id = $2`, [companyId, studentId]);
        if (partnership.rows.length === 0) {
            // 第一次合作，创建雇佣关系
            partnership = await db_1.default.query(`INSERT INTO partnerships (company_id, student_id, relationship_level, collaboration_count)
         VALUES ($1, $2, 'hired', 1)
         RETURNING *`, [companyId, studentId]);
        }
        else {
            // 增加合作次数
            const newCount = partnership.rows[0].collaboration_count + 1;
            let newLevel = partnership.rows[0].relationship_level;
            // 自动升级关系等级
            if (newCount === 2 && newLevel === 'hired') {
                newLevel = 'trusted';
            }
            partnership = await db_1.default.query(`UPDATE partnerships
         SET collaboration_count = $1, relationship_level = $2
         WHERE company_id = $3 AND student_id = $4
         RETURNING *`, [newCount, newLevel, companyId, studentId]);
        }
        // 记录互动
        await db_1.default.query(`INSERT INTO partnership_interactions (partnership_id, interaction_type, interaction_data)
       VALUES ($1, 'task_completed', $2)`, [partnership.rows[0].id, JSON.stringify({ timestamp: new Date() })]);
        res.json({
            success: true,
            partnership: partnership.rows[0],
            canInvitePartner: partnership.rows[0].collaboration_count >= 3 && partnership.rows[0].relationship_level !== 'partner'
        });
    }
    catch (error) {
        console.error('更新合作次数失败:', error);
        res.status(500).json({ error: '更新合作次数失败' });
    }
};
exports.updateCollaborationCount = updateCollaborationCount;
// 企业发起合伙人邀请
const invitePartner = async (req, res) => {
    try {
        const { companyId, studentId, partnershipTerms } = req.body;
        // 检查合作次数
        const partnership = await db_1.default.query(`SELECT * FROM partnerships
       WHERE company_id = $1 AND student_id = $2`, [companyId, studentId]);
        if (partnership.rows.length === 0 || partnership.rows[0].collaboration_count < 3) {
            return res.status(400).json({ error: '需要至少完成3次合作才能发起合伙人邀请' });
        }
        if (partnership.rows[0].relationship_level === 'partner') {
            return res.status(400).json({ error: '已经是合伙人关系' });
        }
        // 更新为合伙人邀请状态
        const result = await db_1.default.query(`UPDATE partnerships
       SET partnership_terms = $1, invited_at = CURRENT_TIMESTAMP
       WHERE company_id = $2 AND student_id = $3
       RETURNING *`, [JSON.stringify(partnershipTerms), companyId, studentId]);
        // 记录互动
        await db_1.default.query(`INSERT INTO partnership_interactions (partnership_id, interaction_type, interaction_data)
       VALUES ($1, 'partner_invited', $2)`, [result.rows[0].id, JSON.stringify({ terms: partnershipTerms })]);
        res.json({
            success: true,
            message: '合伙人邀请已发送',
            partnership: result.rows[0]
        });
    }
    catch (error) {
        console.error('发起合伙人邀请失败:', error);
        res.status(500).json({ error: '发起合伙人邀请失败' });
    }
};
exports.invitePartner = invitePartner;
// 学生接受/拒绝合伙人邀请
const respondToInvitation = async (req, res) => {
    try {
        const { companyId, studentId, accept } = req.body;
        const partnership = await db_1.default.query(`SELECT * FROM partnerships
       WHERE company_id = $1 AND student_id = $2`, [companyId, studentId]);
        if (partnership.rows.length === 0 || !partnership.rows[0].invited_at) {
            return res.status(400).json({ error: '没有待处理的合伙人邀请' });
        }
        if (accept) {
            // 接受邀请，升级为合伙人
            const result = await db_1.default.query(`UPDATE partnerships
         SET relationship_level = 'partner', accepted_at = CURRENT_TIMESTAMP
         WHERE company_id = $1 AND student_id = $2
         RETURNING *`, [companyId, studentId]);
            // 记录互动
            await db_1.default.query(`INSERT INTO partnership_interactions (partnership_id, interaction_type, interaction_data)
         VALUES ($1, 'partner_accepted', $2)`, [result.rows[0].id, JSON.stringify({ timestamp: new Date() })]);
            res.json({
                success: true,
                message: '恭喜！你们现在是合伙人关系了',
                partnership: result.rows[0]
            });
        }
        else {
            // 拒绝邀请，清除邀请记录
            const result = await db_1.default.query(`UPDATE partnerships
         SET invited_at = NULL, partnership_terms = NULL
         WHERE company_id = $1 AND student_id = $2
         RETURNING *`, [companyId, studentId]);
            res.json({
                success: true,
                message: '已拒绝合伙人邀请',
                partnership: result.rows[0]
            });
        }
    }
    catch (error) {
        console.error('响应合伙人邀请失败:', error);
        res.status(500).json({ error: '响应合伙人邀请失败' });
    }
};
exports.respondToInvitation = respondToInvitation;
// 获取学生的所有合伙关系
const getStudentPartnerships = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await db_1.default.query(`SELECT p.*, u.company_name, u.avatar
       FROM partnerships p
       JOIN users u ON p.company_id = u.id
       WHERE p.student_id = $1
       ORDER BY p.relationship_level DESC, p.collaboration_count DESC`, [studentId]);
        res.json({
            partnerships: result.rows,
            stats: {
                total: result.rows.length,
                partners: result.rows.filter(p => p.relationship_level === 'partner').length,
                trusted: result.rows.filter(p => p.relationship_level === 'trusted').length,
                hired: result.rows.filter(p => p.relationship_level === 'hired').length
            }
        });
    }
    catch (error) {
        console.error('获取学生合伙关系失败:', error);
        res.status(500).json({ error: '获取学生合伙关系失败' });
    }
};
exports.getStudentPartnerships = getStudentPartnerships;
// 获取企业的所有合伙关系
const getCompanyPartnerships = async (req, res) => {
    try {
        const { companyId } = req.params;
        const result = await db_1.default.query(`SELECT p.*, u.nickname, u.avatar, u.level
       FROM partnerships p
       JOIN users u ON p.student_id = u.id
       WHERE p.company_id = $1
       ORDER BY p.relationship_level DESC, p.collaboration_count DESC`, [companyId]);
        res.json({
            partnerships: result.rows,
            stats: {
                total: result.rows.length,
                partners: result.rows.filter(p => p.relationship_level === 'partner').length,
                trusted: result.rows.filter(p => p.relationship_level === 'trusted').length,
                hired: result.rows.filter(p => p.relationship_level === 'hired').length
            }
        });
    }
    catch (error) {
        console.error('获取企业合伙关系失败:', error);
        res.status(500).json({ error: '获取企业合伙关系失败' });
    }
};
exports.getCompanyPartnerships = getCompanyPartnerships;
// 记录合伙人互动（想法分享、会议等）
const recordInteraction = async (req, res) => {
    try {
        const { companyId, studentId, interactionType, interactionData } = req.body;
        // 获取合伙关系ID
        const partnership = await db_1.default.query(`SELECT id FROM partnerships
       WHERE company_id = $1 AND student_id = $2`, [companyId, studentId]);
        if (partnership.rows.length === 0) {
            return res.status(404).json({ error: '合伙关系不存在' });
        }
        // 记录互动
        await db_1.default.query(`INSERT INTO partnership_interactions (partnership_id, interaction_type, interaction_data)
       VALUES ($1, $2, $3)`, [partnership.rows[0].id, interactionType, JSON.stringify(interactionData)]);
        res.json({
            success: true,
            message: '互动记录已保存'
        });
    }
    catch (error) {
        console.error('记录合伙人互动失败:', error);
        res.status(500).json({ error: '记录合伙人互动失败' });
    }
};
exports.recordInteraction = recordInteraction;
//# sourceMappingURL=partnershipController.js.map