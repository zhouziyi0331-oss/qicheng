import { query, QueryResult } from '../utils/db';
import logger from '../utils/logger';

/**
 * AI调用日志服务
 * 记录所有AI调用的详细信息，用于监控和成本分析
 */

interface AICallLog {
  engineName: string;      // AI-01 到 AI-06
  modelName: string;       // claude-3-5-sonnet-20241022 等
  userId?: string;         // 用户ID
  userType?: string;       // student/company/system
  promptTokens: number;    // 输入token数
  completionTokens: number; // 输出token数
  totalTokens: number;     // 总token数
  costYuan: number;        // 成本（元）
  durationMs: number;      // 耗时（毫秒）
  status: 'success' | 'failed';
  errorMessage?: string;
  requestData?: any;       // 输入内容（可选，用于调试）
  responseData?: any;      // 输出内容（可选，用于调试）
}

class AILogService {
  /**
   * 记录AI调用日志
   */
  async logAICall(log: AICallLog): Promise<void> {
    try {
      await query(
        `INSERT INTO ai_call_logs (
          engine_name, model_name, user_id, user_type,
          prompt_tokens, completion_tokens, total_tokens,
          cost_yuan, duration_ms, status, error_message,
          request_data, response_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
        [
          log.engineName,
          log.modelName,
          log.userId || null,
          log.userType || null,
          log.promptTokens,
          log.completionTokens,
          log.totalTokens,
          log.costYuan,
          log.durationMs,
          log.status,
          log.errorMessage || null,
          log.requestData ? JSON.stringify(log.requestData) : null,
          log.responseData ? JSON.stringify(log.responseData) : null,
        ]
      );

      logger.info(`AI call logged: ${log.engineName} - ${log.status}`, {
        tokens: log.totalTokens,
        cost: log.costYuan,
        duration: log.durationMs,
      });
    } catch (error: any) {
      // 日志记录失败不应该影响主流程
      logger.error('Failed to log AI call:', error);
    }
  }

  /**
   * 计算Claude API的成本
   * 基于Anthropic的定价：https://www.anthropic.com/pricing
   */
  calculateClaudeCost(modelName: string, promptTokens: number, completionTokens: number): number {
    // Claude 3.5 Sonnet 定价（2024年价格）
    // Input: $3 per million tokens
    // Output: $15 per million tokens

    const inputCostPerMillion = 3;
    const outputCostPerMillion = 15;

    const inputCostUSD = (promptTokens / 1_000_000) * inputCostPerMillion;
    const outputCostUSD = (completionTokens / 1_000_000) * outputCostPerMillion;
    const totalCostUSD = inputCostUSD + outputCostUSD;

    // 转换为人民币（假设汇率7.2）
    const totalCostYuan = totalCostUSD * 7.2;

    return Math.round(totalCostYuan * 10000) / 10000; // 保留4位小数
  }

  /**
   * 获取AI调用统计
   */
  async getAICallStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const result = await query(
        `SELECT
          engine_name,
          COUNT(*) as call_count,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
          SUM(total_tokens) as total_tokens,
          SUM(cost_yuan) as total_cost,
          AVG(duration_ms) as avg_duration_ms
         FROM ai_call_logs
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY engine_name
         ORDER BY total_cost DESC`,
        [startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate || new Date()]
      );

      return result;
    } catch (error: any) {
      logger.error('Failed to get AI call stats:', error);
      return [];
    }
  }

  /**
   * 获取今日AI调用成本
   */
  async getTodayCost(): Promise<number> {
    try {
      const result = await query(
        `SELECT SUM(cost_yuan) as total_cost
         FROM ai_call_logs
         WHERE created_at >= CURRENT_DATE`,
        []
      );

      return parseFloat(String(result[0]?.total_cost || 0));
    } catch (error: any) {
      logger.error('Failed to get today cost:', error);
      return 0;
    }
  }

  /**
   * 获取失败的AI调用
   */
  async getFailedCalls(limit: number = 50): Promise<any[]> {
    try {
      const result = await query(
        `SELECT *
         FROM ai_call_logs
         WHERE status = 'failed'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );

      return result;
    } catch (error: any) {
      logger.error('Failed to get failed calls:', error);
      return [];
    }
  }
}

export default new AILogService();
