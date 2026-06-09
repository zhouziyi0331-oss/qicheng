"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invitationMatchingService_1 = require("../services/invitationMatchingService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/matching/tasks/:taskId/students
 * 为任务匹配合适的学生（企业端使用）
 */
router.post('/tasks/:taskId/students', auth_1.authenticate, async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { limit = 10 } = req.body;
        // 验证用户是否有权限（企业用户）
        if (req.user?.role !== 'company') {
            return res.status(403).json({
                success: false,
                message: 'Only company users can match students for tasks',
            });
        }
        const result = await invitationMatchingService_1.invitationMatchingService.matchStudentsForTask(taskId, limit);
        res.json({
            success: true,
            data: invitationMatchingService_1.invitationMatchingService.formatStudentMatchesForFrontend(result),
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/matching/students/:studentId/tasks
 * 为学生匹配合适的任务（学生端使用）
 */
router.post('/students/:studentId/tasks', auth_1.authenticate, async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { limit = 10 } = req.body;
        // 验证用户只能查看自己的匹配结果
        if (req.user?.userId !== studentId && req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own task matches',
            });
        }
        const result = await invitationMatchingService_1.invitationMatchingService.matchTasksForStudent(studentId, limit);
        res.json({
            success: true,
            data: invitationMatchingService_1.invitationMatchingService.formatTaskMatchesForFrontend(result),
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/matching/tasks/:taskId/invite
 * 向匹配的学生发送任务邀请
 */
router.post('/tasks/:taskId/invite', auth_1.authenticate, async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { studentIds, customMessage } = req.body;
        const companyId = req.user?.userId;
        if (req.user?.role !== 'company') {
            return res.status(403).json({
                success: false,
                message: 'Only company users can send invitations',
            });
        }
        if (!companyId) {
            return res.status(401).json({
                success: false,
                message: 'Company ID not found',
            });
        }
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'studentIds array is required',
            });
        }
        // 发送邀请给每个学生
        const invitations = [];
        const errors = [];
        for (const studentId of studentIds) {
            try {
                const invitation = await invitationMatchingService_1.invitationMatchingService.sendInvitation(taskId, studentId, companyId, 0, // matchScore - 可以从匹配结果中获取
                customMessage);
                invitations.push(invitation);
            }
            catch (error) {
                errors.push({
                    studentId,
                    error: error.message,
                });
            }
        }
        res.json({
            success: true,
            data: {
                taskId,
                invitationsSent: invitations.length,
                invitations,
                errors: errors.length > 0 ? errors : undefined,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/matching/invitations
 * 获取学生收到的邀请列表
 */
router.get('/invitations', auth_1.authenticate, async (req, res, next) => {
    try {
        const studentId = req.user?.userId;
        const { status } = req.query;
        if (req.user?.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can view invitations',
            });
        }
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student ID not found',
            });
        }
        const invitations = await invitationMatchingService_1.invitationMatchingService.getStudentInvitations(studentId, status);
        res.json({
            success: true,
            data: {
                invitations,
                total: invitations.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/matching/invitations/:invitationId
 * 学生接受或拒绝邀请
 */
router.put('/invitations/:invitationId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { invitationId } = req.params;
        const { status } = req.body;
        const studentId = req.user?.userId;
        if (req.user?.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can respond to invitations',
            });
        }
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student ID not found',
            });
        }
        if (!status || !['accepted', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "accepted" or "declined"',
            });
        }
        const updatedInvitation = await invitationMatchingService_1.invitationMatchingService.updateInvitationStatus(invitationId, status, studentId);
        res.json({
            success: true,
            data: updatedInvitation,
            message: `Invitation ${status} successfully`,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=invitationMatching.js.map