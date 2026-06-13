"use strict";
// AI导师系统 - 路由
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../../utils/logger"));
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const mentorController_1 = require("../../controllers/mentorController");
const router = (0, express_1.Router)();
// AI导师通用聊天接口
router.post('/chat', mentorController_1.mentorChat);
// 获取对话历史
router.get('/:taskId/history', mentorController_1.getHistory);
// 获取第一步引导
router.get('/:taskId/first-step', mentorController_1.getFirstStep);
// 学生发送消息给AI导师
router.post('/message', auth_1.authenticate, controller_1.handleStuckMessage);
// 获取对话历史（旧接口）
router.get('/conversations/:taskId', auth_1.authenticate, controller_1.getConversations);
// ============================================================
// 兼容旧版的API端点 - 仍在使用中
// 这些端点被小程序调用，转发到 mentorCoreService
// ============================================================
/**
 * 学生报告卡点
 * POST /api/v1/mentor/:taskId/stuck
 *
 * 小程序使用: services/api.ts::mentorAPI.reportStuck
 * 实现: 调用 mentorCoreService.chat 处理stuck场景
 */
router.post('/:taskId/stuck', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { stuckPoint } = req.body;
        const studentId = req.user?.userId;
        if (!studentId || !stuckPoint) {
            return res.status(400).json({
                success: false,
                error: '缺少参数：studentId 或 stuckPoint'
            });
        }
        // 调用真实的 mentorCoreService
        const result = await mentorCoreService.chat(studentId, `我卡住了：${stuckPoint}`, taskId);
        res.json({
            success: true,
            response: result.response,
            sessionId: result.sessionId,
            detectedSignals: result.detectedSignals
        });
    }
    catch (error) {
        logger_1.default.error('处理stuck消息失败:', error);
        res.status(500).json({ success: false, error: '处理失败' });
    }
});
/**
 * 任务被拒绝后的引导
 * POST /api/v1/mentor/:taskId/rejection-guidance
 *
 * 小程序使用: services/api.ts::mentorAPI.getRejectionGuidance
 */
router.post('/:taskId/rejection-guidance', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { rejectionReason } = req.body;
        const studentId = req.user?.userId;
        if (!studentId || !rejectionReason) {
            return res.status(400).json({
                success: false,
                error: '缺少参数：studentId 或 rejectionReason'
            });
        }
        const result = await mentorCoreService.chat(studentId, `我的提交被打回了，原因是：${rejectionReason}。我应该怎么改进？`, taskId);
        res.json({
            success: true,
            response: result.response,
            sessionId: result.sessionId
        });
    }
    catch (error) {
        logger_1.default.error('处理rejection消息失败:', error);
        res.status(500).json({ success: false, error: '处理失败' });
    }
});
/**
 * 庆祝里程碑
 * POST /api/v1/mentor/:taskId/milestone
 *
 * 小程序使用: services/api.ts::mentorAPI.celebrateMilestone
 */
router.post('/:taskId/milestone', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { milestone } = req.body;
        const studentId = req.user?.userId;
        if (!studentId || !milestone) {
            return res.status(400).json({
                success: false,
                error: '缺少参数：studentId 或 milestone'
            });
        }
        const result = await mentorCoreService.chat(studentId, `我完成了一个重要的里程碑：${milestone}！`, taskId);
        res.json({
            success: true,
            response: result.response,
            sessionId: result.sessionId
        });
    }
    catch (error) {
        logger_1.default.error('处理milestone消息失败:', error);
        res.status(500).json({ success: false, error: '处理失败' });
    }
});
/**
 * 记录导师观察（后台功能）
 * POST /api/v1/mentor/observe
 */
router.post('/observe', auth_1.authenticate, recordObservation);
/**
 * 检测学生卡点（定时任务）
 * POST /api/v1/mentor/detect-stuck
 */
router.post('/detect-stuck', auth_1.authenticate, detectStuckPoints);
/**
 * 生成欢迎消息
 * POST /api/v1/mentor/welcome-message
 */
router.post('/welcome-message', auth_1.authenticate, generateWelcomeMessage);
exports.default = router;
//# sourceMappingURL=index.js.map