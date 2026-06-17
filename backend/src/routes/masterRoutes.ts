import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { query, queryOne, withTransaction } from '../utils/db';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * 申请成为大师
 * POST /api/v1/master/apply
 * Body: { specialties, fee, minTaskPrice, bio, acceptDesignated, allowNegotiation }
 *
 * 权限：Lv.5+可申请
 */
router.post(
  '/apply',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { specialties, fee, minTaskPrice, bio, acceptDesignated, allowNegotiation } = req.body;

      if (!specialties || !fee || !minTaskPrice) {
        return res.status(400).json({
          success: false,
          error: 'specialties, fee, and minTaskPrice are required',
        });
      }

      // 检查用户等级
      const user = await queryOne<{ current_level: number; is_master: boolean }>(
        `SELECT current_level, is_master FROM users WHERE id = $1`,
        [userId]
      );

      if (!user || user.current_level < 5) {
        throw new AppError(403, 'Only Lv.5+ students can apply to be a master');
      }

      if (user.is_master) {
        throw new AppError(400, 'You are already a master');
      }

      // 更新用户为大师（待审核）
      await query(
        `UPDATE users
         SET master_specialties = $2,
             master_fee = $3,
             master_min_task_price = $4,
             master_bio = $5,
             master_accept_designated = $6,
             master_allow_negotiation = $7
         WHERE id = $1`,
        [userId, JSON.stringify(specialties), fee, minTaskPrice, bio, acceptDesignated, allowNegotiation]
      );

      // 发送通知给管理员
      await query(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         SELECT id, 'master_application', '新的大师申请', '有新的大师认证申请待审核', '/admin/masters'
         FROM users WHERE role = 'admin'`
      );

      logger.info('Master application submitted via API', { userId });

      res.json({
        success: true,
        message: '申请已提交，等待管理员审核',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取大师中心数据
 * GET /api/v1/master/dashboard
 *
 * 权限：仅认证大师可访问
 */
router.get(
  '/dashboard',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      // 检查是否为认证大师
      const user = await queryOne<{ is_master: boolean; master_approved_at: Date }>(
        `SELECT is_master, master_approved_at FROM users WHERE id = $1`,
        [userId]
      );

      if (!user?.is_master || !user.master_approved_at) {
        throw new AppError(403, 'Only certified masters can access dashboard');
      }

      // 获取大师统计数据
      const stats = await queryOne<any>(
        `SELECT
           COUNT(*) FILTER (WHERE ta.master_id = $1) as total_tasks,
           COUNT(*) FILTER (WHERE ta.master_id = $1 AND ta.status = 'completed') as completed_tasks,
           COALESCE(SUM(ta.master_fee) FILTER (WHERE ta.master_id = $1 AND ta.status = 'completed'), 0) as total_earnings,
           COALESCE(AVG(ta.master_fee) FILTER (WHERE ta.master_id = $1 AND ta.status = 'completed'), 0) as avg_fee
         FROM task_assignments ta
         WHERE ta.master_id = $1`,
        [userId]
      );

      // 获取待处理的指导请求
      const pendingRequests = await query<any>(
        `SELECT
           ta.id,
           ta.task_id,
           ta.student_id,
           ta.master_requested_at,
           t.title as task_title,
           u.nickname as student_name,
           u.avatar_url as student_avatar
         FROM task_assignments ta
         JOIN tasks t ON ta.task_id = t.id
         JOIN users u ON ta.student_id = u.id
         WHERE ta.master_id = $1
         AND ta.status = 'master_assigned'
         ORDER BY ta.master_requested_at DESC
         LIMIT 10`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          stats,
          pendingRequests,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 更新大师设置
 * PUT /api/v1/master/settings
 * Body: { specialties?, fee?, minTaskPrice?, bio?, acceptDesignated?, allowNegotiation? }
 *
 * 权限：仅认证大师可更新
 */
router.put(
  '/settings',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { specialties, fee, minTaskPrice, bio, acceptDesignated, allowNegotiation } = req.body;

      // 检查是否为认证大师
      const user = await queryOne<{ is_master: boolean; master_approved_at: Date }>(
        `SELECT is_master, master_approved_at FROM users WHERE id = $1`,
        [userId]
      );

      if (!user?.is_master || !user.master_approved_at) {
        throw new AppError(403, 'Only certified masters can update settings');
      }

      // 构建更新语句
      const updates: string[] = [];
      const values: any[] = [userId];
      let paramIndex = 2;

      if (specialties !== undefined) {
        updates.push(`master_specialties = $${paramIndex}`);
        values.push(JSON.stringify(specialties));
        paramIndex++;
      }
      if (fee !== undefined) {
        updates.push(`master_fee = $${paramIndex}`);
        values.push(fee);
        paramIndex++;
      }
      if (minTaskPrice !== undefined) {
        updates.push(`master_min_task_price = $${paramIndex}`);
        values.push(minTaskPrice);
        paramIndex++;
      }
      if (bio !== undefined) {
        updates.push(`master_bio = $${paramIndex}`);
        values.push(bio);
        paramIndex++;
      }
      if (acceptDesignated !== undefined) {
        updates.push(`master_accept_designated = $${paramIndex}`);
        values.push(acceptDesignated);
        paramIndex++;
      }
      if (allowNegotiation !== undefined) {
        updates.push(`master_allow_negotiation = $${paramIndex}`);
        values.push(allowNegotiation);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
      }

      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $1`,
        values
      );

      logger.info('Master settings updated via API', { userId });

      res.json({
        success: true,
        message: '设置已更新',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 浏览大师列表
 * GET /api/v1/masters
 * Query: track?, limit?, offset?
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { track, limit, offset } = req.query;

      let whereClause = `WHERE u.is_master = true AND u.master_approved_at IS NOT NULL`;
      const params: any[] = [];
      let paramIndex = 1;

      if (track) {
        whereClause += ` AND u.master_specialties ? $${paramIndex}`;
        params.push(track);
        paramIndex++;
      }

      params.push(
        limit ? parseInt(limit as string) : 20,
        offset ? parseInt(offset as string) : 0
      );

      const masters = await query<any>(
        `SELECT
           u.id,
           u.nickname,
           u.avatar_url,
           u.master_specialties,
           u.master_fee,
           u.master_min_task_price,
           u.master_total_tasks,
           u.master_avg_rating,
           u.master_bio,
           u.master_accept_designated,
           u.master_allow_negotiation
         FROM users u
         ${whereClause}
         ORDER BY u.master_avg_rating DESC NULLS LAST, u.master_total_tasks DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
      );

      res.json({
        success: true,
        data: masters,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 企业邀请大师
 * POST /api/v1/tasks/:id/invite-master
 * Body: { masterId, offer, message? }
 *
 * 权限：仅企业可邀请
 */
router.post(
  '/:id/invite-master',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id;
      const { masterId, offer, message } = req.body;

      if (!masterId || !offer) {
        return res.status(400).json({
          success: false,
          error: 'masterId and offer are required',
        });
      }

      // 检查任务是否存在且属于当前企业
      const task = await queryOne<{ company_id: string; dispatch_mode: string }>(
        `SELECT company_id, dispatch_mode FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (!task) {
        throw new AppError(404, 'Task not found');
      }

      if (task.company_id !== req.user!.userId) {
        throw new AppError(403, 'You can only invite masters for your own tasks');
      }

      // 创建邀请记录
      await query(
        `INSERT INTO project_invitations (
           task_id, master_id, enterprise_offer, message, status
         ) VALUES ($1, $2, $3, $4, 'pending')`,
        [taskId, masterId, offer, message]
      );

      // 通知大师
      await query(
        `INSERT INTO notifications (
           user_id, type, title, body, link_url
         ) VALUES ($1, 'master_invitation', '企业邀请', $2, $3)`,
        [masterId, '企业邀请你指导一个项目', `/tasks/${taskId}`]
      );

      logger.info('Master invited via API', { taskId, masterId, offer });

      res.json({
        success: true,
        message: '邀请已发送',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 大师响应邀请
 * POST /api/v1/invitations/:id/respond
 * Body: { action: 'accept' | 'reject' | 'negotiate', counterOffer? }
 *
 * 权限：仅被邀请的大师可响应
 */
router.post(
  '/:id/respond',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invitationId = req.params.id;
      const masterId = req.user!.userId;
      const { action, counterOffer } = req.body;

      if (!action || !['accept', 'reject', 'negotiate'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'action must be accept, reject, or negotiate',
        });
      }

      // 检查邀请是否存在且属于当前大师
      const invitation = await queryOne<any>(
        `SELECT * FROM project_invitations WHERE id = $1 AND master_id = $2`,
        [invitationId, masterId]
      );

      if (!invitation) {
        throw new AppError(404, 'Invitation not found');
      }

      if (invitation.status !== 'pending' && invitation.status !== 'negotiating') {
        throw new AppError(400, 'Invitation already responded');
      }

      await withTransaction(async (client) => {
        if (action === 'accept') {
          // 接受邀请
          await client.query(
            `UPDATE project_invitations
             SET status = 'accepted', responded_at = NOW()
             WHERE id = $1`,
            [invitationId]
          );

          // 更新任务
          await client.query(
            `UPDATE tasks
             SET designated_master_id = $2, dispatch_mode = 'designated'
             WHERE id = $1`,
            [invitation.task_id, masterId]
          );
        } else if (action === 'reject') {
          // 拒绝邀请
          await client.query(
            `UPDATE project_invitations
             SET status = 'rejected', responded_at = NOW()
             WHERE id = $1`,
            [invitationId]
          );
        } else if (action === 'negotiate') {
          // 协商价格
          if (!counterOffer) {
            throw new AppError(400, 'counterOffer is required for negotiation');
          }

          await client.query(
            `UPDATE project_invitations
             SET status = 'negotiating',
                 master_counter_offer = $2,
                 responded_at = NOW()
             WHERE id = $1`,
            [invitationId, counterOffer]
          );
        }

        // 通知企业
        await client.query(
          `INSERT INTO notifications (
             user_id, type, title, body, link_url
           )
           SELECT company_id, 'invitation_response', '大师响应', $2, $3
           FROM tasks WHERE id = $1`,
          [
            invitation.task_id,
            action === 'accept' ? '大师已接受邀请' : action === 'reject' ? '大师已拒绝邀请' : '大师提出协商',
            `/tasks/${invitation.task_id}`,
          ]
        );
      });

      logger.info('Master responded to invitation via API', {
        invitationId,
        masterId,
        action,
      });

      res.json({
        success: true,
        message:
          action === 'accept'
            ? '已接受邀请'
            : action === 'reject'
            ? '已拒绝邀请'
            : '协商请求已发送',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 大师发送指导消息
 * POST /api/v1/master/guidance/:taskId
 * Body: { message }
 *
 * 权限：仅指派的大师可发送
 */
router.post(
  '/guidance/:taskId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.taskId;
      const masterId = req.user!.userId;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'message is required',
        });
      }

      // 检查是否为该任务的指派大师
      const assignment = await queryOne<{ student_id: string; session_id: string }>(
        `SELECT ta.student_id, mss.id as session_id
         FROM task_assignments ta
         LEFT JOIN mentor_stage_sessions mss ON ta.task_id = mss.task_id AND ta.student_id = mss.student_id
         WHERE ta.task_id = $1 AND ta.master_id = $2`,
        [taskId, masterId]
      );

      if (!assignment) {
        throw new AppError(403, 'You are not assigned to this task');
      }

      // 发送指导消息
      await query(
        `INSERT INTO mentor_stage_messages (
           session_id, sender_type, master_id, message, created_at
         ) VALUES ($1, 'human_master', $2, $3, NOW())`,
        [assignment.session_id, masterId, message]
      );

      // 通知学生
      await query(
        `INSERT INTO notifications (
           user_id, type, title, body, link_url
         ) VALUES ($1, 'master_message', '大师指导', '大师发来了新的指导消息', $2)`,
        [assignment.student_id, `/tasks/${taskId}/mentor`]
      );

      logger.info('Master guidance message sent via API', { taskId, masterId });

      res.json({
        success: true,
        message: '指导消息已发送',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
