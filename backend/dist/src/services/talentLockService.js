"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-10: 人才优先锁定服务
 * 企业可以锁定优秀学生，获得优先匹配权或独家合作权
 */
class TalentLockService {
    /**
     * 创建锁定申请
     */
    async createLockApplication(data) {
        const { company_id, student_id, lock_type, duration_months, monthly_fee, benefits, application_reason, } = data;
        // 检查是否已有活跃锁定
        const existingLock = await database_1.pool.query(`SELECT id FROM talent_locks
       WHERE company_id = $1 AND student_id = $2 AND lock_type = $3 AND status = 'active'`, [company_id, student_id, lock_type]);
        if (existingLock.rows.length > 0) {
            throw new Error('该学生已被锁定');
        }
        // 检查是否有待处理申请
        const existingApplication = await database_1.pool.query(`SELECT id FROM talent_lock_applications
       WHERE company_id = $1 AND student_id = $2 AND student_status = 'pending'`, [company_id, student_id]);
        if (existingApplication.rows.length > 0) {
            throw new Error('已有待处理的锁定申请');
        }
        const result = await database_1.pool.query(`INSERT INTO talent_lock_applications
       (id, company_id, student_id, lock_type, duration_months, monthly_fee, benefits, application_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            company_id,
            student_id,
            lock_type,
            duration_months,
            monthly_fee,
            JSON.stringify(benefits || {}),
            application_reason,
        ]);
        return result.rows[0];
    }
    /**
     * 学生响应锁定申请
     */
    async respondToApplication(applicationId, studentId, status, response) {
        // 验证申请归属
        const application = await database_1.pool.query(`SELECT * FROM talent_lock_applications WHERE id = $1 AND student_id = $2`, [applicationId, studentId]);
        if (application.rows.length === 0) {
            throw new Error('申请不存在');
        }
        if (application.rows[0].student_status !== 'pending') {
            throw new Error('申请已处理');
        }
        // 更新申请状态
        const result = await database_1.pool.query(`UPDATE talent_lock_applications
       SET student_status = $1, student_response = $2, student_responded_at = NOW(), updated_at = NOW()
       WHERE id = $3
       RETURNING *`, [status, response, applicationId]);
        // 如果接受，创建锁定记录
        if (status === 'accepted') {
            const app = result.rows[0];
            await this.createTalentLock({
                company_id: app.company_id,
                student_id: app.student_id,
                lock_type: app.lock_type,
                duration_months: app.duration_months,
                monthly_fee: app.monthly_fee,
                benefits: app.benefits,
            });
        }
        return result.rows[0];
    }
    /**
     * 创建人才锁定
     */
    async createTalentLock(data) {
        const { company_id, student_id, lock_type, duration_months, monthly_fee, benefits, notes } = data;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + duration_months);
        const totalFee = monthly_fee * duration_months;
        const result = await database_1.pool.query(`INSERT INTO talent_locks
       (id, company_id, student_id, lock_type, duration_months, start_date, end_date,
        monthly_fee, total_fee, benefits, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            company_id,
            student_id,
            lock_type,
            duration_months,
            startDate,
            endDate,
            monthly_fee,
            totalFee,
            JSON.stringify(benefits || {}),
            notes,
        ]);
        // 记录历史
        await this.addLockHistory(result.rows[0].id, 'created', company_id);
        return result.rows[0];
    }
    /**
     * 获取企业的锁定列表
     */
    async getCompanyLocks(companyId, status) {
        let query = `
      SELECT tl.*,
             u.username as student_name,
             u.avatar as student_avatar,
             u.student_level,
             u.bio
      FROM talent_locks tl
      JOIN users u ON tl.student_id = u.id
      WHERE tl.company_id = $1
    `;
        const params = [companyId];
        if (status) {
            query += ` AND tl.status = $2`;
            params.push(status);
        }
        query += ` ORDER BY tl.created_at DESC`;
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    /**
     * 获取学生的锁定列表
     */
    async getStudentLocks(studentId, status) {
        let query = `
      SELECT tl.*,
             u.company_name,
             u.avatar as company_avatar,
             u.industry
      FROM talent_locks tl
      JOIN users u ON tl.company_id = u.id
      WHERE tl.student_id = $1
    `;
        const params = [studentId];
        if (status) {
            query += ` AND tl.status = $2`;
            params.push(status);
        }
        query += ` ORDER BY tl.created_at DESC`;
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    /**
     * 获取锁定详情
     */
    async getLockById(lockId) {
        const result = await database_1.pool.query(`SELECT tl.*,
              s.username as student_name,
              s.avatar as student_avatar,
              s.student_level,
              c.company_name,
              c.avatar as company_avatar
       FROM talent_locks tl
       JOIN users s ON tl.student_id = s.id
       JOIN users c ON tl.company_id = c.id
       WHERE tl.id = $1`, [lockId]);
        if (result.rows.length === 0) {
            throw new Error('锁定不存在');
        }
        // 获取历史记录
        const history = await database_1.pool.query(`SELECT * FROM talent_lock_history WHERE lock_id = $1 ORDER BY created_at DESC`, [lockId]);
        const lock = result.rows[0];
        lock.history = history.rows;
        return lock;
    }
    /**
     * 更新锁定状态
     */
    async updateLockStatus(lockId, status, actionBy, reason) {
        const result = await database_1.pool.query(`UPDATE talent_locks
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`, [status, lockId]);
        if (result.rows.length === 0) {
            throw new Error('锁定不存在');
        }
        // 记录历史
        await this.addLockHistory(lockId, status, actionBy, reason);
        return result.rows[0];
    }
    /**
     * 取消锁定
     */
    async cancelLock(lockId, cancelledBy, reason) {
        await database_1.pool.query(`UPDATE talent_locks
       SET status = 'cancelled', cancelled_reason = $1, cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $2`, [reason, lockId]);
        await this.addLockHistory(lockId, 'cancelled', cancelledBy, reason);
    }
    /**
     * 续约锁定
     */
    async renewLock(lockId, additionalMonths) {
        const lock = await database_1.pool.query(`SELECT * FROM talent_locks WHERE id = $1`, [lockId]);
        if (lock.rows.length === 0) {
            throw new Error('锁定不存在');
        }
        const currentLock = lock.rows[0];
        const newEndDate = new Date(currentLock.end_date);
        newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);
        const additionalFee = currentLock.monthly_fee * additionalMonths;
        const result = await database_1.pool.query(`UPDATE talent_locks
       SET end_date = $1,
           total_fee = total_fee + $2,
           renewal_count = renewal_count + 1,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`, [newEndDate, additionalFee, lockId]);
        await this.addLockHistory(lockId, 'renewed', currentLock.company_id);
        return result.rows[0];
    }
    /**
     * 添加历史记录
     */
    async addLockHistory(lockId, action, actionBy, actionReason) {
        await database_1.pool.query(`INSERT INTO talent_lock_history (id, lock_id, action, action_by, action_reason)
       VALUES ($1, $2, $3, $4, $5)`, [(0, uuid_1.v4)(), lockId, action, actionBy, actionReason]);
    }
    /**
     * 获取价格配置
     */
    async getPricing(lockType, studentLevel) {
        const result = await database_1.pool.query(`SELECT * FROM talent_lock_pricing
       WHERE lock_type = $1
         AND student_level_min <= $2
         AND student_level_max >= $2
         AND is_active = true
       LIMIT 1`, [lockType, studentLevel]);
        if (result.rows.length === 0) {
            throw new Error('未找到价格配置');
        }
        return result.rows[0];
    }
    /**
     * 计算锁定费用
     */
    async calculateLockFee(lockType, studentLevel, durationMonths) {
        const pricing = await this.getPricing(lockType, studentLevel);
        const monthlyFee = parseFloat(pricing.base_monthly_fee);
        let discount = 1.0;
        // 应用时长折扣
        const durationDiscount = pricing.duration_discount || {};
        if (durationDiscount[durationMonths.toString()]) {
            discount = parseFloat(durationDiscount[durationMonths.toString()]);
        }
        const totalFee = monthlyFee * durationMonths * discount;
        return {
            monthly_fee: monthlyFee,
            total_fee: totalFee,
            discount: 1 - discount,
        };
    }
    /**
     * 获取锁定申请列表
     */
    async getApplications(userId, userRole) {
        let query = `
      SELECT tla.*,
             s.username as student_name,
             s.avatar as student_avatar,
             s.student_level,
             c.company_name,
             c.avatar as company_avatar
      FROM talent_lock_applications tla
      JOIN users s ON tla.student_id = s.id
      JOIN users c ON tla.company_id = c.id
      WHERE 1=1
    `;
        if (userRole === 'company') {
            query += ` AND tla.company_id = $1`;
        }
        else if (userRole === 'student') {
            query += ` AND tla.student_id = $1`;
        }
        query += ` ORDER BY tla.created_at DESC`;
        const result = await database_1.pool.query(query, [userId]);
        return result.rows;
    }
    /**
     * 检查学生是否被锁定
     */
    async isStudentLocked(studentId, companyId) {
        let query = `
      SELECT * FROM talent_locks
      WHERE student_id = $1 AND status = 'active'
    `;
        const params = [studentId];
        if (companyId) {
            query += ` AND company_id = $2`;
            params.push(companyId);
        }
        const result = await database_1.pool.query(query, params);
        if (result.rows.length === 0) {
            return { is_locked: false };
        }
        const lock = result.rows[0];
        return {
            is_locked: true,
            lock_type: lock.lock_type,
            company_id: lock.company_id,
            end_date: lock.end_date,
        };
    }
    /**
     * 获取锁定统计
     */
    async getLockStats(companyId) {
        const result = await database_1.pool.query(`SELECT
         COUNT(*) as total_locks,
         COUNT(*) FILTER (WHERE status = 'active') as active_locks,
         COUNT(*) FILTER (WHERE lock_type = 'priority') as priority_locks,
         COUNT(*) FILTER (WHERE lock_type = 'exclusive') as exclusive_locks,
         SUM(total_fee) as total_invested,
         SUM(tasks_completed) as total_tasks,
         AVG(tasks_completed::float / NULLIF(tasks_assigned, 0)) as completion_rate
       FROM talent_locks
       WHERE company_id = $1`, [companyId]);
        return {
            ...result.rows[0],
            total_locks: parseInt(result.rows[0].total_locks, 10),
            active_locks: parseInt(result.rows[0].active_locks, 10),
            priority_locks: parseInt(result.rows[0].priority_locks, 10),
            exclusive_locks: parseInt(result.rows[0].exclusive_locks, 10),
            total_invested: parseFloat(result.rows[0].total_invested || '0'),
            total_tasks: parseInt(result.rows[0].total_tasks, 10),
            completion_rate: parseFloat(result.rows[0].completion_rate || '0'),
        };
    }
    /**
     * 检查并更新过期锁定
     */
    async checkExpiredLocks() {
        await database_1.pool.query(`SELECT check_expired_talent_locks()`);
    }
}
exports.default = new TalentLockService();
//# sourceMappingURL=talentLockService.js.map