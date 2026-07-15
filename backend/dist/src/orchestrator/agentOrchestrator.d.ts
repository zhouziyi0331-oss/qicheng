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
import { EventEmitter } from 'events';
import { AgentEvent, MentorTrigger, EventData, AgentInvocationResult, OrchestratorConfig } from '../types/orchestrator';
type AgentHandler = (eventData: EventData) => Promise<AgentInvocationResult>;
declare class AgentOrchestrator extends EventEmitter {
    private config;
    private agents;
    private eventAgentMap;
    constructor(config?: Partial<OrchestratorConfig>);
    /**
     * 设置事件路由规则
     */
    private setupEventRouting;
    /**
     * 注册Agent
     */
    registerAgent(name: string, handler: AgentHandler): void;
    /**
     * 触发事件 (主入口)
     */
    triggerEvent(event: AgentEvent, eventData: EventData): Promise<AgentInvocationResult[]>;
    /**
     * 调用单个Agent
     */
    invokeAgent(agentName: string, eventData: EventData): Promise<AgentInvocationResult>;
    /**
     * 超时处理
     */
    private timeout;
    /**
     * 记录事件日志
     */
    private logEvent;
    /**
     * 记录Agent调用日志
     */
    private logAgentInvocation;
    /**
     * 加载记忆 (为Agent提供统一接口)
     */
    loadMemory(userId: string, taskId?: string): Promise<import("../types/orchestrator").MentorMemory>;
    /**
     * 获取事件统计
     */
    getEventStats(userId: string, since?: Date): Promise<any>;
}
export declare const orchestrator: AgentOrchestrator;
export { AgentEvent, MentorTrigger };
//# sourceMappingURL=agentOrchestrator.d.ts.map