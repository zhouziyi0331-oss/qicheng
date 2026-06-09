import { Request, Response, NextFunction } from 'express';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// GET /exploration/patterns/:userId — 获取用户的模式探索记录
export async function getPatterns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    const patterns = await query(
      `SELECT id, pattern_type, pattern_name, description, life_marked,
              applied_count, created_at, last_applied_at
       FROM exploration_patterns
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: patterns });
  } catch (err) { next(err); }
}

// POST /exploration/pattern/apply — 应用某个模式
export async function applyPattern(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { patternId, context } = req.body;

    if (!patternId) {
      throw new AppError(400, '缺少 patternId', 'MISSING_PATTERN_ID');
    }

    const pattern = await queryOne(
      `SELECT id, pattern_name FROM exploration_patterns
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [patternId, userId]
    );

    if (!pattern) {
      throw new AppError(404, '模式不存在', 'PATTERN_NOT_FOUND');
    }

    await withTransaction(async (client) => {
      // 更新应用次数
      await client.query(
        `UPDATE exploration_patterns
         SET applied_count = applied_count + 1, last_applied_at = NOW()
         WHERE id = $1`,
        [patternId]
      );

      // 记录应用历史
      await client.query(
        `INSERT INTO exploration_applications (user_id, pattern_id, context, applied_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, patternId, context]
      );
    });

    res.json({ success: true, message: `已应用模式: ${pattern.pattern_name}` });
  } catch (err) { next(err); }
}

// POST /exploration/pattern/mark-life — 标记为人生模式
export async function markAsLifePattern(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { patternId } = req.body;

    if (!patternId) {
      throw new AppError(400, '缺少 patternId', 'MISSING_PATTERN_ID');
    }

    const result = await query(
      `UPDATE exploration_patterns
       SET life_marked = true, life_marked_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, pattern_name`,
      [patternId, userId]
    );

    if (result.length === 0) {
      throw new AppError(404, '模式不存在', 'PATTERN_NOT_FOUND');
    }

    res.json({ success: true, message: `已标记为人生模式: ${result[0].pattern_name}` });
  } catch (err) { next(err); }
}

// POST /exploration/reflection — 提交反思记录
export async function submitReflection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { content, tags, relatedPatternId } = req.body;

    if (!content || content.trim().length === 0) {
      throw new AppError(400, '反思内容不能为空', 'EMPTY_CONTENT');
    }

    const result = await query(
      `INSERT INTO exploration_reflections
       (user_id, content, tags, related_pattern_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [userId, content, tags || [], relatedPatternId || null]
    );

    res.json({ success: true, data: { reflectionId: result[0].id } });
  } catch (err) { next(err); }
}

// GET /exploration/reflections/:userId — 获取反思记录
export async function getReflections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    const reflections = await query(
      `SELECT r.id, r.content, r.tags, r.created_at,
              p.pattern_name as related_pattern_name
       FROM exploration_reflections r
       LEFT JOIN exploration_patterns p ON p.id = r.related_pattern_id
       WHERE r.user_id = $1 AND r.deleted_at IS NULL
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ success: true, data: reflections });
  } catch (err) { next(err); }
}

// GET /exploration/suggestions — 获取探索建议
export async function getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 获取用户的 OPC 标签和任务历史
    const profile = await queryOne<{ opc_label: string; task_count: number }>(
      'SELECT opc_label, task_count FROM student_profiles WHERE user_id = $1',
      [userId]
    );

    if (!profile) {
      throw new AppError(404, '用户档案不存在', 'PROFILE_NOT_FOUND');
    }

    // 基于 OPC 标签生成探索建议
    const suggestions = generateExplorationSuggestions(profile.opc_label, profile.task_count);

    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
}

// POST /exploration/tag — 为探索记录添加标签
export async function addTag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { reflectionId, tag } = req.body;

    if (!reflectionId || !tag) {
      throw new AppError(400, '缺少 reflectionId 或 tag', 'MISSING_PARAMS');
    }

    const reflection = await queryOne(
      `SELECT id, tags FROM exploration_reflections
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [reflectionId, userId]
    );

    if (!reflection) {
      throw new AppError(404, '反思记录不存在', 'REFLECTION_NOT_FOUND');
    }

    const currentTags: string[] = (reflection.tags as string[]) || [];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      await query(
        `UPDATE exploration_reflections SET tags = $1 WHERE id = $2`,
        [currentTags, reflectionId]
      );
    }

    res.json({ success: true, message: '标签已添加' });
  } catch (err) { next(err); }
}

// GET /exploration/tags/:userId — 获取用户的所有标签
export async function getTags(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;

    const reflections = await query<{ tags: string[] }>(
      `SELECT tags FROM exploration_reflections
       WHERE user_id = $1 AND deleted_at IS NULL AND tags IS NOT NULL`,
      [userId]
    );

    // 聚合所有标签
    const allTags = new Set<string>();
    reflections.forEach(r => {
      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach(tag => allTags.add(tag));
      }
    });

    res.json({ success: true, data: Array.from(allTags) });
  } catch (err) { next(err); }
}

// ============================================================
// 内部辅助函数
// ============================================================
function generateExplorationSuggestions(opcLabel: string, taskCount: number): any[] {
  const suggestions = [
    {
      title: '观察你的工作模式',
      description: '记录你在完成任务时的思考方式和行为习惯',
      actionUrl: '/exploration/reflection',
    },
    {
      title: '识别重复出现的挑战',
      description: '哪些问题总是反复出现？这可能揭示了你的成长机会',
      actionUrl: '/exploration/patterns',
    },
  ];

  if (taskCount >= 5) {
    suggestions.push({
      title: '总结你的核心优势',
      description: '从完成的任务中，提炼出你最擅长的3个能力',
      actionUrl: '/exploration/reflection',
    });
  }

  if (taskCount >= 10) {
    suggestions.push({
      title: '探索新的应用场景',
      description: '你的能力可以在哪些新领域发挥作用？',
      actionUrl: '/exploration/patterns',
    });
  }

  return suggestions;
}
