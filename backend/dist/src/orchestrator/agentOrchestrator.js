"use strict";
/**
 * Agent编排器核心
 * Phase R1: 事件驱动的Agent调度系统
 *
 * 核心职责：
 * 1. 监听系统事件
 * 2. 决定唤醒哪个Agent
 * 3. 管理Agent间协作
 * 4. 统一记忆读写接口
 * 5. 记录事件日志
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentorTrigger = exports.AgentEvent = exports.orchestrator = void 0;
const events_1 = require("events");
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const memoryService_1 = require("../services/memoryService");
const orchestrator_1 = require("../types/orchestrator");
Object.defineProperty(exports, "AgentEvent", { enumerable: true, get: function () { return orchestrator_1.AgentEvent; } });
Object.defineProperty(exports, "MentorTrigger", { enumerable: true, get: function () { return orchestrator_1.MentorTrigger; } });
class AgentOrchestrator extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = {
            enableLogging: true,
            eventQueueName: 'agent_events',
            maxRetries: 3,
            timeoutMs: 30000,
            ...config
        };
        this.agents = new Map();
        this.eventAgentMap = new Map();
        this.setupEventRouting();
    }
    /**
     * 设置事件路由规则
     */
    setupEventRouting() {
        // 学生注册 → 天赋测评Agent
        this.eventAgentMap.set(orchestrator_1.AgentEvent.STUDENT_REGISTERED, ['talentAssessmentAgent']);
        // 学生消息 → 导师Agent
        this.eventAgentMap.set(orchestrator_1.AgentEvent.STUDENT_MESSAGE, ['mentorCompanionAgent']);
        // 任务接取 → 导师Agent (欢迎+引导)
        this.eventAgentMap.set(orchestrator_1.AgentEvent.TASK_ACCEPTED, ['mentorCompanionAgent']);
        // 任务提交 → 质控Agent + 导师Agent (串行)
        this.eventAgentMap.set(orchestrator_1.AgentEvent.TASK_SUBMITTED, ['qualityControlAgent', 'mentorCompanionAgent']);
        // 任务完成 → 导师Agent (祝贺)
        this.eventAgentMap.set(orchestrator_1.AgentEvent.TASK_COMPLETED, ['mentorCompanionAgent']);
        // 情绪低落 → 导师Agent (安慰)
        this.eventAgentMap.set(orchestrator_1.AgentEvent.EMOTION_DISTRESS, ['mentorCompanionAgent']);
        // 卡壳检测 → 导师Agent (引导)
        this.eventAgentMap.set(orchestrator_1.AgentEvent.STUCK_DETECTED, ['mentorCompanionAgent']);
        // 企业发单 → 需求拆解Agent
        this.eventAgentMap.set(orchestrator_1.AgentEvent.ENTERPRISE_POST_TASK, ['demandParserAgent']);
        // 报告生成 → 报告生成Agent
        this.eventAgentMap.set(orchestrator_1.AgentEvent.GENERATE_REPORT, ['reportGeneratorAgent']);
        // 报告购买 → 报告生成Agent
        this.eventAgentMap.set(orchestrator_1.AgentEvent.REPORT_PURCHASE, ['reportGeneratorAgent']);
        // Phase R5.3: 升级时触发报告生成（通过reportTriggerService处理）+ Phase 1.4: 升级通关仪式
        this.eventAgentMap.set(orchestrator_1.AgentEvent.LEVEL_UPGRADED, ['reportTriggerAgent', 'levelUpCeremonyAgent']);
        // 截止日期临近 → 进度提醒Agent
        this.eventAgentMap.set(orchestrator_1.AgentEvent.DEADLINE_APPROACHING, ['schedulerAgent']);
        // 主动关怀触发 → 导师Agent
        this.eventAgentMap.set(orchestrator_1.AgentEvent.PROACTIVE_CHECKIN_TRIGGER, ['mentorCompanionAgent']);
    }
    /**
     * 注册Agent
     */
    registerAgent(name, handler) {
        this.agents.set(name, handler);
        logger_1.default.info(`✅ Agent已注册: ${name}`);
    }
    /**
     * 触发事件 (主入口)
     */
    async triggerEvent(event, eventData) {
        const startTime = Date.now();
        try {
            // 1. 记录事件日志
            if (this.config.enableLogging) {
                await this.logEvent(event, eventData);
            }
            // 2. 获取需要调用的Agent列表
            const agentNames = this.eventAgentMap.get(event) || [];
            if (agentNames.length === 0) {
                logger_1.default.warn(`事件 ${event} 没有对应的Agent处理器`);
                return [];
            }
            // 3. 串行调用Agent
            const results = [];
            for (const agentName of agentNames) {
                const result = await this.invokeAgent(agentName, eventData);
                results.push(result);
                // 如果Agent调用失败，记录但继续
                if (!result.success) {
                    logger_1.default.error(`Agent ${agentName} 调用失败:`, result.error);
                }
            }
            logger_1.default.info(`事件 ${event} 处理完成，耗时 ${Date.now() - startTime}ms`);
            return results;
        }
        catch (error) {
            logger_1.default.error(`事件 ${event} 处理失败:`, error);
            throw error;
        }
    }
    /**
     * 调用单个Agent
     */
    async invokeAgent(agentName, eventData) {
        const startTime = Date.now();
        try {
            const handler = this.agents.get(agentName);
            if (!handler) {
                return {
                    success: false,
                    agentName,
                    error: `Agent ${agentName} 未注册`,
                    duration: Date.now() - startTime
                };
            }
            // 调用Agent处理器
            const result = await Promise.race([
                handler(eventData),
                this.timeout(this.config.timeoutMs)
            ]);
            // 记录调用日志
            if (this.config.enableLogging) {
                await this.logAgentInvocation(agentName, eventData, result, Date.now() - startTime);
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`调用Agent ${agentName} 失败:`, error);
            return {
                success: false,
                agentName,
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * 超时处理
     */
    timeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Agent调用超时 (${ms}ms)`)), ms);
        });
    }
    /**
     * 记录事件日志
     */
    async logEvent(event, eventData) {
        try {
            await (0, db_1.query)(`INSERT INTO orchestrator_event_log (event_type, user_id, task_id, event_data, created_at)
         VALUES ($1, $2, $3, $4, NOW())`, [event, eventData.userId, eventData.taskId || null, JSON.stringify(eventData)]);
        }
        catch (error) {
            logger_1.default.error('记录事件日志失败:', error);
        }
    }
    /**
     * 记录Agent调用日志
     */
    async logAgentInvocation(agentName, eventData, result, duration) {
        try {
            await (0, db_1.query)(`UPDATE orchestrator_event_log
         SET agent_invoked = $1, result = $2, duration_ms = $3
         WHERE user_id = $4 AND created_at = (
           SELECT MAX(created_at) FROM orchestrator_event_log WHERE user_id = $4
         )`, [agentName, JSON.stringify(result), duration, eventData.userId]);
        }
        catch (error) {
            logger_1.default.error('记录Agent调用日志失败:', error);
        }
    }
    /**
     * 加载记忆 (为Agent提供统一接口)
     */
    async loadMemory(userId, taskId) {
        const memory = await memoryService_1.memoryService.loadAllLayers(userId);
        // 如果有taskId，加载L2任务记忆
        if (taskId) {
            const taskContext = await memoryService_1.memoryService.loadTaskContext(userId, taskId);
            memory.L2_task = taskContext || undefined;
        }
        return memory;
    }
    /**
     * 获取事件统计
     */
    async getEventStats(userId, since) {
        try {
            const sinceClause = since ? `AND created_at >= $2` : '';
            const params = since ? [userId, since] : [userId];
            const stats = await (0, db_1.query)(`SELECT
          event_type,
          COUNT(*) as count,
          AVG(duration_ms) as avg_duration_ms
         FROM orchestrator_event_log
         WHERE user_id = $1 ${sinceClause}
         GROUP BY event_type
         ORDER BY count DESC`, params);
            return stats;
        }
        catch (error) {
            logger_1.default.error('获取事件统计失败:', error);
            return [];
        }
    }
}
// 导出单例
exports.orchestrator = new AgentOrchestrator();
//# sourceMappingURL=agentOrchestrator.js.map