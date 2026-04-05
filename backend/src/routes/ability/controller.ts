import { Request, Response, NextFunction } from 'express';
import { queryOne, query } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// ============================================================
// GET /ability/radar — 六维雷达图基础版 (免费, 完成首单后解锁)
// v7 要求: 雷达图是产品最精美的页面, 数据层面提供完整支撑
// ============================================================
export async function getRadar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const profile = await queryOne<{
      task_count: number;
      six_dim_scores: Record<string, number>;
      opc_label: string;
      level_a: number;
      level_b: number;
    }>(
      `SELECT sp.task_count, sp.six_dim_scores, sp.opc_label, sp.level_a, sp.level_b
       FROM student_profiles sp WHERE sp.user_id = $1`,
      [userId]
    );

    if (!profile) throw new AppError(404, '请先完成测试', 'PROFILE_NOT_FOUND');
    if (profile.task_count === 0) throw new AppError(403, '完成首单后可解锁六维雷达图', 'LOCKED');

    const scores = profile.six_dim_scores as Record<string, number>;

    // 能力描述语 (v7: 不只是数字，要有具体描述)
    const dimensionDescriptions = buildDimensionDescriptions(scores);

    res.json({
      success: true,
      data: {
        scores,
        dimensions: dimensionDescriptions,
        opcLabel: profile.opc_label,
        level: { a: profile.level_a, b: profile.level_b },
        // 前端使用这些数据渲染深色背景+发光效果雷达图
        renderConfig: {
          backgroundColor: '#0d1117',
          glowEffect: true,
          animationDuration: 1000,
        },
        shareEnabled: true, // 可截图分享 (带平台水印)
      },
    });
  } catch (err) { next(err); }
}

// GET /ability/radar/detailed — 详细版 (付费)
export async function getDetailedRadar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 检查是否已付费
    const paid = await queryOne(
      `SELECT id FROM opc_reports
       WHERE user_id = $1 AND report_type = 'R1' AND status = 'done'`,
      [userId]
    );

    // 检查是否完成了3单 (解锁条件)
    const profile = await queryOne<{ task_count: number; six_dim_scores: Record<string, number> }>(
      'SELECT task_count, six_dim_scores FROM student_profiles WHERE user_id = $1',
      [userId]
    );

    if (!profile || profile.task_count < 3) {
      throw new AppError(403, '完成3单后可解锁详细版', 'LOCKED');
    }

    if (!paid) {
      // 返回预览钩子 (v7)
      const scores = profile.six_dim_scores;
      res.json({
        success: false,
        code: 'PAYMENT_REQUIRED',
        data: {
          locked: true,
          price: 69,
          preview: {
            // 展示前两个维度的简要分析
            previewText: `你的专业技能评分 ${scores.d1}/100，执行力评分 ${scores.d2}/100...`,
            blurredText: '完整的六维分析将揭示你最独特的能力组合，解锁了解你为什么是「[模糊显示]」',
          },
        },
      });
      return;
    }

    // 已付费，返回详细分析
    const report = await queryOne<{ content_json: Record<string, unknown> }>(
      `SELECT content_json FROM opc_reports WHERE user_id = $1 AND report_type = 'R1' AND status = 'done'`,
      [userId]
    );

    res.json({ success: true, data: report?.content_json });
  } catch (err) { next(err); }
}

// ============================================================
// GET /ability/timeline — 能力成长时间线 (v7新增)
// ============================================================
export async function getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const events = await query(
      `SELECT id, event_type, event_title, event_desc, event_data,
              level_before, level_after, level_before_label, level_after_label,
              growth_comparison, is_milestone, share_card_generated, created_at
       FROM growth_timeline
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        events,
        // 前端渲染竖向时间轴
        totalEvents: events.length,
        milestones: events.filter((e) => (e as { is_milestone: boolean }).is_milestone),
      },
    });
  } catch (err) { next(err); }
}

// ============================================================
// 内部: 六维能力描述语生成
// d1:专业技能, d2:执行力, d3:新工具上手, d4:需求理解, d5:时间管理, d6:交付水平
// ============================================================
function buildDimensionDescriptions(scores: Record<string, number>) {
  const desc: Record<string, { name: string; score: number; description: string; color: string }> = {
    d1: {
      name: '专业技能',
      score: scores.d1 || 0,
      description: getScoreDesc(scores.d1, ['你正在积累专业技能', '你有扎实的专业基础', '你是那种说到做到的专家']),
      color: '#6ee7f7',
    },
    d2: {
      name: '执行力',
      score: scores.d2 || 0,
      description: getScoreDesc(scores.d2, ['你正在建立执行习惯', '你的执行力已相当稳定', '你是那种说到做到的人']),
      color: '#a78bfa',
    },
    d3: {
      name: '新工具上手',
      score: scores.d3 || 0,
      description: getScoreDesc(scores.d3, ['你愿意尝试新工具', '你上手新工具很快', '你是工具达人，新工具是你的武器']),
      color: '#34d399',
    },
    d4: {
      name: '需求理解',
      score: scores.d4 || 0,
      description: getScoreDesc(scores.d4, ['你在学习理解需求', '你能准确把握需求', '你能精准理解甲方真正想要什么']),
      color: '#fbbf24',
    },
    d5: {
      name: '时间管理',
      score: scores.d5 || 0,
      description: getScoreDesc(scores.d5, ['你正在建立时间管理习惯', '你的时间管理相当不错', '你是时间的主人，从不拖延']),
      color: '#f87171',
    },
    d6: {
      name: '交付水平',
      score: scores.d6 || 0,
      description: getScoreDesc(scores.d6, ['你正在提升交付质量', '你的交付质量稳定可靠', '你的交付让人惊喜，超出预期']),
      color: '#60a5fa',
    },
  };
  return desc;
}

function getScoreDesc(score: number, levels: string[]): string {
  if (score < 40) return levels[0];
  if (score < 75) return levels[1];
  return levels[2];
}
