"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-29, E-30, E-31, E-32, E-33, E-34: 验收系统服务
 */
class AcceptanceService {
    /**
     * E-29: 创建验收清单
     */
    async createChecklist(taskId, items) {
        const checklistItems = items.map((item, index) => ({
            id: index + 1,
            item: item.item,
            status: 'pending',
            checked_by: null,
            checked_at: null,
        }));
        const result = await database_1.pool.query(`INSERT INTO acceptance_checklists (id, task_id, checklist_items, total_items)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [(0, uuid_1.v4)(), taskId, JSON.stringify(checklistItems), items.length]);
        return result.rows[0];
    }
    /**
     * 更新清单项状态
     */
    async updateChecklistItem(checklistId, itemId, status, checkedBy) {
        // 获取当前清单
        const checklistResult = await database_1.pool.query(`SELECT * FROM acceptance_checklists WHERE id = $1`, [checklistId]);
        if (checklistResult.rows.length === 0) {
            throw new Error('验收清单不存在');
        }
        const checklist = checklistResult.rows[0];
        const items = JSON.parse(JSON.stringify(checklist.checklist_items));
        // 更新对应项
        const item = items.find((i) => i.id === itemId);
        if (!item) {
            throw new Error('清单项不存在');
        }
        item.status = status;
        item.checked_by = checkedBy;
        item.checked_at = new Date().toISOString();
        // 统计
        const checkedItems = items.filter((i) => i.status !== 'pending').length;
        const approvedItems = items.filter((i) => i.status === 'approved').length;
        const rejectedItems = items.filter((i) => i.status === 'rejected').length;
        const overallStatus = checkedItems === items.length
            ? rejectedItems === 0
                ? 'completed'
                : 'partial'
            : 'in_progress';
        // 更新清单
        const result = await database_1.pool.query(`UPDATE acceptance_checklists
       SET checklist_items = $1,
           checked_items = $2,
           approved_items = $3,
           rejected_items = $4,
           overall_status = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`, [JSON.stringify(items), checkedItems, approvedItems, rejectedItems, overallStatus, checklistId]);
        return result.rows[0];
    }
    /**
     * 获取验收清单
     */
    async getChecklist(taskId) {
        const result = await database_1.pool.query(`SELECT * FROM acceptance_checklists WHERE task_id = $1`, [taskId]);
        return result.rows[0] || null;
    }
    /**
     * E-30: 获取修改意见模板列表
     */
    async getRevisionTemplates(category) {
        let query = `SELECT * FROM revision_comment_templates WHERE is_active = true`;
        const params = [];
        if (category) {
            query += ` AND category = $1`;
            params.push(category);
        }
        query += ` ORDER BY usage_count DESC, created_at DESC`;
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    /**
     * 使用模板生成修改意见
     */
    async applyRevisionTemplate(templateId, placeholderValues) {
        // 获取模板
        const templateResult = await database_1.pool.query(`SELECT * FROM revision_comment_templates WHERE id = $1`, [templateId]);
        if (templateResult.rows.length === 0) {
            throw new Error('模板不存在');
        }
        const template = templateResult.rows[0];
        let content = template.template_content;
        // 替换占位符
        Object.entries(placeholderValues).forEach(([key, value]) => {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        // 更新使用次数
        await database_1.pool.query(`UPDATE revision_comment_templates SET usage_count = usage_count + 1 WHERE id = $1`, [templateId]);
        return content;
    }
    /**
     * E-31: 创建维度化验收评分
     */
    async createDimensionalScore(data) {
        const result = await database_1.pool.query(`INSERT INTO dimensional_acceptance_scores
       (id, task_id, company_id, student_id, quality_score, completeness_score,
        timeliness_score, communication_score, professionalism_score,
        quality_comment, completeness_comment, timeliness_comment,
        communication_comment, professionalism_comment, overall_comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            data.task_id,
            data.company_id,
            data.student_id,
            data.quality_score,
            data.completeness_score,
            data.timeliness_score,
            data.communication_score,
            data.professionalism_score,
            data.quality_comment,
            data.completeness_comment,
            data.timeliness_comment,
            data.communication_comment,
            data.professionalism_comment,
            data.overall_comment,
        ]);
        return result.rows[0];
    }
    /**
     * 获取维度评分
     */
    async getDimensionalScore(taskId) {
        const result = await database_1.pool.query(`SELECT * FROM dimensional_acceptance_scores WHERE task_id = $1`, [taskId]);
        return result.rows[0] || null;
    }
    /**
     * 获取学生的评分统计
     */
    async getStudentScoreStats(studentId) {
        const result = await database_1.pool.query(`SELECT
         COUNT(*) as total_scores,
         AVG(quality_score) as avg_quality,
         AVG(completeness_score) as avg_completeness,
         AVG(timeliness_score) as avg_timeliness,
         AVG(communication_score) as avg_communication,
         AVG(professionalism_score) as avg_professionalism,
         AVG(overall_score) as avg_overall
       FROM dimensional_acceptance_scores
       WHERE student_id = $1`, [studentId]);
        return result.rows[0];
    }
    /**
     * E-32: 记录合作意愿
     */
    async recordCooperationWillingness(data) {
        const { task_id, company_id, student_id, role, willing, reason, tags } = data;
        if (role === 'company') {
            const result = await database_1.pool.query(`INSERT INTO cooperation_willingness
         (id, task_id, company_id, student_id, company_willing, company_reason, company_tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (task_id, company_id, student_id)
         DO UPDATE SET
           company_willing = EXCLUDED.company_willing,
           company_reason = EXCLUDED.company_reason,
           company_tags = EXCLUDED.company_tags
         RETURNING *`, [(0, uuid_1.v4)(), task_id, company_id, student_id, willing, reason, tags || []]);
            return result.rows[0];
        }
        else {
            const result = await database_1.pool.query(`INSERT INTO cooperation_willingness
         (id, task_id, company_id, student_id, student_willing, student_reason, student_tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (task_id, company_id, student_id)
         DO UPDATE SET
           student_willing = EXCLUDED.student_willing,
           student_reason = EXCLUDED.student_reason,
           student_tags = EXCLUDED.student_tags
         RETURNING *`, [(0, uuid_1.v4)(), task_id, company_id, student_id, willing, reason, tags || []]);
            return result.rows[0];
        }
    }
    /**
     * 获取合作意愿记录
     */
    async getCooperationWillingness(taskId) {
        const result = await database_1.pool.query(`SELECT * FROM cooperation_willingness WHERE task_id = $1`, [taskId]);
        return result.rows[0] || null;
    }
    /**
     * 获取双向愿意合作的记录
     */
    async getMutualCooperationPairs(userId, role) {
        const column = role === 'company' ? 'company_id' : 'student_id';
        const result = await database_1.pool.query(`SELECT cw.*,
              t.title as task_title,
              u.username as partner_name,
              u.avatar as partner_avatar
       FROM cooperation_willingness cw
       JOIN tasks t ON cw.task_id = t.id
       JOIN users u ON ${role === 'company' ? 'cw.student_id' : 'cw.company_id'} = u.id
       WHERE cw.${column} = $1 AND cw.is_mutual = true
       ORDER BY cw.created_at DESC`, [userId]);
        return result.rows;
    }
    /**
     * E-33: 创建知识产权声明
     */
    async createIPDeclaration(data) {
        const result = await database_1.pool.query(`INSERT INTO intellectual_property_declarations
       (id, task_id, declaration_type, declaration_text, rights_scope, restrictions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            data.task_id,
            data.declaration_type,
            data.declaration_text,
            JSON.stringify(data.rights_scope),
            data.restrictions || [],
        ]);
        return result.rows[0];
    }
    /**
     * 确认知识产权声明
     */
    async confirmIPDeclaration(declarationId, role) {
        const field = role === 'company' ? 'company_confirmed' : 'student_confirmed';
        const timestampField = role === 'company' ? 'company_confirmed_at' : 'student_confirmed_at';
        const result = await database_1.pool.query(`UPDATE intellectual_property_declarations
       SET ${field} = true,
           ${timestampField} = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`, [declarationId]);
        if (result.rows.length === 0) {
            throw new Error('知识产权声明不存在');
        }
        return result.rows[0];
    }
    /**
     * 获取知识产权声明
     */
    async getIPDeclaration(taskId) {
        const result = await database_1.pool.query(`SELECT * FROM intellectual_property_declarations WHERE task_id = $1`, [taskId]);
        return result.rows[0] || null;
    }
    /**
     * E-34: 创建退款/补偿申请
     */
    async createRefundRequest(data) {
        const result = await database_1.pool.query(`INSERT INTO refund_compensation_records
       (id, task_id, applicant_id, applicant_role, record_type, reason,
        reason_detail, requested_amount, evidence_files)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            data.task_id,
            data.applicant_id,
            data.applicant_role,
            data.record_type,
            data.reason,
            data.reason_detail,
            data.requested_amount,
            JSON.stringify(data.evidence_files || []),
        ]);
        return result.rows[0];
    }
    /**
     * 审核退款申请
     */
    async reviewRefundRequest(requestId, reviewedBy, approved, approvedAmount, reviewComment) {
        const status = approved ? 'approved' : 'rejected';
        const result = await database_1.pool.query(`UPDATE refund_compensation_records
       SET status = $1,
           reviewed_by = $2,
           approved_amount = $3,
           review_comment = $4,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`, [status, reviewedBy, approvedAmount, reviewComment, requestId]);
        if (result.rows.length === 0) {
            throw new Error('退款申请不存在');
        }
        return result.rows[0];
    }
    /**
     * 处理退款
     */
    async processRefund(requestId, transactionId) {
        const result = await database_1.pool.query(`UPDATE refund_compensation_records
       SET status = 'processed',
           processed_at = NOW(),
           transaction_id = $1,
           updated_at = NOW()
       WHERE id = $2 AND status = 'approved'
       RETURNING *`, [transactionId, requestId]);
        if (result.rows.length === 0) {
            throw new Error('退款申请不存在或状态不正确');
        }
        return result.rows[0];
    }
    /**
     * 获取退款申请列表
     */
    async getRefundRequests(filters) {
        let query = `
      SELECT rcr.*,
             t.title as task_title,
             u.username as applicant_name
      FROM refund_compensation_records rcr
      JOIN tasks t ON rcr.task_id = t.id
      JOIN users u ON rcr.applicant_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (filters.applicant_id) {
            query += ` AND rcr.applicant_id = $${paramIndex++}`;
            params.push(filters.applicant_id);
        }
        if (filters.status) {
            query += ` AND rcr.status = $${paramIndex++}`;
            params.push(filters.status);
        }
        if (filters.task_id) {
            query += ` AND rcr.task_id = $${paramIndex++}`;
            params.push(filters.task_id);
        }
        query += ` ORDER BY rcr.created_at DESC`;
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
}
exports.default = new AcceptanceService();
//# sourceMappingURL=acceptanceService.js.map