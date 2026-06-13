import { Response } from 'express';
import logger from '../../utils/logger';
import { AuthRequest } from '../../middleware/auth';
import { query } from '../../utils/db';

/**
 * 任务追加需求控制器
 * 企业可在任务进行中追加需求、延长时间或增加预算
 */

// 创建追加需求
export const createAmendment = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.userId;
    const { taskId, amendmentType, description, newDeadline, newBudget } = req.body;

    // 验证任务存在且属于该企业
    const taskCheck = await query(
      `SELECT t.*, ts.student_id, t.deadline, t.budget
       FROM tasks t
       LEFT JOIN task_students ts ON t.id = ts.task_id
       WHERE t.id = $1 AND t.company_id = $2`,
      [taskId, companyId]
    );

    if (taskCheck.length === 0) {
      return res.status(404).json({ success: false, message: '任务不存在或无权操作' });
    }

    const task = taskCheck[0];

    // 只有进行中的任务才能追加需求
    if (task.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: '只有进行中的任务才能追加需求' });
    }

    // 验证追加内容
    if (amendmentType === 'extend_deadline' && !newDeadline) {
      return res.status(400).json({ success: false, message: '延长时间需要提供新的截止日期' });
    }

    if (amendmentType === 'increase_budget' && !newBudget) {
      return res.status(400).json({ success: false, message: '增加预算需要提供新的预算金额' });
    }

    const taskBudget = Number(task.budget) || 0;
    if (amendmentType === 'increase_budget' && newBudget <= taskBudget) {
      return res.status(400).json({ success: false, message: '新预算必须大于原预算' });
    }

    // 创建追加需求记录
    const result = await query(
      `INSERT INTO task_amendments
       (task_id, company_id, amendment_type, description,
        original_deadline, new_deadline, original_budget, new_budget, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
       RETURNING *`,
      [
        taskId,
        companyId,
        amendmentType,
        description,
        task.deadline,
        newDeadline || null,
        task.budget,
        newBudget || null
      ]
    );

    // 发送通知给学生
    const amendmentTypeText: { [key: string]: string } = {
      'extend_deadline': '延长截止时间',
      'add_requirement': '追加任务需求',
      'increase_budget': '增加任务预算'
    };
    const typeText = amendmentTypeText[amendmentType] || '任务变更';

    await query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, created_at)
       VALUES ($1, 'task_amendment', '任务变更通知', $2, $3, NOW())`,
      [
        task.student_id,
        `企业对任务《${task.title}》提出了${typeText}，请及时查看并确认`,
        result[0].id
      ]
    );

    res.json({
      success: true,
      message: '追加需求已提交，等待学生确认',
      data: result[0]
    });

  } catch (error) {
    logger.error('创建追加需求失败:', error);
    res.status(500).json({ success: false, message: '创建追加需求失败' });
  }
};

// 学生响应追加需求
export const respondToAmendment = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const { amendmentId } = req.params;
    const { action, studentResponse } = req.body; // action: 'accept' 或 'reject'

    // 获取追加需求详情
    const amendmentCheck = await query(
      `SELECT a.*, t.title as task_title, ts.student_id
       FROM task_amendments a
       JOIN tasks t ON a.task_id = t.id
       LEFT JOIN task_students ts ON t.id = ts.task_id
       WHERE a.id = $1`,
      [amendmentId]
    );

    if (amendmentCheck.length === 0) {
      return res.status(404).json({ success: false, message: '追加需求不存在' });
    }

    const amendment = amendmentCheck[0];

    // 验证权限
    if (amendment.student_id !== studentId) {
      return res.status(403).json({ success: false, message: '无权操作此追加需求' });
    }

    // 验证状态
    if (amendment.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该追加需求已处理，无法重复操作' });
    }

    // 更新追加需求状态
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await query(
      `UPDATE task_amendments
       SET status = $1, student_response = $2, responded_at = NOW()
       WHERE id = $3`,
      [newStatus, studentResponse, amendmentId]
    );

    // 如果学生接受，更新任务信息
    if (action === 'accept') {
      if (amendment.amendment_type === 'extend_deadline' && amendment.new_deadline) {
        await query(
          'UPDATE tasks SET deadline = $1 WHERE id = $2',
          [amendment.new_deadline, amendment.task_id]
        );
      }

      if (amendment.amendment_type === 'increase_budget' && amendment.new_budget) {
        await query(
          'UPDATE tasks SET budget = $1 WHERE id = $2',
          [amendment.new_budget, amendment.task_id]
        );
      }
    }

    // 发送通知给企业
    await query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, created_at)
       VALUES ($1, 'amendment_response', '追加需求响应', $2, $3, NOW())`,
      [
        amendment.company_id,
        `学生已${action === 'accept' ? '接受' : '拒绝'}了您对任务《${amendment.task_title}》的追加需求`,
        amendmentId
      ]
    );

    res.json({
      success: true,
      message: action === 'accept' ? '已接受追加需求' : '已拒绝追加需求'
    });

  } catch (error) {
    logger.error('响应追加需求失败:', error);
    res.status(500).json({ success: false, message: '响应追加需求失败' });
  }
};

// 获取任务的追加需求列表
export const getTaskAmendments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { taskId } = req.params;

    // 验证用户是否有权限查看
    const taskCheck = await query(
      `SELECT t.company_id, ts.student_id
       FROM tasks t
       LEFT JOIN task_students ts ON t.id = ts.task_id
       WHERE t.id = $1`,
      [taskId]
    );

    if (taskCheck.length === 0) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const task = taskCheck[0];
    if (task.company_id !== userId && task.student_id !== userId) {
      return res.status(403).json({ success: false, message: '无权查看此任务的追加需求' });
    }

    // 获取追加需求列表
    const result = await query(
      `SELECT * FROM task_amendments
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [taskId]
    );

    res.json({
      success: true,
      data: result.length > 0 ? result : []
    });

  } catch (error) {
    logger.error('获取追加需求列表失败:', error);
    res.status(500).json({ success: false, message: '获取追加需求列表失败' });
  }
};

// 获取我的待处理追加需求（学生端）
export const getMyPendingAmendments = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;

    const result = await query(
      `SELECT a.*, t.title as task_title, c.nickname as company_name
       FROM task_amendments a
       JOIN tasks t ON a.task_id = t.id
       JOIN task_students ts ON t.id = ts.task_id
       JOIN users c ON a.company_id = c.id
       WHERE ts.student_id = $1 AND a.status = 'pending'
       ORDER BY a.created_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      data: result.length > 0 ? result : []
    });

  } catch (error) {
    logger.error('获取待处理追加需求失败:', error);
    res.status(500).json({ success: false, message: '获取待处理追加需求失败' });
  }
};
