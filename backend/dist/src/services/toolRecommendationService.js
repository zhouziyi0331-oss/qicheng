"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolRecommendationService = void 0;
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
class ToolRecommendationService {
    /**
     * 根据任务和学生情况推荐工具
     */
    async recommendTools(taskId, studentId, struggle) {
        try {
            // 1. 分析任务类型
            const taskType = await this.analyzeTaskType(taskId);
            // 2. 获取学生技能水平
            const studentLevel = await this.getStudentSkillLevel(studentId, taskType);
            // 3. 构建查询条件
            const suitableFor = {
                task_type: [taskType],
                skill_level: [studentLevel]
            };
            // 4. 查询推荐工具
            const query = `
        SELECT
          id, tool_name, tool_category, tool_description,
          why_recommend, how_to_use, quick_start_steps,
          website_url, is_free, alternatives
        FROM mentor_tool_recommendations
        WHERE suitable_for @> $1::jsonb
        ORDER BY
          times_recommended DESC,
          success_rate DESC NULLS LAST
        LIMIT 3
      `;
            const result = await database_1.pool.query(query, [JSON.stringify(suitableFor)]);
            // 5. 更新推荐次数
            for (const row of result.rows) {
                await this.incrementRecommendationCount(row.id);
            }
            return result.rows.map(row => ({
                toolId: row.id,
                toolName: row.tool_name,
                toolCategory: row.tool_category,
                whyRecommend: row.why_recommend,
                howToUse: row.how_to_use,
                quickStartSteps: row.quick_start_steps,
                websiteUrl: row.website_url,
                isFree: row.is_free
            }));
        }
        catch (error) {
            logger_1.default.error('推荐工具失败', { error, taskId, studentId });
            return [];
        }
    }
    /**
     * 记录工具推荐
     */
    async trackRecommendation(studentId, taskId, toolId, context) {
        try {
            const result = await database_1.pool.query(`INSERT INTO mentor_tool_usage_tracking
         (student_id, tool_id, task_id, recommendation_context)
         VALUES ($1, $2, $3, $4)
         RETURNING id`, [studentId, toolId, taskId, context]);
            return result.rows[0].id;
        }
        catch (error) {
            logger_1.default.error('记录工具推荐失败', { error });
            return 0;
        }
    }
    /**
     * 学生反馈工具使用情况
     */
    async recordToolUsage(trackingId, usage) {
        try {
            const updates = [];
            const values = [];
            let paramIndex = 1;
            updates.push(`student_tried = $${paramIndex}`);
            values.push(usage.tried);
            paramIndex++;
            if (usage.tried) {
                updates.push(`tried_at = NOW()`);
                if (usage.succeeded !== undefined) {
                    updates.push(`succeeded = $${paramIndex}`);
                    values.push(usage.succeeded);
                    paramIndex++;
                }
                if (usage.difficultyLevel) {
                    updates.push(`difficulty_level = $${paramIndex}`);
                    values.push(usage.difficultyLevel);
                    paramIndex++;
                }
                if (usage.timeToLearnMinutes) {
                    updates.push(`time_to_learn_minutes = $${paramIndex}`);
                    values.push(usage.timeToLearnMinutes);
                    paramIndex++;
                }
                if (usage.comment) {
                    updates.push(`student_comment = $${paramIndex}`);
                    values.push(usage.comment);
                    paramIndex++;
                }
                if (usage.wouldRecommend !== undefined) {
                    updates.push(`would_recommend_to_others = $${paramIndex}`);
                    values.push(usage.wouldRecommend);
                    paramIndex++;
                }
            }
            values.push(trackingId);
            const query = `
        UPDATE mentor_tool_usage_tracking
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING tool_id
      `;
            const result = await database_1.pool.query(query, values);
            if (result.rows.length > 0) {
                // 更新工具的成功率
                await this.updateToolSuccessRate(result.rows[0].tool_id);
                return {
                    success: true,
                    message: '工具使用反馈已记录'
                };
            }
            return {
                success: false,
                message: '未找到推荐记录'
            };
        }
        catch (error) {
            logger_1.default.error('记录工具使用失败', { error, trackingId });
            return {
                success: false,
                message: '记录失败'
            };
        }
    }
    /**
     * 获取工具使用统计
     */
    async getToolStatistics(toolId) {
        try {
            const query = `
        SELECT
          COUNT(*) as total_recommendations,
          COUNT(CASE WHEN student_tried THEN 1 END) as tried_count,
          COUNT(CASE WHEN succeeded THEN 1 END) as success_count,
          AVG(time_to_learn_minutes) as avg_learning_time,
          AVG(CASE
            WHEN difficulty_level = 'easy' THEN 1
            WHEN difficulty_level = 'medium' THEN 2
            WHEN difficulty_level = 'hard' THEN 3
          END) as avg_difficulty
        FROM mentor_tool_usage_tracking
        WHERE tool_id = $1
      `;
            const result = await database_1.pool.query(query, [toolId]);
            return result.rows[0];
        }
        catch (error) {
            logger_1.default.error('获取工具统计失败', { error, toolId });
            return null;
        }
    }
    /**
     * 获取最受欢迎的工具
     */
    async getPopularTools(category, limit = 5) {
        try {
            let query = `
        SELECT
          t.id, t.tool_name, t.tool_category, t.tool_description,
          t.why_recommend, t.how_to_use, t.quick_start_steps,
          t.website_url, t.is_free,
          t.times_recommended,
          COALESCE(
            (SELECT COUNT(CASE WHEN succeeded THEN 1 END)::float /
             NULLIF(COUNT(CASE WHEN student_tried THEN 1 END), 0)
             FROM mentor_tool_usage_tracking
             WHERE tool_id = t.id),
            0
          ) as success_rate
        FROM mentor_tool_recommendations t
      `;
            const params = [];
            if (category) {
                query += ` WHERE t.tool_category = $1`;
                params.push(category);
            }
            query += `
        ORDER BY
          times_recommended DESC,
          success_rate DESC
        LIMIT $${params.length + 1}
      `;
            params.push(limit);
            const result = await database_1.pool.query(query, params);
            return result.rows.map(row => ({
                toolId: row.id,
                toolName: row.tool_name,
                toolCategory: row.tool_category,
                whyRecommend: row.why_recommend,
                howToUse: row.how_to_use,
                quickStartSteps: row.quick_start_steps,
                websiteUrl: row.website_url,
                isFree: row.is_free
            }));
        }
        catch (error) {
            logger_1.default.error('获取热门工具失败', { error });
            return [];
        }
    }
    /**
     * 添加新工具
     */
    async addTool(tool) {
        try {
            const result = await database_1.pool.query(`INSERT INTO mentor_tool_recommendations
         (tool_name, tool_category, tool_description, why_recommend,
          how_to_use, quick_start_steps, suitable_for, is_free,
          website_url, tutorial_url, alternatives)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`, [
                tool.toolName,
                tool.toolCategory,
                tool.toolDescription,
                tool.whyRecommend,
                tool.howToUse,
                tool.quickStartSteps,
                JSON.stringify(tool.suitableFor),
                tool.isFree,
                tool.websiteUrl,
                tool.tutorialUrl,
                tool.alternatives
            ]);
            return result.rows[0].id;
        }
        catch (error) {
            logger_1.default.error('添加工具失败', { error });
            return 0;
        }
    }
    /**
     * 分析任务类型
     */
    async analyzeTaskType(taskId) {
        try {
            const result = await database_1.pool.query('SELECT title, description FROM tasks WHERE id = $1', [taskId]);
            if (result.rows.length === 0) {
                return 'general';
            }
            const { title, description } = result.rows[0];
            const text = (title + ' ' + description).toLowerCase();
            if (text.includes('ui') || text.includes('设计') || text.includes('界面') || text.includes('原型')) {
                return 'ui_design';
            }
            if (text.includes('小程序') || text.includes('前端') || text.includes('页面')) {
                return 'frontend';
            }
            if (text.includes('后端') || text.includes('api') || text.includes('接口')) {
                return 'backend';
            }
            if (text.includes('数据') || text.includes('分析')) {
                return 'data_analysis';
            }
            return 'general';
        }
        catch (error) {
            logger_1.default.error('分析任务类型失败', { error, taskId });
            return 'general';
        }
    }
    /**
     * 获取学生技能水平
     */
    async getStudentSkillLevel(studentId, taskType) {
        try {
            const result = await database_1.pool.query(`SELECT technical_skills, total_tasks_completed
         FROM student_learning_profiles
         WHERE student_id = $1`, [studentId]);
            if (result.rows.length === 0) {
                return 'beginner';
            }
            const { technical_skills, total_tasks_completed } = result.rows[0];
            // 根据完成任务数判断
            if (total_tasks_completed === 0) {
                return 'beginner';
            }
            else if (total_tasks_completed < 5) {
                return 'beginner';
            }
            else if (total_tasks_completed < 15) {
                return 'intermediate';
            }
            else {
                return 'advanced';
            }
        }
        catch (error) {
            logger_1.default.error('获取学生技能水平失败', { error, studentId });
            return 'beginner';
        }
    }
    /**
     * 增加推荐次数
     */
    async incrementRecommendationCount(toolId) {
        try {
            await database_1.pool.query(`UPDATE mentor_tool_recommendations
         SET times_recommended = times_recommended + 1,
             updated_at = NOW()
         WHERE id = $1`, [toolId]);
        }
        catch (error) {
            logger_1.default.error('更新推荐次数失败', { error, toolId });
        }
    }
    /**
     * 更新工具成功率
     */
    async updateToolSuccessRate(toolId) {
        try {
            const stats = await this.getToolStatistics(toolId);
            if (stats && stats.tried_count > 0) {
                const successRate = stats.success_count / stats.tried_count;
                await database_1.pool.query(`UPDATE mentor_tool_recommendations
           SET success_rate = $1,
               updated_at = NOW()
           WHERE id = $2`, [successRate, toolId]);
            }
        }
        catch (error) {
            logger_1.default.error('更新工具成功率失败', { error, toolId });
        }
    }
}
exports.toolRecommendationService = new ToolRecommendationService();
//# sourceMappingURL=toolRecommendationService.js.map