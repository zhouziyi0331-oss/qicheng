"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-23, E-24, E-25, E-26, E-27, E-28: 任务追踪系统服务
 */
class TaskTrackingService {
    /**
     * E-23: 获取任务进度仪表盘
     */
    async getProgressDashboard(taskId) {
        // 获取最新快照
        const snapshotResult = await database_1.pool.query(`SELECT * FROM task_progress_snapshots
       WHERE task_id = $1
       ORDER BY snapshot_time DESC
       LIMIT 1`, [taskId]);
        // 获取任务基本信息
        const taskResult = await database_1.pool.query(`SELECT * FROM tasks WHERE id = $1`, [taskId]);
        // 获取里程碑进度
        const milestonesResult = await database_1.pool.query(`SELECT * FROM task_milestones
       WHERE task_id = $1
       ORDER BY sequence_number`, [taskId]);
        // 获取延期预警
        const warningsResult = await database_1.pool.query(`SELECT * FROM task_delay_warnings
       WHERE task_id = $1 AND is_resolved = false
       ORDER BY created_at DESC`, [taskId]);
        return {
            task: taskResult.rows[0],
            snapshot: snapshotResult.rows[0] || null,
            milestones: milestonesResult.rows,
            warnings: warningsResult.rows,
        };
    }
    /**
     * 创建进度快照
     */
    async createProgressSnapshot(taskId) {
        await database_1.pool.query(`SELECT create_progress_snapshot($1)`, [taskId]);
    }
    /**
     * E-24: 创建任务里程碑
     */
    async createMilestone(data) {
        const result = await database_1.pool.query(`INSERT INTO task_milestones
       (id, task_id, milestone_name, description, sequence_number, due_date,
        deliverables, acceptance_criteria, budget_allocation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            data.task_id,
            data.milestone_name,
            data.description,
            data.sequence_number,
            data.due_date,
            data.deliverables || [],
            data.acceptance_criteria || [],
            data.budget_allocation,
        ]);
        return result.rows[0];
    }
    /**
     * 学生提交里程碑
     */
    async submitMilestone(milestoneId, submission, files) {
        const result = await database_1.pool.query(`UPDATE task_milestones
       SET status = 'submitted',
           student_submission = $1,
           submission_files = $2,
           submitted_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`, [submission, JSON.stringify(files || []), milestoneId]);
        if (result.rows.length === 0) {
            throw new Error('里程碑不存在');
        }
        return result.rows[0];
    }
    /**
     * 企业确认里程碑
     */
    async confirmMilestone(milestoneId, approved, feedback, rejectedReason) {
        const status = approved ? 'approved' : 'rejected';
        const result = await database_1.pool.query(`UPDATE task_milestones
       SET status = $1,
           company_feedback = $2,
           is_approved = $3,
           approved_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
           rejected_reason = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`, [status, feedback, approved, rejectedReason, milestoneId]);
        if (result.rows.length === 0) {
            throw new Error('里程碑不存在');
        }
        return result.rows[0];
    }
    /**
     * 获取任务里程碑列表
     */
    async getMilestones(taskId) {
        const result = await database_1.pool.query(`SELECT * FROM task_milestones
       WHERE task_id = $1
       ORDER BY sequence_number`, [taskId]);
        return result.rows;
    }
    /**
     * E-25: 创建交付通知
     */
    async createDeliveryNotification(data) {
        const result = await database_1.pool.query(`INSERT INTO delivery_notifications
       (id, task_id, milestone_id, notification_type, recipient_id, recipient_role,
        title, message, days_until_due)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            data.task_id,
            data.milestone_id,
            data.notification_type,
            data.recipient_id,
            data.recipient_role,
            data.title,
            data.message,
            data.days_until_due,
        ]);
        return result.rows[0];
    }
    /**
     * 获取用户的通知列表
     */
    async getNotifications(userId, unreadOnly = false) {
        let query = `
      SELECT dn.*,
             t.title as task_title,
             tm.milestone_name
      FROM delivery_notifications dn
      JOIN tasks t ON dn.task_id = t.id
      LEFT JOIN task_milestones tm ON dn.milestone_id = tm.id
      WHERE dn.recipient_id = $1
    `;
        if (unreadOnly) {
            query += ` AND dn.is_read = false`;
        }
        query += ` ORDER BY dn.created_at DESC LIMIT 50`;
        const result = await database_1.pool.query(query, [userId]);
        return result.rows;
    }
    /**
     * 标记通知为已读
     */
    async markNotificationAsRead(notificationId) {
        await database_1.pool.query(`UPDATE delivery_notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1`, [notificationId]);
    }
    /**
     * E-26: 创建沟通记录归档
     */
    async archiveCommunication(taskId, startDate, endDate, archivedBy) {
        // 获取消息记录
        const messagesResult = await database_1.pool.query(`SELECT
         m.id,
         m.sender_id,
         u.username as sender_name,
         m.sender_role,
         m.content,
         m.created_at
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.task_id = $1
         AND m.created_at >= $2
         AND m.created_at <= $3
       ORDER BY m.created_at`, [taskId, startDate, endDate]);
        const messages = messagesResult.rows;
        // 统计信息
        const companyMessages = messages.filter((m) => m.sender_role === 'company').length;
        const studentMessages = messages.filter((m) => m.sender_role === 'student').length;
        // 创建归档
        const result = await database_1.pool.query(`INSERT INTO communication_archives
       (id, task_id, start_date, end_date, messages, total_messages,
        company_messages, student_messages, archived_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            taskId,
            startDate,
            endDate,
            JSON.stringify(messages),
            messages.length,
            companyMessages,
            studentMessages,
            archivedBy,
        ]);
        return result.rows[0];
    }
    /**
     * 获取任务的归档记录
     */
    async getArchives(taskId) {
        const result = await database_1.pool.query(`SELECT ca.*,
              u.username as archived_by_name
       FROM communication_archives ca
       JOIN users u ON ca.archived_by = u.id
       WHERE ca.task_id = $1
       ORDER BY ca.archived_at DESC`, [taskId]);
        return result.rows;
    }
    /**
     * E-27: 创建延期预警
     */
    async createDelayWarning(data) {
        const result = await database_1.pool.query(`INSERT INTO task_delay_warnings
       (id, task_id, warning_type, severity, warning_message, warning_data, suggested_actions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            data.task_id,
            data.warning_type,
            data.severity,
            data.warning_message,
            JSON.stringify(data.warning_data || {}),
            data.suggested_actions || [],
        ]);
        return result.rows[0];
    }
    /**
     * 解决预警
     */
    async resolveWarning(warningId, resolutionNote) {
        const result = await database_1.pool.query(`UPDATE task_delay_warnings
       SET is_resolved = true,
           resolved_at = NOW(),
           resolution_note = $1
       WHERE id = $2
       RETURNING *`, [resolutionNote, warningId]);
        if (result.rows.length === 0) {
            throw new Error('预警不存在');
        }
        return result.rows[0];
    }
    /**
     * 获取任务的预警列表
     */
    async getWarnings(taskId, includeResolved = false) {
        let query = `
      SELECT * FROM task_delay_warnings
      WHERE task_id = $1
    `;
        if (!includeResolved) {
            query += ` AND is_resolved = false`;
        }
        query += ` ORDER BY created_at DESC`;
        const result = await database_1.pool.query(query, [taskId]);
        return result.rows;
    }
    /**
     * E-28: 创建紧急介入请求
     */
    async createEmergencyIntervention(data) {
        const result = await database_1.pool.query(`INSERT INTO emergency_interventions
       (id, task_id, initiated_by, initiator_role, reason, reason_detail)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            data.task_id,
            data.initiated_by,
            data.initiator_role,
            data.reason,
            data.reason_detail,
        ]);
        return result.rows[0];
    }
    /**
     * 管理员响应介入请求
     */
    async respondToIntervention(interventionId, adminId, response) {
        const result = await database_1.pool.query(`UPDATE emergency_interventions
       SET status = 'in_progress',
           admin_assigned = $1,
           admin_response = $2,
           responded_at = NOW(),
           response_time_hours = EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
       WHERE id = $3
       RETURNING *`, [adminId, response, interventionId]);
        if (result.rows.length === 0) {
            throw new Error('介入请求不存在');
        }
        return result.rows[0];
    }
    /**
     * 解决介入请求
     */
    async resolveIntervention(interventionId, resolution, resolutionActions) {
        const result = await database_1.pool.query(`UPDATE emergency_interventions
       SET status = 'resolved',
           resolution = $1,
           resolution_actions = $2,
           resolved_at = NOW()
       WHERE id = $3
       RETURNING *`, [resolution, JSON.stringify(resolutionActions || {}), interventionId]);
        if (result.rows.length === 0) {
            throw new Error('介入请求不存在');
        }
        return result.rows[0];
    }
    /**
     * 获取介入请求列表
     */
    async getInterventions(filters) {
        let query = `
      SELECT ei.*,
             t.title as task_title,
             u1.username as initiator_name,
             u2.username as admin_name
      FROM emergency_interventions ei
      JOIN tasks t ON ei.task_id = t.id
      JOIN users u1 ON ei.initiated_by = u1.id
      LEFT JOIN users u2 ON ei.admin_assigned = u2.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (filters.task_id) {
            query += ` AND ei.task_id = $${paramIndex++}`;
            params.push(filters.task_id);
        }
        if (filters.status) {
            query += ` AND ei.status = $${paramIndex++}`;
            params.push(filters.status);
        }
        if (filters.admin_id) {
            query += ` AND ei.admin_assigned = $${paramIndex++}`;
            params.push(filters.admin_id);
        }
        query += ` ORDER BY ei.created_at DESC`;
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
}
exports.default = new TaskTrackingService();
//# sourceMappingURL=taskTrackingService.js.map