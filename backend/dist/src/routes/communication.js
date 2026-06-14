"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../utils/logger"));
const communicationService_1 = require("../services/communicationService");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = (0, express_1.Router)();
/**
 * 企业添加任务补充说明
 * POST /api/v1/communication/clarifications
 */
router.post('/clarifications', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), async (req, res) => {
    try {
        const { taskId, content, attachments } = req.body;
        const companyId = req.user.userId;
        if (!taskId || !content) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        const clarification = await communicationService_1.CommunicationService.addClarification(taskId, companyId, content, attachments);
        res.json({ success: true, data: clarification });
    }
    catch (error) {
        logger_1.default.error('添加补充说明失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 获取任务的补充说明列表
 * GET /api/v1/communication/clarifications/:taskId
 */
router.get('/clarifications/:taskId', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const clarifications = await communicationService_1.CommunicationService.getClarifications(parseInt(taskId));
        res.json({ success: true, data: clarifications });
    }
    catch (error) {
        logger_1.default.error('获取补充说明失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 学生提问（AI回答）
 * POST /api/v1/communication/questions
 */
router.post('/questions', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), async (req, res) => {
    try {
        const { taskId, question } = req.body;
        const studentId = req.user.userId;
        if (!taskId || !question) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        const result = await communicationService_1.CommunicationService.askQuestion(taskId, studentId, question);
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.default.error('提问失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 转发问题给企业
 * POST /api/v1/communication/questions/:questionId/forward
 */
router.post('/questions/:questionId/forward', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), async (req, res) => {
    try {
        const { questionId } = req.params;
        const studentId = req.user.userId;
        const result = await communicationService_1.CommunicationService.forwardToCompany(parseInt(questionId), studentId);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('转发问题失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 企业回答学生问题
 * POST /api/v1/communication/questions/:questionId/answer
 */
router.post('/questions/:questionId/answer', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), async (req, res) => {
    try {
        const { questionId } = req.params;
        const { answer } = req.body;
        const companyId = req.user.userId;
        if (!answer) {
            return res.status(400).json({ error: '回答内容不能为空' });
        }
        const result = await communicationService_1.CommunicationService.answerQuestion(parseInt(questionId), companyId, answer);
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.default.error('回答问题失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 获取任务的问答列表
 * GET /api/v1/communication/questions/:taskId
 */
router.get('/questions/:taskId', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const questions = await communicationService_1.CommunicationService.getQuestions(parseInt(taskId), userId, userRole);
        res.json({ success: true, data: questions });
    }
    catch (error) {
        logger_1.default.error('获取问答列表失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 标记AI回答是否有帮助
 * POST /api/v1/communication/questions/:questionId/helpful
 */
router.post('/questions/:questionId/helpful', auth_1.authenticate, async (req, res) => {
    try {
        const { questionId } = req.params;
        const { isHelpful } = req.body;
        const result = await communicationService_1.CommunicationService.markAIAnswerHelpful(parseInt(questionId), isHelpful);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('标记失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 发送中转消息
 * POST /api/v1/communication/messages
 */
router.post('/messages', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId, receiverId, content, attachments } = req.body;
        const senderId = req.user.userId;
        if (!taskId || !receiverId || !content) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        const result = await communicationService_1.CommunicationService.sendRelayMessage(taskId, senderId, receiverId, content, attachments);
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.default.error('发送消息失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 获取中转消息列表
 * GET /api/v1/communication/messages/:taskId
 */
router.get('/messages/:taskId', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.userId;
        const messages = await communicationService_1.CommunicationService.getRelayMessages(parseInt(taskId), userId);
        res.json({ success: true, data: messages });
    }
    catch (error) {
        logger_1.default.error('获取消息列表失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * 获取未读消息数
 * GET /api/v1/communication/unread-count
 */
router.get('/unread-count', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await communicationService_1.CommunicationService.getUnreadCount(userId);
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        logger_1.default.error('获取未读数失败:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=communication.js.map