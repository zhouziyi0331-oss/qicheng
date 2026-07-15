"use strict";
/**
 * Phase 3.4: 需求自动拆解推送服务
 * 企业发布大需求，系统自动拆解成小任务，精准推送给合适的学生
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});
class DemandDecompositionService {
    /**
     * AI自动拆解大需求
     */
    async decomposeTaskWithAI(params) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 构建AI提示词
            const prompt = `你是一个项目管理专家。请将以下大需求拆解成多个可独立完成的小任务。

**原始需求：**
标题：${params.taskTitle}
描述：${params.taskDescription}
总预算：¥${params.totalBudget}

**拆解要求：**
1. 每个子任务应该是独立、可交付的工作单元
2. 估算每个子任务的工时（小时）和预算分配
3. 标注所需技能和难度等级（1-5）
4. 明确子任务之间的依赖关系
5. 合理分配预算，确保总和不超过原始预算

请以JSON格式返回，结构如下：
{
  "subtasks": [
    {
      "title": "子任务标题",
      "description": "详细描述",
      "type": "任务类型（如：前端开发、后端开发、UI设计等）",
      "required_skills": ["技能1", "技能2"],
      "difficulty_level": 3,
      "estimated_hours": 8,
      "order": 1,
      "dependencies": [],
      "budget_allocation": 500
    }
  ]
}`;
            // 调用Claude API
            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });
            const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
            // 解析AI响应
            let aiResult;
            try {
                // 提取JSON部分
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiResult = JSON.parse(jsonMatch[0]);
                }
                else {
                    throw new Error('无法从AI响应中提取JSON');
                }
            }
            catch (parseError) {
                logger_1.default.error('[DemandDecomposition] AI响应解析失败:', parseError);
                throw new Error('AI拆解失败，请稍后重试');
            }
            // 创建拆解记录
            const decompositionId = `decomp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await client.query(`
        INSERT INTO demand_decompositions (
          id, original_demand_id, company_id, decomposition_strategy, total_subtasks
        )
        VALUES ($1, $2, $3, 'ai_based', $4)
      `, [decompositionId, params.taskId, params.companyId, aiResult.subtasks.length]);
            // 创建子任务
            const subtasks = [];
            for (let i = 0; i < aiResult.subtasks.length; i++) {
                const st = aiResult.subtasks[i];
                const subtaskId = `subtask_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
                await client.query(`
          INSERT INTO subtasks (
            id, decomposition_id, parent_task_id, subtask_title,
            subtask_description, subtask_type, required_skills,
            difficulty_level, estimated_hours, subtask_order,
            dependencies, budget_allocation, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
        `, [
                    subtaskId,
                    decompositionId,
                    params.taskId,
                    st.title,
                    st.description,
                    st.type,
                    st.required_skills || [],
                    st.difficulty_level || 3,
                    st.estimated_hours || 0,
                    st.order || (i + 1),
                    st.dependencies || [],
                    st.budget_allocation || 0
                ]);
                subtasks.push({
                    id: subtaskId,
                    decompositionId,
                    parentTaskId: params.taskId,
                    subtaskTitle: st.title,
                    subtaskDescription: st.description,
                    subtaskType: st.type,
                    requiredSkills: st.required_skills || [],
                    difficultyLevel: st.difficulty_level || 3,
                    estimatedHours: st.estimated_hours || 0,
                    subtaskOrder: st.order || (i + 1),
                    dependencies: st.dependencies || [],
                    budgetAllocation: st.budget_allocation || 0,
                    status: 'pending'
                });
            }
            await client.query('COMMIT');
            logger_1.default.info('[DemandDecomposition] AI拆解完成', {
                decompositionId,
                totalSubtasks: subtasks.length
            });
            return {
                decompositionId,
                subtasks,
                totalSubtasks: subtasks.length
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 智能推送子任务给合适的学生
     */
    async pushSubtaskToStudents(params) {
        const client = await database_1.pool.connect();
        try {
            // 获取子任务信息
            const subtaskResult = await client.query(`
        SELECT
          id, subtask_title, subtask_description, subtask_type,
          required_skills, difficulty_level, estimated_hours, budget_allocation
        FROM subtasks
        WHERE id = $1
      `, [params.subtaskId]);
            if (subtaskResult.rows.length === 0) {
                throw new Error('子任务不存在');
            }
            const subtask = subtaskResult.rows[0];
            const maxPush = params.maxPushCount || 5;
            // 查找匹配的学生
            const studentsResult = await client.query(`
        SELECT
          u.user_id,
          u.name,
          u.level,
          opc.personality_type,
          opc.dimensions,
          COUNT(DISTINCT ta.id) as completed_tasks,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          ARRAY_AGG(DISTINCT t.track) FILTER (WHERE t.track IS NOT NULL) as experience_tracks
        FROM users u
        LEFT JOIN opc_test_results opc ON u.user_id = opc.student_id
          AND opc.test_version = 'v2'
        LEFT JOIN task_assignments ta ON u.user_id = ta.student_id
          AND ta.status = 'completed'
        LEFT JOIN ratings r ON ta.id = r.task_assignment_id
        LEFT JOIN tasks t ON ta.task_id = t.id
        WHERE u.role = 'student'
          AND u.level >= $1 - 1
          AND u.level <= $1 + 1
        GROUP BY u.user_id, u.name, u.level, opc.personality_type, opc.dimensions
        LIMIT 50
      `, [subtask.difficulty_level]);
            // 计算匹配分数
            const matches = studentsResult.rows.map(student => {
                let matchScore = 0;
                const matchReasons = {};
                // 技能匹配（40分）
                const requiredSkills = subtask.required_skills || [];
                const studentTracks = student.experience_tracks || [];
                const skillMatchCount = requiredSkills.filter(skill => studentTracks.some(track => track.includes(skill) || skill.includes(track))).length;
                const skillScore = requiredSkills.length > 0
                    ? (skillMatchCount / requiredSkills.length) * 40
                    : 20;
                matchScore += skillScore;
                matchReasons.skill_match = Math.round(skillScore);
                // 难度匹配（30分）
                const levelDiff = Math.abs(student.level - subtask.difficulty_level);
                const difficultyScore = Math.max(0, 30 - levelDiff * 10);
                matchScore += difficultyScore;
                matchReasons.difficulty_match = Math.round(difficultyScore);
                // 经验匹配（20分）
                const completedTasks = parseInt(student.completed_tasks) || 0;
                const experienceScore = Math.min(20, completedTasks * 2);
                matchScore += experienceScore;
                matchReasons.experience_match = Math.round(experienceScore);
                // 评分匹配（10分）
                const avgRating = parseFloat(student.avg_rating) || 0;
                const ratingScore = avgRating * 2;
                matchScore += ratingScore;
                matchReasons.rating_match = Math.round(ratingScore);
                return {
                    studentId: student.user_id,
                    studentName: student.name,
                    matchScore: Math.round(matchScore),
                    matchReasons
                };
            });
            // 按匹配分数排序，取前N个
            matches.sort((a, b) => b.matchScore - a.matchScore);
            const topMatches = matches.slice(0, maxPush);
            // 记录推送
            const pushResults = [];
            for (const match of topMatches) {
                await client.query(`
          INSERT INTO subtask_push_records (
            subtask_id, student_id, match_score, match_reasons
          )
          VALUES ($1, $2, $3, $4)
        `, [params.subtaskId, match.studentId, match.matchScore, JSON.stringify(match.matchReasons)]);
                pushResults.push({
                    subtaskId: params.subtaskId,
                    studentId: match.studentId,
                    matchScore: match.matchScore,
                    matchReasons: match.matchReasons,
                    pushed: true
                });
            }
            // 更新子任务推送计数
            await client.query(`
        UPDATE subtasks
        SET push_count = push_count + $1, status = 'pushed'
        WHERE id = $2
      `, [topMatches.length, params.subtaskId]);
            logger_1.default.info('[DemandDecomposition] 子任务推送完成', {
                subtaskId: params.subtaskId,
                pushedCount: pushResults.length
            });
            return pushResults;
        }
        finally {
            client.release();
        }
    }
    /**
     * 学生响应子任务推送
     */
    async respondToSubtask(params) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 更新推送记录
            await client.query(`
        UPDATE subtask_push_records
        SET response_status = $1, response_time = NOW(), rejection_reason = $2
        WHERE subtask_id = $3 AND student_id = $4
      `, [params.response, params.rejectionReason, params.subtaskId, params.studentId]);
            if (params.response === 'accepted') {
                // 分配子任务给学生
                await client.query(`
          UPDATE subtasks
          SET assigned_student_id = $1, status = 'accepted'
          WHERE id = $2 AND assigned_student_id IS NULL
        `, [params.studentId, params.subtaskId]);
            }
            // 计算接受率
            const statsResult = await client.query(`
        SELECT
          COUNT(*) FILTER (WHERE response_status = 'accepted') as accepted_count,
          COUNT(*) as total_count
        FROM subtask_push_records
        WHERE subtask_id = $1
      `, [params.subtaskId]);
            if (statsResult.rows.length > 0) {
                const accepted = parseInt(statsResult.rows[0].accepted_count);
                const total = parseInt(statsResult.rows[0].total_count);
                const acceptanceRate = total > 0 ? accepted / total : 0;
                await client.query(`
          UPDATE subtasks
          SET acceptance_rate = $1
          WHERE id = $2
        `, [acceptanceRate, params.subtaskId]);
            }
            await client.query('COMMIT');
            logger_1.default.info('[DemandDecomposition] 学生响应子任务', {
                subtaskId: params.subtaskId,
                studentId: params.studentId,
                response: params.response
            });
            return true;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取学生收到的子任务推送
     */
    async getStudentSubtaskPushes(params) {
        const client = await database_1.pool.connect();
        try {
            let whereClause = 'spr.student_id = $1';
            const queryParams = [params.studentId];
            let paramIndex = 2;
            if (params.responseStatus) {
                whereClause += ` AND spr.response_status = $${paramIndex}`;
                queryParams.push(params.responseStatus);
                paramIndex++;
            }
            const limit = params.limit || 20;
            const result = await client.query(`
        SELECT
          spr.id as push_id,
          st.id as subtask_id,
          st.subtask_title,
          st.subtask_description,
          st.subtask_type,
          st.required_skills,
          st.difficulty_level,
          st.estimated_hours,
          st.budget_allocation,
          spr.match_score,
          spr.match_reasons,
          spr.push_time,
          spr.response_status,
          t.title as parent_task_title
        FROM subtask_push_records spr
        JOIN subtasks st ON spr.subtask_id = st.id
        JOIN tasks t ON st.parent_task_id = t.id
        WHERE ${whereClause}
        ORDER BY spr.push_time DESC
        LIMIT $${paramIndex}
      `, [...queryParams, limit]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
}
exports.default = new DemandDecompositionService();
//# sourceMappingURL=demandDecompositionService.js.map