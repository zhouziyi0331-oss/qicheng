"use strict";
/**
 * AI定价服务 - E-04功能
 * 基于任务特征、市场数据、历史价格提供智能定价建议
 * 增强E-01的定价能力
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class AIPricingService {
    constructor() {
        // 基础定价标准（元/小时）
        this.BASE_RATES = {
            junior: 50,
            intermediate: 80,
            senior: 120,
            expert: 180,
        };
        // 技能加成系数
        this.SKILL_PREMIUMS = {
            'AI': 1.5,
            'Machine Learning': 1.5,
            '区块链': 1.4,
            'Blockchain': 1.4,
            'React Native': 1.3,
            'Flutter': 1.3,
            'Vue': 1.1,
            'React': 1.1,
            'Node.js': 1.1,
            'TypeScript': 1.1,
            'Python': 1.0,
            'Java': 1.0,
            'UI设计': 1.2,
            'UX设计': 1.2,
        };
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || "",
        });
    }
    /**
     * 计算智能定价
     */
    async calculatePrice(taskFeatures) {
        try {
            logger_1.default.info('Calculating AI pricing', { task: taskFeatures.title });
            // 1. 计算基础价格
            const basePrice = await this.calculateBasePrice(taskFeatures);
            // 2. 获取市场数据
            const marketData = await this.getMarketData(taskFeatures);
            // 3. 使用AI进行综合定价分析
            const aiAnalysis = await this.getAIPricingAnalysis(taskFeatures, basePrice, marketData);
            // 4. 计算最终定价
            const finalPricing = this.calculateFinalPricing(basePrice, marketData, aiAnalysis);
            return finalPricing;
        }
        catch (error) {
            logger_1.default.error('Error calculating AI pricing:', error);
            // 返回降级定价
            return this.getFallbackPricing(taskFeatures);
        }
    }
    /**
     * 计算基础价格
     */
    async calculateBasePrice(taskFeatures) {
        // 确定难度等级
        const difficulty = taskFeatures.difficulty || 3;
        const level = difficulty <= 2 ? 'junior' : difficulty <= 3 ? 'intermediate' : difficulty <= 4 ? 'senior' : 'expert';
        const baseRate = this.BASE_RATES[level];
        const hours = taskFeatures.estimated_hours || 40;
        const basePrice = baseRate * hours;
        // 计算技能加成
        let skillPremium = 0;
        if (taskFeatures.required_skills && taskFeatures.required_skills.length > 0) {
            const premiums = taskFeatures.required_skills.map(skill => {
                for (const [key, value] of Object.entries(this.SKILL_PREMIUMS)) {
                    if (skill.toLowerCase().includes(key.toLowerCase())) {
                        return value;
                    }
                }
                return 1.0;
            });
            const avgPremium = premiums.reduce((a, b) => a + b, 0) / premiums.length;
            skillPremium = basePrice * (avgPremium - 1);
        }
        // 计算难度加成
        const difficultyPremium = basePrice * (difficulty - 3) * 0.15;
        // 计算紧急程度加成
        let urgencyPremium = 0;
        if (taskFeatures.urgency === 'urgent') {
            urgencyPremium = basePrice * 0.2;
        }
        else if (taskFeatures.urgency === 'very_urgent') {
            urgencyPremium = basePrice * 0.5;
        }
        return {
            base: basePrice,
            skill_premium: Math.max(0, skillPremium),
            difficulty_premium: Math.max(0, difficultyPremium),
            urgency_premium: Math.max(0, urgencyPremium),
        };
    }
    /**
     * 获取市场数据
     */
    async getMarketData(taskFeatures) {
        const client = await db_1.pool.connect();
        try {
            // 获取平台平均价格
            const platformAvgResult = await client.query(`SELECT AVG(budget) as avg_price
         FROM tasks
         WHERE budget > 0 AND status != 'cancelled'`);
            // 获取相似任务的平均价格
            let similarTasksAvg = platformAvgResult.rows[0].avg_price || 3000;
            let sampleSize = 0;
            if (taskFeatures.task_type) {
                const similarResult = await client.query(`SELECT AVG(budget) as avg_price, COUNT(*) as count
           FROM tasks
           WHERE task_type = $1 AND budget > 0
           AND created_at > NOW() - INTERVAL '90 days'`, [taskFeatures.task_type]);
                if (similarResult.rows[0].count > 0) {
                    similarTasksAvg = similarResult.rows[0].avg_price;
                    sampleSize = parseInt(similarResult.rows[0].count);
                }
            }
            return {
                platform_average: Number(platformAvgResult.rows[0].avg_price) || 3000,
                similar_tasks_avg: Number(similarTasksAvg) || 3000,
                sample_size: sampleSize,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting market data:', error);
            return {
                platform_average: 3000,
                similar_tasks_avg: 3000,
                sample_size: 0,
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 使用AI进行定价分析
     */
    async getAIPricingAnalysis(taskFeatures, basePrice, marketData) {
        try {
            const totalBase = basePrice.base + basePrice.skill_premium + basePrice.difficulty_premium + basePrice.urgency_premium;
            const prompt = `你是启程平台的"AI定价专家"，帮助企业确定任务的合理价格。

任务信息：
标题：${taskFeatures.title}
描述：${taskFeatures.description.substring(0, 200)}
技能要求：${taskFeatures.required_skills?.join(', ') || '未指定'}
难度：${taskFeatures.difficulty || '未知'}/5
预估工时：${taskFeatures.estimated_hours || '未知'}小时

基础定价计算：
- 基础价格：¥${basePrice.base}
- 技能加成：¥${basePrice.skill_premium}
- 难度加成：¥${basePrice.difficulty_premium}
- 紧急加成：¥${basePrice.urgency_premium}
- 小计：¥${totalBase}

市场参考：
- 平台平均价格：¥${marketData.platform_average}
- 相似任务平均：¥${marketData.similar_tasks_avg}

请分析以下因素并给出定价建议：
1. 基础定价是否合理（考虑工时、难度、技能）
2. 与市场价格的对比
3. 是否需要调整（向上或向下）
4. 调整的理由

以JSON格式返回：
{
  "adjustment_factor": 调整系数（0.8-1.2，1.0表示不调整）,
  "reasoning": "定价分析理由（简短）",
  "recommendations": ["建议1", "建议2"]
}`;
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                temperature: 0.5,
                messages: [{ role: 'user', content: prompt }],
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                return {
                    adjustment_factor: Math.min(Math.max(analysis.adjustment_factor || 1.0, 0.8), 1.2),
                    reasoning: analysis.reasoning || '基于市场数据分析',
                    recommendations: analysis.recommendations || [],
                };
            }
            throw new Error('Failed to parse AI response');
        }
        catch (error) {
            logger_1.default.error('Error getting AI pricing analysis:', error);
            return {
                adjustment_factor: 1.0,
                reasoning: '使用标准定价算法',
                recommendations: [],
            };
        }
    }
    /**
     * 计算最终定价
     */
    calculateFinalPricing(basePrice, marketData, aiAnalysis) {
        const totalBase = basePrice.base + basePrice.skill_premium + basePrice.difficulty_premium + basePrice.urgency_premium;
        // 应用AI调整系数
        const marketAdjustment = (totalBase * aiAnalysis.adjustment_factor) - totalBase;
        const suggestedPrice = Math.round(totalBase + marketAdjustment);
        // 计算价格区间（±20%）
        const minPrice = Math.round(suggestedPrice * 0.8);
        const maxPrice = Math.round(suggestedPrice * 1.2);
        // 计算置信度
        const confidenceLevel = marketData.sample_size > 10 ? 0.9 : marketData.sample_size > 5 ? 0.75 : 0.6;
        // 计算市场排名
        const percentileRank = suggestedPrice / marketData.platform_average;
        return {
            suggested_price: suggestedPrice,
            min_price: minPrice,
            max_price: maxPrice,
            confidence_level: confidenceLevel,
            pricing_breakdown: {
                base_price: basePrice.base,
                skill_premium: basePrice.skill_premium,
                difficulty_premium: basePrice.difficulty_premium,
                urgency_premium: basePrice.urgency_premium,
                market_adjustment: marketAdjustment,
            },
            market_comparison: {
                platform_average: marketData.platform_average,
                similar_tasks_avg: marketData.similar_tasks_avg,
                percentile_rank: Math.round(percentileRank * 100) / 100,
            },
            reasoning: aiAnalysis.reasoning,
            recommendations: aiAnalysis.recommendations,
        };
    }
    /**
     * 降级定价（AI失败时）
     */
    getFallbackPricing(taskFeatures) {
        const basePrice = this.BASE_RATES.intermediate * (taskFeatures.estimated_hours || 40);
        return {
            suggested_price: basePrice,
            min_price: Math.round(basePrice * 0.8),
            max_price: Math.round(basePrice * 1.2),
            confidence_level: 0.5,
            pricing_breakdown: {
                base_price: basePrice,
                skill_premium: 0,
                difficulty_premium: 0,
                urgency_premium: 0,
                market_adjustment: 0,
            },
            market_comparison: {
                platform_average: 3000,
                similar_tasks_avg: 3000,
                percentile_rank: 1.0,
            },
            reasoning: '使用标准定价',
            recommendations: ['建议提供更详细的任务信息以获得更精准的定价'],
        };
    }
    /**
     * 保存定价记录
     */
    async savePricingRecord(taskId, taskFeatures, result) {
        const client = await db_1.pool.connect();
        try {
            await client.query(`INSERT INTO ai_pricing_history (
          task_id, task_features, pricing_result,
          suggested_price, confidence_level, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`, [
                taskId,
                JSON.stringify(taskFeatures),
                JSON.stringify(result),
                result.suggested_price,
                result.confidence_level,
            ]).catch(() => {
                // 如果表不存在，忽略错误
                logger_1.default.warn('ai_pricing_history table may not exist');
            });
        }
        finally {
            client.release();
        }
    }
}
exports.default = new AIPricingService();
//# sourceMappingURL=aiPricingService.js.map