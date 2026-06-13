import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// GET /life-question/questions — 获取人生反思问题库
export async function getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, difficulty } = req.query;

    let sql = `SELECT id, question_text, category, difficulty_level,
                      reflection_prompts, created_at
               FROM life_questions
               WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (difficulty) {
      params.push(difficulty);
      sql += ` AND difficulty_level = $${params.length}`;
    }

    sql += ` ORDER BY RANDOM() LIMIT 20`;

    const questions = await query(sql, params);
    res.json({ success: true, data: questions });
  } catch (err: unknown) { next(err); }
}

// POST /life-question/answer — 提交问题答案
export async function submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { questionId, answerText, emotionalState, insights } = req.body;

    if (!questionId || !answerText) {
      throw new AppError(400, '缺少必要参数', 'MISSING_PARAMS');
    }

    // 验证问题是否存在
    const question = await queryOne(
      `SELECT id FROM life_questions WHERE id = $1 AND deleted_at IS NULL`,
      [questionId]
    );

    if (!question) {
      throw new AppError(404, '问题不存在', 'QUESTION_NOT_FOUND');
    }

    // 保存答案
    const result = await query(
      `INSERT INTO life_question_answers
       (user_id, question_id, answer_text, emotional_state, insights, answered_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id`,
      [userId, questionId, answerText, emotionalState, insights || []]
    );

    res.json({ success: true, data: { answerId: result[0].id } });
  } catch (err: unknown) { next(err); }
}

// GET /life-question/reflections/:userId — 获取用户的反思记录
export async function getReflections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    const { startDate, endDate, category } = req.query;

    let sql = `
      SELECT
        a.id, a.answer_text, a.emotional_state, a.insights, a.answered_at,
        q.question_text, q.category, q.difficulty_level
      FROM life_question_answers a
      JOIN life_questions q ON a.question_id = q.id
      WHERE a.user_id = $1 AND a.deleted_at IS NULL
    `;
    const params: any[] = [userId];

    if (startDate) {
      params.push(startDate);
      sql += ` AND a.answered_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND a.answered_at <= $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND q.category = $${params.length}`;
    }

    sql += ` ORDER BY a.answered_at DESC LIMIT 50`;

    const reflections = await query(sql, params);
    res.json({ success: true, data: reflections });
  } catch (err: unknown) { next(err); }
}

// GET /life-question/insights/:userId — 获取反思洞察分析
export async function getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;

    // 统计数据
    const stats = await queryOne<{
      total_reflections: number;
      categories_explored: number;
      avg_insights_per_reflection: number;
    }>(
      `SELECT
         COUNT(*) as total_reflections,
         COUNT(DISTINCT q.category) as categories_explored,
         AVG(ARRAY_LENGTH(a.insights, 1)) as avg_insights_per_reflection
       FROM life_question_answers a
       JOIN life_questions q ON a.question_id = q.id
       WHERE a.user_id = $1 AND a.deleted_at IS NULL`,
      [userId]
    );

    // 情绪状态分布
    const emotionalDistribution = await query(
      `SELECT emotional_state, COUNT(*) as count
       FROM life_question_answers
       WHERE user_id = $1 AND deleted_at IS NULL AND emotional_state IS NOT NULL
       GROUP BY emotional_state
       ORDER BY count DESC`,
      [userId]
    );

    // 最常探索的类别
    const topCategories = await query(
      `SELECT q.category, COUNT(*) as reflection_count
       FROM life_question_answers a
       JOIN life_questions q ON a.question_id = q.id
       WHERE a.user_id = $1 AND a.deleted_at IS NULL
       GROUP BY q.category
       ORDER BY reflection_count DESC
       LIMIT 5`,
      [userId]
    );

    // 最近的深度洞察
    const recentInsights = await query(
      `SELECT a.insights, a.answered_at, q.question_text
       FROM life_question_answers a
       JOIN life_questions q ON a.question_id = q.id
       WHERE a.user_id = $1 AND a.deleted_at IS NULL
         AND ARRAY_LENGTH(a.insights, 1) > 0
       ORDER BY a.answered_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        statistics: stats || { total_reflections: 0, categories_explored: 0, avg_insights_per_reflection: 0 },
        emotionalDistribution,
        topCategories,
        recentInsights
      }
    });
  } catch (err: unknown) { next(err); }
}
