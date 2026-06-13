import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';
import { AuthRequest } from '../../middleware/auth';

// ============================================================
// POST /subcontract/create - 创建转包申请
// ============================================================
export async function createSubcontract(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const userId = req.user!.userId;
    const { taskId, reason, subcontractBudget } = req.body;

    // 1. 验证任务是否属于该学生
    const assignment = await queryOne<{
      id: string;
      task_id: string;
      student_id: string;
      status: string;
    }>(
      `SELECT ta.*, t.budget_net, t.title, t.description
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.task_id = $1 AND ta.student_id = $2 AND ta.status = 'accepted'`,
      [taskId, userId]
    );

    if (!assignment) {
      throw new AppError(404, '任务不存在或你没有权限转包', 'TASK_NOT_FOUND');
    }

    const task = await queryOne<{ budget_net: number; title: string; description: string }>(
      'SELECT budget_net, title, description FROM tasks WHERE id = $1',
      [taskId]
    );

    if (!task) {
      throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
    }

    // 2. 验证转包预算
    const minPriceDiff = 50; // 最低差价50元
    const priceDiff = task.budget_net - subcontractBudget;

    if (priceDiff < minPriceDiff) {
      throw new AppError(400, `转包差价不能低于 ${minPriceDiff} 元`, 'PRICE_DIFF_TOO_LOW');
    }

    if (subcontractBudget <= 0) {
      throw new AppError(400, '转包预算必须大于0', 'INVALID_BUDGET');
    }

    // 3. 调用AI审核转包理由
    const aiApproval = await evaluateSubcontractReason(reason, task.title, task.description);

    if (!aiApproval.approved) {
      throw new AppError(400, `转包申请被拒绝：${aiApproval.feedback}`, 'SUBCONTRACT_REJECTED');
    }

    // 4. 创建转包任务和记录
    const result = await withTransaction(async (client) => {
      // 4a. 创建新任务（转包任务）
      const newTask = await client.query(
        `INSERT INTO tasks
         (company_id, title, description, task_type, track, level_required,
          budget_gross, budget_net, platform_fee_rate, acceptance_criteria,
          is_subcontracted, parent_task_id, original_student_id, status)
         SELECT company_id, title, description, task_type, track, level_required,
                $1, $2, platform_fee_rate, acceptance_criteria,
                TRUE, $3, $4, 'active'
         FROM tasks WHERE id = $3
         RETURNING id`,
        [subcontractBudget * 1.2, subcontractBudget, taskId, userId] // 假设平台抽成20%
      );

      const newTaskId = newTask.rows[0].id;

      // 4b. 创建转包记录
      const subcontract = await client.query(
        `INSERT INTO task_subcontracts
         (original_task_id, new_task_id, original_student_id, reason,
          ai_approved, ai_feedback, original_budget, subcontract_budget, price_difference, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved')
         RETURNING id`,
        [
          taskId,
          newTaskId,
          userId,
          reason,
          true,
          aiApproval.feedback,
          task.budget_net,
          subcontractBudget,
          priceDiff,
        ]
      );

      return { newTaskId, subcontractId: subcontract.rows[0].id };
    });

    logger.info('Subcontract created', { userId, taskId, newTaskId: result.newTaskId });

    res.json({
      success: true,
      message: '转包申请已通过，新任务已创建',
      data: {
        subcontractId: result.subcontractId,
        newTaskId: result.newTaskId,
        priceDifference: priceDiff,
      },
    });
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================
// GET /subcontract/my - 获取我的转包记录
// ============================================================
export async function getMySubcontracts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const subcontracts = await query(
      `SELECT
         ts.*,
         t1.title as original_task_title,
         t2.title as new_task_title,
         u.nickname as new_student_name
       FROM task_subcontracts ts
       JOIN tasks t1 ON ts.original_task_id = t1.id
       JOIN tasks t2 ON ts.new_task_id = t2.id
       LEFT JOIN task_assignments ta ON t2.id = ta.task_id AND ta.status = 'accepted'
       LEFT JOIN users u ON ta.student_id = u.id
       WHERE ts.original_student_id = $1 AND ts.deleted_at IS NULL
       ORDER BY ts.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: subcontracts,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================
// POST /subcontract/:id/complete - 完成转包任务（原学生获得差价）
// ============================================================
export async function completeSubcontract(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // 1. 获取转包记录
    const subcontract = await queryOne<{
      id: string;
      original_student_id: string;
      new_task_id: string;
      price_difference: number;
      status: string;
    }>(
      `SELECT * FROM task_subcontracts WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (!subcontract) {
      throw new AppError(404, '转包记录不存在', 'SUBCONTRACT_NOT_FOUND');
    }

    if (subcontract.original_student_id !== userId) {
      throw new AppError(403, '无权操作此转包记录', 'FORBIDDEN');
    }

    if (subcontract.status === 'completed') {
      throw new AppError(400, '该转包已完成', 'ALREADY_COMPLETED');
    }

    // 2. 检查新任务是否已完成
    const newTask = await queryOne<{ status: string }>(
      'SELECT status FROM tasks WHERE id = $1',
      [subcontract.new_task_id]
    );

    if (newTask?.status !== 'completed') {
      throw new AppError(400, '转包任务尚未完成', 'TASK_NOT_COMPLETED');
    }

    // 3. 结算差价给原学生
    await withTransaction(async (client) => {
      // 3a. 更新转包状态
      await client.query(
        `UPDATE task_subcontracts SET status = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [id]
      );

      // 3b. 增加原学生余额
      await client.query(
        `UPDATE student_balances
         SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW()
         WHERE user_id = $2`,
        [subcontract.price_difference, userId]
      );

      // 3c. 创建支付记录
      await client.query(
        `INSERT INTO payments
         (task_id, student_id, payer, gross_amount, platform_fee, net_amount, status, settled_at)
         VALUES ($1, $2, 'platform', $3, 0, $3, 'settled', NOW())`,
        [subcontract.new_task_id, userId, subcontract.price_difference]
      );
    });

    logger.info('Subcontract completed', { userId, subcontractId: id, priceDiff: subcontract.price_difference });

    res.json({
      success: true,
      message: '转包完成，差价已到账',
      data: {
        priceDifference: subcontract.price_difference,
      },
    });
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================
// 辅助函数：AI评估转包理由
// ============================================================
async function evaluateSubcontractReason(
  reason: string,
  taskTitle: string,
  taskDescription: string
): Promise<{ approved: boolean; feedback: string }> {
  // TODO: 调用AI服务评估转包理由是否合理
  // 合理理由：时间冲突、能力不足、学业繁忙等
  // 不合理理由：单纯想赚差价、懒惰等

  // 模拟AI判断
  const keywords = ['时间', '冲突', '能力', '不足', '学业', '考试', '项目', '紧急'];
  const hasValidReason = keywords.some(kw => reason.includes(kw));

  if (hasValidReason) {
    return {
      approved: true,
      feedback: '你的转包理由合理，已批准。请确保找到合适的接手人。',
    };
  } else {
    return {
      approved: false,
      feedback: '转包理由不够充分。转包应该是因为客观原因（如时间冲突、能力不足），而不是为了赚取差价。',
    };
  }
}
