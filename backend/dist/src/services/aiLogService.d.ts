/**
 * AI调用日志服务
 * 记录所有AI调用的详细信息，用于监控和成本分析
 */
interface AICallLog {
    engineName: string;
    modelName: string;
    userId?: string;
    userType?: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costYuan: number;
    durationMs: number;
    status: 'success' | 'failed';
    errorMessage?: string;
    requestData?: any;
    responseData?: any;
}
declare class AILogService {
    /**
     * 记录AI调用日志
     */
    logAICall(log: AICallLog): Promise<void>;
    /**
     * 计算Claude API的成本
     * 基于Anthropic的定价：https://www.anthropic.com/pricing
     */
    calculateClaudeCost(modelName: string, promptTokens: number, completionTokens: number): number;
    /**
     * 获取AI调用统计
     */
    getAICallStats(startDate?: Date, endDate?: Date): Promise<any>;
    /**
     * 获取今日AI调用成本
     */
    getTodayCost(): Promise<number>;
    /**
     * 获取失败的AI调用
     */
    getFailedCalls(limit?: number): Promise<any[]>;
}
declare const _default: AILogService;
export default _default;
//# sourceMappingURL=aiLogService.d.ts.map