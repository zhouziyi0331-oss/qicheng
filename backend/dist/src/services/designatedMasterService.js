"use strict";
/**
 * 指定大师派单服务
 *
 * 功能：
 * 1. 获取大师列表（带筛选）
 * 2. 发送邀请给大师
 * 3. 处理大师响应（接受/拒绝/协商）
 * 4. 管理协商流程
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
class DesignatedMasterService {
    /**
     * 获取大师列表
     */
    async getMasterList(filter = {}) {
        logger_1.default.info('[指定大师] 获取大师列表', filter);
        const client = await database_1.pool.connect();
        try {
            let query = `
        SELECT
          master_id,
          nickname,
          avatar_url,
          master_min_hourly_rate,
          master_min_order_price,
          master_accept_designated,
          master_allow_negotiation,
          master_specialties,
          master_online,
          master_current_load,
          completed_tasks,
          avg_rating,
          created_at
        FROM master_overview
        WHERE is_master = true
          AND master_accept_designated = true
      `;
            const params = [];
            let paramIndex = 1;
            // 筛选：在线状态
            if (filter.onlineOnly) {
                query += ` AND master_online = true`;
            }
            // 筛选：最低评分
            if (filter.minRating) {
                query += ` AND avg_rating >= $${paramIndex}`;
                params.push(filter.minRating);
                paramIndex++;
            }
            // 筛选：擅长领域（包含任一标签）
            if (filter.specialties && filter.specialties.length > 0) {
                query += ` AND master_specialties && $${paramIndex}`;
                params.push(filter.specialties);
                paramIndex++;
            }
            // 排序：评分降序，完成任务数降序
            query += ` ORDER BY avg_rating DESC NULLS LAST, completed_tasks DESC`;
            // 限制返回数量
            query += ` LIMIT 50`;
            const result = await client.query(query, params);
            const masters = result.rows.map(row => ({
                masterId: row.master_id,
                nickname: row.nickname,
                avatarUrl: row.avatar_url,
                minHourlyRate: parseFloat(row.master_min_hourly_rate) || 0,
                minOrderPrice: parseFloat(row.master_min_order_price) || 0,
                acceptDesignated: row.master_accept_designated,
                allowNegotiation: row.master_allow_negotiation,
                specialties: row.master_specialties || [],
                isOnline: row.master_online,
                currentLoad: row.master_current_load || 0,
                completedTasks: row.completed_tasks || 0,
                avgRating: parseFloat(row.avg_rating) || 0,
                createdAt: row.created_at
            }));
            logger_1.default.info(`[指定大师] 找到 ${masters.length} 位大师`);
            return masters;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取单个大师详情
     */
    async getMasterDetail(masterId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT
          master_id,
          nickname,
          avatar_url,
          master_min_hourly_rate,
          master_min_order_price,
          master_accept_designated,
          master_allow_negotiation,
          master_specialties,
          master_online,
          master_current_load,
          completed_tasks,
          avg_rating,
          created_at
         FROM master_overview
         WHERE master_id = $1`, [masterId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                masterId: row.master_id,
                nickname: row.nickname,
                avatarUrl: row.avatar_url,
                minHourlyRate: parseFloat(row.master_min_hourly_rate) || 0,
                minOrderPrice: parseFloat(row.master_min_order_price) || 0,
                acceptDesignated: row.master_accept_designated,
                allowNegotiation: row.master_allow_negotiation,
                specialties: row.master_specialties || [],
                isOnline: row.master_online,
                currentLoad: row.master_current_load || 0,
                completedTasks: row.completed_tasks || 0,
                avgRating: parseFloat(row.avg_rating) || 0,
                createdAt: row.created_at
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 发送邀请给大师
     */
    async sendInvitation(input) {
        logger_1.default.info('[指定大师] 发送邀请', input);
        const client = await database_1.pool.connect();
        try {
            // 1. 验证大师是否接受指定邀请
            const masterCheck = await client.query(`SELECT master_accept_designated, master_min_order_price
         FROM users
         WHERE id = $1 AND is_master = true`, [input.masterId]);
            if (masterCheck.rows.length === 0) {
                throw new Error('大师不存在或未认证');
            }
            if (!masterCheck.rows[0].master_accept_designated) {
                throw new Error('该大师当前不接受指定邀请');
            }
            const minOrderPrice = parseFloat(masterCheck.rows[0].master_min_order_price) || 0;
            // 2. 验证企业出价是否满足大师最低接单价
            if (input.enterpriseOffer < minOrderPrice) {
                throw new Error(`出价不得低于大师最低接单价 ¥${minOrderPrice}`);
            }
            // 3. 检查是否已有待处理的邀请
            const existingInvitation = await client.query(`SELECT id, status FROM project_invitations
         WHERE task_id = $1 AND master_id = $2
           AND status IN ('pending', 'negotiating')`, [input.taskId, input.masterId]);
            if (existingInvitation.rows.length > 0) {
                throw new Error('已有待处理的邀请，请等待大师响应');
            }
            // 4. 创建邀请记录
            const result = await client.query(`INSERT INTO project_invitations (
          task_id, enterprise_id, master_id,
          enterprise_offer, message, status
        ) VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING id, status, created_at`, [
                input.taskId,
                input.enterpriseId,
                input.masterId,
                input.enterpriseOffer,
                input.message || null
            ]);
            const invitationId = result.rows[0].id;
            logger_1.default.info(`[指定大师] 邀请已发送: invitationId=${invitationId}`);
            // TODO: 发送通知给大师
            return {
                invitationId,
                status: 'pending'
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 大师响应邀请
     */
    async respondToInvitation(invitationId, masterId, action, counterOffer, note) {
        logger_1.default.info('[指定大师] 大师响应邀请', { invitationId, action });
        const client = await database_1.pool.connect();
        try {
            // 1. 验证邀请是否存在且属于该大师
            const invitation = await client.query(`SELECT id, task_id, enterprise_id, master_id, enterprise_offer, status
         FROM project_invitations
         WHERE id = $1 AND master_id = $2`, [invitationId, masterId]);
            if (invitation.rows.length === 0) {
                throw new Error('邀请不存在或无权操作');
            }
            const inv = invitation.rows[0];
            if (inv.status !== 'pending' && inv.status !== 'negotiating') {
                throw new Error(`邀请状态为 ${inv.status}，无法响应`);
            }
            // 2. 根据操作类型更新邀请状态
            let newStatus;
            let updateQuery;
            let updateParams;
            if (action === 'accept') {
                newStatus = 'accepted';
                updateQuery = `
          UPDATE project_invitations
          SET status = 'accepted',
              responded_at = NOW()
          WHERE id = $1
          RETURNING id, status, master_counter_offer, master_note
        `;
                updateParams = [invitationId];
                // 创建订单（任务分配）
                await this.createTaskAssignment(inv.task_id, masterId, inv.enterprise_offer);
            }
            else if (action === 'reject') {
                newStatus = 'rejected';
                updateQuery = `
          UPDATE project_invitations
          SET status = 'rejected',
              master_note = $2,
              responded_at = NOW()
          WHERE id = $1
          RETURNING id, status, master_counter_offer, master_note
        `;
                updateParams = [invitationId, note || '大师拒绝了邀请'];
            }
            else if (action === 'negotiate') {
                if (!counterOffer) {
                    throw new Error('协商时必须提供还价');
                }
                newStatus = 'negotiating';
                updateQuery = `
          UPDATE project_invitations
          SET status = 'negotiating',
              master_counter_offer = $2,
              master_note = $3,
              responded_at = NOW()
          WHERE id = $1
          RETURNING id, status, master_counter_offer, master_note
        `;
                updateParams = [invitationId, counterOffer, note || ''];
            }
            else {
                throw new Error('无效的操作类型');
            }
            const result = await client.query(updateQuery, updateParams);
            const updated = result.rows[0];
            logger_1.default.info(`[指定大师] 邀请已更新: status=${updated.status}`);
            // TODO: 发送通知给企业
            return {
                invitationId: updated.id,
                status: updated.status,
                masterCounterOffer: updated.master_counter_offer ? parseFloat(updated.master_counter_offer) : undefined,
                masterNote: updated.master_note
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 创建任务分配（大师接受邀请后）
     */
    async createTaskAssignment(taskId, masterId, agreedPrice) {
        const client = await database_1.pool.connect();
        try {
            // 创建任务分配记录
            await client.query(`INSERT INTO task_assignments (
          task_id, student_id, status, accepted_at
        ) VALUES ($1, $2, 'in_progress', NOW())`, [taskId, masterId]);
            // 更新任务状态和价格
            await client.query(`UPDATE tasks
         SET status = 'in_progress',
             student_price = $2,
             updated_at = NOW()
         WHERE id = $1`, [taskId, agreedPrice]);
            // 更新大师当前负载
            await client.query(`UPDATE users
         SET master_current_load = master_current_load + 1
         WHERE id = $1`, [masterId]);
            logger_1.default.info(`[指定大师] 任务分配已创建: taskId=${taskId}, masterId=${masterId}`);
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取邀请详情
     */
    async getInvitationDetail(invitationId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT
          pi.*,
          t.title as task_title,
          t.description as task_description,
          u_enterprise.nickname as enterprise_name,
          u_master.nickname as master_name
         FROM project_invitations pi
         JOIN tasks t ON pi.task_id = t.id
         JOIN users u_enterprise ON pi.enterprise_id = u_enterprise.id
         JOIN users u_master ON pi.master_id = u_master.id
         WHERE pi.id = $1`, [invitationId]);
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    /**
     * 自动过期超时的邀请
     */
    async expireOldInvitations() {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`UPDATE project_invitations
         SET status = 'expired'
         WHERE status = 'pending'
           AND expires_at < NOW()
         RETURNING id`);
            const expiredCount = result.rows.length;
            if (expiredCount > 0) {
                logger_1.default.info(`[指定大师] 已过期 ${expiredCount} 个邀请`);
            }
            return expiredCount;
        }
        finally {
            client.release();
        }
    }
}
exports.default = new DesignatedMasterService();
//# sourceMappingURL=designatedMasterService.js.map