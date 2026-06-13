import { Response } from 'express';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { query } from '../utils/db';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * AI智能定价建议服务
 * 根据任务描述、等级、赛道，使用AI分析市场行情给出定价建议
 */

export const getPricingSuggestion = async (req: AuthRequest, res: Response) => {
  try {
    const { description, level, track, requirements } = req.body;

    // 1. 检查缓存（相似任务的定价建议）
    const cachedSuggestion = await query(
      `SELECT * FROM pricing_suggestions
       WHERE task_description = $1 AND task_level = $2 AND task_track = $3
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [description, level, track]
    );

    if (cachedSuggestion.length > 0) {
      return res.json({
        success: true,
        data: cachedSuggestion[0],
        cached: true
      });
    }

    // 2. 查询历史相似任务的平均价格
    const historicalData = await query(
      `SELECT
         AVG(budget) as avg_budget,
         MIN(budget) as min_budget,
         MAX(budget) as max_budget,
         COUNT(*) as task_count
       FROM tasks
       WHERE level = $1 AND track = $2 AND status = 'completed'`,
      [level, track]
    );

    const marketData = historicalData[0];

    // 3. 调用Claude AI进行智能定价分析
    const prompt = `你是一个任务定价专家。请根据以下信息给出合理的定价建议：

任务描述：${description}
任务要求：${requirements || '无'}
任务等级：${level}（Lv.0=入门，Lv.1=初级，Lv.2=中级，Lv.3=高级）
任务赛道：${track}（A=AI应用，B=AI开发，AB=综合）

市场数据参考：
- 历史同类任务平均价格：${marketData.avg_budget ? `¥${marketData.avg_budget}` : '暂无数据'}
- 历史价格区间：${marketData.min_budget ? `¥${marketData.min_budget} - ¥${marketData.max_budget}` : '暂无数据'}
- 历史任务数量：${marketData.task_count}个

请分析：
1. 估算完成该任务需要的工时（小时）
2. 建议的价格区间（最低价-最高价）
3. 定价理由（考虑任务复杂度、技能要求、市场行情）

请以JSON格式返回：
{
  "estimated_hours": 数字,
  "suggested_min_price": 数字,
  "suggested_max_price": 数字,
  "reasoning": "定价理由说明"
}`;

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const aiContent = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';

    // 解析AI返回的JSON
    let pricingData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pricingData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI返回格式错误');
      }
    } catch (parseError) {
      // 降级方案：使用规则引擎
      pricingData = getRuleBasedPricing(level, track, marketData);
    }

    // 4. 保存到缓存
    const savedSuggestion = await query(
      `INSERT INTO pricing_suggestions
       (task_description, task_level, task_track, estimated_hours,
        suggested_min_price, suggested_max_price, market_avg_price, reasoning)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        description,
        level,
        track,
        pricingData.estimated_hours,
        pricingData.suggested_min_price,
        pricingData.suggested_max_price,
        marketData.avg_budget || 0,
        pricingData.reasoning
      ]
    );

    res.json({
      success: true,
      data: savedSuggestion[0],
      cached: false
    });

  } catch (error) {
    logger.error('获取定价建议失败:', error);

    // 降级方案：返回基础定价建议
    const { level, track } = req.body;
    const fallbackPricing = getRuleBasedPricing(level, track, { avg_budget: 0 });

    res.json({
      success: true,
      data: fallbackPricing,
      fallback: true,
      message: 'AI服务暂时不可用，已使用规则引擎生成建议'
    });
  }
};

/**
 * 规则引擎定价（降级方案）
 */
function getRuleBasedPricing(level: string, track: string, marketData: any) {
  // 基础价格矩阵
  const basePrices: { [key: string]: { [key: string]: number } } = {
    'Lv.0': { 'A': 50, 'B': 80, 'AB': 100 },
    'Lv.1': { 'A': 100, 'B': 150, 'AB': 200 },
    'Lv.2': { 'A': 200, 'B': 300, 'AB': 400 },
    'Lv.3': { 'A': 400, 'B': 600, 'AB': 800 }
  };

  const basePrice = basePrices[level]?.[track] || 100;
  const minPrice = Math.max(30, basePrice * 0.8); // 最低30元
  const maxPrice = basePrice * 1.5;

  // 如果有市场数据，参考市场均价调整
  let adjustedMin = minPrice;
  let adjustedMax = maxPrice;
  if (marketData.avg_budget && marketData.avg_budget > 0) {
    adjustedMin = Math.max(minPrice, marketData.avg_budget * 0.8);
    adjustedMax = Math.min(maxPrice, marketData.avg_budget * 1.2);
  }

  return {
    estimated_hours: basePrice / 50, // 假设时薪50元
    suggested_min_price: Math.round(adjustedMin),
    suggested_max_price: Math.round(adjustedMax),
    market_avg_price: marketData.avg_budget || 0,
    reasoning: `基于${level}等级和${track}赛道的市场行情，建议定价区间为¥${Math.round(adjustedMin)}-¥${Math.round(adjustedMax)}。${marketData.task_count > 0 ? `参考了${marketData.task_count}个历史任务数据。` : '暂无历史数据参考。'}`
  };
}

/**
 * 清理过期的定价建议缓存（定时任务调用）
 */
export const cleanExpiredPricingSuggestions = async () => {
  try {
    const result = await query(
      'DELETE FROM pricing_suggestions WHERE expires_at < NOW()'
    );
    logger.info(`清理了${result.length}条过期的定价建议`);
  } catch (error) {
    logger.error('清理定价建议缓存失败:', error);
  }
};
