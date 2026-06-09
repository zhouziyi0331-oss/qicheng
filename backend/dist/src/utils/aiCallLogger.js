"use strict";
/**
 * AI调用日志记录工具
 *
 * 用于记录所有AI引擎的调用情况，包括：
 * - Claude API调用
 * - Embedding API调用
 * - 其他AI服务调用
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAICall = logAICall;
exports.calculateClaudeCost = calculateClaudeCost;
exports.calculateEmbeddingCost = calculateEmbeddingCost;
exports.callClaudeWithLogging = callClaudeWithLogging;
exports.callEmbeddingWithLogging = callEmbeddingWithLogging;
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("./logger"));
/**
 * 记录AI调用日志
 */
async function logAICall(input) {
    try {
        const client = await database_1.pool.connect();
        try {
            await client.query(`INSERT INTO ai_call_logs (
          engine_name, model_name, user_id, user_type,
          prompt_tokens, completion_tokens, total_tokens,
          cost_yuan, duration_ms, status, error_message,
          request_data, response_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [
                input.engineName,
                input.modelName,
                input.userId || null,
                input.userType || null,
                input.promptTokens || null,
                input.completionTokens || null,
                input.totalTokens || null,
                input.costYuan || null,
                input.durationMs || null,
                input.status,
                input.errorMessage || null,
                input.requestData ? JSON.stringify(input.requestData) : null,
                input.responseData ? JSON.stringify(input.responseData) : null
            ]);
            logger_1.default.info(`[AI调用日志] ${input.engineName} - ${input.modelName} - ${input.status}`);
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        // 日志记录失败不应该影响主流程
        logger_1.default.error('[AI调用日志] 记录失败:', error);
    }
}
/**
 * 计算Claude API调用成本
 *
 * 价格参考（2024年）：
 * - Claude 3.5 Sonnet: 输入$3/M tokens, 输出$15/M tokens
 * - Claude 3 Opus: 输入$15/M tokens, 输出$75/M tokens
 * - Claude 3 Haiku: 输入$0.25/M tokens, 输出$1.25/M tokens
 */
function calculateClaudeCost(modelName, promptTokens, completionTokens) {
    const USD_TO_CNY = 7.2; // 汇率
    let inputCostPerM = 3; // 默认Sonnet价格
    let outputCostPerM = 15;
    if (modelName.includes('opus')) {
        inputCostPerM = 15;
        outputCostPerM = 75;
    }
    else if (modelName.includes('haiku')) {
        inputCostPerM = 0.25;
        outputCostPerM = 1.25;
    }
    const inputCost = (promptTokens / 1000000) * inputCostPerM;
    const outputCost = (completionTokens / 1000000) * outputCostPerM;
    const totalCostUSD = inputCost + outputCost;
    const totalCostCNY = totalCostUSD * USD_TO_CNY;
    return Math.round(totalCostCNY * 10000) / 10000; // 保留4位小数
}
/**
 * 计算Embedding API调用成本
 *
 * 价格参考（硅基流动）：
 * - BAAI/bge-large-zh-v1.5: ¥0.0007/1K tokens
 */
function calculateEmbeddingCost(modelName, tokens) {
    let costPer1K = 0.0007; // 默认BGE价格
    if (modelName.includes('bge-large')) {
        costPer1K = 0.0007;
    }
    const totalCost = (tokens / 1000) * costPer1K;
    return Math.round(totalCost * 10000) / 10000; // 保留4位小数
}
/**
 * 包装Claude API调用，自动记录日志
 */
async function callClaudeWithLogging(engineName, modelName, apiCall, userId, userType) {
    const startTime = Date.now();
    try {
        const response = await apiCall();
        const durationMs = Date.now() - startTime;
        // 提取token使用情况
        const promptTokens = response.usage?.input_tokens || 0;
        const completionTokens = response.usage?.output_tokens || 0;
        const totalTokens = promptTokens + completionTokens;
        // 计算成本
        const costYuan = calculateClaudeCost(modelName, promptTokens, completionTokens);
        // 记录日志
        await logAICall({
            engineName,
            modelName,
            userId,
            userType,
            promptTokens,
            completionTokens,
            totalTokens,
            costYuan,
            durationMs,
            status: 'success'
        });
        return response;
    }
    catch (error) {
        const durationMs = Date.now() - startTime;
        // 记录失败日志
        await logAICall({
            engineName,
            modelName,
            userId,
            userType,
            durationMs,
            status: 'failed',
            errorMessage: error.message || '未知错误'
        });
        throw error;
    }
}
/**
 * 包装Embedding API调用，自动记录日志
 */
async function callEmbeddingWithLogging(engineName, modelName, apiCall, textLength, userId, userType) {
    const startTime = Date.now();
    try {
        const response = await apiCall();
        const durationMs = Date.now() - startTime;
        // 估算token数（中文约1.5字符/token，英文约4字符/token）
        const estimatedTokens = Math.ceil(textLength / 2);
        // 计算成本
        const costYuan = calculateEmbeddingCost(modelName, estimatedTokens);
        // 记录日志
        await logAICall({
            engineName,
            modelName,
            userId,
            userType,
            promptTokens: estimatedTokens,
            completionTokens: 0,
            totalTokens: estimatedTokens,
            costYuan,
            durationMs,
            status: 'success'
        });
        return response;
    }
    catch (error) {
        const durationMs = Date.now() - startTime;
        // 记录失败日志
        await logAICall({
            engineName,
            modelName,
            userId,
            userType,
            durationMs,
            status: 'failed',
            errorMessage: error.message || '未知错误'
        });
        throw error;
    }
}
exports.default = {
    logAICall,
    calculateClaudeCost,
    calculateEmbeddingCost,
    callClaudeWithLogging,
    callEmbeddingWithLogging
};
//# sourceMappingURL=aiCallLogger.js.map