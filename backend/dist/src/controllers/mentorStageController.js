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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSession = getCurrentSession;
exports.getSessionMessages = getSessionMessages;
exports.sendMessage = sendMessage;
exports.requestQualityReview = requestQualityReview;
exports.getSessionStats = getSessionStats;
exports.confirmRequirementUnderstanding = confirmRequirementUnderstanding;
exports.getStudentGrowthDashboard = getStudentGrowthDashboard;
exports.getRecentEmotions = getRecentEmotions;
exports.getGrowthMilestones = getGrowthMilestones;
exports.getUncelebratedMilestones = getUncelebratedMilestones;
exports.celebrateMilestone = celebrateMilestone;
exports.getMentorMemories = getMentorMemories;
exports.getMemoryStats = getMemoryStats;
exports.getGrowthStats = getGrowthStats;
exports.getGuidanceRecommendations = getGuidanceRecommendations;
exports.getToolRecommendations = getToolRecommendations;
exports.feedbackToolUsage = feedbackToolUsage;
exports.getPopularTools = getPopularTools;
exports.triggerFollowUps = triggerFollowUps;
exports.getSchedulerStatus = getSchedulerStatus;
const mentorStageService_1 = require("../services/mentorStageService");
const mentorTriggerService_1 = require("../services/mentorTriggerService");
const emotionAnalysisService_1 = require("../services/emotionAnalysisService");
const growthTrackingService_1 = require("../services/growthTrackingService");
const mentorMemoryService_1 = __importDefault(require("../services/mentorMemoryService"));
const toolRecommendationService_1 = require("../services/toolRecommendationService");
const mentorScheduler_1 = require("../services/mentorScheduler");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * AI导师阶段控制器（终极版 - 完整功能）
 */
/**
 * 获取当前会话信息
 */
async function getCurrentSession(req, res) {
    try {
        const { taskId } = req.params;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const session = await mentorStageService_1.mentorStageService.getSessionByTaskId(taskId);
        if (!session) {
            return res.json({
                success: true,
                data: null,
            });
        }
        // 验证学生权限
        if (session.studentId !== studentId) {
            throw new errorHandler_1.AppError(403, '无权访问此会话', 'FORBIDDEN');
        }
        res.json({
            success: true,
            data: session,
        });
    }
    catch (error) {
        logger_1.default.error('获取会话失败', { error });
        throw error;
    }
}
/**
 * 获取会话消息历史
 */
async function getSessionMessages(req, res) {
    try {
        const { sessionId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        // 验证权限
        const session = await mentorStageService_1.mentorStageService.getSession(sessionId);
        if (!session) {
            throw new errorHandler_1.AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
        }
        if (session.studentId !== studentId) {
            throw new errorHandler_1.AppError(403, '无权访问此会话', 'FORBIDDEN');
        }
        const messages = await mentorStageService_1.mentorStageService.getMessages(sessionId, parseInt(limit), parseInt(offset));
        res.json({
            success: true,
            data: {
                messages,
                total: session.totalMessages,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取消息历史失败', { error });
        throw error;
    }
}
/**
 * 发送消息给导师（增强版 - 使用自适应引导）
 */
async function sendMessage(req, res) {
    try {
        const { sessionId } = req.params;
        const { content } = req.body;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        if (!content || content.trim().length === 0) {
            throw new errorHandler_1.AppError(400, '消息内容不能为空', 'EMPTY_MESSAGE');
        }
        // 验证权限
        const session = await mentorStageService_1.mentorStageService.getSession(sessionId);
        if (!session) {
            throw new errorHandler_1.AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
        }
        if (session.studentId !== studentId) {
            throw new errorHandler_1.AppError(403, '无权访问此会话', 'FORBIDDEN');
        }
        // 保存学生消息（会自动触发情绪分析、成长检测等）
        await mentorStageService_1.mentorStageService.saveMessage(sessionId, 'student', content, {
            stage: session.currentStage,
        });
        // 使用自适应引导生成回复
        const startTime = Date.now();
        const guidance = await mentorStageService_1.mentorStageService.generateAdaptiveResponse(sessionId, content);
        const responseTime = Date.now() - startTime;
        // 保存导师回复
        const messageId = await mentorStageService_1.mentorStageService.saveMessage(sessionId, 'mentor', guidance.content, {
            stage: session.currentStage,
            modelUsed: 'claude-adaptive', // 标记为自适应模式
            responseTimeMs: responseTime,
            extra: guidance.metadata,
        });
        // 检查是否有未庆祝的里程碑
        const uncelebratedMilestones = await mentorStageService_1.mentorStageService.getUncelebratedMilestones(session.studentId);
        res.json({
            success: true,
            data: {
                messageId,
                content: guidance.content,
                stage: session.currentStage,
                responseTime: responseTime,
                metadata: {
                    ...guidance.metadata,
                    uncelebratedMilestones: uncelebratedMilestones.length,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('发送消息失败', { error });
        throw error;
    }
}
/**
 * 请求质量预审
 */
async function requestQualityReview(req, res) {
    try {
        const { taskId } = req.params;
        const { submission } = req.body;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        if (!submission || submission.trim().length === 0) {
            throw new errorHandler_1.AppError(400, '提交内容不能为空', 'EMPTY_SUBMISSION');
        }
        // 触发质量预审
        const result = await mentorTriggerService_1.mentorTriggerService.triggerQualityReview(taskId, studentId, submission);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('质量预审失败', { error });
        throw error;
    }
}
/**
 * 获取会话统计
 */
async function getSessionStats(req, res) {
    try {
        const { sessionId } = req.params;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        // 验证权限
        const session = await mentorStageService_1.mentorStageService.getSession(sessionId);
        if (!session) {
            throw new errorHandler_1.AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
        }
        if (session.studentId !== studentId) {
            throw new errorHandler_1.AppError(403, '无权访问此会话', 'FORBIDDEN');
        }
        const stats = await mentorStageService_1.mentorStageService.getSessionStats(sessionId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error('获取会话统计失败', { error });
        throw error;
    }
}
/**
 * 确认需求理解（阶段1完成）
 */
async function confirmRequirementUnderstanding(req, res) {
    try {
        const { sessionId } = req.params;
        const { productFramework, score } = req.body;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        // 验证权限
        const session = await mentorStageService_1.mentorStageService.getSession(sessionId);
        if (!session) {
            throw new errorHandler_1.AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
        }
        if (session.studentId !== studentId) {
            throw new errorHandler_1.AppError(403, '无权访问此会话', 'FORBIDDEN');
        }
        // 更新会话
        await mentorStageService_1.mentorStageService.updateSession(sessionId, {
            requirementConfirmed: true,
            requirementUnderstandingScore: score,
            productFramework,
        });
        // 转换到执行引导阶段
        await mentorStageService_1.mentorStageService.transitionStage(sessionId, mentorStageService_1.MentorStage.EXECUTION_GUIDANCE);
        res.json({
            success: true,
            message: '需求理解确认成功，进入执行引导阶段',
        });
    }
    catch (error) {
        logger_1.default.error('确认需求理解失败', { error });
        throw error;
    }
}
// ========== 辅助函数 ==========
async function buildContextFromSession(session, currentMessage) {
    const { query, queryOne } = await Promise.resolve().then(() => __importStar(require('../utils/db')));
    // 获取任务信息
    const task = await queryOne(`SELECT t.*, c.company_name, c.industry
     FROM tasks t
     LEFT JOIN companies c ON t.company_id = c.id
     WHERE t.id = $1`, [session.taskId]);
    // 获取学生信息
    const student = await queryOne(`SELECT nickname, university, major FROM students WHERE id = $1`, [session.studentId]);
    return {
        taskTitle: task?.title || '',
        taskDescription: task?.description || '',
        taskRequirements: task?.requirements || '',
        taskDeadline: task?.deadline,
        studentName: student?.nickname || '同学',
        studentLevel: student?.university,
        studentMajor: student?.major,
        companyName: task?.company_name || '企业',
        companyIndustry: task?.industry,
        stageSpecificData: {
            studentQuestion: currentMessage,
        },
        conversationHistory: [],
    };
}
function mapModelRecommendation(recommendation) {
    switch (recommendation) {
        case 'opus':
            return 'claude-opus-4-7';
        case 'sonnet':
            return 'claude-sonnet-4-6';
        case 'haiku':
            return 'claude-haiku-4-5';
        default:
            return 'claude-sonnet-4-6';
    }
}
function calculateCost(model, tokens) {
    const pricing = {
        'claude-opus-4-7': { input: 15, output: 75 },
        'claude-sonnet-4-6': { input: 3, output: 15 },
        'claude-haiku-4-5': { input: 0.8, output: 4 },
    };
    const modelPricing = pricing[model] || pricing['claude-sonnet-4-6'];
    const avgPrice = (modelPricing.input + modelPricing.output) / 2;
    return (tokens / 1000000) * avgPrice;
}
async function analyzeAndUpdateStats(sessionId, stage, content) {
    // 简单的关键词分析
    if (stage === mentorStageService_1.MentorStage.EXECUTION_GUIDANCE) {
        // 检测是否包含鼓励性语言
        const encouragementKeywords = ['很好', '不错', '加油', '继续', '棒', '优秀', '进步'];
        if (encouragementKeywords.some(keyword => content.includes(keyword))) {
            await mentorStageService_1.mentorStageService.incrementStats(sessionId, 'encouragementCount');
        }
        // 检测是否推荐了工具
        const toolKeywords = ['推荐', '工具', '使用', '可以试试', '建议'];
        if (toolKeywords.some(keyword => content.includes(keyword))) {
            // 这里可以进一步提取具体的工具名称
            // 暂时只增加计数
        }
    }
}
// ========== 灵魂系统API ==========
/**
 * 获取学生成长仪表板
 */
async function getStudentGrowthDashboard(req, res) {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const dashboard = await mentorStageService_1.mentorStageService.getStudentGrowthDashboard(studentId);
        res.json({
            success: true,
            data: dashboard,
        });
    }
    catch (error) {
        logger_1.default.error('获取成长仪表板失败', { error });
        throw error;
    }
}
/**
 * 获取学生最近情绪
 */
async function getRecentEmotions(req, res) {
    try {
        const studentId = req.user?.userId;
        const { limit = 10 } = req.query;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const emotions = await emotionAnalysisService_1.emotionAnalysisService.getRecentEmotions(parseInt(studentId), parseInt(limit));
        res.json({
            success: true,
            data: emotions,
        });
    }
    catch (error) {
        logger_1.default.error('获取最近情绪失败', { error });
        throw error;
    }
}
/**
 * 获取学生成长里程碑
 */
async function getGrowthMilestones(req, res) {
    try {
        const studentId = req.user?.userId;
        const { limit = 10 } = req.query;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const milestones = await growthTrackingService_1.growthTrackingService.getRecentMilestones(parseInt(studentId), parseInt(limit));
        res.json({
            success: true,
            data: milestones,
        });
    }
    catch (error) {
        logger_1.default.error('获取成长里程碑失败', { error });
        throw error;
    }
}
/**
 * 获取未庆祝的里程碑
 */
async function getUncelebratedMilestones(req, res) {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const milestones = await mentorStageService_1.mentorStageService.getUncelebratedMilestones(studentId);
        res.json({
            success: true,
            data: milestones,
        });
    }
    catch (error) {
        logger_1.default.error('获取未庆祝里程碑失败', { error });
        throw error;
    }
}
/**
 * 庆祝里程碑
 */
async function celebrateMilestone(req, res) {
    try {
        const { milestoneId } = req.params;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        await mentorStageService_1.mentorStageService.celebrateMilestone(parseInt(milestoneId));
        res.json({
            success: true,
            message: '里程碑已庆祝',
        });
    }
    catch (error) {
        logger_1.default.error('庆祝里程碑失败', { error });
        throw error;
    }
}
/**
 * 获取导师记忆
 */
async function getMentorMemories(req, res) {
    try {
        const studentId = req.user?.userId;
        const { memoryType, memoryCategory, minImportance, limit = 10 } = req.query;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const memories = await mentorMemoryService_1.default.getAllMemories(parseInt(studentId), {
            memoryType: memoryType,
            memoryCategory: memoryCategory,
            minImportance: minImportance ? parseFloat(minImportance) : undefined,
            limit: parseInt(limit),
        });
        res.json({
            success: true,
            data: memories,
        });
    }
    catch (error) {
        logger_1.default.error('获取导师记忆失败', { error });
        throw error;
    }
}
/**
 * 获取记忆统计
 */
async function getMemoryStats(req, res) {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const stats = await mentorMemoryService_1.default.getMemoryStats(parseInt(studentId));
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error('获取记忆统计失败', { error });
        throw error;
    }
}
/**
 * 获取成长统计
 */
async function getGrowthStats(req, res) {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const stats = await growthTrackingService_1.growthTrackingService.getGrowthStats(parseInt(studentId));
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error('获取成长统计失败', { error });
        throw error;
    }
}
/**
 * 获取引导建议
 */
async function getGuidanceRecommendations(req, res) {
    try {
        const { sessionId } = req.params;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        // 验证权限
        const session = await mentorStageService_1.mentorStageService.getSession(sessionId);
        if (!session) {
            throw new errorHandler_1.AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
        }
        if (session.studentId !== studentId) {
            throw new errorHandler_1.AppError(403, '无权访问此会话', 'FORBIDDEN');
        }
        const recommendations = await mentorStageService_1.mentorStageService.getGuidanceRecommendations(sessionId);
        res.json({
            success: true,
            data: recommendations,
        });
    }
    catch (error) {
        logger_1.default.error('获取引导建议失败', { error });
        throw error;
    }
}
// ========== 工具推荐API ==========
/**
 * 获取工具推荐
 */
async function getToolRecommendations(req, res) {
    try {
        const { taskId } = req.params;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const tools = await toolRecommendationService_1.toolRecommendationService.recommendTools(parseInt(taskId), parseInt(studentId));
        res.json({
            success: true,
            data: tools,
        });
    }
    catch (error) {
        logger_1.default.error('获取工具推荐失败', { error });
        throw error;
    }
}
/**
 * 反馈工具使用情况
 */
async function feedbackToolUsage(req, res) {
    try {
        const { trackingId } = req.params;
        const { tried, succeeded, difficultyLevel, timeToLearnMinutes, comment, wouldRecommend } = req.body;
        const studentId = req.user?.userId;
        if (!studentId) {
            throw new errorHandler_1.AppError(401, '未授权', 'UNAUTHORIZED');
        }
        const result = await toolRecommendationService_1.toolRecommendationService.recordToolUsage(parseInt(trackingId), {
            tried,
            succeeded,
            difficultyLevel,
            timeToLearnMinutes,
            comment,
            wouldRecommend
        });
        res.json({
            success: result.success,
            message: result.message,
        });
    }
    catch (error) {
        logger_1.default.error('反馈工具使用失败', { error });
        throw error;
    }
}
/**
 * 获取热门工具
 */
async function getPopularTools(req, res) {
    try {
        const { category, limit = 5 } = req.query;
        const tools = await toolRecommendationService_1.toolRecommendationService.getPopularTools(category, parseInt(limit));
        res.json({
            success: true,
            data: tools,
        });
    }
    catch (error) {
        logger_1.default.error('获取热门工具失败', { error });
        throw error;
    }
}
// ========== 主动跟进API ==========
/**
 * 手动触发主动跟进（管理员功能）
 */
async function triggerFollowUps(req, res) {
    try {
        // 这里应该检查管理员权限
        // if (!req.user?.isAdmin) {
        //   throw new AppError(403, '需要管理员权限', 'FORBIDDEN');
        // }
        const result = await mentorScheduler_1.mentorScheduler.triggerFollowUps();
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('触发主动跟进失败', { error });
        throw error;
    }
}
/**
 * 获取调度器状态（管理员功能）
 */
async function getSchedulerStatus(req, res) {
    try {
        const status = mentorScheduler_1.mentorScheduler.getStatus();
        res.json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        logger_1.default.error('获取调度器状态失败', { error });
        throw error;
    }
}
//# sourceMappingURL=mentorStageController.js.map