"use strict";
/**
 * AIJudgeService - AI判断服务
 *
 * 核心功能：
 * 1. 调用DeepSeek API判断学生回答质量
 * 2. 返回结构化判断结果（pass/retry/fail）
 * 3. 记录判断日志用于阈值校准
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIJudgeService = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../../utils/db");
class AIJudgeService {
    /**
     * 第一轮判断（能力验证）- 有retry机会
     */
    static async judgeRound1(params) {
        const prompt = `你是一个严格但公平的能力评估官。

【商家需求】
${params.needDescription}

【验证题目】
${params.questionText}

【判断标准】
通过条件：${params.criteria.pass}
不通过条件：${params.criteria.fail}

【学生回答】
${params.studentAnswer}

请判断这个回答是否达到通过标准。
只输出以下JSON格式，不要有任何其他内容：
{
  "result": "pass" | "retry" | "fail",
  "reason": "一句话说明判断理由（给内部记录用，不展示给学生）",
  "retry_prompt": "如果是retry，给学生的提示方向（一句话，不超过30字）"
}

判断规则：
- pass：回答清晰展示了对需求的理解，有具体方法或思路
- retry：回答方向对但太笼统，给一次补充机会
- fail：回答完全偏题，或明显没有相关能力`;
        return this.callAI(params.sessionId, 'round1', prompt, 'deepseek-chat');
    }
    /**
     * 第二轮判断（意愿验证）- 无retry，只有pass/fail
     */
    static async judgeRound2(params) {
        const prompt = `你是一个判断执行意愿的评估官。

【商家需求】
${params.needDescription}

【意愿验证题】
${params.questionText}

【判断标准】
通过条件：${params.criteria.pass}
不通过条件：${params.criteria.fail}

【学生回答】
${params.studentAnswer}

只输出以下JSON格式：
{
  "result": "pass" | "fail",
  "reason": "一句话判断理由（内部记录）"
}

注意：第二轮没有retry机会，判断要更严格。
通过的核心标准：回答体现了真实的执行意愿和具体的行动计划。`;
        return this.callAI(params.sessionId, 'round2', prompt, 'deepseek-chat');
    }
    /**
     * 调用AI API（支持DeepSeek主用，GPT备用）
     */
    static async callAI(sessionId, round, prompt, model) {
        const startTime = Date.now();
        let apiUrl = this.DEEPSEEK_API_URL;
        let apiKey = this.DEEPSEEK_API_KEY;
        let modelUsed = 'deepseek-chat';
        try {
            // 尝试调用DeepSeek
            const response = await axios_1.default.post(apiUrl, {
                model: modelUsed,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
                max_tokens: round === 'round1' ? 400 : 300,
                response_format: { type: 'json_object' }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                timeout: 30000
            });
            const latencyMs = Date.now() - startTime;
            const content = response.data.choices[0].message.content;
            const result = JSON.parse(content);
            // 记录日志
            await this.logJudge(sessionId, round, modelUsed, response.data.usage?.prompt_tokens || 0, response.data.usage?.completion_tokens || 0, result.result, result.reason, latencyMs);
            logger.info(`[AIJudgeService] ${round} 判断完成: ${result.result}, 耗时: ${latencyMs}ms`);
            return result;
        }
        catch (error) {
            logger.error(`[AIJudgeService] DeepSeek调用失败，尝试GPT备用:`, error.message);
            // 降级到GPT-4o-mini
            try {
                apiUrl = this.GPT_API_URL;
                apiKey = this.GPT_API_KEY;
                modelUsed = 'gpt-4o-mini';
                const response = await axios_1.default.post(apiUrl, {
                    model: modelUsed,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.2,
                    max_tokens: round === 'round1' ? 400 : 300,
                    response_format: { type: 'json_object' }
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`
                    },
                    timeout: 30000
                });
                const latencyMs = Date.now() - startTime;
                const content = response.data.choices[0].message.content;
                const result = JSON.parse(content);
                await this.logJudge(sessionId, round, modelUsed, response.data.usage?.prompt_tokens || 0, response.data.usage?.completion_tokens || 0, result.result, result.reason, latencyMs);
                logger.info(`[AIJudgeService] GPT备用成功: ${result.result}, 耗时: ${latencyMs}ms`);
                return result;
            }
            catch (gptError) {
                logger.error(`[AIJudgeService] GPT备用也失败:`, gptError.message);
                throw new Error('AI判断服务暂时不可用，请稍后重试');
            }
        }
    }
    /**
     * 记录AI判断日志
     */
    static async logJudge(sessionId, round, modelUsed, promptTokens, completionTokens, result, reason, latencyMs) {
        try {
            await (0, db_1.query)(`INSERT INTO ai_judge_logs
         (session_id, round, model_used, prompt_tokens, completion_tokens, result, reason, latency_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [sessionId, round, modelUsed, promptTokens, completionTokens, result, reason, latencyMs]);
        }
        catch (error) {
            logger.error('[AIJudgeService] 记录日志失败:', error);
            // 不抛出错误，避免影响主流程
        }
    }
    /**
     * 获取当前阈值配置
     */
    static async getThreshold(track) {
        const result = await (0, db_1.query)(`SELECT round1_pass_threshold, round2_pass_threshold
       FROM threshold_configs
       WHERE (track = $1 OR track IS NULL)
         AND effective_at <= NOW()
       ORDER BY track NULLS LAST, effective_at DESC
       LIMIT 1`, [track || null]);
        if (result.length === 0) {
            return { round1: 0.7, round2: 0.75 }; // 默认阈值
        }
        return {
            round1: result[0].round1_pass_threshold,
            round2: result[0].round2_pass_threshold
        };
    }
}
exports.AIJudgeService = AIJudgeService;
AIJudgeService.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
AIJudgeService.DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
AIJudgeService.GPT_API_KEY = process.env.OPENAI_API_KEY || '';
AIJudgeService.GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
//# sourceMappingURL=aiJudgeService.js.map