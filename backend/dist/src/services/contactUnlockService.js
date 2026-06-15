"use strict";
/**
 * 联系方式解锁服务
 *
 * 功能：
 * 1. 申请解锁联系方式
 * 2. 同意/拒绝解锁申请
 * 3. 查看已解锁的联系方式
 * 4. 检查解锁状态
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
const dataAccessLogService_1 = __importDefault(require("./dataAccessLogService"));
class ContactUnlockService {
    /**
     * 申请解锁联系方式
     */
    async requestUnlock(params) {
        const { studentId, companyId, taskId, requestedBy } = params;
        // 1. 检查是否满足解锁条件（完成2单）
        const canUnlock = await this.canUnlock(studentId, companyId);
        if (!canUnlock.eligible) {
            throw new Error(`还需完成 ${2 - canUnlock.completedCount} 单才能解锁联系方式`);
        }
        // 2. 检查是否已有解锁请求
        const existingRequest = await db_1.default.query(`SELECT * FROM contact_exchange_requests
       WHERE student_id = $1 AND company_id = $2`, [studentId, companyId]);
        let result;
        if (existingRequest.length > 0) {
            // 更新现有请求
            const existing = existingRequest.filter(Boolean)[0];
            if (existing.exchanged) {
                throw new Error('联系方式已解锁');
            }
            const updateField = requestedBy === 'student' ? 'student_agreed' : 'company_agreed';
            const updateTimeField = requestedBy === 'student' ? 'student_agreed_at' : 'company_agreed_at';
            result = await db_1.default.query(`UPDATE contact_exchange_requests
         SET ${updateField} = true,
             ${updateTimeField} = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`, [existing.id]);
        }
        else {
            // 创建新请求
            const studentAgreed = requestedBy === 'student';
            const companyAgreed = requestedBy === 'company';
            result = await db_1.default.query(`INSERT INTO contact_exchange_requests (
          student_id, company_id, task_id,
          student_agreed, company_agreed,
          student_agreed_at, company_agreed_at,
          collaboration_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`, [
                studentId,
                companyId,
                taskId,
                studentAgreed,
                companyAgreed,
                studentAgreed ? new Date() : null,
                companyAgreed ? new Date() : null,
                canUnlock.completedCount
            ]);
        }
        const request = result[0];
        // 3. 检查是否双方都同意，如果是则自动解锁
        if (request.student_agreed && request.company_agreed && !request.exchanged) {
            await this.executeUnlock(request.id);
            request.exchanged = true;
            request.exchanged_at = new Date();
        }
        return this.formatUnlockResponse(request, canUnlock);
    }
    /**
     * 同意解锁申请
     */
    async approveUnlock(studentId, companyId, approvedBy) {
        // 检查是否有待处理的请求
        const result = await db_1.default.query(`SELECT * FROM contact_exchange_requests
       WHERE student_id = $1 AND company_id = $2`, [studentId, companyId]);
        if (result.length === 0) {
            throw new Error('未找到解锁申请');
        }
        const request = result[0];
        if (request.exchanged) {
            throw new Error('联系方式已解锁');
        }
        // 更新同意状态
        const updateField = approvedBy === 'student' ? 'student_agreed' : 'company_agreed';
        const updateTimeField = approvedBy === 'student' ? 'student_agreed_at' : 'company_agreed_at';
        const updated = await db_1.default.query(`UPDATE contact_exchange_requests
       SET ${updateField} = true,
           ${updateTimeField} = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`, [request.id]);
        const updatedRequest = updated.filter(Boolean)[0];
        // 如果双方都同意，执行解锁
        if (updatedRequest.student_agreed && updatedRequest.company_agreed) {
            await this.executeUnlock(updatedRequest.id);
            updatedRequest.exchanged = true;
            updatedRequest.exchanged_at = new Date();
        }
        const canUnlock = await this.canUnlock(studentId, companyId);
        return this.formatUnlockResponse(updatedRequest, canUnlock);
    }
    /**
     * 拒绝解锁申请
     */
    async rejectUnlock(studentId, companyId, rejectedBy) {
        // 删除解锁请求
        await db_1.default.query(`DELETE FROM contact_exchange_requests
       WHERE student_id = $1 AND company_id = $2 AND exchanged = false`, [studentId, companyId]);
    }
    /**
     * 执行解锁（双方都同意后）
     */
    async executeUnlock(requestId) {
        await db_1.default.query(`UPDATE contact_exchange_requests
       SET exchanged = true,
           exchanged_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`, [requestId]);
    }
    /**
     * 获取已解锁的联系方式
     */
    async getUnlockedContact(studentId, companyId, requestedBy, requesterId) {
        // 1. 检查是否已解锁
        const unlockStatus = await this.getUnlockStatus(studentId, companyId);
        if (!unlockStatus.exchanged) {
            throw new Error('联系方式未解锁');
        }
        // 2. 获取对方的联系方式
        const targetUserId = requestedBy === 'student' ? companyId : studentId;
        const targetUserType = requestedBy === 'student' ? 'company' : 'student';
        const result = await db_1.default.query(`SELECT phone, wechat, email FROM users WHERE id = $1`, [targetUserId]);
        if (result.length === 0) {
            throw new Error('用户不存在');
        }
        const contact = result[0];
        // 3. 记录访问日志
        await dataAccessLogService_1.default.logAccess({
            userId: requesterId,
            userType: requestedBy,
            resourceType: 'contact_info',
            resourceId: targetUserId,
            action: 'view',
            success: true,
            decryptionPerformed: false
        });
        return {
            phone: contact.phone,
            wechat: contact.wechat,
            email: contact.email
        };
    }
    /**
     * 获取解锁状态
     */
    async getUnlockStatus(studentId, companyId) {
        const result = await db_1.default.query(`SELECT * FROM contact_exchange_requests
       WHERE student_id = $1 AND company_id = $2`, [studentId, companyId]);
        const canUnlock = await this.canUnlock(studentId, companyId);
        if (result.length === 0) {
            return {
                id: '',
                studentId,
                companyId,
                studentAgreed: false,
                companyAgreed: false,
                exchanged: false,
                canUnlock: canUnlock.eligible,
                collaborationCount: canUnlock.completedCount
            };
        }
        return this.formatUnlockResponse(result[0], canUnlock);
    }
    /**
     * 检查是否可以解锁
     */
    async canUnlock(studentId, companyId) {
        const result = await db_1.default.query(`SELECT COUNT(*) as count
       FROM collaboration_history
       WHERE student_id = $1 AND company_id = $2 AND status = 'completed'`, [studentId, companyId]);
        const completedCount = parseInt(result[0].count, 10);
        return {
            eligible: completedCount >= 2,
            completedCount
        };
    }
    /**
     * 获取用户的所有解锁请求
     */
    async getUserUnlockRequests(userId, userType) {
        const field = userType === 'student' ? 'student_id' : 'company_id';
        const result = await db_1.default.query(`SELECT * FROM contact_exchange_requests
       WHERE ${field} = $1
       ORDER BY created_at DESC`, [userId]);
        const requests = await Promise.all(result.map(async (row) => {
            const canUnlock = await this.canUnlock(row.student_id, row.company_id);
            return this.formatUnlockResponse(row, canUnlock);
        }));
        return requests;
    }
    /**
     * 格式化解锁响应
     */
    formatUnlockResponse(request, canUnlock) {
        return {
            id: request.id,
            studentId: request.student_id,
            companyId: request.company_id,
            studentAgreed: request.student_agreed,
            companyAgreed: request.company_agreed,
            exchanged: request.exchanged,
            canUnlock: canUnlock.eligible,
            collaborationCount: canUnlock.completedCount
        };
    }
}
exports.default = new ContactUnlockService();
//# sourceMappingURL=contactUnlockService.js.map