"use strict";
/**
 * 编排器测试路由
 * Phase R1: 测试编排器和6层记忆系统
 *
 * 注意：这些路由用于开发测试，不需要认证
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agentOrchestrator_1 = require("../orchestrator/agentOrchestrator");
const memoryService_1 = require("../services/memoryService");
const orchestratorInit_1 = require("../orchestrator/orchestratorInit");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
// 跳过认证中间件（仅用于测试）
router.use((req, res, next) => {
    // 在开发环境下允许测试路由绕过认证
    if (process.env.NODE_ENV === 'development') {
        next();
    }
    else {
        res.status(403).json({ error: '测试路由仅在开发环境可用' });
    }
});
/**
 * 测试编排器基础功能
 * POST /api/v1/orchestrator/test/trigger
 */
router.post('/test/trigger', async (req, res) => {
    try {
        const { event, userId, message, taskId } = req.body;
        if (!event || !userId) {
            return res.status(400).json({ error: '缺少必需参数: event, userId' });
        }
        const result = await agentOrchestrator_1.orchestrator.triggerEvent(event, {
            userId,
            message,
            taskId,
            timestamp: new Date()
        });
        res.json({
            success: true,
            event,
            results: result
        });
    }
    catch (error) {
        logger_1.default.error('测试编排器失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * 测试导师对话（增强版）
 * POST /api/v1/orchestrator/test/mentor
 */
router.post('/test/mentor', async (req, res) => {
    try {
        const { userId, message, trigger, ...otherContext } = req.body;
        if (!userId || !message) {
            return res.status(400).json({ error: '缺少必需参数: userId, message' });
        }
        const results = await (0, orchestratorInit_1.triggerMentorMessage)(userId, message, trigger || agentOrchestrator_1.MentorTrigger.USER_INITIATED, otherContext // 传递所有其他字段（taskId, milestone, milestoneType, impact等）
        );
        res.json({
            success: true,
            results
        });
    }
    catch (error) {
        logger_1.default.error('测试导师对话失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * 查看6层记忆
 * GET /api/v1/orchestrator/memory/:userId
 */
router.get('/memory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { taskId } = req.query;
        const memory = await memoryService_1.memoryService.loadAllLayers(userId);
        // 如果指定了taskId，加载L2
        if (taskId && typeof taskId === 'string') {
            const taskContext = await memoryService_1.memoryService.loadTaskContext(userId, taskId);
            memory.L2_task = taskContext || undefined;
        }
        res.json({
            success: true,
            userId,
            memory
        });
    }
    catch (error) {
        logger_1.default.error('查看记忆失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * 更新L5核心画像（测试）
 * POST /api/v1/orchestrator/memory/:userId/core-profile
 */
router.post('/memory/:userId/core-profile', async (req, res) => {
    try {
        const { userId } = req.params;
        const { abilityTags, track, communicationStyle } = req.body;
        await memoryService_1.memoryService.updateCoreProfile(userId, {
            abilityTags,
            track,
            communicationStyle
        });
        res.json({
            success: true,
            message: 'L5核心画像已更新'
        });
    }
    catch (error) {
        logger_1.default.error('更新L5核心画像失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * 添加L6关系记忆（测试）
 * POST /api/v1/orchestrator/memory/:userId/relationship
 */
router.post('/memory/:userId/relationship', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, data } = req.body;
        const updates = {};
        if (type === 'quote' && data) {
            updates.addQuote = data;
        }
        else if (type === 'promise' && data) {
            updates.addPromise = data;
        }
        else if (type === 'anchor' && data) {
            updates.addAnchor = data;
        }
        else if (type === 'stage' && data) {
            updates.updateStage = data;
        }
        await memoryService_1.memoryService.updateRelationshipMemory(userId, updates);
        res.json({
            success: true,
            message: 'L6关系记忆已更新'
        });
    }
    catch (error) {
        logger_1.default.error('更新L6关系记忆失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * 查看编排器事件统计
 * GET /api/v1/orchestrator/stats/:userId
 */
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { since } = req.query;
        const sinceDate = since ? new Date(since) : undefined;
        const stats = await agentOrchestrator_1.orchestrator.getEventStats(userId, sinceDate);
        res.json({
            success: true,
            userId,
            stats
        });
    }
    catch (error) {
        logger_1.default.error('查看事件统计失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * 测试任务接取触发
 * POST /api/v1/orchestrator/test/task-accepted
 */
router.post('/test/task-accepted', async (req, res) => {
    try {
        const { userId, taskId } = req.body;
        if (!userId || !taskId) {
            return res.status(400).json({ error: '缺少必需参数: userId, taskId' });
        }
        const results = await (0, orchestratorInit_1.triggerTaskAccepted)(userId, taskId);
        res.json({
            success: true,
            results
        });
    }
    catch (error) {
        logger_1.default.error('测试任务接取触发失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * 测试需求拆解
 * POST /api/v1/orchestrator/test/demand-parsing
 */
router.post('/test/demand-parsing', async (req, res) => {
    try {
        const { taskId, taskDescription, enterpriseId } = req.body;
        if (!taskId || !taskDescription) {
            return res.status(400).json({ error: '缺少必需参数: taskId, taskDescription' });
        }
        const results = await (0, orchestratorInit_1.triggerDemandParsing)(taskId, taskDescription, enterpriseId);
        res.json({
            success: true,
            results
        });
    }
    catch (error) {
        logger_1.default.error('测试需求拆解失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
/**
 * 测试报告生成
 * POST /api/v1/orchestrator/test/report-generation
 */
router.post('/test/report-generation', async (req, res) => {
    try {
        const { userId, reportType, timeRange } = req.body;
        if (!userId) {
            return res.status(400).json({ error: '缺少必需参数: userId' });
        }
        const results = await (0, orchestratorInit_1.triggerReportGeneration)(userId, reportType, timeRange);
        res.json({
            success: true,
            results
        });
    }
    catch (error) {
        logger_1.default.error('测试报告生成失败:', error);
        res.status(500).json({
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.default = router;
//# sourceMappingURL=orchestrator.js.map