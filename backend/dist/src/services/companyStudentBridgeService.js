"use strict";
/**
 * Phase 3.3: 企业-学生端打通服务
 * 让企业看到学生的成长，学生获得来自企业的认可
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
class CompanyStudentBridgeService {
    /**
     * 记录学生成长里程碑
     */
    async recordMilestone(params) {
        const client = await database_1.pool.connect();
        try {
            const milestoneId = `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await client.query(`
        INSERT INTO student_growth_milestones (
          id, student_id, milestone_type, milestone_name,
          milestone_description, achieved_value, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
                milestoneId,
                params.studentId,
                params.milestoneType,
                params.milestoneName,
                params.milestoneDescription,
                params.achievedValue,
                params.metadata ? JSON.stringify(params.metadata) : null
            ]);
            logger_1.default.info('[CompanyStudentBridge] 记录成长里程碑', {
                milestoneId,
                studentId: params.studentId,
                type: params.milestoneType
            });
            // 触发通知给关注的企业
            await this.notifySubscribedCompanies(milestoneId, params.studentId, params.milestoneType);
            return milestoneId;
        }
        finally {
            client.release();
        }
    }
    /**
     * 通知订阅的企业
     */
    async notifySubscribedCompanies(milestoneId, studentId, milestoneType) {
        const client = await database_1.pool.connect();
        try {
            // 获取里程碑详情
            const milestoneResult = await client.query(`
        SELECT milestone_name, milestone_description, achieved_value, metadata
        FROM student_growth_milestones
        WHERE id = $1
      `, [milestoneId]);
            if (milestoneResult.rows.length === 0)
                return;
            const milestone = milestoneResult.rows[0];
            // 获取学生信息
            const studentResult = await client.query(`
        SELECT name FROM users WHERE user_id = $1
      `, [studentId]);
            const studentName = studentResult.rows[0]?.name || '某学生';
            // 查找订阅了该学生的企业
            const subscriptions = await client.query(`
        SELECT company_id, notification_preferences
        FROM company_student_subscriptions
        WHERE student_id = $1
      `, [studentId]);
            let notifiedCount = 0;
            for (const sub of subscriptions.rows) {
                const prefs = sub.notification_preferences || {};
                // 检查该企业是否订阅了此类通知
                const notificationKey = milestoneType;
                if (prefs[notificationKey] === false) {
                    continue; // 该企业不想收到此类通知
                }
                // 生成通知内容
                const { title, content } = this.generateNotificationContent(studentName, milestoneType, milestone);
                // 创建通知
                await client.query(`
          INSERT INTO student_growth_notifications (
            student_id, company_id, notification_type,
            title, content, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                    studentId,
                    sub.company_id,
                    milestoneType,
                    title,
                    content,
                    JSON.stringify(milestone.metadata || {})
                ]);
                notifiedCount++;
            }
            // 更新里程碑的通知计数
            await client.query(`
        UPDATE student_growth_milestones
        SET notified_companies = $1
        WHERE id = $2
      `, [notifiedCount, milestoneId]);
            logger_1.default.info('[CompanyStudentBridge] 通知企业完成', {
                milestoneId,
                notifiedCount
            });
        }
        finally {
            client.release();
        }
    }
    /**
     * 生成通知内容
     */
    generateNotificationContent(studentName, milestoneType, milestone) {
        const typeMap = {
            level_up: {
                title: `${studentName}升级了`,
                content: `${studentName}达到了${milestone.milestone_name}，继续保持关注！`
            },
            skill_breakthrough: {
                title: `${studentName}掌握了新技能`,
                content: `${studentName}在${milestone.milestone_name}上取得突破，${milestone.milestone_description || ''}`
            },
            achievement_unlock: {
                title: `${studentName}解锁成就`,
                content: `${studentName}解锁了"${milestone.milestone_name}"成就`
            },
            project_completed: {
                title: `${studentName}完成了新项目`,
                content: `${studentName}完成了第${milestone.achieved_value}个项目`
            }
        };
        return typeMap[milestoneType] || {
            title: `${studentName}的成长动态`,
            content: milestone.milestone_description || ''
        };
    }
    /**
     * 企业订阅学生成长
     */
    async subscribeToStudent(params) {
        const client = await database_1.pool.connect();
        try {
            await client.query(`
        INSERT INTO company_student_subscriptions (
          company_id, student_id, subscription_type, notification_preferences
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id, student_id)
        DO UPDATE SET
          subscription_type = EXCLUDED.subscription_type,
          notification_preferences = EXCLUDED.notification_preferences
      `, [
                params.companyId,
                params.studentId,
                params.subscriptionType || 'normal',
                JSON.stringify(params.notificationPreferences || {
                    level_up: true,
                    skill_breakthrough: true,
                    achievement_unlock: true,
                    project_completed: true
                })
            ]);
            logger_1.default.info('[CompanyStudentBridge] 企业订阅学生', {
                companyId: params.companyId,
                studentId: params.studentId
            });
            return true;
        }
        finally {
            client.release();
        }
    }
    /**
     * 企业添加学生声誉标签
     */
    async addReputationTag(params) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`
        INSERT INTO company_student_reputation_tags (
          company_id, student_id, tag_type, tag_name, tag_description,
          evidence, source_task_id, confidence_score, is_visible_to_student, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
                params.companyId,
                params.studentId,
                params.tagType,
                params.tagName,
                params.tagDescription,
                params.evidence,
                params.sourceTaskId,
                params.confidenceScore,
                params.isVisibleToStudent !== false, // 默认可见
                params.createdBy
            ]);
            const tagId = result.rows[0].id;
            logger_1.default.info('[CompanyStudentBridge] 添加声誉标签', {
                tagId,
                companyId: params.companyId,
                studentId: params.studentId,
                tagType: params.tagType
            });
            return tagId;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取学生的声誉标签（学生视角）
     */
    async getStudentReputationTags(studentId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`
        SELECT
          id, company_id, student_id, tag_type, tag_name,
          tag_description, evidence, source_task_id,
          confidence_score, is_visible_to_student, created_at
        FROM company_student_reputation_tags
        WHERE student_id = $1
          AND is_visible_to_student = true
        ORDER BY created_at DESC
      `, [studentId]);
            return result.rows.map(row => ({
                id: row.id,
                companyId: row.company_id,
                studentId: row.student_id,
                tagType: row.tag_type,
                tagName: row.tag_name,
                tagDescription: row.tag_description,
                evidence: row.evidence,
                sourceTaskId: row.source_task_id,
                confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
                isVisibleToStudent: row.is_visible_to_student,
                createdAt: row.created_at
            }));
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取企业的成长通知
     */
    async getCompanyNotifications(params) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'company_id = $1';
            const queryParams = [params.companyId];
            let paramIndex = 2;
            if (params.unreadOnly) {
                whereClause += ' AND is_read = false';
            }
            // 获取总数
            const countResult = await client.query(`SELECT COUNT(*) FROM student_growth_notifications WHERE ${whereClause}`, queryParams);
            const total = parseInt(countResult.rows[0].count);
            // 获取通知列表
            const limit = params.limit || 20;
            const offset = params.offset || 0;
            const result = await client.query(`
        SELECT
          n.id, n.student_id, u.name as student_name,
          n.company_id, n.notification_type, n.title, n.content,
          n.metadata, n.is_read, n.created_at
        FROM student_growth_notifications n
        LEFT JOIN users u ON n.student_id = u.user_id
        WHERE ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, limit, offset]);
            const notifications = result.rows.map(row => ({
                id: row.id,
                studentId: row.student_id,
                studentName: row.student_name,
                companyId: row.company_id,
                notificationType: row.notification_type,
                title: row.title,
                content: row.content,
                metadata: row.metadata,
                isRead: row.is_read,
                createdAt: row.created_at
            }));
            return { notifications, total };
        }
        finally {
            client.release();
        }
    }
    /**
     * 标记通知为已读
     */
    async markNotificationAsRead(notificationId, companyId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`
        UPDATE student_growth_notifications
        SET is_read = true, read_at = NOW()
        WHERE id = $1 AND company_id = $2
        RETURNING id
      `, [notificationId, companyId]);
            return result.rows.length > 0;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取学生的成长里程碑
     */
    async getStudentMilestones(params) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'student_id = $1';
            const queryParams = [params.studentId];
            let paramIndex = 2;
            if (params.milestoneType) {
                whereClause += ` AND milestone_type = $${paramIndex}`;
                queryParams.push(params.milestoneType);
                paramIndex++;
            }
            const limit = params.limit || 20;
            const result = await client.query(`
        SELECT
          id, student_id, milestone_type, milestone_name,
          milestone_description, achieved_value, metadata, achieved_at
        FROM student_growth_milestones
        WHERE ${whereClause}
        ORDER BY achieved_at DESC
        LIMIT $${paramIndex}
      `, [...queryParams, limit]);
            return result.rows.map(row => ({
                id: row.id,
                studentId: row.student_id,
                milestoneType: row.milestone_type,
                milestoneName: row.milestone_name,
                milestoneDescription: row.milestone_description,
                achievedValue: row.achieved_value,
                metadata: row.metadata,
                achievedAt: row.achieved_at
            }));
        }
        finally {
            client.release();
        }
    }
}
exports.default = new CompanyStudentBridgeService();
//# sourceMappingURL=companyStudentBridgeService.js.map