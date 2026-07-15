"use strict";
/**
 * 任务邀约服务
 *
 * 处理定向邀约的核心业务逻辑
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskInvitationService = void 0;
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
// ==========================================
// 核心服务方法
// ==========================================
class TaskInvitationService {
    /**
     * 获取学生的所有邀约
     */
    async getMyInvitations(studentId) {
        try {
            // 先自动过期旧邀约
            await this.expireOldInvitations();
            const query = `
        SELECT
          ti.*,
          t.title as task_title,
          t.description as task_description,
          t.budget_net as task_budget,
          t.deadline as task_deadline,
          u.nickname as company_name,
          u.id as company_id
        FROM task_invitations ti
        JOIN tasks t ON ti.task_id = t.id
        JOIN users u ON t.company_id = u.id
        WHERE ti.student_id = $1
        ORDER BY
          CASE ti.status
            WHEN 'pending' THEN 1
            WHEN 'accepted' THEN 2
            WHEN 'declined' THEN 3
            WHEN 'expired' THEN 4
            ELSE 5
          END,
          ti.invited_at DESC
      `;
            const result = await database_1.pool.query(query, [studentId]);
            const invitations = result.rows;
            // 按状态分组
            return {
                pending: invitations.filter(inv => inv.status === 'pending'),
                accepted: invitations.filter(inv => inv.status === 'accepted'),
                declined: invitations.filter(inv => inv.status === 'declined'),
                expired: invitations.filter(inv => inv.status === 'expired'),
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get my invitations', { error, studentId });
            throw error;
        }
    }
    /**
     * 接受邀约
     */
    async acceptInvitation(invitationId, studentId) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 1. 检查邀约是否存在且属于该学生
            const checkQuery = `
        SELECT * FROM task_invitations
        WHERE id = $1 AND student_id = $2
        FOR UPDATE
      `;
            const checkResult = await client.query(checkQuery, [invitationId, studentId]);
            if (checkResult.rows.length === 0) {
                throw new Error('邀约不存在或无权限');
            }
            const invitation = checkResult.rows[0];
            // 2. 检查邀约状态
            if (invitation.status !== 'pending') {
                throw new Error(`邀约状态无效: ${invitation.status}`);
            }
            // 3. 检查是否过期
            if (new Date(invitation.expires_at) < new Date()) {
                // 标记为过期
                await client.query(`UPDATE task_invitations SET status = 'expired' WHERE id = $1`, [invitationId]);
                throw new Error('邀约已过期');
            }
            // 4. 检查该任务是否已有学生接受
            const acceptedQuery = `
        SELECT id FROM task_invitations
        WHERE task_id = $1 AND status = 'accepted'
      `;
            const acceptedResult = await client.query(acceptedQuery, [invitation.task_id]);
            if (acceptedResult.rows.length > 0) {
                throw new Error('该任务已被其他学生接受');
            }
            // 5. 接受邀约
            const updateQuery = `
        UPDATE task_invitations
        SET status = 'accepted', responded_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
            const updateResult = await client.query(updateQuery, [invitationId]);
            // 6. 将该任务的其他pending邀约标记为cancelled
            await client.query(`UPDATE task_invitations
         SET status = 'cancelled'
         WHERE task_id = $1 AND id != $2 AND status = 'pending'`, [invitation.task_id, invitationId]);
            // 7. 创建订单（关联到task_assignments或orders表）
            // TODO: 根据实际业务逻辑创建订单
            await client.query(`INSERT INTO task_assignments (task_id, student_id, status, assigned_at)
         VALUES ($1, $2, 'accepted', NOW())
         ON CONFLICT (task_id, student_id) DO NOTHING`, [invitation.task_id, studentId]);
            await client.query('COMMIT');
            logger_1.default.info('Invitation accepted', { invitationId, studentId, taskId: invitation.task_id });
            return updateResult.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Failed to accept invitation', { error, invitationId, studentId });
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 拒绝邀约
     */
    async declineInvitation(invitationId, studentId) {
        try {
            // 检查邀约是否存在且属于该学生
            const checkQuery = `
        SELECT * FROM task_invitations
        WHERE id = $1 AND student_id = $2
      `;
            const checkResult = await database_1.pool.query(checkQuery, [invitationId, studentId]);
            if (checkResult.rows.length === 0) {
                throw new Error('邀约不存在或无权限');
            }
            const invitation = checkResult.rows[0];
            if (invitation.status !== 'pending') {
                throw new Error(`邀约状态无效: ${invitation.status}`);
            }
            // 拒绝邀约
            const updateQuery = `
        UPDATE task_invitations
        SET status = 'declined', responded_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
            const updateResult = await database_1.pool.query(updateQuery, [invitationId]);
            logger_1.default.info('Invitation declined', { invitationId, studentId });
            return updateResult.rows[0];
        }
        catch (error) {
            logger_1.default.error('Failed to decline invitation', { error, invitationId, studentId });
            throw error;
        }
    }
    /**
     * 获取单个邀约详情
     */
    async getInvitationDetail(invitationId, studentId) {
        try {
            const query = `
        SELECT
          ti.*,
          t.title as task_title,
          t.description as task_description,
          t.budget_net as task_budget,
          t.deadline as task_deadline,
          t.acceptance_criteria as task_requirements,
          u.nickname as company_name,
          u.id as company_id,
          u.avatar_url as company_avatar
        FROM task_invitations ti
        JOIN tasks t ON ti.task_id = t.id
        JOIN users u ON t.company_id = u.id
        WHERE ti.id = $1 AND ti.student_id = $2
      `;
            const result = await database_1.pool.query(query, [invitationId, studentId]);
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows[0];
        }
        catch (error) {
            logger_1.default.error('Failed to get invitation detail', { error, invitationId, studentId });
            throw error;
        }
    }
    /**
     * 自动过期24小时未响应的邀约
     */
    async expireOldInvitations() {
        try {
            const result = await database_1.pool.query(`
        UPDATE task_invitations
        SET status = 'expired'
        WHERE status = 'pending' AND expires_at < NOW()
        RETURNING id
      `);
            const expiredCount = result.rowCount || 0;
            if (expiredCount > 0) {
                logger_1.default.info('Expired old invitations', { count: expiredCount });
            }
            return expiredCount;
        }
        catch (error) {
            logger_1.default.error('Failed to expire old invitations', { error });
            throw error;
        }
    }
    /**
     * 创建邀约（供后台匹配引擎调用）
     */
    async createInvitation(params) {
        try {
            const query = `
        INSERT INTO task_invitations (
          task_id,
          student_id,
          invitation_type,
          invitation_reason,
          match_score,
          match_details,
          rank,
          paid_amount,
          payment_id,
          status,
          invited_at,
          expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW(), NOW() + INTERVAL '24 hours')
        ON CONFLICT (task_id, student_id) DO UPDATE
        SET
          invitation_type = EXCLUDED.invitation_type,
          invitation_reason = EXCLUDED.invitation_reason,
          match_score = EXCLUDED.match_score,
          match_details = EXCLUDED.match_details,
          rank = EXCLUDED.rank,
          paid_amount = EXCLUDED.paid_amount,
          payment_id = EXCLUDED.payment_id,
          status = 'pending',
          invited_at = NOW(),
          expires_at = NOW() + INTERVAL '24 hours'
        RETURNING *
      `;
            const result = await database_1.pool.query(query, [
                params.taskId,
                params.studentId,
                params.invitationType,
                params.invitationReason || null,
                params.matchScore || null,
                params.matchDetails ? JSON.stringify(params.matchDetails) : null,
                params.rank || null,
                params.paidAmount || 0,
                params.paymentId || null,
            ]);
            logger_1.default.info('Invitation created', { taskId: params.taskId, studentId: params.studentId });
            return result.rows[0];
        }
        catch (error) {
            logger_1.default.error('Failed to create invitation', { error, params });
            throw error;
        }
    }
    /**
     * 批量创建邀约（供匹配引擎调用）
     */
    async createBatchInvitations(taskId, students) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            const invitations = [];
            for (const student of students) {
                const query = `
          INSERT INTO task_invitations (
            task_id,
            student_id,
            invitation_type,
            invitation_reason,
            match_score,
            match_details,
            rank,
            status,
            invited_at,
            expires_at
          ) VALUES ($1, $2, 'auto', $3, $4, $5, $6, 'pending', NOW(), NOW() + INTERVAL '24 hours')
          ON CONFLICT (task_id, student_id) DO UPDATE
          SET
            invitation_reason = EXCLUDED.invitation_reason,
            match_score = EXCLUDED.match_score,
            match_details = EXCLUDED.match_details,
            rank = EXCLUDED.rank,
            status = 'pending',
            invited_at = NOW(),
            expires_at = NOW() + INTERVAL '24 hours'
          RETURNING *
        `;
                const result = await client.query(query, [
                    taskId,
                    student.studentId,
                    student.matchReasons.join('\n'),
                    student.matchScore,
                    JSON.stringify(student.matchDetails),
                    student.rank,
                ]);
                invitations.push(result.rows[0]);
            }
            await client.query('COMMIT');
            logger_1.default.info('Batch invitations created', { taskId, count: students.length });
            return invitations;
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Failed to create batch invitations', { error, taskId });
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.taskInvitationService = new TaskInvitationService();
//# sourceMappingURL=taskInvitationService.js.map