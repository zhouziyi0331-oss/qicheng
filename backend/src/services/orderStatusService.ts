import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import { enqueueAITask, AITaskType } from './aiTaskQueue';

/**
 * 订单状态管理服务
 * 负责订单状态变更时自动触发相应的AI任务
 */

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  REVISION_REQUESTED = 'revision_requested',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface OrderStatusChangeEvent {
  orderId: string;
  studentId: string;
  taskId: string;
  companyId: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  metadata?: any;
}

class OrderStatusService {
  /**
   * 更新订单状态并触发相应的AI任务
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    metadata?: any
  ): Promise<void> {
    try {
      // 1. 获取订单信息
      const order = await queryOne<{
        id: string;
        student_id: string;
        task_id: string;
        company_id: string;
        status: string;
      }>(
        `SELECT id, student_id, task_id, company_id, status
         FROM orders
         WHERE id = $1`,
        [orderId]
      );

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      const oldStatus = order.status as OrderStatus;

      // 2. 更新订单状态
      await query(
        `UPDATE orders
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [newStatus, orderId]
      );

      logger.info(`Order status updated: ${orderId} ${oldStatus} -> ${newStatus}`);

      // 3. 触发状态变更事件
      await this.handleStatusChange({
        orderId,
        studentId: order.student_id,
        taskId: order.task_id,
        companyId: order.company_id,
        oldStatus,
        newStatus,
        metadata
      });

    } catch (error: unknown) {
      logger.error('Failed to update order status:', error);
      throw error;
    }
  }

  /**
   * 处理订单状态变更事件
   */
  private async handleStatusChange(event: OrderStatusChangeEvent): Promise<void> {
    const { orderId, studentId, taskId, companyId, oldStatus, newStatus, metadata } = event;

    try {
      switch (newStatus) {
        case OrderStatus.ACCEPTED:
          // 学生接单 → 30秒后触发T-01（任务拆解）
          await this.scheduleT01Guidance(orderId, studentId, taskId);
          break;

        case OrderStatus.IN_PROGRESS:
          // 任务进行中 → 启动T-04监控（无操作轻推）
          await this.scheduleT04Monitoring(orderId, studentId);
          break;

        case OrderStatus.SUBMITTED:
          // 学生提交 → 触发AI-03预审核
          await this.triggerSubmissionReview(orderId, studentId, metadata);
          break;

        case OrderStatus.REVISION_REQUESTED:
          // 企业打回 → 触发T-03（翻译反馈）
          await this.triggerT03Guidance(orderId, studentId, metadata);
          break;

        case OrderStatus.COMPLETED:
          // 任务完成 → 触发AI-04成长报告 + T-05里程碑见证
          await this.triggerCompletionTasks(orderId, studentId);
          break;

        case OrderStatus.CANCELLED:
          // 任务取消 → 清理相关任务
          await this.cleanupOrderTasks(orderId);
          break;
      }

      // 通知WebSocket
      const websocketService = require('./websocketService').default;
      websocketService.notifyOrderStatusChange(
        studentId,
        orderId,
        newStatus,
        this.getStatusMessage(newStatus)
      );

    } catch (error: unknown) {
      logger.error('Failed to handle status change:', error);
    }
  }

  /**
   * T-01: 接单后30秒，任务拆解引导
   */
  private async scheduleT01Guidance(
    orderId: string,
    studentId: string,
    taskId: string
  ): Promise<void> {
    logger.info(`Scheduling T-01 guidance for order ${orderId}`);

    // 获取学生画像和项目需求
    const [studentProfile, projectProfile] = await Promise.all([
      queryOne(
        `SELECT profile_text, core_strengths
         FROM student_work_condition_profiles
         WHERE student_id = $1`,
        [studentId]
      ),
      queryOne(
        `SELECT requirement_text, project_type
         FROM project_requirement_profiles
         WHERE task_id = $1`,
        [taskId]
      )
    ]);

    // 获取任务详情
    const task = await queryOne(
      `SELECT title, description, deliverable_type
       FROM tasks
       WHERE id = $1`,
      [taskId]
    );

    // 30秒后触发
    setTimeout(async () => {
      await enqueueAITask({
        type: AITaskType.MENTOR_GUIDANCE,
        orderId,
        studentId,
        scenario: 'T01',
        context: {
          studentProfile: studentProfile?.profile_text,
          coreStrengths: studentProfile?.core_strengths,
          projectRequirement: projectProfile?.requirement_text,
          projectType: projectProfile?.project_type,
          taskTitle: task?.title,
          taskDescription: task?.description,
          deliverableType: task?.deliverable_type
        }
      });
    }, 30000); // 30秒
  }

  /**
   * T-04: 监控学生活动，无操作超过2小时则轻推
   */
  private async scheduleT04Monitoring(
    orderId: string,
    studentId: string
  ): Promise<void> {
    logger.info(`Starting T-04 monitoring for order ${orderId}`);

    // TODO: 实现定时检查逻辑
    // 可以使用cron job或定时任务
    // 检查 orders.last_activity_at
    // 如果超过2小时无活动，触发T-04
  }

  /**
   * AI-03: 交付物预审核
   */
  private async triggerSubmissionReview(
    orderId: string,
    studentId: string,
    metadata?: any
  ): Promise<void> {
    logger.info(`Triggering submission review for order ${orderId}`);

    // 获取提交物信息
    const submission = await queryOne(
      `SELECT id, submission_content, submission_files
       FROM order_submissions
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [orderId]
    );

    // 获取任务要求
    const task = await queryOne(
      `SELECT title, description, deliverable_type, acceptance_criteria
       FROM tasks t
       JOIN orders o ON t.id = o.task_id
       WHERE o.id = $1`,
      [orderId]
    );

    await enqueueAITask({
      type: AITaskType.SUBMISSION_REVIEW,
      orderId,
      studentId,
      context: {
        submissionContent: submission?.submission_content,
        submissionFiles: submission?.submission_files,
        taskTitle: task?.title,
        taskDescription: task?.description,
        deliverableType: task?.deliverable_type,
        acceptanceCriteria: task?.acceptance_criteria
      }
    });
  }

  /**
   * T-03: 企业打回，翻译反馈
   */
  private async triggerT03Guidance(
    orderId: string,
    studentId: string,
    metadata?: any
  ): Promise<void> {
    logger.info(`Triggering T-03 guidance for order ${orderId}`);

    // 获取企业反馈
    const feedback = metadata?.companyFeedback || '';

    // 获取提交物
    const submission = await queryOne(
      `SELECT submission_content, submission_files
       FROM order_submissions
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [orderId]
    );

    // 获取任务要求
    const task = await queryOne(
      `SELECT title, description, acceptance_criteria
       FROM tasks t
       JOIN orders o ON t.id = o.task_id
       WHERE o.id = $1`,
      [orderId]
    );

    await enqueueAITask({
      type: AITaskType.MENTOR_GUIDANCE,
      orderId,
      studentId,
      scenario: 'T03',
      context: {
        companyFeedback: feedback,
        submissionContent: submission?.submission_content,
        taskTitle: task?.title,
        taskDescription: task?.description,
        acceptanceCriteria: task?.acceptance_criteria
      }
    });
  }

  /**
   * 任务完成：触发成长报告 + T-05里程碑见证
   */
  private async triggerCompletionTasks(
    orderId: string,
    studentId: string
  ): Promise<void> {
    logger.info(`Triggering completion tasks for order ${orderId}`);

    // 获取任务完成数据
    const orderData = await queryOne(
      `SELECT o.*, t.title, t.description,
              s.submission_content, s.created_at as submitted_at,
              r.score as review_score, r.feedback as review_feedback
       FROM orders o
       JOIN tasks t ON o.task_id = t.id
       LEFT JOIN order_submissions s ON o.id = s.order_id
       LEFT JOIN submission_reviews r ON s.id = r.submission_id
       WHERE o.id = $1`,
      [orderId]
    );

    // 触发AI-04成长报告
    await enqueueAITask({
      type: AITaskType.GROWTH_REPORT,
      orderId,
      studentId,
      context: {
        orderData,
        taskTitle: orderData?.title,
        completedAt: new Date().toISOString()
      }
    });

    // 触发T-05里程碑见证
    await enqueueAITask({
      type: AITaskType.MENTOR_GUIDANCE,
      orderId,
      studentId,
      scenario: 'T05',
      context: {
        taskTitle: orderData?.title,
        reviewScore: orderData?.review_score,
        completedAt: new Date().toISOString()
      }
    });
  }

  /**
   * 清理订单相关任务
   */
  private async cleanupOrderTasks(orderId: string): Promise<void> {
    logger.info(`Cleaning up tasks for cancelled order ${orderId}`);
    // TODO: 取消队列中的相关任务
  }

  /**
   * 获取状态变更消息
   */
  private getStatusMessage(status: OrderStatus): string {
    const messages: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '订单待确认',
      [OrderStatus.ACCEPTED]: '订单已接受，启程老师将为你提供引导',
      [OrderStatus.IN_PROGRESS]: '任务进行中',
      [OrderStatus.SUBMITTED]: '已提交交付物，等待审核',
      [OrderStatus.REVISION_REQUESTED]: '需要修改，启程老师已为你翻译反馈',
      [OrderStatus.COMPLETED]: '任务完成！你的成长报告正在生成',
      [OrderStatus.CANCELLED]: '订单已取消'
    };

    return messages[status] || '订单状态已更新';
  }

  /**
   * 记录学生活动
   */
  async recordStudentActivity(orderId: string): Promise<void> {
    await query(
      `UPDATE orders
       SET last_activity_at = NOW()
       WHERE id = $1`,
      [orderId]
    );
  }
}

export default new OrderStatusService();
