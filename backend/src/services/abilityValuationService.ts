/**
 * Phase 2.2: 能力估值服务
 *
 * 功能：
 * 1. 计算学生能力的市场价值
 * 2. 生成资产仪表盘数据
 * 3. 追踪能力价值变化趋势
 */

import { pool } from '../config/database';
import logger from '../utils/logger';

interface AbilityAsset {
  abilityName: string;
  currentLevel: number;
  experiencePoints: number;
  marketValue: number;
  monthlyGrowth: number;
  potentialValue: number;
}

interface AssetDashboard {
  totalValue: number;
  monthlyIncome: number;
  growthRate: number;
  assets: AbilityAsset[];
  trends: {
    date: string;
    value: number;
  }[];
  marketComparison: {
    percentile: number;
    averageValue: number;
    topPerformerValue: number;
  };
  nextMilestone: {
    targetValue: number;
    estimatedDays: number;
    requiredActions: string[];
  };
}

// 能力基础单价（每级的基础价值）
const ABILITY_BASE_VALUES = {
  // 内容创作类
  'AI图文创作': 200,
  '视频制作': 300,
  '文案写作': 180,
  '设计能力': 250,

  // 技术开发类
  '前端开发': 400,
  '后端开发': 450,
  'AI应用开发': 500,
  '数据分析': 350,

  // 工具应用类
  'Prompt工程': 150,
  '工作流搭建': 200,
  'AI工具整合': 180,

  // 通用能力
  '项目管理': 300,
  '沟通协作': 150,
  '问题解决': 200
};

// 市场需求系数（根据当前市场热度）
const MARKET_DEMAND_MULTIPLIER = {
  'AI应用开发': 1.5,
  'Prompt工程': 1.3,
  '数据分析': 1.2,
  '前端开发': 1.1,
  '后端开发': 1.1,
  '视频制作': 1.2,
  'AI图文创作': 1.1
};

class AbilityValuationService {
  /**
   * 生成学生的资产仪表盘
   */
  async generateDashboard(studentId: string): Promise<AssetDashboard> {
    const client = await pool.connect();

    try {
      // 1. 获取学生的所有能力数据
      const abilitiesResult = await client.query(
        `SELECT
          ability_name,
          current_level,
          experience_points,
          last_updated
         FROM student_abilities
         WHERE student_id = $1 AND current_level > 0
         ORDER BY current_level DESC, experience_points DESC`,
        [studentId]
      );

      // 2. 计算每项能力的市场价值
      const assets: AbilityAsset[] = [];
      let totalValue = 0;

      for (const ability of abilitiesResult.rows) {
        const valuation = this.calculateAbilityValue(
          ability.ability_name,
          ability.current_level,
          ability.experience_points
        );

        const monthlyGrowth = await this.calculateMonthlyGrowth(
          studentId,
          ability.ability_name
        );

        assets.push({
          abilityName: ability.ability_name,
          currentLevel: ability.current_level,
          experiencePoints: ability.experience_points,
          marketValue: valuation.currentValue,
          monthlyGrowth,
          potentialValue: valuation.potentialValue
        });

        totalValue += valuation.currentValue;
      }

      // 3. 获取历史价值趋势
      const trends = await this.getValueTrends(studentId);

      // 4. 计算月均收入（基于最近30天完成的任务）
      const monthlyIncome = await this.calculateMonthlyIncome(studentId);

      // 5. 计算增长率
      const growthRate = trends.length > 1
        ? ((totalValue - trends[0].value) / trends[0].value) * 100
        : 0;

      // 6. 市场对比数据
      const marketComparison = await this.getMarketComparison(studentId, totalValue);

      // 7. 下一个里程碑
      const nextMilestone = this.calculateNextMilestone(totalValue, assets);

      logger.info('[AbilityValuation] 资产仪表盘生成成功', {
        studentId,
        totalValue,
        assetsCount: assets.length
      });

      return {
        totalValue: Math.round(totalValue),
        monthlyIncome: Math.round(monthlyIncome),
        growthRate: Math.round(growthRate * 10) / 10,
        assets,
        trends,
        marketComparison,
        nextMilestone
      };
    } catch (error) {
      logger.error('[AbilityValuation] 生成资产仪表盘失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 计算单项能力的市场价值
   */
  private calculateAbilityValue(
    abilityName: string,
    level: number,
    experiencePoints: number
  ): { currentValue: number; potentialValue: number } {
    // 基础价值
    const baseValue = ABILITY_BASE_VALUES[abilityName] || 150;

    // 市场需求系数
    const demandMultiplier = MARKET_DEMAND_MULTIPLIER[abilityName] || 1.0;

    // 当前价值 = 基础价值 × 等级 × 需求系数 × 经验加成
    const experienceBonus = 1 + (experiencePoints / 10000) * 0.2; // 每10000经验增加20%
    const currentValue = baseValue * level * demandMultiplier * experienceBonus;

    // 潜在价值（下一级的价值）
    const potentialValue = baseValue * (level + 1) * demandMultiplier * experienceBonus;

    return {
      currentValue: Math.round(currentValue),
      potentialValue: Math.round(potentialValue)
    };
  }

  /**
   * 计算月均收入
   */
  private async calculateMonthlyIncome(studentId: string): Promise<number> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM earnings
         WHERE student_id = $1
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [studentId]
      );

      return parseFloat(result.rows[0]?.total || '0');
    } catch (error) {
      logger.error('[AbilityValuation] 计算月均收入失败:', error);
      return 0;
    } finally {
      client.release();
    }
  }

  /**
   * 计算能力月度成长值
   */
  private async calculateMonthlyGrowth(
    studentId: string,
    abilityName: string
  ): Promise<number> {
    const client = await pool.connect();

    try {
      // 获取30天前的能力数据
      const historyResult = await client.query(
        `SELECT current_level, experience_points
         FROM ability_growth_history
         WHERE student_id = $1
           AND ability_name = $2
           AND recorded_at >= NOW() - INTERVAL '30 days'
         ORDER BY recorded_at ASC
         LIMIT 1`,
        [studentId, abilityName]
      );

      if (historyResult.rows.length === 0) {
        return 0;
      }

      const oldLevel = historyResult.rows[0].current_level;
      const oldExp = historyResult.rows[0].experience_points;

      // 获取当前能力数据
      const currentResult = await client.query(
        `SELECT current_level, experience_points
         FROM student_abilities
         WHERE student_id = $1 AND ability_name = $2`,
        [studentId, abilityName]
      );

      if (currentResult.rows.length === 0) {
        return 0;
      }

      const currentLevel = currentResult.rows[0].current_level;
      const currentExp = currentResult.rows[0].experience_points;

      // 计算价值增长
      const oldValue = this.calculateAbilityValue(abilityName, oldLevel, oldExp).currentValue;
      const currentValue = this.calculateAbilityValue(abilityName, currentLevel, currentExp).currentValue;

      return currentValue - oldValue;
    } catch (error) {
      logger.error('[AbilityValuation] 计算月度成长失败:', error);
      return 0;
    } finally {
      client.release();
    }
  }

  /**
   * 获取价值变化趋势（最近7天）
   */
  private async getValueTrends(studentId: string): Promise<{ date: string; value: number }[]> {
    const client = await pool.connect();

    try {
      // 获取最近7天的能力快照
      const result = await client.query(
        `SELECT
          DATE(recorded_at) as date,
          ability_name,
          current_level,
          experience_points
         FROM ability_growth_history
         WHERE student_id = $1
           AND recorded_at >= NOW() - INTERVAL '7 days'
         ORDER BY recorded_at DESC`,
        [studentId]
      );

      // 按日期分组计算总价值
      const trendMap = new Map<string, number>();

      for (const row of result.rows) {
        const date = row.date.toISOString().split('T')[0];
        const value = this.calculateAbilityValue(
          row.ability_name,
          row.current_level,
          row.experience_points
        ).currentValue;

        trendMap.set(date, (trendMap.get(date) || 0) + value);
      }

      // 转换为数组并排序
      const trends = Array.from(trendMap.entries())
        .map(([date, value]) => ({ date, value: Math.round(value) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trends;
    } catch (error) {
      logger.error('[AbilityValuation] 获取价值趋势失败:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 获取市场对比数据
   */
  private async getMarketComparison(
    studentId: string,
    totalValue: number
  ): Promise<{
    percentile: number;
    averageValue: number;
    topPerformerValue: number;
  }> {
    const client = await pool.connect();

    try {
      // 计算所有学生的能力价值分布
      const result = await client.query(
        `SELECT
          COUNT(*) FILTER (WHERE total_value < $1) as below_count,
          COUNT(*) as total_count,
          AVG(total_value) as avg_value,
          MAX(total_value) as max_value
         FROM (
           SELECT
             student_id,
             SUM(current_level * 200) as total_value
           FROM student_abilities
           WHERE current_level > 0
           GROUP BY student_id
         ) as student_values`,
        [totalValue]
      );

      const belowCount = parseInt(result.rows[0].below_count || '0');
      const totalCount = parseInt(result.rows[0].total_count || '1');
      const avgValue = parseFloat(result.rows[0].avg_value || '0');
      const maxValue = parseFloat(result.rows[0].max_value || '0');

      const percentile = Math.round((belowCount / totalCount) * 100);

      return {
        percentile,
        averageValue: Math.round(avgValue),
        topPerformerValue: Math.round(maxValue)
      };
    } catch (error) {
      logger.error('[AbilityValuation] 获取市场对比数据失败:', error);
      return {
        percentile: 50,
        averageValue: 3000,
        topPerformerValue: 10000
      };
    } finally {
      client.release();
    }
  }

  /**
   * 计算下一个里程碑
   */
  private calculateNextMilestone(
    currentValue: number,
    assets: AbilityAsset[]
  ): {
    targetValue: number;
    estimatedDays: number;
    requiredActions: string[];
  } {
    // 里程碑目标（5000, 10000, 20000, 50000）
    const milestones = [5000, 10000, 20000, 50000, 100000];
    const nextMilestone = milestones.find(m => m > currentValue) || currentValue * 2;

    // 找出成长最快的能力
    const topGrowthAssets = assets
      .filter(a => a.monthlyGrowth > 0)
      .sort((a, b) => b.monthlyGrowth - a.monthlyGrowth)
      .slice(0, 3);

    const avgMonthlyGrowth = topGrowthAssets.length > 0
      ? topGrowthAssets.reduce((sum, a) => sum + a.monthlyGrowth, 0) / topGrowthAssets.length
      : 500;

    const estimatedDays = avgMonthlyGrowth > 0
      ? Math.ceil(((nextMilestone - currentValue) / avgMonthlyGrowth) * 30)
      : 30;

    // 推荐行动
    const requiredActions: string[] = [];

    if (topGrowthAssets.length > 0) {
      requiredActions.push(`继续提升「${topGrowthAssets[0].abilityName}」，当前增速最快`);
    }

    const lowLevelAssets = assets.filter(a => a.currentLevel < 3);
    if (lowLevelAssets.length > 0) {
      requiredActions.push(`将「${lowLevelAssets[0].abilityName}」升至Lv.3可快速增值`);
    }

    requiredActions.push('完成3个高质量任务可提升市场评价');

    return {
      targetValue: nextMilestone,
      estimatedDays,
      requiredActions
    };
  }
}

export default new AbilityValuationService();
