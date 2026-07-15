"use strict";
/**
 * 任务邀约控制器
 *
 * 处理学生端的邀约相关HTTP请求
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyInvitations = getMyInvitations;
exports.getInvitationDetail = getInvitationDetail;
exports.acceptInvitation = acceptInvitation;
exports.declineInvitation = declineInvitation;
exports.verifyCapability = verifyCapability;
exports.expireOldInvitations = expireOldInvitations;
exports.createInvitation = createInvitation;
exports.batchCreateInvitations = batchCreateInvitations;
const taskInvitationService_1 = require("../services/taskInvitationService");
const logger_1 = __importDefault(require("../utils/logger"));
// ==========================================
// 学生端接口
// ==========================================
/**
 * 获取我的邀约列表
 * GET /api/v1/invitations/my-invitations
 */
async function getMyInvitations(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invitations = await taskInvitationService_1.taskInvitationService.getMyInvitations(userId);
        return res.json({
            success: true,
            data: invitations,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get my invitations', { error, userId: req.user?.userId });
        return res.status(500).json({
            error: 'Failed to get invitations',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取邀约详情
 * GET /api/v1/invitations/:invitationId
 */
async function getInvitationDetail(req, res) {
    try {
        const userId = req.user?.userId;
        const { invitationId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invitation = await taskInvitationService_1.taskInvitationService.getInvitationDetail(invitationId, userId);
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }
        return res.json({
            success: true,
            data: invitation,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get invitation detail', { error, invitationId: req.params.invitationId });
        return res.status(500).json({
            error: 'Failed to get invitation detail',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 接受邀约
 * POST /api/v1/invitations/:invitationId/accept
 */
async function acceptInvitation(req, res) {
    try {
        const userId = req.user?.userId;
        const { invitationId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invitation = await taskInvitationService_1.taskInvitationService.acceptInvitation(invitationId, userId);
        return res.json({
            success: true,
            message: '邀约已接受',
            data: invitation,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to accept invitation', { error, invitationId: req.params.invitationId });
        // 根据错误类型返回不同状态码
        if (error.message.includes('不存在') || error.message.includes('无权限')) {
            return res.status(404).json({
                error: 'Invitation not found',
                message: error.message,
            });
        }
        if (error.message.includes('已过期') || error.message.includes('状态无效') || error.message.includes('已被')) {
            return res.status(400).json({
                error: 'Invalid invitation status',
                message: error.message,
            });
        }
        return res.status(500).json({
            error: 'Failed to accept invitation',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 拒绝邀约
 * POST /api/v1/invitations/:invitationId/decline
 */
async function declineInvitation(req, res) {
    try {
        const userId = req.user?.userId;
        const { invitationId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invitation = await taskInvitationService_1.taskInvitationService.declineInvitation(invitationId, userId);
        return res.json({
            success: true,
            message: '邀约已拒绝',
            data: invitation,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to decline invitation', { error, invitationId: req.params.invitationId });
        if (error.message.includes('不存在') || error.message.includes('无权限')) {
            return res.status(404).json({
                error: 'Invitation not found',
                message: error.message,
            });
        }
        if (error.message.includes('状态无效')) {
            return res.status(400).json({
                error: 'Invalid invitation status',
                message: error.message,
            });
        }
        return res.status(500).json({
            error: 'Failed to decline invitation',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * AI能力核验（接受邀约后的二次确认）
 * POST /api/v1/invitations/:invitationId/verify
 */
async function verifyCapability(req, res) {
    try {
        const userId = req.user?.userId;
        const { invitationId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 获取邀约详情和任务信息
        const invitation = await taskInvitationService_1.taskInvitationService.getInvitationDetail(invitationId, userId);
        if (!invitation) {
            return res.status(404).json({
                success: false,
                error: 'Invitation not found'
            });
        }
        // 获取学生能力数据
        const { query } = await Promise.resolve().then(() => __importStar(require('../utils/db')));
        const studentProfile = await query(`SELECT
        skill_tags,
        project_experience,
        completed_tasks_count,
        level_a,
        level_b
       FROM student_profiles
       WHERE user_id = $1`, [userId]);
        if (studentProfile.length === 0) {
            return res.json({
                success: true,
                data: {
                    passed: true,
                    confidence: 60,
                    matchedSkills: [],
                    weakSkills: [],
                    message: '暂无能力数据，建议谨慎接单'
                }
            });
        }
        const profile = studentProfile[0];
        const studentSkills = profile.skill_tags || [];
        const taskSkills = invitation.task?.required_skills || [];
        // 计算技能匹配度
        const matchedSkills = taskSkills.filter((skill) => studentSkills.some((s) => typeof s === 'string' ? s === skill : s.name === skill));
        const weakSkills = taskSkills.filter((skill) => !matchedSkills.includes(skill));
        // 计算信心指数
        const skillMatchRate = taskSkills.length > 0
            ? (matchedSkills.length / taskSkills.length) * 100
            : 100;
        const experienceBonus = Math.min(profile.completed_tasks_count * 5, 20);
        const levelBonus = (profile.level_a * 10) + (profile.level_b * 2);
        let confidence = Math.round(skillMatchRate * 0.6 +
            experienceBonus * 0.2 +
            levelBonus * 0.2);
        confidence = Math.min(confidence, 95);
        const passed = confidence >= 50;
        return res.json({
            success: true,
            data: {
                passed,
                confidence,
                matchedSkills: matchedSkills.map((skill) => ({
                    name: skill,
                    studentLevel: profile.level_a + profile.level_b / 10,
                    caseCount: profile.project_experience?.filter((exp) => exp.skills?.includes(skill)).length || 0
                })),
                weakSkills: weakSkills.map((skill) => ({
                    name: skill,
                    suggestion: '建议在接单前学习相关技能'
                })),
                message: passed
                    ? `你有${confidence}%的把握完成此项目`
                    : '该项目可能超出当前能力范围，建议积累更多经验后再尝试'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to verify capability', { error, invitationId: req.params.invitationId });
        return res.status(500).json({
            success: false,
            error: 'Failed to verify capability',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 手动触发过期检查（管理员接口）
 * POST /api/v1/invitations/expire-old
 */
async function expireOldInvitations(req, res) {
    try {
        const count = await taskInvitationService_1.taskInvitationService.expireOldInvitations();
        return res.json({
            success: true,
            message: `已过期 ${count} 个邀约`,
            data: { count },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to expire old invitations', { error });
        return res.status(500).json({
            error: 'Failed to expire invitations',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// ==========================================
// 内部接口（供匹配引擎调用）
// ==========================================
/**
 * 创建邀约
 * POST /api/v1/invitations/create
 *
 * 仅供内部服务调用
 */
async function createInvitation(req, res) {
    try {
        const { taskId, studentId, invitationType, invitationReason, matchScore, matchDetails, rank, paidAmount, paymentId, } = req.body;
        if (!taskId || !studentId || !invitationType) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'taskId, studentId, invitationType are required',
            });
        }
        const invitation = await taskInvitationService_1.taskInvitationService.createInvitation({
            taskId,
            studentId,
            invitationType,
            invitationReason,
            matchScore,
            matchDetails,
            rank,
            paidAmount,
            paymentId,
        });
        return res.json({
            success: true,
            data: invitation,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to create invitation', { error, body: req.body });
        return res.status(500).json({
            error: 'Failed to create invitation',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 批量创建邀约
 * POST /api/v1/invitations/batch-create
 *
 * 仅供内部匹配引擎调用
 */
async function batchCreateInvitations(req, res) {
    try {
        const { taskId, students } = req.body;
        if (!taskId || !students || !Array.isArray(students)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'taskId and students array are required',
            });
        }
        const invitations = await taskInvitationService_1.taskInvitationService.createBatchInvitations(taskId, students);
        return res.json({
            success: true,
            message: `已创建 ${invitations.length} 个邀约`,
            data: invitations,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to batch create invitations', { error, body: req.body });
        return res.status(500).json({
            error: 'Failed to batch create invitations',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=invitationController.js.map