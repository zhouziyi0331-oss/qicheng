/**
 * AI调用日志记录工具
 *
 * 用于记录所有AI引擎的调用情况，包括：
 * - Claude API调用
 * - Embedding API调用
 * - 其他AI服务调用
 */
interface AICallLogInput {
    engineName: string;
    modelName: string;
    userId?: string;
    userType?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    costYuan?: number;
    durationMs?: number;
    status: 'success' | 'failed';
    errorMessage?: string;
    requestData?: any;
    responseData?: any;
}
/**
 * 记录AI调用日志
 */
export declare function logAICall(input: AICallLogInput): Promise<void>;
/**
 * 计算Claude API调用成本
 *
 * 价格参考（2024年）：
 * - Claude 3.5 Sonnet: 输入$3/M tokens, 输出$15/M tokens
 * - Claude 3 Opus: 输入$15/M tokens, 输出$75/M tokens
 * - Claude 3 Haiku: 输入$0.25/M tokens, 输出$1.25/M tokens
 */
export declare function calculateClaudeCost(modelName: string, promptTokens: number, completionTokens: number): number;
/**
 * 计算Embedding API调用成本
 *
 * 价格参考（硅基流动）：
 * - BAAI/bge-large-zh-v1.5: ¥0.0007/1K tokens
 */
export declare function calculateEmbeddingCost(modelName: string, tokens: number): number;
/**
 * 包装Claude API调用，自动记录日志
 */
export declare function callClaudeWithLogging<T>(engineName: string, modelName: string, apiCall: () => Promise<any>, userId?: string, userType?: string): Promise<T>;
/**
 * 包装Embedding API调用，自动记录日志
 */
export declare function callEmbeddingWithLogging(engineName: string, modelName: string, apiCall: () => Promise<any>, textLength: number, userId?: string, userType?: string): Promise<any>;
declare const _default: {
    logAICall: typeof logAICall;
    calculateClaudeCost: typeof calculateClaudeCost;
    calculateEmbeddingCost: typeof calculateEmbeddingCost;
    callClaudeWithLogging: typeof callClaudeWithLogging;
    callEmbeddingWithLogging: typeof callEmbeddingWithLogging;
};
export default _default;
//# sourceMappingURL=aiCallLogger.d.ts.map