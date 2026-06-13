/**
 * 企业端价格推荐服务
 *
 * 功能：
 * 1. 根据项目参数计算推荐价格区间（常规派单）
 * 2. 计算指定大师模式的兜底价
 * 3. 基于历史数据优化推荐算法
 */

import { pool } from '../config/database';
import logger from '../utils/logger';

interface PriceRecommendationInput {
  track: 'A' | 'B' | 'AB';  // 赛道类型
  difficulty: number;        // 难度 1-5
  estimatedHours: number;    // 预估工时
  deliverableType?: string;  // 交付物类型
}

interface PriceRecommendation {
  basePrice: number;         // 基准价格
  priceMin: number;          // 推荐下限
  priceMax: number;          // 推荐上限
  floorPrice: number;        // 指定大师兜底价
  historicalAvgPrice?: number; // 历史平均价格
  similarTasksCount?: number;  // 参考的同类项目数量
}

class PriceRecommendationService {
  /**
   * 赛道基础价（元/小时）
   */
  private readonly TRACK_BASE_RATES = {
    'A': 50,   // content赛道
    'B': 80,   // dev赛道
    'AB': 65   // 混合赛道
  };

  /**
   * 难度系数
   */
  private readonly DIFFICULTY_MULTIPLIERS = {
    1: 0.7,
    2: 0.85,
    3: 1.0,
    4: 1.3,
    5: 1.6
  };

  /**
   * 交付物复杂度系数
   */
  private readonly DELIVERABLE_MULTIPLIERS: Record<string, number> = {
    'image': 1.0,
    'video': 1.4,
    'document': 0.8,
    'code': 1.5,
    'mixed': 1.3,
    'default': 1.0
  };

  /**
   * 计算价格推荐
   */
  async calculatePriceRecommendation(input: PriceRecommendationInput): Promise<PriceRecommendation> {
    logger.info('[价格推荐] 开始计算', input);

    // 1. 计算基准价格
    const basePrice = this.calculateBasePrice(input);

    // 2. 获取历史数据参考
    const historicalData = await this.getHistoricalData(input);

    // 3. 计算推荐区间
    let priceMin: number;
    let priceMax: number;

    if (historicalData.avgPrice && historicalData.count >= 5) {
      // 有足够历史数据，基于历史均价计算
      priceMin = Math.round(historicalData.avgPrice * 0.8);
      priceMax = Math.round(historicalData.avgPrice * 1.5);
      logger.info(`[价格推荐] 基于历史数据：均价=${historicalData.avgPrice}, 样本数=${historicalData.count}`);
    } else {
      // 历史数据不足，基于基准价计算
      priceMin = Math.round(basePrice * 0.85);
      priceMax = Math.round(basePrice * 1.3);
      logger.info(`[价格推荐] 基于基准价：basePrice=${basePrice}`);
    }

    // 4. 计算指定大师兜底价（推荐上限 × 1.5）
    const floorPrice = Math.round(priceMax * 1.5);

    const recommendation: PriceRecommendation = {
      basePrice,
      priceMin,
      priceMax,
      floorPrice,
      historicalAvgPrice: historicalData.avgPrice,
      similarTasksCount: historicalData.count
    };

    logger.info('[价格推荐] 计算完成', recommendation);

    return recommendation;
  }

  /**
   * 计算基准价格
   */
  private calculateBasePrice(input: PriceRecommendationInput): number {
    const { track, difficulty, estimatedHours, deliverableType } = input;

    // 基础时薪
    const baseRate = this.TRACK_BASE_RATES[track] || this.TRACK_BASE_RATES['A'];

    // 难度系数
    const difficultyMultiplier = this.DIFFICULTY_MULTIPLIERS[difficulty as keyof typeof this.DIFFICULTY_MULTIPLIERS] || 1.0;

    // 交付物复杂度系数
    const deliverableMultiplier = deliverableType
      ? (this.DELIVERABLE_MULTIPLIERS[deliverableType] || this.DELIVERABLE_MULTIPLIERS['default'])
      : this.DELIVERABLE_MULTIPLIERS['default'];

    // 基准价 = 基础时薪 × 难度系数 × 交付物系数 × 预估工时
    const basePrice = baseRate * difficultyMultiplier * deliverableMultiplier * estimatedHours;

    return Math.round(basePrice);
  }

  /**
   * 获取历史数据参考
   */
  private async getHistoricalData(input: PriceRecommendationInput): Promise<{ avgPrice?: number; count: number }> {
    const client = await pool.connect();
    try {
      // 查询同赛道、同难度的已完成任务的平均价格
      const result = await client.query(
        `SELECT
          AVG(t.student_price) as avg_price,
          COUNT(*) as count
         FROM tasks t
         JOIN task_assignments ta ON t.id = ta.task_id
         WHERE t.track = $1
           AND t.difficulty = $2
           AND ta.status = 'completed'
           AND t.student_price IS NOT NULL
           AND t.student_price > 0`,
        [input.track, input.difficulty]
      );

      const avgPrice = result.rows[0].avg_price ? parseFloat(result.rows[0].avg_price) : undefined;
      const count = parseInt(result.rows[0].count) || 0;

      return { avgPrice, count };
    } finally {
      client.release();
    }
  }

  /**
   * 保存价格计算历史（用于后续优化算法）
   */
  async savePriceCalculationHistory(
    taskId: string,
    input: PriceRecommendationInput,
    recommendation: PriceRecommendation
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO price_calculation_history (
          task_id, track, difficulty, estimated_hours, deliverable_type,
          base_price, price_min, price_max,
          historical_avg_price, similar_tasks_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          taskId,
          input.track,
          input.difficulty,
          input.estimatedHours,
          input.deliverableType || null,
          recommendation.basePrice,
          recommendation.priceMin,
          recommendation.priceMax,
          recommendation.historicalAvgPrice || null,
          recommendation.similarTasksCount || 0
        ]
      );

      logger.info(`[价格推荐] 已保存计算历史: taskId=${taskId}`);
    } finally {
      client.release();
    }
  }

  /**
   * 验证企业出价是否合理
   */
  validateEnterprisePrice(
    enterprisePrice: number,
    recommendation: PriceRecommendation
  ): { valid: boolean; warning?: string; level: 'ok' | 'low' | 'high' } {
    if (enterprisePrice < recommendation.priceMin) {
      return {
        valid: true,
        warning: `低于推荐价格可能影响匹配速度。推荐区间：¥${recommendation.priceMin} - ¥${recommendation.priceMax}`,
        level: 'low'
      };
    }

    if (enterprisePrice > recommendation.priceMax) {
      return {
        valid: true,
        warning: `你出的价格高于推荐上限。系统将为你匹配过往评分最高的学生。`,
        level: 'high'
      };
    }

    return {
      valid: true,
      level: 'ok'
    };
  }
}

export default new PriceRecommendationService();
