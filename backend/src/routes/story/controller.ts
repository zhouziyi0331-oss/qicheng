import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';
import { moderateContent } from '../../utils/moderation';

// ============================================================
// GET /story/feed — 故事墙信息流
// RULE: NO LEADERBOARD — 排序逻辑: 相似OPC标签 + 相似等级 + 时间倒序
// 绝不按 likes 排序 (PRD Ch.09 & Ch.24)
// ============================================================
export async function getFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // 获取当前用户的 OPC 标签和等级
    const profile = await queryOne<{ opc_label: string; current_level: number; track: string }>(
      'SELECT opc_label, current_level, track FROM users u LEFT JOIN student_capabilities sc ON u.id = sc.student_id WHERE u.id = $1',
      [userId]
    );

    // RULE: NO LEADERBOARD
    // 排序: 1) 同OPC标签优先 2) 相近等级 (±1) 3) 时间倒序
    // 绝对不使用 ORDER BY likes 或任何基于热度/收入的排序
    const posts = await query(
      `SELECT
         swp.id,
         CASE WHEN swp.is_anonymous THEN '匿名OPC' ELSE u.nickname END as author_name,
         CASE WHEN swp.is_anonymous THEN NULL ELSE u.avatar_url END as author_avatar,
         swp.track, swp.level, swp.task_type, swp.earnings, swp.content,
         swp.is_anonymous, swp.created_at,
         -- 点赞数仅展示，绝不用于排序
         swp.likes as like_count,
         -- 相似度评分 (用于排序，非排行)
         CASE
           WHEN sp.opc_label = $2 THEN 3
           WHEN ABS(swp.level - $3) <= 1 THEN 2
           WHEN swp.track = $4 THEN 1
           ELSE 0
         END as similarity_score
       FROM story_wall_posts swp
       JOIN users u ON u.id = swp.user_id
       LEFT JOIN users u ON u.id = swp.user_id
       WHERE swp.status = 'approved'
         AND swp.deleted_at IS NULL
         AND swp.user_id != $1
       -- RULE: NO LEADERBOARD — ORDER BY similarity_score DESC, time DESC (never by likes)
       ORDER BY similarity_score DESC, swp.created_at DESC
       LIMIT $5 OFFSET $6`,
      [userId, profile?.opc_label, profile?.current_level || 0, profile?.track || 'A', limit, offset]
    );

    res.json({
      success: true,
      data: posts,
      meta: { page, limit, sortBy: 'similarity_and_time' },
      // 明确告知前端: 此接口永不提供按点赞排序的选项
      sortingNote: 'Sorted by OPC similarity and time. NO LEADERBOARD.',
    });
  } catch (err: unknown) { next(err); }
}

// ============================================================
// POST /story/posts — 发布故事 (AI审核后可见)
// ============================================================
export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { content, isAnonymous, earnings } = req.body;

    if (!content || content.trim().length < 10) {
      throw new AppError(400, '故事内容至少10个字', 'CONTENT_TOO_SHORT');
    }
    if (content.length > 500) {
      throw new AppError(400, '故事内容不超过500字', 'CONTENT_TOO_LONG');
    }

    const profile = await queryOne<{ track: string; current_level: number; tasks_completed: number }>(
      'SELECT track, current_level, tasks_completed FROM users u LEFT JOIN student_capabilities sc ON u.id = sc.student_id WHERE u.id = $1',
      [userId]
    );

    // 至少完成1单才能发布故事
    if (!profile || profile.tasks_completed === 0) {
      throw new AppError(403, '完成至少1单后可以分享故事', 'NO_TASKS_COMPLETED');
    }

    const [post] = await query<{ id: string }>(
      `INSERT INTO story_wall_posts
        (user_id, is_anonymous, track, level, content, earnings, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')
       RETURNING id`,
      [userId, isAnonymous || false, profile.track, profile.current_level, content.trim(), earnings || null]
    );

    // AI 内容审核 (异步)
    moderateContent(content).then(async (result: { safe: boolean; reason?: string }) => {
      if (!result.safe) {
        await query(
          `UPDATE story_wall_posts SET status = 'rejected', reject_reason = $1 WHERE id = $2`,
          [result.reason || '内容不符合社区规范', post.id]
        );
        logger.info('Story post rejected by AI', { postId: post.id, reason: result.reason });
      } else {
        await query(
          `UPDATE story_wall_posts SET status = 'active' WHERE id = $1`,
          [post.id]
        );
        logger.info('Story post approved', { postId: post.id });
      }
    }).catch((err: Error) => {
      logger.error('AI moderation error', { error: err.message });
    });

    res.status(201).json({
      success: true,
      data: { postId: post.id, status: 'pending', message: '故事已提交，审核通过后将展示在故事墙' },
    });
  } catch (err: unknown) { next(err); }
}

// ============================================================
// POST /story/posts/:id/like — 点赞
// RULE: 点赞数仅存储展示, 不影响排序, 不产生排行榜
// ============================================================
export async function likePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    // RULE: NO LEADERBOARD — likes are stored but never used for ranking
    await query(
      `UPDATE story_wall_posts SET likes = likes + 1 WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    res.json({ success: true, message: '已点赞' });
  } catch (err: unknown) { next(err); }
}

// ============================================================
// GET /story/peers — 同类人信息流
// "和你差不多的人在做什么" — 基于OPC标签相似度, 绝不排行
// RULE: NO LEADERBOARD — See PRD Ch.09
// ============================================================
export async function getPeersFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const profile = await queryOne<{ opc_label: string; current_level: number; track: string }>(
      'SELECT opc_label, current_level, track FROM users u LEFT JOIN student_capabilities sc ON u.id = sc.student_id WHERE u.id = $1',
      [userId]
    );
    if (!profile) throw new AppError(404, '请先完成测试', 'PROFILE_NOT_FOUND');

    // RULE: NO LEADERBOARD — 只展示"同类人在做什么"，不展示谁赚最多
    const peers = await query(
      `SELECT
         'task_completed' as event_type,
         CASE WHEN sp.opc_label IS NOT NULL
           THEN '一位' || sp.opc_label
           ELSE '一位' || CASE u.current_level WHEN 0 THEN '探索者' WHEN 1 THEN '入门者'
                          WHEN 2 THEN '实践者' WHEN 3 THEN '熟练者' ELSE '专业者' END
         END as actor_label,
         t.track,
         t.title as task_title,
         ta.completed_at,
         u.track
       FROM task_assignments ta
       JOIN users u ON u.id = ta.student_id
       JOIN tasks t ON t.id = ta.task_id
       WHERE ta.status = 'completed'
         AND ta.student_id != $1
         AND (sp.opc_label = $2 OR ABS(u.current_level - $3) <= 1)
         AND ta.completed_at > NOW() - interval '7 days'
       -- RULE: NO LEADERBOARD — ORDER BY time only, never by earnings/count
       ORDER BY ta.completed_at DESC
       LIMIT 20`,
      [userId, profile.opc_label, profile.current_level]
    );

    res.json({
      success: true,
      data: peers,
      message: `和你差不多的人最近在做什么`,
    });
  } catch (err: unknown) { next(err); }
}

// ============================================================
// GET /story-wall
// 获取故事墙列表（兼容前端路由）
// ============================================================
export async function getStoryWall(req: Request, res: Response, next: NextFunction): Promise<void> {
  // 复用 getFeed 逻辑
  return getFeed(req, res, next);
}

// ============================================================
// POST /story-wall/submit
// 提交故事（兼容前端路由）
// ============================================================
export async function submitStory(req: Request, res: Response, next: NextFunction): Promise<void> {
  // 复用 createPost 逻辑
  return createPost(req, res, next);
}

// ============================================================
// POST /story/:id/comment
// 评论故事
// ============================================================
export async function commentOnStory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: storyId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      throw new AppError(400, '评论内容不能为空', 'EMPTY_CONTENT');
    }

    // 检查故事是否存在
    const story = await queryOne(
      'SELECT id, author_id FROM story_wall_posts WHERE id = $1 AND deleted_at IS NULL',
      [storyId]
    );

    if (!story) {
      throw new AppError(404, '故事不存在', 'STORY_NOT_FOUND');
    }

    // 创建评论（使用 story_wall_comments 表）
    const comment = await queryOne<{ id: string }>(
      `INSERT INTO story_wall_comments (post_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [storyId, userId, content.trim()]
    );

    // 更新故事的评论数
    await query(
      `UPDATE story_wall_posts
       SET comment_count = COALESCE(comment_count, 0) + 1
       WHERE id = $1`,
      [storyId]
    );

    // 如果评论的不是自己的故事，创建通知
    if ((story as any).author_id !== userId) {
      await query(
        `INSERT INTO notifications (user_id, type, title, content, related_id, created_at)
         VALUES ($1, 'story_comment', '新评论', '有人评论了你的故事', $2, NOW())`,
        [(story as any).author_id, storyId]
      ).catch(() => {
        // 忽略通知创建失败
      });
    }

    res.json({
      success: true,
      data: {
        commentId: comment?.id,
        message: '评论成功',
      },
    });
  } catch (err: unknown) {
    next(err);
  }
}
