import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 探索模式加速器 Controller
 *
 * 核心理念：不只是学技能，而是探索新模式
 * - 项目标签：不只是"Figma"，还有"探索新工具"
 * - 完成反思：不只是"评价任务"，还有"发现了什么新模式"
 * - 模式库：记录学生发现的可复用模式
 */

// 为任务添加探索标签
export const addExplorationTag = async (req: Request, res: Response) => {
  try {
    const { taskId, tagType, tagLabel, explorationDescription } = req.body;

    const result = await pool.query(
      `INSERT INTO task_exploration_tags (task_id, tag_type, tag_label, exploration_description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [taskId, tagType, tagLabel, explorationDescription]
    );

    res.json({
      success: true,
      tag: result.rows[0]
    });
  } catch (error) {
    console.error('添加探索标签失败:', error);
    res.status(500).json({ error: '添加探索标签失败' });
  }
};

// 获取任务的探索标签
export const getTaskExplorationTags = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const result = await pool.query(
      `SELECT * FROM task_exploration_tags
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [taskId]
    );

    res.json({
      tags: result.rows
    });
  } catch (error) {
    console.error('获取探索标签失败:', error);
    res.status(500).json({ error: '获取探索标签失败' });
  }
};

// 提交探索反思（任务完成后）
export const submitReflection = async (req: Request, res: Response) => {
  try {
    const { studentId, taskId, reflections } = req.body;

    // reflections 是一个数组，包含三个问题的答案
    // 1. 这个项目让你发现了什么新模式？
    // 2. 你在这个项目中找到了什么更好的做法？
    // 3. 你会把这个模式用到生活的其他地方吗？

    const insertPromises = reflections.map((reflection: any) =>
      pool.query(
        `INSERT INTO exploration_reflections (student_id, task_id, reflection_type, reflection_text)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [studentId, taskId, reflection.type, reflection.text]
      )
    );

    const results = await Promise.all(insertPromises);

    // 如果学生发现了新模式，自动添加到模式库
    const newPatternReflection = reflections.find((r: any) => r.type === 'new_pattern' && r.text.length > 10);
    if (newPatternReflection) {
      await pool.query(
        `INSERT INTO exploration_patterns (student_id, pattern_name, pattern_description, discovered_in_task_id)
         VALUES ($1, $2, $3, $4)`,
        [studentId, '新发现的模式', newPatternReflection.text, taskId]
      );
    }

    res.json({
      success: true,
      message: '探索反思已保存',
      reflections: results.map(r => r.rows[0])
    });
  } catch (error) {
    console.error('提交探索反思失败:', error);
    res.status(500).json({ error: '提交探索反思失败' });
  }
};

// 获取学生的探索反思历史
export const getStudentReflections = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      `SELECT r.*, t.title as task_title
       FROM exploration_reflections r
       JOIN tasks t ON r.task_id = t.id
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [studentId]
    );

    res.json({
      reflections: result.rows
    });
  } catch (error) {
    console.error('获取探索反思失败:', error);
    res.status(500).json({ error: '获取探索反思失败' });
  }
};

// 获取学生的探索模式库
export const getStudentPatterns = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      `SELECT p.*, t.title as discovered_in_task_title
       FROM exploration_patterns p
       LEFT JOIN tasks t ON p.discovered_in_task_id = t.id
       WHERE p.student_id = $1
       ORDER BY p.created_at DESC`,
      [studentId]
    );

    res.json({
      patterns: result.rows,
      stats: {
        total: result.rows.length,
        appliedToLife: result.rows.filter(p => p.want_apply_to_life).length
      }
    });
  } catch (error) {
    console.error('获取探索模式库失败:', error);
    res.status(500).json({ error: '获取探索模式库失败' });
  }
};

// 标记模式想应用到生活中
export const markPatternForLife = async (req: Request, res: Response) => {
  try {
    const { patternId, wantApply } = req.body;

    const result = await pool.query(
      `UPDATE exploration_patterns
       SET want_apply_to_life = $1
       WHERE id = $2
       RETURNING *`,
      [wantApply, patternId]
    );

    res.json({
      success: true,
      pattern: result.rows[0]
    });
  } catch (error) {
    console.error('标记模式失败:', error);
    res.status(500).json({ error: '标记模式失败' });
  }
};

// 记录模式应用
export const recordPatternApplication = async (req: Request, res: Response) => {
  try {
    const { patternId } = req.body;

    const result = await pool.query(
      `UPDATE exploration_patterns
       SET applied_count = applied_count + 1
       WHERE id = $1
       RETURNING *`,
      [patternId]
    );

    res.json({
      success: true,
      pattern: result.rows[0]
    });
  } catch (error) {
    console.error('记录模式应用失败:', error);
    res.status(500).json({ error: '记录模式应用失败' });
  }
};

// AI生成探索建议（基于任务内容）
export const generateExplorationSuggestions = async (req: Request, res: Response) => {
  try {
    const { taskId, taskDescription } = req.body;

    // 这里可以接入AI，根据任务描述生成探索建议
    // 暂时返回模拟数据
    const suggestions = [
      {
        tagType: 'new_tool',
        tagLabel: '探索新工具',
        description: '这个项目可能让你发现一个新的设计工具或开发框架'
      },
      {
        tagType: 'new_thinking',
        tagLabel: '探索新思路',
        description: '这个项目可能帮你找到解决问题的新角度'
      }
    ];

    res.json({
      suggestions
    });
  } catch (error) {
    console.error('生成探索建议失败:', error);
    res.status(500).json({ error: '生成探索建议失败' });
  }
};
