import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * OPC孵化计划 Controller
 *
 * 核心理念：Lv.4（自流者）解锁，帮助学生独立发展
 * 触发条件：完成20个项目 + 等级达到Lv.4 + 找到热情方向
 * 平台提供：免费OPC报告、独立接单资格、联合体支持、创业资源对接
 * 学生承诺：每月更新成长报告、分享探索经验、帮助新人
 */

// 检查孵化资格
export const checkEligibility = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    // 检查任务完成数
    const tasksResult = await pool.query(
      `SELECT COUNT(*) as completed_tasks
       FROM tasks
       WHERE student_id = $1 AND status = 'completed'`,
      [studentId]
    );

    // 检查等级
    const userResult = await pool.query(
      `SELECT level FROM users WHERE id = $1`,
      [studentId]
    );

    // 检查是否有热情方向（至少3个热情火花）
    const passionResult = await pool.query(
      `SELECT COUNT(*) as passion_count
       FROM passion_sparks
       WHERE student_id = $1 AND want_explore = true`,
      [studentId]
    );

    const completedTasks = parseInt(tasksResult.rows[0].completed_tasks);
    const level = userResult.rows[0].level;
    const passionCount = parseInt(passionResult.rows[0].passion_count);

    const eligible = completedTasks >= 20 && level >= 4 && passionCount >= 3;

    res.json({
      eligible,
      requirements: {
        completedTasks: { current: completedTasks, required: 20, met: completedTasks >= 20 },
        level: { current: level, required: 4, met: level >= 4 },
        passionDirection: { current: passionCount, required: 3, met: passionCount >= 3 }
      }
    });
  } catch (error) {
    console.error('检查孵化资格失败:', error);
    res.status(500).json({ error: '检查孵化资格失败' });
  }
};

// 申请加入孵化计划
export const applyForIncubation = async (req: Request, res: Response) => {
  try {
    const { studentId, passionDirection } = req.body;

    // 检查是否已经在孵化计划中
    const existing = await pool.query(
      `SELECT * FROM opc_incubation WHERE student_id = $1`,
      [studentId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '已经在孵化计划中' });
    }

    // 创建孵化记录
    const result = await pool.query(
      `INSERT INTO opc_incubation (student_id, status, passion_direction)
       VALUES ($1, 'applying', $2)
       RETURNING *`,
      [studentId, passionDirection]
    );

    res.json({
      success: true,
      message: '申请已提交，我们会在3个工作日内审核',
      incubation: result.rows[0]
    });
  } catch (error) {
    console.error('申请孵化计划失败:', error);
    res.status(500).json({ error: '申请孵化计划失败' });
  }
};

// 获取孵化状态
export const getIncubationStatus = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      `SELECT * FROM opc_incubation WHERE student_id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.json({ inIncubation: false });
    }

    // 获取月度更新记录
    const updates = await pool.query(
      `SELECT * FROM incubation_monthly_updates
       WHERE incubation_id = $1
       ORDER BY update_month DESC`,
      [result.rows[0].id]
    );

    // 获取资源对接记录
    const resources = await pool.query(
      `SELECT * FROM incubation_resources
       WHERE incubation_id = $1
       ORDER BY connected_at DESC`,
      [result.rows[0].id]
    );

    res.json({
      inIncubation: true,
      incubation: result.rows[0],
      monthlyUpdates: updates.rows,
      resources: resources.rows
    });
  } catch (error) {
    console.error('获取孵化状态失败:', error);
    res.status(500).json({ error: '获取孵化状态失败' });
  }
};

// 提交月度更新
export const submitMonthlyUpdate = async (req: Request, res: Response) => {
  try {
    const { studentId, updateMonth, growthSummary, explorationStories, challengesFaced, nextMonthPlan } = req.body;

    // 获取孵化记录
    const incubation = await pool.query(
      `SELECT id FROM opc_incubation WHERE student_id = $1 AND status = 'incubating'`,
      [studentId]
    );

    if (incubation.rows.length === 0) {
      return res.status(400).json({ error: '不在孵化计划中' });
    }

    // 检查本月是否已更新
    const existing = await pool.query(
      `SELECT * FROM incubation_monthly_updates
       WHERE incubation_id = $1 AND update_month = $2`,
      [incubation.rows[0].id, updateMonth]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '本月已提交更新' });
    }

    // 创建月度更新
    const result = await pool.query(
      `INSERT INTO incubation_monthly_updates
       (incubation_id, update_month, growth_summary, exploration_stories, challenges_faced, next_month_plan)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [incubation.rows[0].id, updateMonth, growthSummary, explorationStories, challengesFaced, nextMonthPlan]
    );

    res.json({
      success: true,
      message: '月度更新已保存',
      update: result.rows[0]
    });
  } catch (error) {
    console.error('提交月度更新失败:', error);
    res.status(500).json({ error: '提交月度更新失败' });
  }
};

// 对接创业资源
export const connectResource = async (req: Request, res: Response) => {
  try {
    const { studentId, resourceType, resourceName, resourceDescription, contactInfo } = req.body;

    // 获取孵化记录
    const incubation = await pool.query(
      `SELECT id FROM opc_incubation WHERE student_id = $1 AND status = 'incubating'`,
      [studentId]
    );

    if (incubation.rows.length === 0) {
      return res.status(400).json({ error: '不在孵化计划中' });
    }

    // 创建资源对接记录
    const result = await pool.query(
      `INSERT INTO incubation_resources
       (incubation_id, resource_type, resource_name, resource_description, contact_info)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [incubation.rows[0].id, resourceType, resourceName, resourceDescription, contactInfo]
    );

    res.json({
      success: true,
      message: '资源对接成功',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('对接资源失败:', error);
    res.status(500).json({ error: '对接资源失败' });
  }
};

// 毕业（完成孵化）
export const graduate = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body;

    const result = await pool.query(
      `UPDATE opc_incubation
       SET status = 'graduated', graduation_date = CURRENT_TIMESTAMP
       WHERE student_id = $1 AND status = 'incubating'
       RETURNING *`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: '不在孵化计划中' });
    }

    res.json({
      success: true,
      message: '恭喜毕业！你已经可以独立飞翔了',
      incubation: result.rows[0]
    });
  } catch (error) {
    console.error('毕业失败:', error);
    res.status(500).json({ error: '毕业失败' });
  }
};

// 获取所有孵化中的学生（管理员用）
export const getAllIncubating = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.nickname, u.avatar, u.level
       FROM opc_incubation i
       JOIN users u ON i.student_id = u.id
       WHERE i.status = 'incubating'
       ORDER BY i.created_at DESC`
    );

    res.json({
      incubating: result.rows
    });
  } catch (error) {
    console.error('获取孵化列表失败:', error);
    res.status(500).json({ error: '获取孵化列表失败' });
  }
};
