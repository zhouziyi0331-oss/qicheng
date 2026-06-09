"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorTriggerService = exports.MentorTriggerService = exports.TriggerType = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const mentorStageService_1 = require("./mentorStageService");
const mentorPromptBuilder_1 = require("./mentorPromptBuilder");
const aiServiceClient_1 = require("./aiServiceClient");
/**
 * AI导师触发服务
 * 负责在任务流程的关键节点自动触发导师对话
 */
var TriggerType;
(function (TriggerType) {
    TriggerType["TASK_ACCEPTED"] = "task_accepted";
    TriggerType["EXECUTION_STARTED"] = "execution_started";
    TriggerType["STUDENT_STUCK"] = "student_stuck";
    TriggerType["SUBMISSION_READY"] = "submission_ready";
    TriggerType["COMPANY_FEEDBACK"] = "company_feedback";
    TriggerType["MANUAL"] = "manual";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
class MentorTriggerService {
    /**
     * 触发需求理解阶段（任务接单后24小时内）
     */
    async triggerRequirementUnderstanding(taskId, studentId) {
        try {
            logger_1.default.info('触发需求理解阶段', { taskId, studentId });
            // 创建会话
            const sessionId = await mentorStageService_1.mentorStageService.createSession(taskId, studentId);
            // 记录触发事件
            await this.recordTrigger(sessionId, TriggerType.TASK_ACCEPTED, {
                taskId,
                studentId,
            });
            // 获取任务和用户信息
            const context = await this.buildContext(taskId, studentId);
            // 构建Prompt
            const prompt = await mentorPromptBuilder_1.mentorPromptBuilder.buildPrompt(mentorStageService_1.MentorStage.REQUIREMENT_UNDERSTANDING, context);
            // 调用AI生成开场白
            const startTime = Date.now();
            const response = await aiServiceClient_1.aiServiceClient.chat({
                model: this.mapModelRecommendation(prompt.modelRecommendation),
                messages: [
                    { role: 'system', content: prompt.systemPrompt },
                    { role: 'user', content: prompt.userPrompt },
                ],
                max_tokens: prompt.maxTokens,
                temperature: prompt.temperature,
            });
            const responseTime = Date.now() - startTime;
            // 保存导师消息
            await mentorStageService_1.mentorStageService.saveMessage(sessionId, 'mentor', response.content, {
                stage: mentorStageService_1.MentorStage.REQUIREMENT_UNDERSTANDING,
                modelUsed: response.model,
                tokensUsed: response.usage.total_tokens,
                cost: this.calculateCost(response.model, response.usage.total_tokens),
                responseTimeMs: responseTime,
            });
            // 保存系统消息（触发说明）
            await mentorStageService_1.mentorStageService.saveMessage(sessionId, 'system', '任务接单成功，启动需求理解阶段', { stage: mentorStageService_1.MentorStage.REQUIREMENT_UNDERSTANDING });
            logger_1.default.info('需求理解阶段触发成功', { taskId, studentId, sessionId });
        }
        catch (error) {
            logger_1.default.error('触发需求理解阶段失败', { error, taskId, studentId });
            throw error;
        }
    }
    /**
     * 触发执行引导阶段（学生开始执行后）
     */
    async triggerExecutionGuidance(taskId, studentId, studentQuestion) {
        try {
            logger_1.default.info('触发执行引导阶段', { taskId, studentId });
            // 获取或创建会话
            let session = await mentorStageService_1.mentorStageService.getSessionByTaskId(taskId);
            if (!session) {
                const sessionId = await mentorStageService_1.mentorStageService.createSession(taskId, studentId);
                session = await mentorStageService_1.mentorStageService.getSession(sessionId);
            }
            if (!session) {
                throw new Error('无法创建会话');
            }
            // 转换到执行引导阶段
            await mentorStageService_1.mentorStageService.transitionStage(session.id, mentorStageService_1.MentorStage.EXECUTION_GUIDANCE);
            // 记录触发事件
            await this.recordTrigger(session.id, TriggerType.EXECUTION_STARTED, {
                taskId,
                studentId,
                studentQuestion,
            });
            // 获取上下文
            const context = await this.buildContext(taskId, studentId, {
                studentQuestion: studentQuestion || '我准备开始执行任务了',
            });
            // 获取会话历史
            const messages = await mentorStageService_1.mentorStageService.getMessages(session.id, 10);
            context.conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));
            // 构建Prompt
            const prompt = await mentorPromptBuilder_1.mentorPromptBuilder.buildPrompt(mentorStageService_1.MentorStage.EXECUTION_GUIDANCE, context);
            // 调用AI
            const startTime = Date.now();
            const response = await aiServiceClient_1.aiServiceClient.chat({
                model: this.mapModelRecommendation(prompt.modelRecommendation),
                messages: [
                    { role: 'system', content: prompt.systemPrompt },
                    { role: 'user', content: prompt.userPrompt },
                ],
                max_tokens: prompt.maxTokens,
                temperature: prompt.temperature,
            });
            const responseTime = Date.now() - startTime;
            // 保存消息
            await mentorStageService_1.mentorStageService.saveMessage(session.id, 'mentor', response.content, {
                stage: mentorStageService_1.MentorStage.EXECUTION_GUIDANCE,
                modelUsed: response.model,
                tokensUsed: response.usage.total_tokens,
                cost: this.calculateCost(response.model, response.usage.total_tokens),
                responseTimeMs: responseTime,
            });
            // 更新统计
            await mentorStageService_1.mentorStageService.incrementStats(session.id, 'guidanceCount');
            logger_1.default.info('执行引导阶段触发成功', { taskId, studentId, sessionId: session.id });
        }
        catch (error) {
            logger_1.default.error('触发执行引导阶段失败', { error, taskId, studentId });
            throw error;
        }
    }
    /**
     * 触发质量预审阶段（学生准备提交前）
     */
    async triggerQualityReview(taskId, studentId, submission) {
        try {
            logger_1.default.info('触发质量预审阶段', { taskId, studentId });
            // 获取会话
            let session = await mentorStageService_1.mentorStageService.getSessionByTaskId(taskId);
            if (!session) {
                const sessionId = await mentorStageService_1.mentorStageService.createSession(taskId, studentId);
                session = await mentorStageService_1.mentorStageService.getSession(sessionId);
            }
            if (!session) {
                throw new Error('无法创建会话');
            }
            // 转换到质量预审阶段
            await mentorStageService_1.mentorStageService.transitionStage(session.id, mentorStageService_1.MentorStage.QUALITY_REVIEW);
            // 记录触发事件
            await this.recordTrigger(session.id, TriggerType.SUBMISSION_READY, {
                taskId,
                studentId,
                submissionLength: submission.length,
            });
            // 获取上下文
            const context = await this.buildContext(taskId, studentId, {
                submission,
            });
            // 构建Prompt
            const prompt = await mentorPromptBuilder_1.mentorPromptBuilder.buildPrompt(mentorStageService_1.MentorStage.QUALITY_REVIEW, context);
            // 调用AI（使用Opus进行质量审核）
            const startTime = Date.now();
            const response = await aiServiceClient_1.aiServiceClient.chat({
                model: 'claude-opus-4-7',
                messages: [
                    { role: 'system', content: prompt.systemPrompt },
                    { role: 'user', content: prompt.userPrompt },
                ],
                max_tokens: 3000,
                temperature: 0.5,
            });
            const responseTime = Date.now() - startTime;
            // 解析评分（从AI回复中提取）
            const scoreMatch = response.content.match(/总体评分[：:]\s*(\d+)\/100/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
            const passed = score >= 70;
            // 保存消息
            await mentorStageService_1.mentorStageService.saveMessage(session.id, 'mentor', response.content, {
                stage: mentorStageService_1.MentorStage.QUALITY_REVIEW,
                modelUsed: response.model,
                tokensUsed: response.usage.total_tokens,
                cost: this.calculateCost(response.model, response.usage.total_tokens),
                responseTimeMs: responseTime,
                extra: { score, passed },
            });
            // 更新会话
            await mentorStageService_1.mentorStageService.updateSession(session.id, {
                preReviewPassed: passed,
                finalReviewScore: score,
            });
            await mentorStageService_1.mentorStageService.incrementStats(session.id, 'preReviewCount');
            logger_1.default.info('质量预审完成', { taskId, studentId, score, passed });
            return {
                passed,
                score,
                feedback: response.content,
            };
        }
        catch (error) {
            logger_1.default.error('触发质量预审阶段失败', { error, taskId, studentId });
            throw error;
        }
    }
    /**
     * 触发沟通桥梁阶段（企业反馈后）
     */
    async triggerCommunicationBridge(taskId, studentId, companyFeedback) {
        try {
            logger_1.default.info('触发沟通桥梁阶段', { taskId, studentId });
            // 获取会话
            let session = await mentorStageService_1.mentorStageService.getSessionByTaskId(taskId);
            if (!session) {
                const sessionId = await mentorStageService_1.mentorStageService.createSession(taskId, studentId);
                session = await mentorStageService_1.mentorStageService.getSession(sessionId);
            }
            if (!session) {
                throw new Error('无法创建会话');
            }
            // 转换到沟通桥梁阶段
            await mentorStageService_1.mentorStageService.transitionStage(session.id, mentorStageService_1.MentorStage.COMMUNICATION_BRIDGE);
            // 记录触发事件
            await this.recordTrigger(session.id, TriggerType.COMPANY_FEEDBACK, {
                taskId,
                studentId,
                feedbackLength: companyFeedback.length,
            });
            // 获取上下文
            const context = await this.buildContext(taskId, studentId, {
                companyFeedback,
            });
            // 获取会话历史
            const messages = await mentorStageService_1.mentorStageService.getMessages(session.id, 10);
            context.conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));
            // 构建Prompt
            const prompt = await mentorPromptBuilder_1.mentorPromptBuilder.buildPrompt(mentorStageService_1.MentorStage.COMMUNICATION_BRIDGE, context);
            // 调用AI
            const startTime = Date.now();
            const response = await aiServiceClient_1.aiServiceClient.chat({
                model: this.mapModelRecommendation(prompt.modelRecommendation),
                messages: [
                    { role: 'system', content: prompt.systemPrompt },
                    { role: 'user', content: prompt.userPrompt },
                ],
                max_tokens: prompt.maxTokens,
                temperature: prompt.temperature,
            });
            const responseTime = Date.now() - startTime;
            // 保存消息
            await mentorStageService_1.mentorStageService.saveMessage(session.id, 'mentor', response.content, {
                stage: mentorStageService_1.MentorStage.COMMUNICATION_BRIDGE,
                modelUsed: response.model,
                tokensUsed: response.usage.total_tokens,
                cost: this.calculateCost(response.model, response.usage.total_tokens),
                responseTimeMs: responseTime,
            });
            // 更新统计
            await mentorStageService_1.mentorStageService.incrementStats(session.id, 'translationCount');
            logger_1.default.info('沟通桥梁阶段触发成功', { taskId, studentId, sessionId: session.id });
        }
        catch (error) {
            logger_1.default.error('触发沟通桥梁阶段失败', { error, taskId, studentId });
            throw error;
        }
    }
    /**
     * 记录触发事件
     */
    async recordTrigger(sessionId, triggerType, metadata) {
        try {
            await (0, db_1.query)(`INSERT INTO mentor_stage_triggers
         (session_id, trigger_type, trigger_condition, fired_at)
         VALUES ($1, $2, $3, NOW())`, [sessionId, triggerType, JSON.stringify(metadata)]);
        }
        catch (error) {
            logger_1.default.error('记录触发事件失败', { error, sessionId, triggerType });
            // 不抛出错误，避免影响主流程
        }
    }
    /**
     * 构建上下文
     */
    async buildContext(taskId, studentId, stageSpecificData) {
        try {
            // 获取任务信息
            const task = await (0, db_1.queryOne)(`SELECT t.*, c.company_name, c.industry
         FROM tasks t
         LEFT JOIN companies c ON t.company_id = c.id
         WHERE t.id = $1`, [taskId]);
            if (!task) {
                throw new Error('任务不存在');
            }
            // 获取学生信息
            const student = await (0, db_1.queryOne)(`SELECT nickname, university, major FROM students WHERE id = $1`, [studentId]);
            return {
                taskTitle: task.title,
                taskDescription: task.description,
                taskRequirements: task.requirements,
                taskDeadline: task.deadline,
                studentName: student?.nickname || '同学',
                studentLevel: student?.university || undefined,
                studentMajor: student?.major || undefined,
                companyName: task.company_name || '企业',
                companyIndustry: task.industry || undefined,
                stageSpecificData,
            };
        }
        catch (error) {
            logger_1.default.error('构建上下文失败', { error, taskId, studentId });
            throw error;
        }
    }
    /**
     * 映射模型推荐
     */
    mapModelRecommendation(recommendation) {
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
    /**
     * 计算成本（简化版）
     */
    calculateCost(model, tokens) {
        // 价格（美元/百万tokens）
        const pricing = {
            'claude-opus-4-7': { input: 15, output: 75 },
            'claude-sonnet-4-6': { input: 3, output: 15 },
            'claude-haiku-4-5': { input: 0.8, output: 4 },
        };
        const modelPricing = pricing[model] || pricing['claude-sonnet-4-6'];
        // 简化计算：假设input和output各占一半
        const avgPrice = (modelPricing.input + modelPricing.output) / 2;
        return (tokens / 1000000) * avgPrice;
    }
}
exports.MentorTriggerService = MentorTriggerService;
exports.mentorTriggerService = new MentorTriggerService();
//# sourceMappingURL=mentorTriggerService.js.map