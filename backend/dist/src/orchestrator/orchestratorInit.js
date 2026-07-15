"use strict";
/**
 * 编排器初始化
 * 注册所有Agent到编排器
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeOrchestrator = initializeOrchestrator;
exports.triggerMentorMessage = triggerMentorMessage;
exports.triggerTaskAccepted = triggerTaskAccepted;
exports.triggerTaskCompleted = triggerTaskCompleted;
exports.triggerEmotionDistress = triggerEmotionDistress;
exports.triggerDemandParsing = triggerDemandParsing;
exports.triggerReportGeneration = triggerReportGeneration;
exports.triggerLevelUpgrade = triggerLevelUpgrade;
exports.triggerTaskCompletedWithReport = triggerTaskCompletedWithReport;
const agentOrchestrator_1 = require("./agentOrchestrator");
const mentorCompanionAgentEnhanced_1 = require("../agents/mentorCompanionAgentEnhanced");
const taskBreakdownService_1 = __importDefault(require("../services/taskBreakdownService"));
const reportGeneratorAgent_1 = __importDefault(require("../agents/reportGeneratorAgent"));
const reportTriggerService_1 = __importDefault(require("../services/reportTriggerService"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 初始化编排器，注册所有Agent
 */
function initializeOrchestrator() {
    logger_1.default.info('🚀 初始化Agent编排器...');
    // 注册导师Agent（增强版）
    agentOrchestrator_1.orchestrator.registerAgent('mentorCompanionAgent', async (eventData) => {
        const { userId, message, context } = eventData;
        // 根据事件类型确定触发场景
        let trigger = agentOrchestrator_1.MentorTrigger.USER_INITIATED;
        // 可以根据eventData中的信息推断trigger
        if (context?.trigger) {
            trigger = context.trigger;
        }
        // 使用handleTrigger来调用专门的场景处理逻辑
        return mentorCompanionAgentEnhanced_1.mentorCompanionAgentEnhanced.handleTrigger(userId, trigger, { ...context, message });
    });
    // 注册天赋测评Agent（占位符，Phase R3实现）
    agentOrchestrator_1.orchestrator.registerAgent('talentAssessmentAgent', async (eventData) => {
        logger_1.default.info(`[占位符] 天赋测评Agent被调用: userId=${eventData.userId}`);
        return {
            success: true,
            agentName: 'talentAssessmentAgent',
            data: { message: 'Phase R3将实现' },
            duration: 0
        };
    });
    // 注册质控Agent（占位符，Phase R2实现）
    agentOrchestrator_1.orchestrator.registerAgent('qualityControlAgent', async (eventData) => {
        logger_1.default.info(`[占位符] 质控Agent被调用: userId=${eventData.userId}, taskId=${eventData.taskId}`);
        return {
            success: true,
            agentName: 'qualityControlAgent',
            data: { message: 'Phase R2将实现' },
            duration: 0
        };
    });
    // 注册需求拆解Agent（Phase R3实现）
    agentOrchestrator_1.orchestrator.registerAgent('demandParserAgent', async (eventData) => {
        const startTime = Date.now();
        try {
            const { taskId, context } = eventData;
            if (!taskId) {
                throw new Error('taskId is required for demandParserAgent');
            }
            // 从context中获取任务描述
            const rawDescription = context?.taskDescription || context?.description;
            if (!rawDescription) {
                throw new Error('Task description is required for breakdown');
            }
            logger_1.default.info(`[需求拆解Agent] 开始拆解任务: taskId=${taskId}`);
            // 调用任务拆解服务
            const breakdownResult = await taskBreakdownService_1.default.breakdownTask(rawDescription, {
                userId: context?.enterpriseId || context?.userId,
                additionalContext: context
            });
            let historyId = null;
            // 开发模式下跳过数据库保存（因为缺少tasks表）
            if (process.env.NODE_ENV !== 'development') {
                // 保存拆解结果到数据库
                historyId = await taskBreakdownService_1.default.saveBreakdownResult(taskId, rawDescription, breakdownResult, {
                    userId: context?.enterpriseId || context?.userId,
                    additionalContext: context
                });
            }
            else {
                logger_1.default.info('[需求拆解Agent] 开发模式：跳过数据库保存');
                historyId = 'dev_' + Date.now();
            }
            logger_1.default.info(`[需求拆解Agent] 拆解完成: taskId=${taskId}, subtasks=${breakdownResult.subtasks.length}, historyId=${historyId}`);
            return {
                success: true,
                agentName: 'demandParserAgent',
                data: {
                    breakdownResult,
                    historyId,
                    summary: {
                        subtasksCount: breakdownResult.subtasks.length,
                        totalCost: breakdownResult.totalCost,
                        totalDays: breakdownResult.totalDays,
                        requiredSkills: breakdownResult.requiredSkills
                    }
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.default.error('[需求拆解Agent] 拆解失败:', error);
            return {
                success: false,
                agentName: 'demandParserAgent',
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime
            };
        }
    });
    // 注册报告生成Agent（占位符，Phase R4实现）
    // 注册报告生成Agent（Phase R4实现）
    agentOrchestrator_1.orchestrator.registerAgent('reportGeneratorAgent', async (eventData) => {
        const startTime = Date.now();
        try {
            const { userId, context } = eventData;
            if (!userId) {
                throw new Error('userId is required for reportGeneratorAgent');
            }
            logger_1.default.info(`[报告生成Agent] 开始生成报告: userId=${userId}`);
            // 调用报告生成服务
            const report = await reportGeneratorAgent_1.default.generateReport(userId, {
                reportType: context?.reportType || 'comprehensive',
                timeRange: context?.timeRange || 90
            });
            logger_1.default.info(`[报告生成Agent] 报告生成完成: userId=${userId}, reportId=${report.reportId}`);
            return {
                success: true,
                agentName: 'reportGeneratorAgent',
                data: {
                    report,
                    summary: {
                        totalTasks: report.summary.totalTasks,
                        completionRate: report.summary.completionRate,
                        growthTrend: report.summary.growthTrend,
                        milestonesCount: report.milestones.length
                    }
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.default.error('[报告生成Agent] 报告生成失败:', error);
            return {
                success: false,
                agentName: 'reportGeneratorAgent',
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime
            };
        }
    });
    // 注册进度提醒Agent（占位符，Phase R2实现）
    agentOrchestrator_1.orchestrator.registerAgent('schedulerAgent', async (eventData) => {
        logger_1.default.info(`[占位符] 进度提醒Agent被调用: userId=${eventData.userId}`);
        return {
            success: true,
            agentName: 'schedulerAgent',
            data: { message: 'Phase R2将实现' },
            duration: 0
        };
    });
    // Phase R5.3: 注册报告触发Agent
    agentOrchestrator_1.orchestrator.registerAgent('reportTriggerAgent', async (eventData) => {
        const startTime = Date.now();
        try {
            const { userId, context } = eventData;
            if (!userId) {
                throw new Error('userId is required for reportTriggerAgent');
            }
            logger_1.default.info(`[报告触发Agent] 处理事件: userId=${userId}, event=${context?.eventType}`);
            // 根据事件类型触发相应的报告生成
            if (context?.eventType === 'level_upgrade') {
                await reportTriggerService_1.default.onLevelUpgrade(userId, context.oldLevel || 0, context.newLevel || 1);
            }
            else if (context?.eventType === 'task_completed') {
                await reportTriggerService_1.default.onTaskCompleted(userId, context.taskId);
            }
            else if (context?.eventType === 'report_purchase') {
                await reportTriggerService_1.default.onReportPurchase(userId, context.companyId);
            }
            logger_1.default.info(`[报告触发Agent] 触发完成: userId=${userId}`);
            return {
                success: true,
                agentName: 'reportTriggerAgent',
                data: {
                    message: 'Report generation triggered',
                    eventType: context?.eventType
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.default.error('[报告触发Agent] 触发失败:', error);
            return {
                success: false,
                agentName: 'reportTriggerAgent',
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime
            };
        }
    });
    // Phase 1.4: 注册升级通关仪式Agent
    agentOrchestrator_1.orchestrator.registerAgent('levelUpCeremonyAgent', async (eventData) => {
        const startTime = Date.now();
        try {
            const { userId, context } = eventData;
            if (!userId) {
                throw new Error('userId is required for levelUpCeremonyAgent');
            }
            const { oldLevel, newLevel, triggerReason } = context || {};
            if (!oldLevel || !newLevel) {
                throw new Error('oldLevel and newLevel are required');
            }
            logger_1.default.info(`[升级通关仪式Agent] 触发升级仪式: userId=${userId}, ${oldLevel} -> ${newLevel}`);
            // 动态导入服务（避免循环依赖）
            const levelUpCeremonyService = require('../services/levelUpCeremonyService').default;
            const result = await levelUpCeremonyService.triggerLevelUpCeremony({
                studentId: userId,
                oldLevel,
                newLevel,
                triggerReason: triggerReason || 'task_milestone'
            });
            logger_1.default.info(`[升级通关仪式Agent] 仪式生成成功: ceremonyId=${result.ceremonyId}`);
            return {
                success: true,
                agentName: 'levelUpCeremonyAgent',
                data: {
                    ceremonyId: result.ceremonyId,
                    ceremonyContent: result.ceremonyContent
                },
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.default.error('[升级通关仪式Agent] 触发失败:', error);
            return {
                success: false,
                agentName: 'levelUpCeremonyAgent',
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime
            };
        }
    });
    logger_1.default.info('✅ Agent编排器初始化完成');
    logger_1.default.info('✅ 已注册Agent: mentorCompanionAgent (增强版), talentAssessmentAgent (占位), qualityControlAgent (占位), demandParserAgent (实现), reportGeneratorAgent (实现), reportTriggerAgent (实现), levelUpCeremonyAgent (实现), schedulerAgent (占位)');
}
/**
 * 便捷方法：触发导师对话
 */
async function triggerMentorMessage(userId, message, trigger = agentOrchestrator_1.MentorTrigger.USER_INITIATED, context) {
    return agentOrchestrator_1.orchestrator.triggerEvent(agentOrchestrator_1.AgentEvent.STUDENT_MESSAGE, {
        userId,
        message,
        timestamp: new Date(),
        context: { ...context, trigger }
    });
}
/**
 * 便捷方法：触发任务接取
 */
async function triggerTaskAccepted(userId, taskId) {
    return agentOrchestrator_1.orchestrator.triggerEvent(agentOrchestrator_1.AgentEvent.TASK_ACCEPTED, {
        userId,
        taskId,
        timestamp: new Date(),
        context: { trigger: agentOrchestrator_1.MentorTrigger.TASK_ACCEPTED }
    });
}
/**
 * 便捷方法：触发任务完成
 */
async function triggerTaskCompleted(userId, taskId) {
    return agentOrchestrator_1.orchestrator.triggerEvent(agentOrchestrator_1.AgentEvent.TASK_COMPLETED, {
        userId,
        taskId,
        timestamp: new Date(),
        context: { trigger: agentOrchestrator_1.MentorTrigger.TASK_COMPLETED }
    });
}
/**
 * 便捷方法：触发情绪低落
 */
async function triggerEmotionDistress(userId, emotion, context) {
    return agentOrchestrator_1.orchestrator.triggerEvent(agentOrchestrator_1.AgentEvent.EMOTION_DISTRESS, {
        userId,
        emotion,
        timestamp: new Date(),
        context: { ...context, trigger: agentOrchestrator_1.MentorTrigger.EMOTIONAL_DISTRESS_DETECTED }
    });
}
/**
 * 便捷方法：触发需求拆解
 */
async function triggerDemandParsing(taskId, taskDescription, enterpriseId, additionalContext) {
    return agentOrchestrator_1.orchestrator.triggerEvent(agentOrchestrator_1.AgentEvent.ENTERPRISE_POST_TASK, {
        taskId,
        enterpriseId: enterpriseId || '',
        userId: enterpriseId || '',
        timestamp: new Date(),
        context: {
            taskDescription,
            ...additionalContext
        }
    });
}
/**
 * 便捷方法：触发报告生成
 */
async function triggerReportGeneration(userId, reportType, timeRange) {
    return agentOrchestrator_1.orchestrator.triggerEvent(agentOrchestrator_1.AgentEvent.GENERATE_REPORT, {
        userId,
        timestamp: new Date(),
        context: {
            reportType: reportType || 'comprehensive',
            timeRange: timeRange || 90
        }
    });
}
/**
 * Phase R5.3: 便捷方法：触发升级事件（自动触发报告生成）
 */
async function triggerLevelUpgrade(userId, oldLevel, newLevel) {
    return agentOrchestrator_1.orchestrator.triggerEvent(agentOrchestrator_1.AgentEvent.LEVEL_UPGRADED, {
        userId,
        timestamp: new Date(),
        context: {
            eventType: 'level_upgrade',
            oldLevel,
            newLevel
        }
    });
}
/**
 * Phase R5.3: 便捷方法：任务完成时可能触发报告生成
 */
async function triggerTaskCompletedWithReport(userId, taskId) {
    // 先触发导师庆祝
    await triggerTaskCompleted(userId, taskId);
    // 然后检查是否需要生成报告（通过reportTriggerAgent）
    return agentOrchestrator_1.orchestrator.triggerEvent(agentOrchestrator_1.AgentEvent.LEVEL_UPGRADED, {
        userId,
        taskId,
        timestamp: new Date(),
        context: {
            eventType: 'task_completed',
            taskId
        }
    });
}
//# sourceMappingURL=orchestratorInit.js.map