"use strict";
/**
 * 任务分级和智能匹配控制器
 *
 * 处理任务等级、学生等级、智能匹配相关的HTTP请求
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskLevels = getTaskLevels;
exports.calculateTaskLevel = calculateTaskLevel;
exports.getStudentLevel = getStudentLevel;
exports.updateStudentLevel = updateStudentLevel;
exports.matchTaskWithStudents = matchTaskWithStudents;
exports.getTaskMatches = getTaskMatches;
exports.getStudentRecommendations = getStudentRecommendations;
exports.notifyMatchedStudents = notifyMatchedStudents;
const taskLevelMatchingService_1 = require("../services/taskLevelMatchingService");
const logger_1 = __importDefault(require("../utils/logger"));
// =====================================================
// 类型定义
// =====================================================
// =====================================================
// 任务等级接口
// =====================================================
/**
 * 获取所有任务等级定义
 * GET /api/v1/task-levels
 */
async function getTaskLevels(req, res) {
    try {
        const levels = await taskLevelMatchingService_1.taskLevelMatchingService.getTaskLevels();
        return res.json({
            success: true,
            data: levels,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get task levels', { error });
        return res.status(500).json({
            error: 'Failed to get task levels',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 计算任务等级
 * POST /api/v1/task-levels/calculate/:taskId
 */
async function calculateTaskLevel(req, res) {
    try {
        const userId = req.user?.id;
        const { taskId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const level = await taskLevelMatchingService_1.taskLevelMatchingService.calculateTaskLevel(taskId);
        return res.json({
            success: true,
            data: {
                task_id: taskId,
                level,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to calculate task level', { error });
        return res.status(500).json({
            error: 'Failed to calculate task level',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 学生等级接口
// =====================================================
/**
 * 获取学生等级信息
 * GET /api/v1/student-levels/:studentId
 */
async function getStudentLevel(req, res) {
    try {
        const { studentId } = req.params;
        const level = await taskLevelMatchingService_1.taskLevelMatchingService.getStudentLevel(studentId);
        if (!level) {
            return res.status(404).json({ error: 'Student level not found' });
        }
        return res.json({
            success: true,
            data: level,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get student level', { error });
        return res.status(500).json({
            error: 'Failed to get student level',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 更新学生等级（手动触发）
 * POST /api/v1/student-levels/:studentId/update
 */
async function updateStudentLevel(req, res) {
    try {
        const userId = req.user?.id;
        const { studentId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有学生本人或管理员可以更新
        if (userId !== studentId && req.user?.role !== 'admin' && req.user?.role !== 'platform') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await taskLevelMatchingService_1.taskLevelMatchingService.updateStudentLevel(studentId);
        const updatedLevel = await taskLevelMatchingService_1.taskLevelMatchingService.getStudentLevel(studentId);
        return res.json({
            success: true,
            data: updatedLevel,
            message: 'Student level updated successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to update student level', { error });
        return res.status(500).json({
            error: 'Failed to update student level',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 智能匹配接口
// =====================================================
/**
 * 为任务匹配学生
 * POST /api/v1/matching/task/:taskId/match
 */
async function matchTaskWithStudents(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { taskId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有企业或管理员可以触发匹配
        if (userRole !== 'company' && userRole !== 'admin' && userRole !== 'platform') {
            return res.status(403).json({ error: 'Only companies can match tasks' });
        }
        const matches = await taskLevelMatchingService_1.taskLevelMatchingService.matchTaskWithStudents(taskId, limit);
        return res.json({
            success: true,
            data: matches,
            total: matches.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to match task with students', { error });
        return res.status(500).json({
            error: 'Failed to match task with students',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取任务的匹配学生列表
 * GET /api/v1/matching/task/:taskId/matches
 */
async function getTaskMatches(req, res) {
    try {
        const userId = req.user?.id;
        const { taskId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const matches = await taskLevelMatchingService_1.taskLevelMatchingService.getTaskMatches(taskId, limit);
        return res.json({
            success: true,
            data: matches,
            total: matches.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get task matches', { error });
        return res.status(500).json({
            error: 'Failed to get task matches',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取学生的推荐任务
 * GET /api/v1/matching/student/:studentId/recommendations
 */
async function getStudentRecommendations(req, res) {
    try {
        const userId = req.user?.id;
        const { studentId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有学生本人可以查看推荐
        if (userId !== studentId && req.user?.role !== 'admin' && req.user?.role !== 'platform') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const recommendations = await taskLevelMatchingService_1.taskLevelMatchingService.getStudentRecommendedTasks(studentId, limit);
        return res.json({
            success: true,
            data: recommendations,
            total: recommendations.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get student recommendations', { error });
        return res.status(500).json({
            error: 'Failed to get student recommendations',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 通知匹配的学生
 * POST /api/v1/matching/task/:taskId/notify
 */
async function notifyMatchedStudents(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { taskId } = req.params;
        const topN = parseInt(req.body.top_n) || 5;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有企业或管理员可以通知
        if (userRole !== 'company' && userRole !== 'admin' && userRole !== 'platform') {
            return res.status(403).json({ error: 'Only companies can notify students' });
        }
        await taskLevelMatchingService_1.taskLevelMatchingService.notifyMatchedStudents(taskId, topN);
        return res.json({
            success: true,
            message: `Notified top ${topN} matched students`,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to notify matched students', { error });
        return res.status(500).json({
            error: 'Failed to notify matched students',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=taskLevelMatchingController.js.map