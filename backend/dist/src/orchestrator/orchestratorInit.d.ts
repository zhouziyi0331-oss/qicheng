/**
 * 编排器初始化
 * 注册所有Agent到编排器
 */
import { MentorTrigger } from './agentOrchestrator';
import { AgentInvocationResult } from '../types/orchestrator';
/**
 * 初始化编排器，注册所有Agent
 */
export declare function initializeOrchestrator(): void;
/**
 * 便捷方法：触发导师对话
 */
export declare function triggerMentorMessage(userId: string, message: string, trigger?: MentorTrigger, context?: Record<string, any>): Promise<AgentInvocationResult[]>;
/**
 * 便捷方法：触发任务接取
 */
export declare function triggerTaskAccepted(userId: string, taskId: string): Promise<AgentInvocationResult[]>;
/**
 * 便捷方法：触发任务完成
 */
export declare function triggerTaskCompleted(userId: string, taskId: string): Promise<AgentInvocationResult[]>;
/**
 * 便捷方法：触发情绪低落
 */
export declare function triggerEmotionDistress(userId: string, emotion: string, context?: Record<string, any>): Promise<AgentInvocationResult[]>;
/**
 * 便捷方法：触发需求拆解
 */
export declare function triggerDemandParsing(taskId: string, taskDescription: string, enterpriseId?: string, additionalContext?: Record<string, any>): Promise<AgentInvocationResult[]>;
/**
 * 便捷方法：触发报告生成
 */
export declare function triggerReportGeneration(userId: string, reportType?: 'comprehensive' | 'summary' | 'growth', timeRange?: number): Promise<AgentInvocationResult[]>;
/**
 * Phase R5.3: 便捷方法：触发升级事件（自动触发报告生成）
 */
export declare function triggerLevelUpgrade(userId: string, oldLevel: number, newLevel: number): Promise<AgentInvocationResult[]>;
/**
 * Phase R5.3: 便捷方法：任务完成时可能触发报告生成
 */
export declare function triggerTaskCompletedWithReport(userId: string, taskId: string): Promise<AgentInvocationResult[]>;
//# sourceMappingURL=orchestratorInit.d.ts.map