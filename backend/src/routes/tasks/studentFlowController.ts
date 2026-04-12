import { Request, Response, NextFunction } from 'express';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

/**
 * 学生端接单流程API
 *
 * 流程：
 * 1. 学生查看收到的任务邀请（显示85%价格）
 * 2. 学生接受任务（第一个接受的获得任务）
 * 3. 学生更新任务进度
 * 4. 学生提交交付物
 */

// ============================================
// 1. 学生查看收到的任务邀请
// ============================================
export async function getTaskInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;

    // 获取所有待接受的邀请
    const invitations = await query<any>(
      `SELECT
        am.id as match_id,
        am.match_score,
        am.match_reason,
        am.invitation_status,
        am.created_at as invited_at,
        t.id as task_id,
        t.title,
        t.description,
        t.task_type,
        t.student_price,
        t.deadline,
        t.estimated_minutes,
        t.level_required,
        t.acceptance_criteria,
        u.nickname as company_name,
        cp.company_name as company_full_name,
        cp.industry
       FROM ai_matches am
       JOIN tasks t ON am.task_id = t.id
       JOIN users u ON t.company_id = u.id
       LEFT JOIN company_profiles cp ON u.id = cp.user_id
       WHERE am.student_id = $1
         AND am.is_invited = true
         AND am.invitation_status = 'pending'
         AND t.status = 'pending_accept'
       ORDER BY am.created_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      data: {
        totalInvitations: invitations.length,
        invitations: invitations.map((inv: any) => ({
          matchId: inv.match_id,
          taskId: inv.task_id,
          title: inv.title,
          description: inv.description,
          taskType: inv.task_type,
          price: inv.student_price, // 学生看到的是85%价格
          deadline: inv.deadline,
          estimatedHours: inv.estimated_minutes ? Math.round(inv.estimated_minutes / 60) : null,
          levelRequired: inv.level_required,
          acceptanceCriteria: inv.acceptance_criteria,
          matchScore: inv.match_score,
          matchReason: inv.match_reason,
          companyName: inv.company_full_name || inv.company_name,
          industry: inv.industry,
          invitedAt: inv.invited_at,
          invitationStatus: inv.invitation_status
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 2. 学生接受任务邀请
// ============================================
export async function acceptTaskInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;
    const { taskId } = req.params;

    await withTransaction(async (client) => {
      // 1. 检查任务状态（使用行锁防止并发）
      const task = await client.query(
        `SELECT * FROM tasks WHERE id = $1 FOR UPDATE`,
        [taskId]
      );

      if (task.rows.length === 0) {
        throw new AppError(404, '任务不存在', 'TASK_NOT_FOUND');
      }

      const taskData = task.rows[0];

      if (taskData.status !== 'pending_accept') {
        throw new AppError(400, '该任务已被其他学生接单', 'TASK_ALREADY_ACCEPTED');
      }

      // 2. 检查学生是否收到邀请
      const match = await client.query(
        `SELECT * FROM ai_matches
         WHERE task_id = $1 AND student_id = $2 AND is_invited = true`,
        [taskId, studentId]
      );

      if (match.rows.length === 0) {
        throw new AppError(403, '您未收到该任务的邀请', 'NOT_INVITED');
      }

      const matchData = match.rows[0];

      if (matchData.invitation_status !== 'pending') {
        throw new AppError(400, '邀请已失效', 'INVITATION_EXPIRED');
      }

      // 3. 更新任务状态 - 学生接单
      await client.query(
        `UPDATE tasks
         SET status = 'in_progress',
             accepted_student_id = $1
         WHERE id = $2`,
        [studentId, taskId]
      );

      // 4. 更新匹配记录 - 标记为已接受
      await client.query(
        `UPDATE ai_matches
         SET invitation_status = 'accepted',
             responded_at = NOW()
         WHERE task_id = $1 AND student_id = $2`,
        [taskId, studentId]
      );

      // 5. 将其他学生的邀请标记为过期
      await client.query(
        `UPDATE ai_matches
         SET invitation_status = 'expired'
         WHERE task_id = $1 AND student_id != $2 AND invitation_status = 'pending'`,
        [taskId, studentId]
      );

      // 6. 通知企业
      await client.query(
        `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'company', 'task_accepted', '学生已接单', $2, $3)`,
        [
          taskData.company_id,
          `学生已接受任务《${taskData.title}》，开始执行中...`,
          taskId
        ]
      );

      // 7. 通知其他学生邀请已过期
      const otherStudents = await client.query(
        `SELECT student_id FROM ai_matches
         WHERE task_id = $1 AND student_id != $2 AND is_invited = true`,
        [taskId, studentId]
      );

      for (const row of otherStudents.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
           VALUES ($1, 'student', 'invitation_expired', '任务邀请已过期', $2, $3)`,
          [
            row.student_id,
            `任务《${taskData.title}》已被其他学生接单`,
            taskId
          ]
        );
      }

      // 8. 更新学生统计
      await client.query(
        `UPDATE student_profiles
         SET active_tasks = active_tasks + 1
         WHERE user_id = $1`,
        [studentId]
      );

      logger.info('Student accepted task', { taskId, studentId });

      res.json({
        success: true,
        data: {
          taskId,
          title: taskData.title,
          price: taskData.student_price,
          status: 'in_progress',
          message: '恭喜！您已成功接单，请按时完成任务'
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 3. 学生拒绝任务邀请
// ============================================
export async function rejectTaskInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;
    const { taskId } = req.params;
    const { reason } = req.body;

    await withTransaction(async (client) => {
      // 更新匹配记录
      await client.query(
        `UPDATE ai_matches
         SET invitation_status = 'rejected',
             responded_at = NOW()
         WHERE task_id = $1 AND student_id = $2 AND invitation_status = 'pending'`,
        [taskId, studentId]
      );

      logger.info('Student rejected task invitation', { taskId, studentId, reason });

      res.json({
        success: true,
        data: {
          message: '已拒绝该任务邀请'
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 4. 学生更新任务进度
// ============================================
export async function updateTaskProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;
    const { taskId } = req.params;
    const { progressPercentage, progressDescription, milestone } = req.body;

    // 验证任务归属
    const task = await queryOne<any>(
      `SELECT * FROM tasks WHERE id = $1 AND accepted_student_id = $2`,
      [taskId, studentId]
    );

    if (!task) {
      throw new AppError(404, '任务不存在或您无权操作', 'TASK_NOT_FOUND');
    }

    // 记录进度
    await query(
      `INSERT INTO task_progress (task_id, student_id, progress_percentage, progress_description, milestone)
       VALUES ($1, $2, $3, $4, $5)`,
      [taskId, studentId, progressPercentage, progressDescription, milestone]
    );

    // 通知企业
    await query(
      `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
       VALUES ($1, 'company', 'progress_update', '任务进度更新', $2, $3)`,
      [
        task.company_id,
        `任务《${task.title}》进度更新：${progressPercentage}% - ${progressDescription}`,
        taskId
      ]
    );

    logger.info('Task progress updated', { taskId, studentId, progressPercentage });

    res.json({
      success: true,
      data: {
        taskId,
        progressPercentage,
        message: '进度更新成功'
      }
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 5. 学生提交交付物
// ============================================
export async function submitDeliverables(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.userId;
    const { taskId } = req.params;
    const { deliverables } = req.body; // 数组：[{fileType, fileUrl, fileName, fileSize, description}]

    if (!deliverables || deliverables.length === 0) {
      throw new AppError(400, '请至少提交一个交付物', 'NO_DELIVERABLES');
    }

    await withTransaction(async (client) => {
      // 1. 验证任务归属
      const task = await client.query(
        `SELECT * FROM tasks WHERE id = $1 AND accepted_student_id = $2`,
        [taskId, studentId]
      );

      if (task.rows.length === 0) {
        throw new AppError(404, '任务不存在或您无权操作', 'TASK_NOT_FOUND');
      }

      const taskData = task.rows[0];

      if (taskData.status !== 'in_progress') {
        throw new AppError(400, '任务状态不正确', 'INVALID_STATUS');
      }

      // 2. 保存交付物
      for (const item of deliverables) {
        await client.query(
          `INSERT INTO task_deliverables (
            task_id, student_id, file_type, file_url, file_name, file_size, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            taskId,
            studentId,
            item.fileType,
            item.fileUrl,
            item.fileName,
            item.fileSize,
            item.description
          ]
        );
      }

      // 3. 更新任务状态为待AI审核
      await client.query(
        `UPDATE tasks SET status = 'pending_ai_review' WHERE id = $1`,
        [taskId]
      );

      // 4. 通知企业
      await client.query(
        `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'company', 'deliverables_submitted', '学生已提交交付物', $2, $3)`,
        [
          taskData.company_id,
          `学生已提交任务《${taskData.title}》的交付物，AI正在审核中...`,
          taskId
        ]
      );

      // 5. 触发AI审核（异步）
      // TODO: 调用AI服务审核交付物
      setTimeout(() => {
        triggerAIReview(taskId).catch(err => {
          logger.error('AI review failed', { taskId, error: err });
        });
      }, 1000);

      logger.info('Deliverables submitted', { taskId, studentId, count: deliverables.length });

      res.json({
        success: true,
        data: {
          taskId,
          deliverablesCount: deliverables.length,
          status: 'pending_ai_review',
          message: '交付物提交成功，AI正在审核中...'
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

// ============================================
// 6. AI审核交付物（后台任务）
// ============================================
async function triggerAIReview(taskId: string): Promise<void> {
  try {
    // 获取交付物
    const deliverables = await query<any>(
      `SELECT * FROM task_deliverables WHERE task_id = $1`,
      [taskId]
    );

    // TODO: 调用AI服务审核
    // 这里先模拟审核通过
    const aiReviewPassed = true;
    const aiReviewResult = '交付物完整，功能符合需求，质量良好';

    await withTransaction(async (client) => {
      // 更新交付物审核状态
      for (const item of deliverables) {
        await client.query(
          `UPDATE task_deliverables
           SET ai_review_status = $1,
               ai_review_result = $2,
               ai_reviewed_at = NOW()
           WHERE id = $3`,
          [aiReviewPassed ? 'passed' : 'failed', aiReviewResult, item.id]
        );
      }

      if (aiReviewPassed) {
        // AI审核通过，更新任务状态为待企业验收
        await client.query(
          `UPDATE tasks SET status = 'pending_verification' WHERE id = $1`,
          [taskId]
        );

        // 获取任务信息
        const task = await queryOne<any>(
          `SELECT * FROM tasks WHERE id = $1`,
          [taskId]
        );

        // 通知企业验收
        await client.query(
          `INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
           VALUES ($1, 'company', 'ready_for_verification', '请验收任务', $2, $3)`,
          [
            task.company_id,
            `任务《${task.title}》AI审核通过，请查看交付物并验收`,
            taskId
          ]
        );

        // 发送邮件通知企业
        // TODO: 发送邮件
      }

      logger.info('AI review completed', { taskId, passed: aiReviewPassed });
    });
  } catch (err) {
    logger.error('AI review error', { taskId, error: err });
    throw err;
  }
}

// 导出所有函数
export default {
  getTaskInvitations,
  acceptTaskInvitation,
  rejectTaskInvitation,
  updateTaskProgress,
  submitDeliverables
};
