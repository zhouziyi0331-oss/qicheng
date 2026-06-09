"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationMatchingService = void 0;
const aiServiceClient_1 = require("./aiServiceClient");
const errorHandler_1 = require("../middleware/errorHandler");
const uuid_1 = require("uuid");
class InvitationMatchingService {
    /**
     * 为任务匹配合适的学生
     */
    async matchStudentsForTask(taskId, limit = 10) {
        try {
            const result = await aiServiceClient_1.aiServiceClient.matchStudentsForTask({
                task_id: taskId,
                limit,
            });
            return result;
        }
        catch (error) {
            console.error('Student matching failed:', error);
            throw new errorHandler_1.AppError(error.response?.status || 500, error.response?.data?.message || 'Failed to match students');
        }
    }
    /**
     * 为学生匹配合适的任务
     */
    async matchTasksForStudent(studentId, limit = 10) {
        try {
            const result = await aiServiceClient_1.aiServiceClient.matchTasksForStudent({
                student_id: studentId,
                limit,
            });
            return result;
        }
        catch (error) {
            console.error('Task matching failed:', error);
            throw new errorHandler_1.AppError(error.response?.status || 500, error.response?.data?.message || 'Failed to match tasks');
        }
    }
    /**
     * 格式化学生匹配结果为前端友好的格式
     */
    formatStudentMatchesForFrontend(response) {
        return {
            taskId: response.task_id,
            matches: response.matches.map(match => ({
                studentId: match.student_id,
                matchScore: match.match_score,
                scoreBreakdown: {
                    opcMatch: match.score_breakdown.opc_match,
                    capabilityComplement: match.score_breakdown.capability_complement,
                    taskExperience: match.score_breakdown.task_experience,
                    activity: match.score_breakdown.activity,
                },
                reasoning: match.reasoning,
                recommendedRole: match.recommended_role,
            })),
            createdAt: response.created_at,
        };
    }
    /**
     * 格式化任务匹配结果为前端友好的格式
     */
    formatTaskMatchesForFrontend(response) {
        return {
            studentId: response.student_id,
            matches: response.matches.map(match => ({
                taskId: match.task_id,
                matchScore: match.match_score,
                scoreBreakdown: {
                    capabilityMatch: match.score_breakdown.capability_match,
                    growthPotential: match.score_breakdown.growth_potential,
                    interestAlignment: match.score_breakdown.interest_alignment,
                    difficultyFit: match.score_breakdown.difficulty_fit,
                },
                reasoning: match.reasoning,
                estimatedSuccessRate: match.estimated_success_rate,
            })),
            createdAt: response.created_at,
        };
    }
    /**
     * 根据匹配分数获取推荐等级
     */
    getRecommendationLevel(score) {
        if (score >= 0.8)
            return 'highly_recommended';
        if (score >= 0.6)
            return 'recommended';
        if (score >= 0.4)
            return 'suitable';
        return 'not_recommended';
    }
    /**
     * 发送任务邀请
     */
    async sendInvitation(taskId, studentId, companyId, matchScore, customMessage) {
        try {
            const { pool } = await Promise.resolve().then(() => __importStar(require('../utils/db')));
            // 检查是否已存在待处理的邀请
            const existingResult = await pool.query('SELECT id FROM invitations WHERE task_id = $1 AND student_id = $2 AND status = $3', [taskId, studentId, 'pending']);
            if (existingResult.rows.length > 0) {
                throw new errorHandler_1.AppError(400, 'An invitation is already pending for this student');
            }
            // 创建邀请记录
            const invitationId = (0, uuid_1.v4)();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
            const result = await pool.query(`INSERT INTO invitations (id, task_id, student_id, company_id, status, custom_message, match_score, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`, [invitationId, taskId, studentId, companyId, 'pending', customMessage, matchScore, expiresAt]);
            const invitation = result.rows[0];
            // TODO: 发送通知给学生（邮件、站内信等）
            // await notificationService.sendInvitationNotification(studentId, invitation);
            return {
                invitationId: invitation.id,
                taskId: invitation.task_id,
                studentId: invitation.student_id,
                companyId: invitation.company_id,
                status: invitation.status,
                customMessage: invitation.custom_message,
                matchScore: invitation.match_score,
                createdAt: invitation.created_at,
                expiresAt: invitation.expires_at,
            };
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            console.error('Failed to send invitation:', error);
            throw new errorHandler_1.AppError(500, 'Failed to send invitation');
        }
    }
    /**
     * 获取学生收到的邀请列表
     */
    async getStudentInvitations(studentId, status) {
        try {
            const { pool } = await Promise.resolve().then(() => __importStar(require('../utils/db')));
            let query = 'SELECT * FROM invitations WHERE student_id = $1';
            const params = [studentId];
            if (status) {
                query += ' AND status = $2';
                params.push(status);
            }
            query += ' ORDER BY created_at DESC';
            const result = await pool.query(query, params);
            return result.rows.map((inv) => ({
                invitationId: inv.id,
                taskId: inv.task_id,
                studentId: inv.student_id,
                companyId: inv.company_id,
                status: inv.status,
                customMessage: inv.custom_message,
                matchScore: inv.match_score,
                createdAt: inv.created_at,
                expiresAt: inv.expires_at,
                respondedAt: inv.responded_at,
            }));
        }
        catch (error) {
            console.error('Failed to get student invitations:', error);
            throw new errorHandler_1.AppError(500, 'Failed to get student invitations');
        }
    }
    /**
     * 更新邀请状态
     */
    async updateInvitationStatus(invitationId, status, studentId) {
        try {
            const { pool } = await Promise.resolve().then(() => __importStar(require('../utils/db')));
            // 获取邀请
            const invitationResult = await pool.query('SELECT * FROM invitations WHERE id = $1', [invitationId]);
            if (invitationResult.rows.length === 0) {
                throw new errorHandler_1.AppError(404, 'Invitation not found');
            }
            const invitation = invitationResult.rows[0];
            // 验证学生只能更新自己的邀请
            if (invitation.student_id !== studentId) {
                throw new errorHandler_1.AppError(403, 'You can only update your own invitations');
            }
            // 检查邀请是否已过期
            if (new Date() > new Date(invitation.expires_at)) {
                await pool.query('UPDATE invitations SET status = $1 WHERE id = $2', ['expired', invitationId]);
                throw new errorHandler_1.AppError(400, 'Invitation has expired');
            }
            // 检查邀请是否已处理
            if (invitation.status !== 'pending') {
                throw new errorHandler_1.AppError(400, `Invitation is already ${invitation.status}`);
            }
            // 更新邀请状态
            const updateResult = await pool.query('UPDATE invitations SET status = $1, responded_at = NOW() WHERE id = $2 RETURNING *', [status, invitationId]);
            const updatedInvitation = updateResult.rows[0];
            return {
                invitationId: updatedInvitation.id,
                taskId: updatedInvitation.task_id,
                studentId: updatedInvitation.student_id,
                companyId: updatedInvitation.company_id,
                status: updatedInvitation.status,
                respondedAt: updatedInvitation.responded_at,
            };
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            console.error('Failed to update invitation status:', error);
            throw new errorHandler_1.AppError(500, 'Failed to update invitation status');
        }
    }
}
exports.invitationMatchingService = new InvitationMatchingService();
//# sourceMappingURL=invitationMatchingService.js.map