/**
 * AI智能定价服务
 *
 * 基于任务特征、市场数据和AI分析提供智能定价建议
 */

import { pool } from '../utils/db';
import logger from '../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

// =====================================================
// 类型定义
// =====================================================

export interface PricingSuggestion {
  suggested_min: number;
  suggested_max: number;
  reasoning: string;
  confidence_score: number; // 0-100
  market_comparison: string;
  complexity_score: number;
  factors: PricingFactor[];
  warnings?: string[];
  recommendations?: string[];
}

export interface PricingFactor {
  name: string;
  value: number;
  weight: number;
  impact: number; // 对价格的影响（元）
  description: string;
}

export interface MarketBenchmark {
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  sample_count: number;
}

export interface TaskPricingInput {
  title: string;
  description: string;
  requirements?: string;
  deliverables?: string;
  category?: string;
  difficulty_level?: string;
  estimated_hours?: number;
  required_abilities?: any[];
  deadline?: Date;
  company_id: string;
}

// =====================================================
// AI智能定价服务类
// =====================================================

class AIPricingService {
  /**
   * 获取智能定价建议
   */
  async getPricingSuggestion(input: TaskPricingInput): Promise<PricingSuggestion> {
    const client = await pool.connect();

    try {
      // 1. 计算任务复杂度
      const complexityScore = await this.calculateComplexity(client, input);

      // 2. 获取市场基准价格
      const marketBenchmark = await this.getMarketBenchmark(
        client,
        input.category || 'general',
        input.difficulty_level || 'intermediate'
      );

      // 3. 计算各个定价因子
      const factors = await this.calculatePricingFactors(client, input, complexityScore);

      // 4. 使用AI进行综合分析
      const aiAnalysis = await this.getAIAnalysis(input, complexityScore, marketBenchmark, factors);

      // 5. 计算最终建议价格
      const finalSuggestion = this.calculateFinalPrice(
        aiAnalysis,
        marketBenchmark,
        factors,
        complexityScore
      );

      logger.info('Pricing suggestion generated', {
        category: input.category,
        complexity: complexityScore,
        suggestedRange: `${finalSuggestion.suggested_min}-${finalSuggestion.suggested_max}`,
      });

      return finalSuggestion;
    } catch (error) {
      logger.error('Failed to get pricing suggestion', { error, input });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 计算任务复杂度
   */
  private async calculateComplexity(client: any, input: TaskPricingInput): Promise<number> {
    const result = await client.query(
      `SELECT calculate_task_complexity($1, $2, $3, $4) as score`,
      [
        input.description,
        input.requirements || '',
        input.deliverables || '',
        input.estimated_hours || 0,
      ]
    );

    return result.rows[0].score;
  }

  /**
   * 获取市场基准价格
   */
  private async getMarketBenchmark(
    client: any,
    category: string,
    difficulty: string
  ): Promise<MarketBenchmark | null> {
    const result = await client.query(
      `SELECT * FROM get_market_benchmark($1, $2)`,
      [category, difficulty]
    );

    if (result.rows.length === 0) {
      // 如果没有该分类的数据，返回默认值
      return {
        avg_price: 500,
        median_price: 500,
        min_price: 200,
        max_price: 1000,
        sample_count: 0,
      };
    }

    return result.rows[0];
  }

  /**
   * 计算各个定价因子
   */
  private async calculatePricingFactors(
    client: any,
    input: TaskPricingInput,
    complexityScore: number
  ): Promise<PricingFactor[]> {
    // 获取定价因子权重
    const factorsResult = await client.query(
      `SELECT * FROM pricing_factors WHERE is_active = true ORDER BY weight DESC`
    );

    const factors: PricingFactor[] = [];

    for (const factor of factorsResult.rows) {
      let value = 0;
      let impact = 0;

      switch (factor.factor_name) {
        case 'task_complexity':
          value = complexityScore;
          impact = (complexityScore / 100) * 500 * factor.weight;
          break;

        case 'required_skills':
          value = this.getSkillLevelScore(input.difficulty_level);
          impact = (value / 100) * 400 * factor.weight;
          break;

        case 'urgency':
          value = this.getUrgencyScore(input.deadline);
          impact = (value / 100) * 300 * factor.weight;
          break;

        case 'estimated_hours':
          value = input.estimated_hours || 10;
          impact = value * 50 * factor.weight;
          break;

        case 'market_demand':
          value = await this.getMarketDemandScore(client, input.category);
          impact = (value / 100) * 200 * factor.weight;
          break;

        case 'company_reputation':
          value = await this.getCompanyReputationScore(client, input.company_id);
          impact = (value / 100) * 100 * factor.weight;
          break;
      }

      factors.push({
        name: factor.factor_name,
        value,
        weight: factor.weight,
        impact,
        description: factor.description,
      });
    }

    return factors;
  }

  /**
   * 获取技能等级分数
   */
  private getSkillLevelScore(difficulty?: string): number {
    const scores: { [key: string]: number } = {
      beginner: 30,
      intermediate: 60,
      advanced: 80,
      expert: 100,
    };

    return scores[difficulty || 'intermediate'] || 60;
  }

  /**
   * 获取紧急程度分数
   */
  private getUrgencyScore(deadline?: Date): number {
    if (!deadline) return 50;

    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline <= 3) return 100;
    if (daysUntilDeadline <= 7) return 80;
    if (daysUntilDeadline <= 14) return 60;
    if (daysUntilDeadline <= 30) return 40;
    return 20;
  }

  /**
   * 获取市场需求分数
   */
  private async getMarketDemandScore(client: any, category?: string): Promise<number> {
    if (!category) return 50;

    // 计算该分类的供需比
    const result = await client.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'open') as open_tasks,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks
       FROM tasks
       WHERE category = $1
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [category]
    );

    const { open_tasks, completed_tasks } = result.rows[0];
    const total = open_tasks + completed_tasks;

    if (total === 0) return 50;

    // 开放任务占比越高，需求越大
    const demandRatio = open_tasks / total;
    return Math.min(demandRatio * 100, 100);
  }

  /**
   * 获取企业信誉分数
   */
  private async getCompanyReputationScore(client: any, companyId: string): Promise<number> {
    const result = await client.query(
      `SELECT
         COUNT(*) as total_tasks,
         AVG(COALESCE((SELECT AVG(rating) FROM ratings WHERE task_id = tasks.id AND rater_type = 'student'), 4.0)) as avg_rating
       FROM tasks
       WHERE company_id = $1 AND status = 'completed'`,
      [companyId]
    );

    const { total_tasks, avg_rating } = result.rows[0];

    // 基础分：任务数量（最多50分）
    const taskScore = Math.min(total_tasks * 5, 50);

    // 评分分数（最多50分）
    const ratingScore = (avg_rating / 5) * 50;

    return taskScore + ratingScore;
  }

  /**
   * 使用AI进行综合分析
   */
  private async getAIAnalysis(
    input: TaskPricingInput,
    complexityScore: number,
    marketBenchmark: MarketBenchmark | null,
    factors: PricingFactor[]
  ): Promise<any> {
    const prompt = `你是一个专业的任务定价顾问。请根据以下信息，给出合理的价格建议。

任务信息：
- 标题：${input.title}
- 描述：${input.description}
- 具体要求：${input.requirements || '无'}
- 交付物：${input.deliverables || '无'}
- 分类：${input.category || '未分类'}
- 难度：${input.difficulty_level || '中等'}
- 预计工时：${input.estimated_hours || '未知'} 小时
- 截止日期：${input.deadline || '未设置'}

任务复杂度分数：${complexityScore}/100

市场基准价格：
- 平均价格：${marketBenchmark?.avg_price || '无数据'} 元
- 中位数：${marketBenchmark?.median_price || '无数据'} 元
- 价格区间：${marketBenchmark?.min_price || '无数据'} - ${marketBenchmark?.max_price || '无数据'} 元

定价因子分析：
${factors.map(f => `- ${f.description}: ${f.value.toFixed(1)}分，影响 ${f.impact.toFixed(0)} 元`).join('\n')}

请以JSON格式返回定价建议：
{
  "suggested_min": 500,
  "suggested_max": 800,
  "reasoning": "详细的定价理由",
  "confidence_score": 85,
  "market_comparison": "与市场价格的对比分析",
  "warnings": ["可能的风险提示"],
  "recommendations": ["给企业的建议"]
}

confidence_score: 0-100，表示对这个定价的信心程度`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * 计算最终建议价格
   */
  private calculateFinalPrice(
    aiAnalysis: any,
    marketBenchmark: MarketBenchmark | null,
    factors: PricingFactor[],
    complexityScore: number
  ): PricingSuggestion {
    // 基于因子计算的价格
    const factorBasedPrice = factors.reduce((sum, f) => sum + f.impact, 0);

    // AI建议价格
    const aiMin = aiAnalysis.suggested_min;
    const aiMax = aiAnalysis.suggested_max;

    // 市场基准价格
    const marketMin = marketBenchmark?.min_price || 200;
    const marketMax = marketBenchmark?.max_price || 1000;

    // 综合计算（AI权重60%，因子权重30%，市场权重10%）
    const finalMin = Math.round(aiMin * 0.6 + factorBasedPrice * 0.8 * 0.3 + marketMin * 0.1);
    const finalMax = Math.round(aiMax * 0.6 + factorBasedPrice * 1.2 * 0.3 + marketMax * 0.1);

    return {
      suggested_min: Math.max(finalMin, 100), // 最低100元
      suggested_max: Math.max(finalMax, finalMin + 100), // 确保有价格区间
      reasoning: aiAnalysis.reasoning,
      confidence_score: aiAnalysis.confidence_score,
      market_comparison: aiAnalysis.market_comparison,
      complexity_score: complexityScore,
      factors,
      warnings: aiAnalysis.warnings,
      recommendations: aiAnalysis.recommendations,
    };
  }

  /**
   * 保存定价历史
   */
  async savePricingHistory(
    taskId: string,
    companyId: string,
    suggestion: PricingSuggestion,
    actualMin: number,
    actualMax: number
  ): Promise<string> {
    const client = await pool.connect();

    try {
      // 获取任务信息
      const taskResult = await client.query(
        `SELECT category, difficulty_level, description, requirements, deliverables, estimated_hours, required_abilities
         FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const task = taskResult.rows[0];

      const result = await client.query(
        `INSERT INTO pricing_history (
          task_id, company_id, task_category, task_difficulty,
          task_description_length, requirements_complexity, estimated_hours, required_abilities,
          ai_suggested_min, ai_suggested_max, ai_reasoning, ai_confidence_score,
          actual_budget_min, actual_budget_max, price_deviation, task_published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING id`,
        [
          taskId,
          companyId,
          task.category,
          task.difficulty_level,
          task.description?.length || 0,
          suggestion.complexity_score,
          task.estimated_hours,
          task.required_abilities,
          suggestion.suggested_min,
          suggestion.suggested_max,
          suggestion.reasoning,
          suggestion.confidence_score,
          actualMin,
          actualMax,
          actualMax - suggestion.suggested_max,
        ]
      );

      const historyId = result.rows[0].id;

      // 更新任务表
      await client.query(
        `UPDATE tasks
         SET ai_pricing_applied = true,
             ai_pricing_confidence = $1,
             pricing_history_id = $2
         WHERE id = $3`,
        [suggestion.confidence_score, historyId, taskId]
      );

      logger.info('Pricing history saved', { taskId, historyId });

      return historyId;
    } catch (error) {
      logger.error('Failed to save pricing history', { error, taskId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 记录定价调整
   */
  async recordPricingAdjustment(
    taskId: string,
    companyId: string,
    originalMin: number,
    originalMax: number,
    adjustedMin: number,
    adjustedMax: number,
    reason: string,
    note?: string
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query(
        `INSERT INTO pricing_adjustments (
          task_id, company_id, original_min, original_max,
          adjusted_min, adjusted_max, adjustment_reason, adjustment_note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [taskId, companyId, originalMin, originalMax, adjustedMin, adjustedMax, reason, note]
      );

      logger.info('Pricing adjustment recorded', { taskId, reason });
    } catch (error) {
      logger.error('Failed to record pricing adjustment', { error, taskId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新市场基准价格（定期任务）
   */
  async updateMarketBenchmarks(): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('SELECT update_market_benchmarks()');
      logger.info('Market benchmarks updated successfully');
    } catch (error) {
      logger.error('Failed to update market benchmarks', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取定价准确度分析
   */
  async getPricingAccuracy(category?: string, difficulty?: string): Promise<any[]> {
    const client = await pool.connect();

    try {
      let query = 'SELECT * FROM pricing_accuracy_analysis';
      const conditions: string[] = [];
      const params: any[] = [];

      if (category) {
        conditions.push(`task_category = $${params.length + 1}`);
        params.push(category);
      }

      if (difficulty) {
        conditions.push(`task_difficulty = $${params.length + 1}`);
        params.push(difficulty);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get pricing accuracy', { error });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const aiPricingService = new AIPricingService();
