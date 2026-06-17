import { query, queryOne, withTransaction } from '../utils/db';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * 三次审核兜底服务
 *
 * 功能：
 * 1. 检测第三次审核失败
 * 2. 提供转单和召唤大师两个选项
 * 3. 处理转单逻辑（20/80分润）
 * 4. 处理召唤大师逻辑
 */

interface ThreeStrikeOptions {
  taskId: string;
  studentId: string;
  submissionId: string;
}

interface TransferTaskOptions {
  taskId: string;
  fromStudentId: string;
  toStudentId: string;
  reason: string;
}

interface SummonMasterOptions {
  taskId: string;
  studentId: string;
  masterId: string;
  message?: string;
}

class ThreeStrikeSafetyNetService {
  /**
   * 检查是否触发三次审核兜底
   */
  async checkThreeStrikeTrigger(taskId: string, studentId: string): Promise<boolean> {
    const submissions = await query<{ version: number; ai_review_score: number }>(
      `SELECT version, ai_review_score
       FROM task_submissions
       WHERE task_id = $1
       ORDER BY version DESC`,
      [taskId]
    );

    // 检查是否已经提交了3次且都未通过
    if (submissions.length >= 3) {
      const allFailed = submissions.slice(0, 3).every(s => s.ai_review_score < 70);

      if (allFailed) {
        // 标记第三次提交为最终失败
        await query(
          `UPDATE task_submissions
           SET is_final_fail = true
           WHERE task_id = $1 AND version = 3`,
          [taskId]
        );

        logger.warn('Three strike safety net triggered', {
          taskId,
          studentId,
          submissions: submissions.length,
        });

        return true;
      }
    }

    return false;
  }

  /**
   * 获取可转单的学生列表
   * 条件：同赛道、等级相近、当前任务数<3
   */
  async getTransferCandidates(taskId: string, currentStudentId: string): Promise<any[]> {
    const task = await queryOne<{ track: string; level_required: number }>(
      `SELECT track, level_required FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    const candidates = await query<any>(
      `SELECT
         u.id,
         u.nickname,
         u.avatar_url,
         u.current_level,
         sc.tasks_completed,
         sc.avg_task_quality,
         COUNT(ta.id) as active_tasks
       FROM users u
       JOIN student_capabilities sc ON u.id = sc.student_id
       LEFT JOIN task_assignments ta ON u.id = ta.student_id
         AND ta.status IN ('accepted', 'in_progress')
       WHERE u.id != $1
       AND u.role = 'student'
       AND sc.track = $2
       AND u.current_level BETWEEN $3 - 1 AND $3 + 1
       GROUP BY u.id, u.nickname, u.avatar_url, u.current_level,
                sc.tasks_completed, sc.avg_task_quality
       HAVING COUNT(ta.id) < 3
       ORDER BY sc.avg_task_quality DESC, sc.tasks_completed DESC
       LIMIT 10`,
      [currentStudentId, task.track, task.level_required]
    );

    return candidates;
  }

  /**
   * 执行转单
   * 分润：原学生20%，接包学生80%
   */
  async transferTask(options: TransferTaskOptions): Promise<void> {
    const { taskId, fromStudentId, toStudentId, reason } = options;

    await withTransaction(async (client) => {
      // 1. 获取任务信息
      const task = await client.query(
        `SELECT student_price FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (task.rows.length === 0) {
        throw new AppError(404, 'Task not found');
      }

      const studentPrice = task.rows[0].student_price;
      const transferFee = studentPrice * 0.2; // 原学生获得20%
      const receiverIncome = studentPrice * 0.8; // 接包学生获得80%

      // 2. 更新原任务分配状态为transferred
      await client.query(
        `UPDATE task_assignments
         SET status = 'transferred',
             transfer_to = $2,
             transfer_reason = $3,
             transferred_at = NOW()
         WHERE task_id = $1 AND student_id = $4`,
        [taskId, toStudentId, reason, fromStudentId]
      );

      // 3. 创建新的任务分配给接包学生
      await client.query(
        `INSERT INTO task_assignments (
           task_id, student_id, status, match_score, match_reason, assigned_at
         ) VALUES ($1, $2, 'accepted', 0, '转单接包', NOW())`,
        [taskId, toStudentId]
      );

      // 4. 记录转单收入（原学生）
      await client.query(
        `INSERT INTO income_records (
           user_id, task_id, amount, type, status, description
         ) VALUES ($1, $2, $3, 'transfer_fee', 'pending', '转单费用（20%）')`,
        [fromStudentId, taskId, transferFee]
      );

      // 5. 更新任务状态
      await client.query(
        `UPDATE tasks
         SET status = 'in_progress',
             accepted_student_id = $2,
             student_price = $3
         WHERE id = $1`,
        [taskId, toStudentId, receiverIncome]
      );

      logger.info('Task transferred successfully', {
        taskId,
        fromStudentId,
        toStudentId,
        transferFee,
        receiverIncome,
      });
    });
  }

  /**
   * 获取可召唤的大师列表
   * 条件：已认证、在线、擅长该赛道
   */
  async getAvailableMasters(taskId: string): Promise<any[]> {
    const task = await queryOne<{ track: string }>(
      `SELECT track FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    const masters = await query<any>(
      `SELECT
         u.id,
         u.nickname,
         u.avatar_url,
         u.master_specialties,
         u.master_fee,
         u.master_total_tasks,
         u.master_avg_rating,
         u.master_bio
       FROM users u
       WHERE u.is_master = true
       AND u.master_approved_at IS NOT NULL
       AND u.master_specialties ? $1
       ORDER BY u.master_avg_rating DESC NULLS LAST, u.master_total_tasks DESC
       LIMIT 10`,
      [task.track]
    );

    return masters;
  }

  /**
   * 召唤大师
   */
  async summonMaster(options: SummonMasterOptions): Promise<void> {
    const { taskId, studentId, masterId, message } = options;

    await withTransaction(async (client) => {
      // 1. 获取大师费用
      const master = await client.query(
        `SELECT master_fee FROM users WHERE id = $1 AND is_master = true`,
        [masterId]
      );

      if (master.rows.length === 0) {
        throw new AppError(404, 'Master not found');
      }

      const masterFee = master.rows[0].master_fee;

      // 2. 更新任务分配，添加大师
      await client.query(
        `UPDATE task_assignments
         SET master_id = $2,
             master_fee = $3,
             master_requested_at = NOW(),
             status = 'master_assigned'
         WHERE task_id = $1 AND student_id = $4`,
        [taskId, masterId, masterFee, studentId]
      );

      // 3. 创建导师会话（大师模式）
      await client.query(
        `INSERT INTO mentor_stage_sessions (
           student_id, task_id, current_stage, created_at
         ) VALUES ($1, $2, 'T-02', NOW())`,
        [studentId, taskId]
      );

      // 4. 发送通知给大师
      await client.query(
        `INSERT INTO notifications (
           user_id, type, title, body, link_url
         ) VALUES ($1, 'master_request', '学生召唤', $2, $3)`,
        [
          masterId,
          `学生请求您的指导帮助`,
          `/tasks/${taskId}`,
        ]
      );

      // 5. 冻结大师费用
      await client.query(
        `INSERT INTO income_records (
           user_id, task_id, amount, type, status, description
         ) VALUES ($1, $2, $3, 'master_fee', 'frozen', '大师指导费用（冻结）')`,
        [studentId, taskId, -masterFee]
      );

      logger.info('Master summoned successfully', {
        taskId,
        studentId,
        masterId,
        masterFee,
      });
    });
  }

  /**
   * 获取三次审核兜底状态
   */
  async getThreeStrikeStatus(taskId: string, studentId: string): Promise<any> {
    const submissions = await query<any>(
      `SELECT version, ai_review_score, is_final_fail, created_at
       FROM task_submissions
       WHERE task_id = $1
       ORDER BY version DESC`,
      [taskId]
    );

    const assignment = await queryOne<any>(
      `SELECT status, transfer_to, master_id
       FROM task_assignments
       WHERE task_id = $1 AND student_id = $2`,
      [taskId, studentId]
    );

    return {
      submissionCount: submissions.length,
      isFinalFail: submissions.length >= 3 && submissions[0]?.is_final_fail,
      submissions: submissions.slice(0, 3),
      status: assignment?.status,
      hasTransferred: !!assignment?.transfer_to,
      hasMaster: !!assignment?.master_id,
    };
  }
}

export default new ThreeStrikeSafetyNetService();
