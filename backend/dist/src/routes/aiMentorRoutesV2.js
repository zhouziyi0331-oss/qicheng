"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../../utils/logger"));
const aiMentorServiceV2_1 = __importDefault(require("../services/aiMentorServiceV2"));
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
/**
 * 发送消息给AI导师（通用接口）
 * POST /api/v1/ai-mentor/message
 */
router.post('/message', auth_1.authenticate, [
    (0, express_validator_1.body)('message').notEmpty().withMessage('消息不能为空'),
    (0, express_validator_1.body)('taskId').optional().isUUID().withMessage('taskId必须是有效的UUID')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const userId = req.user.userId;
        const { message, taskId } = req.body;
        // 检测是否包含"卡住"关键词，自动触发T-02
        const isStuckMessage = /卡住|不知道|不会|怎么办|困住|不懂/.test(message);
        if (isStuckMessage && taskId) {
            const mentorResponse = await aiMentorServiceV2_1.default.triggerT02Stuck(userId, taskId, message, message);
            return res.json({
                success: true,
                data: mentorResponse
            });
        }
        // 通用对话
        const mentorResponse = await aiMentorServiceV2_1.default.sendMentorMessage(userId, message, {
            triggerType: 'manual',
            taskId
        });
        res.json({
            success: true,
            data: mentorResponse
        });
    }
    catch (error) {
        logger_1.default.error('AI导师消息处理失败:', error);
        next(error);
    }
});
/**
 * 触发T-01: 接单后引导
 * POST /api/v1/ai-mentor/trigger/onboarding
 */
router.post('/trigger/onboarding', auth_1.authenticate, [
    (0, express_validator_1.body)('taskId').isUUID().withMessage('taskId必须是有效的UUID'),
    (0, express_validator_1.body)('taskTitle').notEmpty().withMessage('taskTitle不能为空'),
    (0, express_validator_1.body)('taskDescription').notEmpty().withMessage('taskDescription不能为空')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const userId = req.user.userId;
        const { taskId, taskTitle, taskDescription } = req.body;
        const mentorResponse = await aiMentorServiceV2_1.default.triggerT01Onboarding(userId, taskId, { title: taskTitle, description: taskDescription });
        res.json({
            success: true,
            data: mentorResponse
        });
    }
    catch (error) {
        logger_1.default.error('T-01触发失败:', error);
        next(error);
    }
});
/**
 * 触发T-03: 交付物被打回
 * POST /api/v1/ai-mentor/trigger/rejected
 */
router.post('/trigger/rejected', auth_1.authenticate, [
    (0, express_validator_1.body)('taskId').isUUID().withMessage('taskId必须是有效的UUID'),
    (0, express_validator_1.body)('rejectionReason').notEmpty().withMessage('rejectionReason不能为空')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const userId = req.user.userId;
        const { taskId, rejectionReason, feedbackDetails } = req.body;
        const mentorResponse = await aiMentorServiceV2_1.default.triggerT03Rejected(userId, taskId, rejectionReason, feedbackDetails || {});
        res.json({
            success: true,
            data: mentorResponse
        });
    }
    catch (error) {
        logger_1.default.error('T-03触发失败:', error);
        next(error);
    }
});
/**
 * 触发T-05: 里程碑见证
 * POST /api/v1/ai-mentor/trigger/milestone
 */
router.post('/trigger/milestone', auth_1.authenticate, [
    (0, express_validator_1.body)('milestoneType').isIn(['first_task_completed', 'level_up', 'overcome_stuck_point', 'high_rating', 'fast_completion']).withMessage('milestoneType无效'),
    (0, express_validator_1.body)('milestoneData').isObject().withMessage('milestoneData必须是对象')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const userId = req.user.userId;
        const { milestoneType, milestoneData } = req.body;
        const mentorResponse = await aiMentorServiceV2_1.default.triggerT05Milestone(userId, milestoneType, milestoneData);
        res.json({
            success: true,
            data: mentorResponse
        });
    }
    catch (error) {
        logger_1.default.error('T-05触发失败:', error);
        next(error);
    }
});
/**
 * 获取对话历史
 * GET /api/v1/ai-mentor/history
 */
router.get('/history', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { taskId, limit = 20 } = req.query;
        const { pool } = require('../config/database');
        const client = await pool.connect();
        try {
            const result = await client.query(`SELECT
             id,
             role,
             message,
             trigger_type,
             quick_replies,
             created_at
           FROM mentor_conversations_v2
           WHERE student_id = $1
             AND ($2::uuid IS NULL OR task_id = $2)
           ORDER BY created_at DESC
           LIMIT $3`, [userId, taskId, parseInt(limit)]);
            res.json({
                success: true,
                data: {
                    conversations: result.rows.reverse(), // 按时间正序
                    totalCount: result.rows.length
                }
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        logger_1.default.error('获取对话历史失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=aiMentorRoutesV2.js.map