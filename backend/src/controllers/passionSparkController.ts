import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 捕捉热情火花
 * POST /api/passion-spark/capture
 */
export const capturePassionSpark = async (req: Request, res: Response) => {
  const { studentId, taskId, sparkText, context } = req.body;

  if (!studentId || !sparkText) {
    return res.status(400).json({ error: '参数错误' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO passion_sparks (student_id, task_id, spark_text, context)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [studentId, taskId, sparkText, context]
    );

    res.json({
      success: true,
      sparkId: result.rows[0].id,
      message: '热情火花已捕捉'
    });
  } catch (error) {
    console.error('捕捉热情火花失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 获取学生的热情火花列表
 * GET /api/passion-spark/:studentId
 */
export const getPassionSparks = async (req: Request, res: Response) => {
  const { studentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT ps.*, t.title as task_title
       FROM passion_sparks ps
       LEFT JOIN tasks t ON ps.task_id = t.id
       WHERE ps.student_id = $1
       ORDER BY ps.captured_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      sparks: result.rows
    });
  } catch (error) {
    console.error('获取热情火花失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 标记想要继续探索
 * POST /api/passion-spark/mark-explore
 */
export const markWantExplore = async (req: Request, res: Response) => {
  const { sparkId, wantExplore } = req.body;

  if (!sparkId) {
    return res.status(400).json({ error: '参数错误' });
  }

  try {
    await pool.query(
      `UPDATE passion_sparks SET want_explore = $1 WHERE id = $2`,
      [wantExplore, sparkId]
    );

    res.json({
      success: true,
      message: wantExplore ? '已标记为想继续探索' : '已取消标记'
    });
  } catch (error) {
    console.error('标记探索失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 获取想要探索的火花
 * GET /api/passion-spark/:studentId/want-explore
 */
export const getWantExploreSparks = async (req: Request, res: Response) => {
  const { studentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT ps.*, t.title as task_title
       FROM passion_sparks ps
       LEFT JOIN tasks t ON ps.task_id = t.id
       WHERE ps.student_id = $1 AND ps.want_explore = true
       ORDER BY ps.captured_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      sparks: result.rows
    });
  } catch (error) {
    console.error('获取探索火花失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};
