"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartnership = getPartnership;
exports.updateCollaborationCount = updateCollaborationCount;
exports.invitePartner = invitePartner;
exports.respondToInvitation = respondToInvitation;
exports.getStudentPartnerships = getStudentPartnerships;
exports.getCompanyPartnerships = getCompanyPartnerships;
exports.recordInteraction = recordInteraction;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
// ============================================================
// GET /partnerships/:companyId/:studentId
// 获取企业与学生的合伙关系
// ============================================================
async function getPartnership(req, res, next) {
    try {
        const { companyId, studentId } = req.params;
        const userId = req.user.userId;
        // 权限检查：只有关系双方或管理员可以查看
        if (userId !== companyId && userId !== studentId && req.user.role !== 'admin') {
            throw new errorHandler_1.AppError(403, '无权查看该合伙关系', 'FORBIDDEN');
        }
        const partnership = await (0, db_1.queryOne)(`SELECT id, company_id, student_id, relationship_level, collaboration_count,
              partnership_terms, invited_at, accepted_at, status, created_at, updated_at
       FROM partnerships
       WHERE company_id = $1 AND student_id = $2`, [companyId, studentId]);
        if (!partnership) {
            throw new errorHandler_1.AppError(404, '合伙关系不存在', 'PARTNERSHIP_NOT_FOUND');
        }
        // 获取互动记录数量
        const interactionCount = await (0, db_1.queryOne)(`SELECT COUNT(*) as count
       FROM partnership_interactions
       WHERE partnership_id = $1`, [partnership.id]);
        res.json({
            success: true,
            data: {
                ...partnership,
                interactionCount: interactionCount?.count || 0,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /partnerships/update-count
// 更新合作次数
// ============================================================
async function updateCollaborationCount(req, res, next) {
    try {
        const { companyId, studentId } = req.body;
        const userId = req.user.userId;
        // 权限检查：只有企业方可以更新
        if (userId !== companyId && req.user.role !== 'admin') {
            throw new errorHandler_1.AppError(403, '无权更新合作次数', 'FORBIDDEN');
        }
        // 检查合伙关系是否存在
        const partnership = await (0, db_1.queryOne)('SELECT id, collaboration_count FROM partnerships WHERE company_id = $1 AND student_id = $2', [companyId, studentId]);
        if (!partnership) {
            throw new errorHandler_1.AppError(404, '合伙关系不存在', 'PARTNERSHIP_NOT_FOUND');
        }
        // 更新合作次数
        const newCount = partnership.collaboration_count + 1;
        await (0, db_1.query)(`UPDATE partnerships
       SET collaboration_count = $1
       WHERE id = $2`, [newCount, partnership.id]);
        // 根据合作次数自动升级关系等级
        let newLevel = 'hired';
        if (newCount >= 10) {
            newLevel = 'partner';
        }
        else if (newCount >= 3) {
            newLevel = 'trusted';
        }
        await (0, db_1.query)('UPDATE partnerships SET relationship_level = $1 WHERE id = $2', [newLevel, partnership.id]);
        res.json({
            success: true,
            data: {
                collaborationCount: newCount,
                relationshipLevel: newLevel,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /partnerships/invite
// 企业邀请学生成为合伙人
// ============================================================
async function invitePartner(req, res, next) {
    try {
        const { companyId, studentId, partnershipTerms } = req.body;
        const userId = req.user.userId;
        // 权限检查：只有企业方可以邀请
        if (userId !== companyId || req.user.role !== 'company') {
            throw new errorHandler_1.AppError(403, '只有企业可以发起合伙邀请', 'FORBIDDEN');
        }
        // 检查学生是否存在
        const student = await (0, db_1.queryOne)('SELECT id, role FROM users WHERE id = $1', [studentId]);
        if (!student || student.role !== 'student') {
            throw new errorHandler_1.AppError(404, '学生不存在', 'STUDENT_NOT_FOUND');
        }
        // 检查是否已存在合伙关系
        const existing = await (0, db_1.queryOne)('SELECT id FROM partnerships WHERE company_id = $1 AND student_id = $2', [companyId, studentId]);
        if (existing) {
            throw new errorHandler_1.AppError(400, '已存在合伙关系', 'PARTNERSHIP_EXISTS');
        }
        // 创建合伙邀请
        const partnership = await (0, db_1.queryOne)(`INSERT INTO partnerships (company_id, student_id, relationship_level, partnership_terms, invited_at, status)
       VALUES ($1, $2, 'partner', $3, NOW(), 'pending')
       RETURNING id`, [companyId, studentId, JSON.stringify(partnershipTerms)]);
        // 创建通知（如果通知系统存在）
        await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, content, related_id, created_at)
       VALUES ($1, 'partnership_invite', '合伙人邀请', '您收到了一个合伙人邀请', $2, NOW())`, [studentId, partnership?.id]).catch(() => {
            // 忽略通知创建失败
        });
        res.json({
            success: true,
            data: {
                partnershipId: partnership?.id,
                message: '合伙邀请已发送',
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /partnerships/respond
// 学生响应合伙邀请
// ============================================================
async function respondToInvitation(req, res, next) {
    try {
        const { companyId, studentId, accept } = req.body;
        const userId = req.user.userId;
        // 权限检查：只有学生本人可以响应
        if (userId !== studentId || req.user.role !== 'student') {
            throw new errorHandler_1.AppError(403, '只有学生本人可以响应邀请', 'FORBIDDEN');
        }
        // 查找待处理的邀请
        const partnership = await (0, db_1.queryOne)(`SELECT id, status FROM partnerships
       WHERE company_id = $1 AND student_id = $2 AND status = 'pending'`, [companyId, studentId]);
        if (!partnership) {
            throw new errorHandler_1.AppError(404, '未找到待处理的邀请', 'INVITATION_NOT_FOUND');
        }
        if (accept) {
            // 接受邀请
            await (0, db_1.query)(`UPDATE partnerships
         SET status = 'active', accepted_at = NOW()
         WHERE id = $1`, [partnership.id]);
            res.json({
                success: true,
                data: {
                    message: '已接受合伙邀请',
                    status: 'active',
                },
            });
        }
        else {
            // 拒绝邀请，删除记录
            await (0, db_1.query)('DELETE FROM partnerships WHERE id = $1', [partnership.id]);
            res.json({
                success: true,
                data: {
                    message: '已拒绝合伙邀请',
                    status: 'rejected',
                },
            });
        }
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /partnerships/student/:studentId
// 获取学生的所有合伙关系
// ============================================================
async function getStudentPartnerships(req, res, next) {
    try {
        const { studentId } = req.params;
        const userId = req.user.userId;
        // 权限检查：只有学生本人或管理员可以查看
        if (userId !== studentId && req.user.role !== 'admin') {
            throw new errorHandler_1.AppError(403, '无权查看该学生的合伙关系', 'FORBIDDEN');
        }
        const partnerships = await (0, db_1.query)(`SELECT p.id, p.company_id, p.relationship_level, p.collaboration_count,
              p.partnership_terms, p.status, p.created_at, p.accepted_at,
              u.username as company_name, u.avatar_url as company_avatar
       FROM partnerships p
       JOIN users u ON p.company_id = u.id
       WHERE p.student_id = $1 AND p.status = 'active'
       ORDER BY p.relationship_level DESC, p.collaboration_count DESC`, [studentId]);
        res.json({
            success: true,
            data: {
                partnerships,
                totalCount: partnerships.length,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /partnerships/company/:companyId
// 获取企业的所有合伙关系
// ============================================================
async function getCompanyPartnerships(req, res, next) {
    try {
        const { companyId } = req.params;
        const userId = req.user.userId;
        // 权限检查：只有企业本人或管理员可以查看
        if (userId !== companyId && req.user.role !== 'admin') {
            throw new errorHandler_1.AppError(403, '无权查看该企业的合伙关系', 'FORBIDDEN');
        }
        const partnerships = await (0, db_1.query)(`SELECT p.id, p.student_id, p.relationship_level, p.collaboration_count,
              p.partnership_terms, p.status, p.created_at, p.accepted_at,
              u.username as student_name, u.avatar_url as student_avatar,
              sp.opc_label, u.current_level, u.current_level
       FROM partnerships p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.company_id = $1 AND p.status = 'active'
       ORDER BY p.relationship_level DESC, p.collaboration_count DESC`, [companyId]);
        // 按关系等级分组
        const grouped = {
            partners: partnerships.filter((p) => p.relationship_level === 'partner'),
            trusted: partnerships.filter((p) => p.relationship_level === 'trusted'),
            hired: partnerships.filter((p) => p.relationship_level === 'hired'),
        };
        res.json({
            success: true,
            data: {
                partnerships,
                grouped,
                totalCount: partnerships.length,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /partnerships/interaction
// 记录合伙人互动
// ============================================================
async function recordInteraction(req, res, next) {
    try {
        const { companyId, studentId, interactionType, interactionData } = req.body;
        const userId = req.user.userId;
        // 权限检查：只有关系双方可以记录互动
        if (userId !== companyId && userId !== studentId) {
            throw new errorHandler_1.AppError(403, '无权记录该互动', 'FORBIDDEN');
        }
        // 查找合伙关系
        const partnership = await (0, db_1.queryOne)('SELECT id FROM partnerships WHERE company_id = $1 AND student_id = $2 AND status = $3', [companyId, studentId, 'active']);
        if (!partnership) {
            throw new errorHandler_1.AppError(404, '合伙关系不存在或未激活', 'PARTNERSHIP_NOT_FOUND');
        }
        // 记录互动
        const interaction = await (0, db_1.queryOne)(`INSERT INTO partnership_interactions (partnership_id, interaction_type, interaction_data, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`, [partnership.id, interactionType, JSON.stringify(interactionData)]);
        res.json({
            success: true,
            data: {
                interactionId: interaction?.id,
                message: '互动记录已保存',
            },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map