import { Request, Response, NextFunction } from 'express';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';
import { contactExchangeService } from '../../services/contactExchangeService';
import { mentorTriggerService } from '../../services/mentorTriggerService';

/**
 * 企业验收和支付流程API
 *
 * 流程：
 * 1. 企业查看交付物
 * 2. 企业验收通过 → 支付70%尾款
 * 3. 7天内确认或自动确认 → 平台付款给学生
 * 4. 检查连续合作2次 → 交换微信
 */

// ============================================
// 1. 企业查看交付物
// ============================================
export async function getTaskDeliverables(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user!.userId;
    const { taskId } = req.params;

    // 验证任务归属
    const task = await queryOne<any>(
      `SELECT * FROM tasks WHERE id = $1 AND company_id = $2`,
      [taskId, companyId]
    );

    if (!task) {
      throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
    }

    // 获取交付物
    const deliverables = await query<any>(
      `SELECT
        td.*,
        u.nickname as student_name
       FROM task_deliverables td
       JOIN users u ON td.student_id = u.id
       WHERE td.task_id = $1
       ORDER BY td.created_at DESC`,
      [taskId]
    );

    // 获取任务进度记录
    const progressHistory = await query<any>(
      `SELECT * FROM task_progress
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [taskId]
    );

    res.json({
      success: true,
      data: {
        taskId,
        taskTitle: task.title,
        taskStatus: task.status,
        studentPrice: task.student_price,
        companyPrice: task.company_price,
        finalAmount: task.final_amount,
        deliverables: deliverables.map((d: any) => ({
          id: d.id,
          fileType: d.file_type,
          fileUrl: d.file_url,
          fileName: d.file_name,
          fileSize: d.file_size,
          description: d.description,
          aiReviewStatus: d.ai_review_status,
          aiReviewResult: d.ai_review_result,
          aiReviewedAt: d.ai_reviewed_at,
          submittedAt: d.created_at
        })),
        progressHistory: progressHistory.map((p: any) => ({
          percentage: p.progress_percentage,
          description: p.progress_description,
          milestone: p.milestone,
          createdAt: p.created_at
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 2. 企业验收通过并支付尾款
// ============================================
export async function approveAndPayFinal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user!.userId;
    const { taskId } = req.params;
    const { paymentMethod, transactionId, feedback, rating } = req.body;

    await withTransaction(async (client) => {
      // 1. 验证任务状态
      const task = await client.query(
        `SELECT * FROM tasks WHERE id = $1 AND company_id = $2 FOR UPDATE`,
        [taskId, companyId]
      );

      if (task.rows.length === 0) {
        throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
      }

      const taskData = task.rows[0];

      if (taskData.status !== 'pending_verification') {
        throw new AppError(400, '任务状态不正确', 'INVALID_STATUS');
      }

      // 2. 记录尾款支付
      await client.query(
        `INSERT INTO payments (
          task_id, payer_id, payer_type, receiver_id, receiver_type,
          amount, payment_type, payment_method, transaction_id, status, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          taskId,
          companyId,
          'company',
          'platform',
          'platform',
          taskData.final_amount,
          'final',
          paymentMethod,
          transactionId,
          'success'
        ]
      );

      // 3. 更新任务状态和尾款标记
      const verificationDeadline = new Date();
      verificationDeadline.setDate(verificationDeadline.getDate() + 7); // 7天后

      await client.query(
        `UPDATE tasks
         SET status = 'pending_confirmation',
             final_paid = true,
             verification_deadline = $1
         WHERE id = $2`,
        [verificationDeadline, taskId]
      );

      // 4. 通知学生
      await client.query(
        `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'student', 'verification_approved', '企业验收通过', $2, $3)`,
        [
          taskData.accepted_student_id,
          `企业已验收通过任务《${taskData.title}》，尾款已支付到平台，7天内确认后将付款给您`,
          taskId
        ]
      );

      logger.info('Task approved and final payment made', {
        taskId,
        companyId,
        finalAmount: taskData.final_amount
      });

      res.json({
        success: true,
        data: {
          taskId,
          finalAmount: taskData.final_amount,
          verificationDeadline,
          status: 'pending_confirmation',
          message: '验收通过！尾款已支付，7天内确认或自动确认后将付款给学生'
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 2.5 企业拒绝验收（打回重做）
// ============================================
export async function rejectDeliverable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user!.userId;
    const { taskId } = req.params;
    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      throw new AppError(400, '请填写拒绝原因', 'MISSING_FEEDBACK');
    }

    await withTransaction(async (client) => {
      // 1. 验证任务状态
      const task = await client.query(
        `SELECT * FROM tasks WHERE id = $1 AND company_id = $2 FOR UPDATE`,
        [taskId, companyId]
      );

      if (task.rows.length === 0) {
        throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
      }

      const taskData = task.rows[0];

      if (taskData.status !== 'pending_verification') {
        throw new AppError(400, '任务状态不正确', 'INVALID_STATUS');
      }

      // 2. 更新任务状态为进行中
      await client.query(
        `UPDATE tasks SET status = 'in_progress' WHERE id = $1`,
        [taskId]
      );

      // 3. 记录拒绝原因
      await client.query(
        `INSERT INTO task_flow_logs (
          task_id, action_type, description, actor_type, actor_id, actor_name
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          taskId,
          'verification_rejected',
          feedback,
          'company',
          companyId,
          '企业'
        ]
      );

      // 4. 通知学生
      await client.query(
        `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'student', 'verification_rejected', '验收未通过', $2, $3)`,
        [
          taskData.accepted_student_id,
          `任务《${taskData.title}》验收未通过，企业反馈：${feedback}。请根据反馈修改后重新提交。`,
          taskId
        ]
      );

      // 5. 异步触发AI导师沟通桥梁（翻译企业反馈）
      setTimeout(async () => {
        try {
          await mentorTriggerService.triggerCommunicationBridge(
            taskId,
            taskData.accepted_student_id,
            feedback
          );
          logger.info('AI导师沟通桥梁已触发', { taskId, studentId: taskData.accepted_student_id });
        } catch (error) {
          logger.error('触发AI导师沟通桥梁失败', { taskId, error });
        }
      }, 2000);

      logger.info('Task verification rejected', {
        taskId,
        companyId,
        feedback
      });

      res.json({
        success: true,
        data: {
          taskId,
          status: 'in_progress',
          message: '已拒绝验收，学生将收到反馈并重新提交'
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 3. 企业最终确认（7天内）
// ============================================
export async function finalConfirmation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user!.userId;
    const { taskId } = req.params;
    const { rating, feedback } = req.body;

    await withTransaction(async (client) => {
      // 1. 验证任务状态
      const task = await client.query(
        `SELECT * FROM tasks WHERE id = $1 AND company_id = $2 FOR UPDATE`,
        [taskId, companyId]
      );

      if (task.rows.length === 0) {
        throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
      }

      const taskData = task.rows[0];

      if (taskData.status !== 'pending_confirmation') {
        throw new AppError(400, '任务状态不正确', 'INVALID_STATUS');
      }

      // 2. 平台付款给学生
      await client.query(
        `INSERT INTO payments (
          task_id, payer_id, payer_type, receiver_id, receiver_type,
          amount, payment_type, status, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          taskId,
          'platform',
          'platform',
          taskData.accepted_student_id,
          'student',
          taskData.student_price,
          'platform_to_student',
          'success'
        ]
      );

      // 3. 更新任务状态为已完成
      await client.query(
        `UPDATE tasks
         SET status = 'completed',
             auto_confirmed = false
         WHERE id = $1`,
        [taskId]
      );

      // 4. 更新学生统计
      await client.query(
        `UPDATE student_capabilities
         SET completed_tasks = completed_tasks + 1,
             active_tasks = active_tasks - 1,
             total_earnings = total_earnings + $1
         WHERE user_id = $2`,
        [taskData.student_price, taskData.accepted_student_id]
      );

      // 5. 记录合作历史（用于2单解锁）
      await client.query(
        `INSERT INTO collaboration_history (
          student_id, company_id, task_id, status, completed_at
        ) VALUES ($1, $2, $3, 'completed', NOW())
        ON CONFLICT (student_id, company_id, task_id)
        DO UPDATE SET status = 'completed', completed_at = NOW()`,
        [taskData.accepted_student_id, companyId, taskId]
      );

      // 6. 通知学生
      await client.query(
        `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'student', 'payment_received', '收到付款', $2, $3)`,
        [
          taskData.accepted_student_id,
          `恭喜！任务《${taskData.title}》已完成，您已收到付款¥${taskData.student_price}`,
          taskId
        ]
      );

      // 6. 检查合作次数，触发联系方式交换（第3次合作）
      // 使用新的联系方式交换服务
      try {
        await contactExchangeService.checkAndPromptExchange(
          taskData.accepted_student_id,
          companyId,
          taskId
        );
      } catch (error) {
        logger.error('Failed to check contact exchange', { error, taskId });
        // 不阻塞主流程
      }

      logger.info('Task final confirmation completed', {
        taskId,
        companyId,
        studentId: taskData.accepted_student_id,
        amount: taskData.student_price
      });

      res.json({
        success: true,
        data: {
          taskId,
          status: 'completed',
          studentPayment: taskData.student_price,
          message: '任务已完成，平台已付款给学生'
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 4. 7天自动确认（定时任务调用）
// ============================================
export async function autoConfirmTasks(): Promise<void> {
  try {
    // 查找所有超过7天未确认的任务
    const tasks = await query<any>(
      `SELECT * FROM tasks
       WHERE status = 'pending_confirmation'
         AND verification_deadline < NOW()
         AND auto_confirmed = false`,
      []
    );

    for (const task of tasks) {
      await withTransaction(async (client) => {
        // 1. 平台付款给学生
        await client.query(
          `INSERT INTO payments (
            task_id, payer_id, payer_type, receiver_id, receiver_type,
            amount, payment_type, status, paid_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            task.id,
            'platform',
            'platform',
            task.accepted_student_id,
            'student',
            task.student_price,
            'platform_to_student',
            'success'
          ]
        );

        // 2. 更新任务状态
        await client.query(
          `UPDATE tasks
           SET status = 'completed',
               auto_confirmed = true
           WHERE id = $1`,
          [task.id]
        );

        // 3. 更新学生统计
        await client.query(
          `UPDATE student_capabilities
           SET completed_tasks = completed_tasks + 1,
               active_tasks = active_tasks - 1,
               total_earnings = total_earnings + $1
           WHERE user_id = $2`,
          [task.student_price, task.accepted_student_id]
        );

        // 4. 通知企业
        await client.query(
          `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
           VALUES ($1, 'company', 'auto_confirmed', '任务自动确认', $2, $3)`,
          [
            task.company_id,
            `任务《${task.title}》已超过7天验收期，系统已自动确认并付款给学生`,
            task.id
          ]
        );

        // 5. 记录合作历史（用于2单解锁）
        await client.query(
          `INSERT INTO collaboration_history (
            student_id, company_id, task_id, status, completed_at
          ) VALUES ($1, $2, $3, 'completed', NOW())
          ON CONFLICT (student_id, company_id, task_id)
          DO UPDATE SET status = 'completed', completed_at = NOW()`,
          [task.accepted_student_id, task.company_id, task.id]
        );

        // 6. 通知学生
        await client.query(
          `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
           VALUES ($1, 'student', 'payment_received', '收到付款', $2, $3)`,
          [
            task.accepted_student_id,
            `任务《${task.title}》已自动确认完成，您已收到付款¥${task.student_price}`,
            task.id
          ]
        );

        // 7. 检查合作次数，触发联系方式交换（第3次合作）
        try {
          await contactExchangeService.checkAndPromptExchange(
            task.accepted_student_id,
            task.company_id,
            task.id
          );
        } catch (error) {
          logger.error('Failed to check contact exchange', { error, taskId: task.id });
          // 不阻塞主流程
        }

        logger.info('Task auto-confirmed', {
          taskId: task.id,
          companyId: task.company_id,
          studentId: task.accepted_student_id
        });
      });
    }

    logger.info('Auto-confirm tasks completed', { count: tasks.length });
  } catch (err) {
    logger.error('Auto-confirm tasks failed', { error: err });
    throw err;
  }
}

// ============================================
// 6. 企业补充需求
// ============================================
export async function addRequirementSupplement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user!.userId;
    const { taskId } = req.params;
    const { content, estimatedDays } = req.body;

    if (!content) {
      throw new AppError(400, '补充内容不能为空', 'MISSING_CONTENT');
    }

    await withTransaction(async (client) => {
      // 1. 验证任务状态
      const task = await client.query(
        `SELECT * FROM tasks WHERE id = $1 AND company_id = $2`,
        [taskId, companyId]
      );

      if (task.rows.length === 0) {
        throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
      }

      const taskData = task.rows[0];

      if (taskData.status !== 'in_progress') {
        throw new AppError(400, '只能在任务进行中补充需求', 'INVALID_STATUS');
      }

      // 2. 计算新的截止日期
      const oldDeadline = new Date(taskData.deadline);
      const newDeadline = new Date(oldDeadline);
      newDeadline.setDate(newDeadline.getDate() + (estimatedDays || 3));

      // 3. 记录补充需求
      await client.query(
        `INSERT INTO requirement_supplements (
          task_id, company_id, content, estimated_days, old_deadline, new_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [taskId, companyId, content, estimatedDays, oldDeadline, newDeadline]
      );

      // 4. 更新任务截止日期
      await client.query(
        `UPDATE tasks SET deadline = $1 WHERE id = $2`,
        [newDeadline, taskId]
      );

      // 5. 通知学生
      await client.query(
        `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'student', 'requirement_supplement', '企业补充了需求', $2, $3)`,
        [
          taskData.accepted_student_id,
          `任务《${taskData.title}》有新的补充需求，截止日期已延长${estimatedDays || 3}天至${newDeadline.toLocaleDateString()}`,
          taskId
        ]
      );

      logger.info('Requirement supplement added', {
        taskId,
        companyId,
        estimatedDays,
        newDeadline
      });

      res.json({
        success: true,
        data: {
          taskId,
          oldDeadline,
          newDeadline,
          estimatedDays: estimatedDays || 3,
          message: `需求补充成功，截止日期已延长${estimatedDays || 3}天`
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// 导出所有函数
export default {
  getTaskDeliverables,
  approveAndPayFinal,
  rejectDeliverable,
  finalConfirmation,
  autoConfirmTasks,
  addRequirementSupplement
};
