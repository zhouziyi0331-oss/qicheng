"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-12: 定向培养计划服务
 * 企业为学生制定定向培养方案，培养所需人才
 */
class CultivationService {
    /**
     * 创建培养计划
     */
    async createPlan(data) {
        const { company_id, student_id, plan_name, description, target_role, duration_months, target_skills, target_level, target_task_count, phases, incentives, total_budget, } = data;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + duration_months);
        const result = await database_1.pool.query(`INSERT INTO cultivation_plans
       (id, company_id, student_id, plan_name, description, target_role,
        duration_months, start_date, end_date, target_skills, target_level,
        target_task_count, phases, incentives, total_budget)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            company_id,
            student_id,
            plan_name,
            description,
            target_role,
            duration_months,
            startDate,
            endDate,
            target_skills,
            target_level,
            target_task_count,
            JSON.stringify(phases),
            JSON.stringify(incentives || {}),
            total_budget,
        ]);
        return result.rows[0];
    }
    /**
     * 学生响应培养计划
     */
    async respondToPlan(planId, studentId, accepted, response) {
        const result = await database_1.pool.query(`UPDATE cultivation_plans
       SET student_accepted = $1, student_response = $2, student_responded_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND student_id = $4
       RETURNING *`, [accepted, response, planId, studentId]);
        if (result.rows.length === 0) {
            throw new Error('培养计划不存在');
        }
        return result.rows[0];
    }
    /**
     * 获取企业的培养计划列表
     */
    async getCompanyPlans(companyId, status) {
        let query = `
      SELECT cp.*,
             u.username as student_name,
             u.avatar as student_avatar,
             u.student_level as current_level
      FROM cultivation_plans cp
      JOIN users u ON cp.student_id = u.id
      WHERE cp.company_id = $1
    `;
        const params = [companyId];
        if (status) {
            query += ` AND cp.status = $2`;
            params.push(status);
        }
        query += ` ORDER BY cp.created_at DESC`;
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    /**
     * 获取学生的培养计划列表
     */
    async getStudentPlans(studentId, status) {
        let query = `
      SELECT cp.*,
             u.company_name,
             u.avatar as company_avatar
      FROM cultivation_plans cp
      JOIN users u ON cp.company_id = u.id
      WHERE cp.student_id = $1
    `;
        const params = [studentId];
        if (status) {
            query += ` AND cp.status = $2`;
            params.push(status);
        }
        query += ` ORDER BY cp.created_at DESC`;
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    /**
     * 获取培养计划详情
     */
    async getPlanById(planId) {
        const result = await database_1.pool.query(`SELECT cp.*,
              s.username as student_name,
              s.avatar as student_avatar,
              s.student_level as current_level,
              c.company_name,
              c.avatar as company_avatar
       FROM cultivation_plans cp
       JOIN users s ON cp.student_id = s.id
       JOIN users c ON cp.company_id = c.id
       WHERE cp.id = $1`, [planId]);
        if (result.rows.length === 0) {
            throw new Error('培养计划不存在');
        }
        const plan = result.rows[0];
        // 获取阶段进度
        const phases = await database_1.pool.query(`SELECT * FROM cultivation_phase_progress WHERE plan_id = $1 ORDER BY phase_number`, [planId]);
        plan.phase_progress = phases.rows;
        // 获取关联任务
        const tasks = await database_1.pool.query(`SELECT ct.*, t.title, t.status, t.budget
       FROM cultivation_tasks ct
       JOIN tasks t ON ct.task_id = t.id
       WHERE ct.plan_id = $1
       ORDER BY ct.created_at DESC`, [planId]);
        plan.tasks = tasks.rows;
        // 获取技能学习记录
        const skills = await database_1.pool.query(`SELECT * FROM skill_learning_records WHERE plan_id = $1 ORDER BY created_at DESC`, [planId]);
        plan.skill_records = skills.rows;
        return plan;
    }
    /**
     * 更新培养计划
     */
    async updatePlan(planId, updates) {
        const allowedFields = ['description', 'target_role', 'phases', 'incentives', 'total_budget', 'status'];
        const fields = [];
        const values = [];
        let paramIndex = 1;
        Object.entries(updates).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                if (key === 'phases' || key === 'incentives') {
                    fields.push(`${key} = $${paramIndex++}`);
                    values.push(JSON.stringify(value));
                }
                else {
                    fields.push(`${key} = $${paramIndex++}`);
                    values.push(value);
                }
            }
        });
        if (fields.length === 0) {
            throw new Error('没有可更新的字段');
        }
        fields.push(`updated_at = NOW()`);
        values.push(planId);
        const query = `
      UPDATE cultivation_plans
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        const result = await database_1.pool.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('培养计划不存在');
        }
        return result.rows[0];
    }
    /**
     * 关联任务到培养计划
     */
    async linkTask(planId, taskId, phaseNumber, purpose) {
        await database_1.pool.query(`INSERT INTO cultivation_tasks (id, plan_id, task_id, phase_number, purpose)
       VALUES ($1, $2, $3, $4, $5)`, [(0, uuid_1.v4)(), planId, taskId, phaseNumber, purpose]);
    }
    /**
     * 记录技能学习
     */
    async recordSkillLearning(planId, studentId, skillName, skillCategory) {
        const result = await database_1.pool.query(`INSERT INTO skill_learning_records
       (id, plan_id, student_id, skill_name, skill_category, learning_started_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`, [(0, uuid_1.v4)(), planId, studentId, skillName, skillCategory]);
        return result.rows[0];
    }
    /**
     * 完成技能学习
     */
    async completeSkillLearning(recordId, proficiencyLevel, verifiedByTaskId) {
        const result = await database_1.pool.query(`UPDATE skill_learning_records
       SET learning_completed_at = NOW(),
           proficiency_level = $1,
           verified_by_task_id = $2,
           is_certified = true,
           certified_at = NOW()
       WHERE id = $3
       RETURNING *`, [proficiencyLevel, verifiedByTaskId, recordId]);
        if (result.rows.length === 0) {
            throw new Error('学习记录不存在');
        }
        // 更新培养计划的已掌握技能
        const record = result.rows[0];
        await database_1.pool.query(`UPDATE cultivation_plans
       SET skills_acquired = array_append(skills_acquired, $1)
       WHERE id = $2 AND NOT ($1 = ANY(skills_acquired))`, [record.skill_name, record.plan_id]);
        // 更新阶段进度的已掌握技能
        await database_1.pool.query(`UPDATE cultivation_phase_progress cpp
       SET skills_acquired = array_append(skills_acquired, $1)
       WHERE plan_id = $2
         AND NOT ($1 = ANY(skills_acquired))
         AND $1 = ANY(target_skills)`, [record.skill_name, record.plan_id]);
        return result.rows[0];
    }
    /**
     * 添加反馈
     */
    async addFeedback(planId, feedbackBy, feedbackRole, feedbackType, content) {
        const result = await database_1.pool.query(`INSERT INTO cultivation_feedback (id, plan_id, feedback_by, feedback_role, feedback_type, content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [(0, uuid_1.v4)(), planId, feedbackBy, feedbackRole, feedbackType, content]);
        return result.rows[0];
    }
    /**
     * 获取反馈列表
     */
    async getFeedbacks(planId) {
        const result = await database_1.pool.query(`SELECT cf.*,
              u.username as feedback_by_name,
              u.avatar as feedback_by_avatar
       FROM cultivation_feedback cf
       JOIN users u ON cf.feedback_by = u.id
       WHERE cf.plan_id = $1
       ORDER BY cf.created_at DESC`, [planId]);
        return result.rows;
    }
    /**
     * 完成培养计划评估
     */
    async evaluatePlan(planId, evaluation, successScore) {
        const result = await database_1.pool.query(`UPDATE cultivation_plans
       SET final_evaluation = $1,
           success_score = $2,
           evaluated_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`, [evaluation, successScore, planId]);
        if (result.rows.length === 0) {
            throw new Error('培养计划不存在');
        }
        return result.rows[0];
    }
    /**
     * 获取培养统计
     */
    async getCultivationStats(companyId) {
        const result = await database_1.pool.query(`SELECT
         COUNT(*) as total_plans,
         COUNT(*) FILTER (WHERE status = 'active') as active_plans,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_plans,
         COALESCE(SUM(total_budget), 0) as total_invested,
         COALESCE(SUM(spent_amount), 0) as total_spent,
         AVG(success_score) FILTER (WHERE success_score IS NOT NULL) as avg_success_score,
         AVG(completion_percentage) as avg_progress
       FROM cultivation_plans
       WHERE company_id = $1`, [companyId]);
        return {
            ...result.rows[0],
            total_plans: parseInt(result.rows[0].total_plans, 10),
            active_plans: parseInt(result.rows[0].active_plans, 10),
            completed_plans: parseInt(result.rows[0].completed_plans, 10),
            total_invested: parseFloat(result.rows[0].total_invested),
            total_spent: parseFloat(result.rows[0].total_spent),
            avg_success_score: parseFloat(result.rows[0].avg_success_score || '0'),
            avg_progress: parseFloat(result.rows[0].avg_progress || '0'),
        };
    }
    /**
     * 获取推荐培养方案模板
     */
    async getRecommendedTemplate(targetRole) {
        // 预定义的培养方案模板
        const templates = {
            '前端工程师': {
                duration_months: 6,
                target_skills: ['React', 'TypeScript', 'Webpack', 'CSS-in-JS', 'Next.js'],
                phases: [
                    { phase: 1, name: '基础阶段', duration_weeks: 4, skills: ['React基础', 'ES6'], tasks: 2 },
                    { phase: 2, name: '进阶阶段', duration_weeks: 8, skills: ['TypeScript', 'Redux'], tasks: 4 },
                    { phase: 3, name: '实战阶段', duration_weeks: 12, skills: ['Next.js', '性能优化'], tasks: 6 },
                ],
            },
            'UI设计师': {
                duration_months: 4,
                target_skills: ['Figma', 'UI设计规范', '交互设计', '设计系统'],
                phases: [
                    { phase: 1, name: '工具掌握', duration_weeks: 2, skills: ['Figma', 'Sketch'], tasks: 1 },
                    { phase: 2, name: '设计实践', duration_weeks: 6, skills: ['UI设计', '交互设计'], tasks: 3 },
                    { phase: 3, name: '系统设计', duration_weeks: 8, skills: ['设计系统', '组件库'], tasks: 4 },
                ],
            },
        };
        return templates[targetRole] || null;
    }
}
exports.default = new CultivationService();
//# sourceMappingURL=cultivationService.js.map