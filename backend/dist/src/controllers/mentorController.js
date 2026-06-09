"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectHabits = exports.generateRejectionMessage = exports.generateMilestoneMessage = exports.generateWelcomeMessage = exports.detectStuckPoints = exports.recordObservation = exports.getFirstStep = exports.getHistory = exports.getWelcomeMessage = exports.getStudentStats = exports.getSessionStats = exports.getStudentSessions = exports.getConversationHistory = exports.mentorChat = void 0;
const mentorCoreService_1 = __importDefault(require("../services/mentorCoreService"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * AI导师控制器 - 使用新的MentorCoreService
 */
/**
 * AI导师聊天接口
 * POST /api/v1/mentor/chat
 */
const mentorChat = async (req, res) => {
    try {
        const { studentId, taskId, message, conversationHistory } = req.body;
        if (!studentId || !message) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数：studentId 和 message',
            });
        }
        // 从conversationHistory中提取sessionId（如果有）
        const sessionId = req.body.sessionId;
        logger_1.default.info('AI导师对话请求', { studentId, taskId, messageLength: message.length });
        // 调用核心服务
        const result = await mentorCoreService_1.default.chat(studentId, message, taskId, sessionId);
        logger_1.default.info('AI导师对话成功', {
            sessionId: result.sessionId,
            responseLength: result.response.length,
            tokensUsed: result.tokensUsed,
            responseTime: result.responseTime,
            signals: result.detectedSignals,
        });
        return res.json({
            success: true,
            sessionId: result.sessionId,
            response: result.response,
            tokensUsed: result.tokensUsed,
            responseTime: result.responseTime,
            detectedPassionSpark: result.detectedSignals.passionSpark,
            detectedFlowMoment: result.detectedSignals.flowMoment,
            detectedStuckPoint: result.detectedSignals.stuckPoint,
            suggestions: result.suggestions,
        });
    }
    catch (error) {
        logger_1.default.error('AI导师对话失败:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'AI导师服务暂时不可用',
        });
    }
};
exports.mentorChat = mentorChat;
/**
 * 获取对话历史
 * GET /api/v1/mentor/sessions/:sessionId/messages
 */
const getConversationHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const messages = await mentorCoreService_1.default.getSessionMessages(sessionId, parseInt(limit), parseInt(offset));
        return res.json({
            success: true,
            messages,
        });
    }
    catch (error) {
        logger_1.default.error('获取对话历史失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取对话历史失败',
        });
    }
};
exports.getConversationHistory = getConversationHistory;
/**
 * 获取学生的所有会话
 * GET /api/v1/mentor/sessions
 */
const getStudentSessions = async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: '缺少参数：studentId',
            });
        }
        const sessions = await mentorCoreService_1.default.getStudentSessions(studentId);
        return res.json({
            success: true,
            sessions,
        });
    }
    catch (error) {
        logger_1.default.error('获取学生会话失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取学生会话失败',
        });
    }
};
exports.getStudentSessions = getStudentSessions;
/**
 * 获取会话统计
 * GET /api/v1/mentor/sessions/:sessionId/stats
 */
const getSessionStats = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const stats = await mentorCoreService_1.default.getSessionStats(sessionId);
        return res.json({
            success: true,
            stats,
        });
    }
    catch (error) {
        logger_1.default.error('获取会话统计失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取会话统计失败',
        });
    }
};
exports.getSessionStats = getSessionStats;
/**
 * 获取学生的对话统计
 * GET /api/v1/mentor/students/:studentId/stats
 */
const getStudentStats = async (req, res) => {
    try {
        const { studentId } = req.params;
        const stats = await mentorCoreService_1.default.getStudentStats(studentId);
        return res.json({
            success: true,
            stats,
        });
    }
    catch (error) {
        logger_1.default.error('获取学生统计失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取学生统计失败',
        });
    }
};
exports.getStudentStats = getStudentStats;
/**
 * 获取欢迎消息（兼容旧接口）
 * POST /api/v1/mentor/welcome-message
 */
const getWelcomeMessage = async (req, res) => {
    try {
        const { studentId, taskId } = req.body;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: '缺少参数：studentId',
            });
        }
        // 使用AI导师生成欢迎消息
        const welcomeMessage = taskId
            ? `你接了这个任务，恭喜！🎉 我是启程小猫，会陪你一起完成这个项目。有什么问题随时找我聊~`
            : `嗨！我是启程小猫 🐱 有什么我可以帮你的吗？`;
        return res.json({
            success: true,
            message: welcomeMessage,
        });
    }
    catch (error) {
        logger_1.default.error('获取欢迎消息失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取欢迎消息失败',
        });
    }
};
exports.getWelcomeMessage = getWelcomeMessage;
/**
 * 获取对话历史（兼容旧接口）
 * GET /api/v1/mentor/:taskId/history
 */
const getHistory = async (req, res) => {
    try {
        const { taskId } = req.params;
        // 返回空数组，让前端使用默认欢迎消息
        res.json({ messages: [] });
    }
    catch (error) {
        logger_1.default.error('获取对话历史失败:', error);
        res.status(500).json({ error: '获取对话历史失败' });
    }
};
exports.getHistory = getHistory;
/**
 * 获取第一步引导（兼容旧接口）
 * GET /api/v1/mentor/:taskId/first-step
 */
const getFirstStep = async (req, res) => {
    try {
        const { taskId } = req.params;
        res.json({ message: null });
    }
    catch (error) {
        logger_1.default.error('获取第一步引导失败:', error);
        res.status(500).json({ error: '获取第一步引导失败' });
    }
};
exports.getFirstStep = getFirstStep;
/**
 * 记录导师观察（兼容旧接口）
 */
const recordObservation = async (req, res) => {
    try {
        res.json({ success: true, message: '观察已记录' });
    }
    catch (error) {
        logger_1.default.error('记录观察失败:', error);
        res.status(500).json({ success: false, error: '记录观察失败' });
    }
};
exports.recordObservation = recordObservation;
/**
 * 检测学生卡点（兼容旧接口）
 */
const detectStuckPoints = async (req, res) => {
    try {
        res.json({ success: true, stuckStudents: [] });
    }
    catch (error) {
        logger_1.default.error('检测卡点失败:', error);
        res.status(500).json({ success: false, error: '检测卡点失败' });
    }
};
exports.detectStuckPoints = detectStuckPoints;
/**
 * 生成欢迎消息（兼容旧接口）
 */
const generateWelcomeMessage = async (req, res) => {
    try {
        const { studentId, taskId } = req.body;
        const message = taskId
            ? `你接了这个任务，恭喜！🎉 我是启程小猫，会陪你一起完成这个项目。有什么问题随时找我聊~`
            : `嗨！我是启程小猫 🐱 有什么我可以帮你的吗？`;
        res.json({ success: true, message });
    }
    catch (error) {
        logger_1.default.error('生成欢迎消息失败:', error);
        res.status(500).json({ success: false, error: '生成欢迎消息失败' });
    }
};
exports.generateWelcomeMessage = generateWelcomeMessage;
/**
 * 生成里程碑消息（兼容旧接口）
 */
const generateMilestoneMessage = async (req, res) => {
    try {
        res.json({ success: true, message: '恭喜你完成了这个里程碑！🎉' });
    }
    catch (error) {
        logger_1.default.error('生成里程碑消息失败:', error);
        res.status(500).json({ success: false, error: '生成里程碑消息失败' });
    }
};
exports.generateMilestoneMessage = generateMilestoneMessage;
/**
 * 生成拒绝消息（兼容旧接口）
 */
const generateRejectionMessage = async (req, res) => {
    try {
        res.json({ success: true, message: '这次的提交还有改进空间，我们一起看看怎么优化吧~' });
    }
    catch (error) {
        logger_1.default.error('生成拒绝消息失败:', error);
        res.status(500).json({ success: false, error: '生成拒绝消息失败' });
    }
};
exports.generateRejectionMessage = generateRejectionMessage;
/**
 * 检测习惯（兼容旧接口）
 */
const detectHabits = async (req, res) => {
    try {
        res.json({ success: true, habits: [] });
    }
    catch (error) {
        logger_1.default.error('检测习惯失败:', error);
        res.status(500).json({ success: false, error: '检测习惯失败' });
    }
};
exports.detectHabits = detectHabits;
//# sourceMappingURL=mentorController.js.map