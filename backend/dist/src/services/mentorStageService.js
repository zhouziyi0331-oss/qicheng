"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorStageService = exports.MentorStageService = exports.StageStatus = exports.MentorStage = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const emotionAnalysisService_1 = require("./emotionAnalysisService");
const growthTrackingService_1 = require("./growthTrackingService");
const mentorMemoryService_1 = __importDefault(require("./mentorMemoryService"));
const adaptiveGuidanceService_1 = require("./adaptiveGuidanceService");
const humanizedConversationService_1 = require("./humanizedConversationService");
/**
 * AI导师阶段管理服务（终极版 - 有温度的陪伴）
 * 负责管理4个阶段的会话、消息和状态转换
 * 集成情绪感知、成长追踪、记忆系统、自适应引导和人性化对话
 */
var MentorStage;
(function (MentorStage) {
    MentorStage["REQUIREMENT_UNDERSTANDING"] = "requirement_understanding";
    MentorStage["EXECUTION_GUIDANCE"] = "execution_guidance";
    MentorStage["QUALITY_REVIEW"] = "quality_review";
    MentorStage["COMMUNICATION_BRIDGE"] = "communication_bridge";
})(MentorStage || (exports.MentorStage = MentorStage = {}));
var StageStatus;
(function (StageStatus) {
    StageStatus["IN_PROGRESS"] = "in_progress";
    StageStatus["COMPLETED"] = "completed";
    StageStatus["SKIPPED"] = "skipped";
})(StageStatus || (exports.StageStatus = StageStatus = {}));
class MentorStageService {
    /**
     * 创建新的导师会话
     */
    async createSession(taskId, studentId) {
        try {
            // 检查是否已存在会话
            const existing = await (0, db_1.queryOne)('SELECT id FROM mentor_stage_sessions WHERE task_id = $1', [taskId]);
            if (existing) {
                logger_1.default.info('导师会话已存在', { taskId, sessionId: existing.id });
                return existing.id;
            }
            // 创建新会话
            const result = await (0, db_1.queryOne)(`INSERT INTO mentor_stage_sessions (task_id, student_id, current_stage, stage_status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`, [taskId, studentId, MentorStage.REQUIREMENT_UNDERSTANDING, StageStatus.IN_PROGRESS]);
            if (!result) {
                throw new Error('创建会话失败');
            }
            logger_1.default.info('创建导师会话', { taskId, studentId, sessionId: result.id });
            return result.id;
        }
        catch (error) {
            logger_1.default.error('创建导师会话失败', { error, taskId, studentId });
            throw error;
        }
    }
    /**
     * 获取会话信息
     */
    async getSession(sessionId) {
        try {
            const result = await (0, db_1.queryOne)(`SELECT
          id, task_id, student_id, current_stage, stage_status,
          requirement_understanding_score, requirement_confirmed, product_framework,
          guidance_count, encouragement_count, tools_recommended,
          pre_review_count, pre_review_passed, final_review_score,
          translation_count, communication_resolved,
          total_messages, total_tokens_used, total_cost,
          started_at, completed_at, created_at, updated_at
         FROM mentor_stage_sessions
         WHERE id = $1`, [sessionId]);
            if (!result)
                return null;
            return {
                id: result.id,
                taskId: result.task_id,
                studentId: result.student_id,
                currentStage: result.current_stage,
                stageStatus: result.stage_status,
                requirementUnderstandingScore: result.requirement_understanding_score,
                requirementConfirmed: result.requirement_confirmed,
                productFramework: result.product_framework,
                guidanceCount: result.guidance_count,
                encouragementCount: result.encouragement_count,
                toolsRecommended: result.tools_recommended || [],
                preReviewCount: result.pre_review_count,
                preReviewPassed: result.pre_review_passed,
                finalReviewScore: result.final_review_score,
                translationCount: result.translation_count,
                communicationResolved: result.communication_resolved,
                totalMessages: result.total_messages,
                totalTokensUsed: result.total_tokens_used,
                totalCost: parseFloat(result.total_cost || 0),
                startedAt: result.started_at,
                completedAt: result.completed_at,
                createdAt: result.created_at,
                updatedAt: result.updated_at,
            };
        }
        catch (error) {
            logger_1.default.error('获取导师会话失败', { error, sessionId });
            throw error;
        }
    }
    /**
     * 根据任务ID获取会话
     */
    async getSessionByTaskId(taskId) {
        try {
            const result = await (0, db_1.queryOne)('SELECT id FROM mentor_stage_sessions WHERE task_id = $1', [taskId]);
            if (!result)
                return null;
            return this.getSession(result.id);
        }
        catch (error) {
            logger_1.default.error('根据任务ID获取会话失败', { error, taskId });
            throw error;
        }
    }
    /**
     * 更新阶段
     */
    async transitionStage(sessionId, newStage) {
        try {
            await (0, db_1.query)(`UPDATE mentor_stage_sessions
         SET current_stage = $1, updated_at = NOW()
         WHERE id = $2`, [newStage, sessionId]);
            logger_1.default.info('导师阶段转换', { sessionId, newStage });
        }
        catch (error) {
            logger_1.default.error('导师阶段转换失败', { error, sessionId, newStage });
            throw error;
        }
    }
    /**
     * 更新会话字段
     */
    async updateSession(sessionId, updates) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;
            // 构建动态更新语句
            if (updates.requirementUnderstandingScore !== undefined) {
                fields.push(`requirement_understanding_score = $${paramIndex++}`);
                values.push(updates.requirementUnderstandingScore);
            }
            if (updates.requirementConfirmed !== undefined) {
                fields.push(`requirement_confirmed = $${paramIndex++}`);
                values.push(updates.requirementConfirmed);
            }
            if (updates.productFramework !== undefined) {
                fields.push(`product_framework = $${paramIndex++}`);
                values.push(updates.productFramework);
            }
            if (updates.guidanceCount !== undefined) {
                fields.push(`guidance_count = $${paramIndex++}`);
                values.push(updates.guidanceCount);
            }
            if (updates.encouragementCount !== undefined) {
                fields.push(`encouragement_count = $${paramIndex++}`);
                values.push(updates.encouragementCount);
            }
            if (updates.toolsRecommended !== undefined) {
                fields.push(`tools_recommended = $${paramIndex++}`);
                values.push(JSON.stringify(updates.toolsRecommended));
            }
            if (updates.preReviewCount !== undefined) {
                fields.push(`pre_review_count = $${paramIndex++}`);
                values.push(updates.preReviewCount);
            }
            if (updates.preReviewPassed !== undefined) {
                fields.push(`pre_review_passed = $${paramIndex++}`);
                values.push(updates.preReviewPassed);
            }
            if (updates.finalReviewScore !== undefined) {
                fields.push(`final_review_score = $${paramIndex++}`);
                values.push(updates.finalReviewScore);
            }
            if (updates.translationCount !== undefined) {
                fields.push(`translation_count = $${paramIndex++}`);
                values.push(updates.translationCount);
            }
            if (updates.communicationResolved !== undefined) {
                fields.push(`communication_resolved = $${paramIndex++}`);
                values.push(updates.communicationResolved);
            }
            if (updates.stageStatus !== undefined) {
                fields.push(`stage_status = $${paramIndex++}`);
                values.push(updates.stageStatus);
            }
            if (updates.completedAt !== undefined) {
                fields.push(`completed_at = $${paramIndex++}`);
                values.push(updates.completedAt);
            }
            if (fields.length === 0)
                return;
            fields.push(`updated_at = NOW()`);
            values.push(sessionId);
            const sql = `UPDATE mentor_stage_sessions SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
            await (0, db_1.query)(sql, values);
            logger_1.default.info('更新导师会话', { sessionId, updates });
        }
        catch (error) {
            logger_1.default.error('更新导师会话失败', { error, sessionId, updates });
            throw error;
        }
    }
    /**
     * 保存消息（增强版 - 带情绪分析和记忆提取）
     */
    async saveMessage(sessionId, role, content, metadata) {
        try {
            // 获取当前阶段
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error('会话不存在');
            }
            const stage = metadata?.stage || session.currentStage;
            // 插入消息
            const result = await (0, db_1.queryOne)(`INSERT INTO mentor_stage_messages
         (session_id, stage, role, content, model_used, tokens_used, cost, response_time_ms, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`, [
                sessionId,
                stage,
                role,
                content,
                metadata?.modelUsed || null,
                metadata?.tokensUsed || null,
                metadata?.cost || null,
                metadata?.responseTimeMs || null,
                metadata?.extra ? JSON.stringify(metadata.extra) : null,
            ]);
            if (!result) {
                throw new Error('保存消息失败');
            }
            const messageId = result.id;
            // 更新会话统计
            await (0, db_1.query)(`UPDATE mentor_stage_sessions
         SET total_messages = total_messages + 1,
             total_tokens_used = total_tokens_used + $1,
             total_cost = total_cost + $2,
             updated_at = NOW()
         WHERE id = $3`, [metadata?.tokensUsed || 0, metadata?.cost || 0, sessionId]);
            // 如果是学生消息，异步进行情绪分析和记忆提取
            if (role === 'student') {
                this.processStudentMessage(session.studentId, session.taskId, sessionId, messageId, content).catch(err => {
                    logger_1.default.error('处理学生消息失败', { error: err, messageId });
                });
            }
            logger_1.default.info('保存导师消息', { sessionId, role, messageId });
            return messageId;
        }
        catch (error) {
            logger_1.default.error('保存导师消息失败', { error, sessionId, role });
            throw error;
        }
    }
    /**
     * 处理学生消息（情绪分析、成长检测、记忆提取）
     */
    async processStudentMessage(studentId, taskId, sessionId, messageId, content) {
        try {
            // 获取对话历史
            const messages = await this.getMessages(sessionId, 10);
            const conversationHistory = messages.reverse().map(m => ({
                role: m.role,
                content: m.content
            }));
            // 1. 情绪分析
            const emotionResult = await emotionAnalysisService_1.emotionAnalysisService.analyzeEmotion(parseInt(studentId), parseInt(taskId), parseInt(sessionId), parseInt(messageId), content, this.buildContextSummary(conversationHistory));
            // 2. 成长里程碑检测
            const recentEmotions = await emotionAnalysisService_1.emotionAnalysisService.getRecentEmotions(parseInt(studentId), 5);
            await growthTrackingService_1.growthTrackingService.detectAndRecordMilestone(parseInt(studentId), parseInt(taskId), parseInt(sessionId), {
                currentMessage: content,
                previousMessages: conversationHistory,
                currentEmotion: emotionResult.emotion,
                previousEmotions: recentEmotions
            });
            // 3. 记忆提取（每5条消息分析一次）
            if (messages.length % 5 === 0) {
                await mentorMemoryService_1.default.extractMemoryFromConversation(parseInt(studentId), parseInt(taskId), parseInt(sessionId), conversationHistory, emotionResult.emotion);
            }
            // 4. 定期更新学习模式（每10条消息）
            if (messages.length % 10 === 0) {
                await adaptiveGuidanceService_1.adaptiveGuidanceService.analyzeAndUpdateLearningPatterns(parseInt(studentId), parseInt(sessionId));
            }
        }
        catch (error) {
            logger_1.default.error('处理学生消息失败', { error, studentId, messageId });
        }
    }
    /**
     * 构建上下文摘要
     */
    buildContextSummary(history) {
        return history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
    }
    /**
     * 生成自适应引导回复（终极版 - 人性化）
     */
    async generateAdaptiveResponse(sessionId, studentMessage) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error('会话不存在');
            }
            // 获取对话历史
            const messages = await this.getMessages(sessionId, 10);
            const conversationHistory = messages.reverse().map(m => ({
                role: m.role,
                content: m.content
            }));
            // 先进行情绪分析
            const emotionResult = await emotionAnalysisService_1.emotionAnalysisService.analyzeEmotion(parseInt(session.studentId), parseInt(session.taskId), parseInt(sessionId), null, studentMessage, this.buildContextSummary(conversationHistory));
            // 使用人性化对话服务生成回复
            const humanizedResponse = await humanizedConversationService_1.humanizedConversationService.generateHumanizedResponse(parseInt(session.studentId), parseInt(session.taskId), parseInt(sessionId), studentMessage, conversationHistory, emotionResult.emotion);
            return {
                content: humanizedResponse.content,
                metadata: {
                    detectedEmotion: emotionResult.emotion,
                    emotionIntensity: emotionResult.intensity,
                    tone: humanizedResponse.tone,
                    hasEmpathy: humanizedResponse.hasEmpathy,
                    hasWarmth: humanizedResponse.hasWarmth,
                    remembersPast: humanizedResponse.remembersPast,
                    toolRecommendations: humanizedResponse.toolRecommendations,
                    followUpTopics: humanizedResponse.followUpTopics
                }
            };
        }
        catch (error) {
            logger_1.default.error('生成人性化回复失败', { error, sessionId });
            throw error;
        }
    }
    /**
     * 获取消息历史
     */
    async getMessages(sessionId, limit = 50, offset = 0) {
        try {
            const results = await (0, db_1.query)(`SELECT
          id, session_id, stage, role, content,
          model_used, tokens_used, cost, response_time_ms, metadata,
          created_at
         FROM mentor_stage_messages
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`, [sessionId, limit, offset]);
            return results.map((row) => ({
                id: row.id,
                sessionId: row.session_id,
                stage: row.stage,
                role: row.role,
                content: row.content,
                modelUsed: row.model_used,
                tokensUsed: row.tokens_used,
                cost: row.cost ? parseFloat(row.cost) : undefined,
                responseTimeMs: row.response_time_ms,
                metadata: row.metadata,
                createdAt: row.created_at,
            }));
        }
        catch (error) {
            logger_1.default.error('获取导师消息历史失败', { error, sessionId });
            throw error;
        }
    }
    /**
     * 更新统计（增量）
     */
    async incrementStats(sessionId, field, increment = 1) {
        try {
            const fieldMap = {
                guidanceCount: 'guidance_count',
                encouragementCount: 'encouragement_count',
                preReviewCount: 'pre_review_count',
                translationCount: 'translation_count',
            };
            const dbField = fieldMap[field];
            await (0, db_1.query)(`UPDATE mentor_stage_sessions
         SET ${dbField} = ${dbField} + $1, updated_at = NOW()
         WHERE id = $2`, [increment, sessionId]);
            logger_1.default.info('更新导师统计', { sessionId, field, increment });
        }
        catch (error) {
            logger_1.default.error('更新导师统计失败', { error, sessionId, field });
            throw error;
        }
    }
    /**
     * 添加推荐工具
     */
    async addRecommendedTool(sessionId, tool) {
        try {
            await (0, db_1.query)(`UPDATE mentor_stage_sessions
         SET tools_recommended = tools_recommended || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`, [JSON.stringify([tool]), sessionId]);
            logger_1.default.info('添加推荐工具', { sessionId, tool });
        }
        catch (error) {
            logger_1.default.error('添加推荐工具失败', { error, sessionId, tool });
            throw error;
        }
    }
    /**
     * 获取会话统计（增强版 - 包含情绪和成长数据）
     */
    async getSessionStats(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error('会话不存在');
            }
            const messageStats = await (0, db_1.query)(`SELECT
          role,
          COUNT(*) as count,
          AVG(response_time_ms) as avg_response_time
         FROM mentor_stage_messages
         WHERE session_id = $1
         GROUP BY role`, [sessionId]);
            const messagesByRole = {
                student: 0,
                mentor: 0,
                system: 0,
            };
            let totalResponseTime = 0;
            let responseCount = 0;
            messageStats.forEach((row) => {
                messagesByRole[row.role] = parseInt(row.count);
                if (row.avg_response_time) {
                    totalResponseTime += parseFloat(row.avg_response_time);
                    responseCount++;
                }
            });
            // 获取情绪摘要
            const recentEmotions = await emotionAnalysisService_1.emotionAnalysisService.getRecentEmotions(parseInt(session.studentId), 5);
            // 获取成长摘要
            const recentMilestones = await growthTrackingService_1.growthTrackingService.getRecentMilestones(parseInt(session.studentId), 3);
            return {
                totalMessages: session.totalMessages,
                totalTokensUsed: session.totalTokensUsed,
                totalCost: session.totalCost,
                messagesByRole,
                averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
                emotionSummary: {
                    currentEmotion: recentEmotions[0]?.emotion || 'neutral',
                    recentEmotions: recentEmotions.map(e => ({
                        emotion: e.emotion,
                        intensity: e.intensity
                    }))
                },
                growthSummary: {
                    milestonesAchieved: recentMilestones.length,
                    recentMilestones: recentMilestones.map((m) => ({
                        title: m.milestone_title,
                        type: m.milestone_type
                    }))
                }
            };
        }
        catch (error) {
            logger_1.default.error('获取会话统计失败', { error, sessionId });
            throw error;
        }
    }
    /**
     * 获取学生的完整成长仪表板
     */
    async getStudentGrowthDashboard(studentId) {
        try {
            const result = await (0, db_1.queryOne)(`SELECT * FROM student_growth_dashboard WHERE student_id = $1`, [studentId]);
            // 获取最近解锁的天赋标签（最近7天内解锁的，最多5个）
            const recentTagsResult = await (0, db_1.query)(`SELECT
           tt.tag_name,
           tt.description as tag_description,
           stt.strength,
           stt.first_observed_at as unlocked_at
         FROM student_talent_tags stt
         JOIN talent_tags tt ON stt.tag_id = tt.id
         WHERE stt.student_id = $1
           AND stt.first_observed_at >= NOW() - INTERVAL '7 days'
         ORDER BY stt.first_observed_at DESC
         LIMIT 5`, [studentId]);
            return {
                ...result,
                recentUnlockedTags: recentTagsResult || []
            };
        }
        catch (error) {
            logger_1.default.error('获取成长仪表板失败', { error, studentId });
            return null;
        }
    }
    /**
     * 获取未庆祝的里程碑
     */
    async getUncelebratedMilestones(studentId) {
        try {
            return await growthTrackingService_1.growthTrackingService.getUncelebratedMilestones(parseInt(studentId));
        }
        catch (error) {
            logger_1.default.error('获取未庆祝里程碑失败', { error, studentId });
            return [];
        }
    }
    /**
     * 标记里程碑为已庆祝
     */
    async celebrateMilestone(milestoneId) {
        try {
            await growthTrackingService_1.growthTrackingService.markAsCelebrated(milestoneId);
        }
        catch (error) {
            logger_1.default.error('标记里程碑已庆祝失败', { error, milestoneId });
        }
    }
    /**
     * 获取引导建议
     */
    async getGuidanceRecommendations(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error('会话不存在');
            }
            return await adaptiveGuidanceService_1.adaptiveGuidanceService.getGuidanceRecommendations(parseInt(session.studentId), parseInt(sessionId));
        }
        catch (error) {
            logger_1.default.error('获取引导建议失败', { error, sessionId });
            return null;
        }
    }
}
exports.MentorStageService = MentorStageService;
exports.mentorStageService = new MentorStageService();
//# sourceMappingURL=mentorStageService.js.map