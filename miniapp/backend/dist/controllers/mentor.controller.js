"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrowthStats = exports.getFlowMoments = exports.getPassionSparks = exports.celebrateMilestone = exports.reportStuck = exports.getFirstStep = exports.getHistory = exports.chat = void 0;
const mentor_service_1 = require("../services/mentor.service");
const logger_1 = require("../utils/logger");
/**
 * AI导师控制器
 */
/**
 * AI对话
 */
const chat = async (req, res) => {
    try {
        const userId = req.userId;
        const { message, context, taskId, conversationHistory } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                error: '消息内容不能为空'
            });
        }
        const result = await mentor_service_1.mentorService.chat(userId, message, context || 'general', taskId, conversationHistory);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('AI对话失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.chat = chat;
/**
 * 获取对话历史
 */
const getHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { taskId } = req.params;
        const history = await mentor_service_1.mentorService.getHistory(userId, taskId);
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        logger_1.log.error('获取对话历史失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getHistory = getHistory;
/**
 * 获取接单第一步引导
 */
const getFirstStep = async (req, res) => {
    try {
        const userId = req.userId;
        const { taskId } = req.params;
        const guidance = await mentor_service_1.mentorService.getFirstStep(userId, taskId);
        res.json({
            success: true,
            data: {
                guidance
            }
        });
    }
    catch (error) {
        logger_1.log.error('获取第一步引导失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getFirstStep = getFirstStep;
/**
 * 学生说"我卡住了"
 */
const reportStuck = async (req, res) => {
    try {
        const userId = req.userId;
        const { taskId } = req.params;
        const { stuckPoint } = req.body;
        if (!stuckPoint) {
            return res.status(400).json({
                success: false,
                error: '请描述卡点'
            });
        }
        const guidance = await mentor_service_1.mentorService.reportStuck(userId, taskId, stuckPoint);
        res.json({
            success: true,
            data: {
                guidance
            }
        });
    }
    catch (error) {
        logger_1.log.error('处理卡点失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.reportStuck = reportStuck;
/**
 * 完成里程碑时的见证
 */
const celebrateMilestone = async (req, res) => {
    try {
        const userId = req.userId;
        const { taskId } = req.params;
        const { milestone } = req.body;
        if (!milestone) {
            return res.status(400).json({
                success: false,
                error: '请描述里程碑'
            });
        }
        const feedback = await mentor_service_1.mentorService.celebrateMilestone(userId, taskId, milestone);
        res.json({
            success: true,
            data: {
                feedback
            }
        });
    }
    catch (error) {
        logger_1.log.error('生成里程碑反馈失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.celebrateMilestone = celebrateMilestone;
/**
 * 获取热情火花列表
 */
const getPassionSparks = async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;
        const sparks = await mentor_service_1.mentorService.getPassionSparks(userId, limit);
        res.json({
            success: true,
            data: sparks
        });
    }
    catch (error) {
        logger_1.log.error('获取热情火花失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getPassionSparks = getPassionSparks;
/**
 * 获取穿越感时刻列表
 */
const getFlowMoments = async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;
        const moments = await mentor_service_1.mentorService.getFlowMoments(userId, limit);
        res.json({
            success: true,
            data: moments
        });
    }
    catch (error) {
        logger_1.log.error('获取穿越感时刻失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getFlowMoments = getFlowMoments;
/**
 * 获取成长统计
 */
const getGrowthStats = async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await mentor_service_1.mentorService.getGrowthStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.log.error('获取成长统计失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getGrowthStats = getGrowthStats;
//# sourceMappingURL=mentor.controller.js.map