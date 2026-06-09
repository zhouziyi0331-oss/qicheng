import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// GET /passion/sparks/:userId — 获取用户的热情火花记录
export async function getSparks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    const sparks = await query(
      `SELECT id, activity_name, description, intensity_level, context,
              triggered_at, tags, created_at
       FROM passion_sparks
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY triggered_at DESC`,
      [userId]
    );
    res.json({ success: true, data: sparks });
  } catch (err) { next(err); }
}

// POST /passion/spark/record — 记录热情火花
export async function recordSpark(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { activityName, description, intensityLevel, context, tags } = req.body;

    if (!activityName || !intensityLevel) {
      throw new AppError(400, '缺少必要参数', 'MISSING_PARAMS');
    }

    if (intensityLevel < 1 || intensityLevel > 10) {
      throw new AppError(400, '强度等级必须在1-10之间', 'INVALID_INTENSITY');
    }

    const result = await query(
      `INSERT INTO passion_sparks
       (user_id, activity_name, description, intensity_level, context,
        triggered_at, tags, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW())
       RETURNING id`,
      [userId, activityName, description, intensityLevel, context, tags || []]
    );

    res.json({ success: true, data: { sparkId: result[0].id } });
  } catch (err) { next(err); }
}

// GET /passion/analysis/:userId — 获取热情分析
export async function getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;

    // 获取热情火花统计
    const stats = await queryOne<{
      total_sparks: number;
      avg_intensity: number;
      top_activities: string[];
      common_tags: string[];
    }>(
      `SELECT
         COUNT(*) as total_sparks,
         AVG(intensity_level) as avg_intensity,
         ARRAY_AGG(DISTINCT activity_name) FILTER (WHERE intensity_level >= 7) as top_activities,
         ARRAY_AGG(DISTINCT unnest(tags)) as common_tags
       FROM passion_sparks
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    // 获取最近的高强度火花
    const recentHighIntensity = await query(
      `SELECT activity_name, intensity_level, triggered_at
       FROM passion_sparks
       WHERE user_id = $1 AND intensity_level >= 7 AND deleted_at IS NULL
       ORDER BY triggered_at DESC
       LIMIT 10`,
      [userId]
    );

    // 生成热情趋势（按月统计）
    const trends = await query(
      `SELECT
         DATE_TRUNC('month', triggered_at) as month,
         COUNT(*) as spark_count,
         AVG(intensity_level) as avg_intensity
       FROM passion_sparks
       WHERE user_id = $1 AND deleted_at IS NULL
       GROUP BY DATE_TRUNC('month', triggered_at)
       ORDER BY month DESC
       LIMIT 12`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        statistics: stats || { total_sparks: 0, avg_intensity: 0, top_activities: [], common_tags: [] },
        recentHighIntensity,
        trends
      }
    });
  } catch (err) { next(err); }
}

// GET /passion/recommendations/:userId — 获取热情探索建议
export async function getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;

    // 获取用户的热情火花数据
    const sparks = await query<{
      activity_name: string;
      intensity_level: number;
      tags: string[];
    }>(
      `SELECT activity_name, intensity_level, tags
       FROM passion_sparks
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY intensity_level DESC, triggered_at DESC
       LIMIT 20`,
      [userId]
    );

    if (sparks.length === 0) {
      res.json({
        success: true,
        data: {
          recommendations: [],
          message: '暂无足够数据生成建议，请先记录一些热情火花'
        }
      });
      return;
    }

    // 分析高强度活动
    const highIntensityActivities = sparks
      .filter(s => s.intensity_level >= 7)
      .map(s => s.activity_name);

    // 提取常见标签
    const allTags = sparks.flatMap(s => s.tags || []);
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // 生成建议
    const recommendations = [
      {
        type: 'deep_dive',
        title: '深入探索高强度活动',
        description: `您在以下活动中表现出强烈热情：${highIntensityActivities.slice(0, 3).join('、')}。建议深入探索这些领域。`,
        activities: highIntensityActivities.slice(0, 5)
      },
      {
        type: 'pattern_exploration',
        title: '探索相关领域',
        description: `基于您的兴趣标签（${topTags.join('、')}），推荐探索相关领域。`,
        suggestedTags: topTags
      },
      {
        type: 'consistency',
        title: '保持记录习惯',
        description: '持续记录热情火花可以帮助您更好地了解自己的兴趣模式。',
        action: 'continue_tracking'
      }
    ];

    res.json({ success: true, data: { recommendations } });
  } catch (err) { next(err); }
}
