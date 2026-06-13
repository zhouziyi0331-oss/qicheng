"use strict";
/**
 * 语义匹配引擎
 * 6维度匹配算法：技能、难度、领域、成长潜力、可靠性、偏好
 * 用于精准匹配任务和学生
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class SemanticMatchingEngine {
    constructor() {
        // 6个维度的权重配置（可调优）
        this.weights = {
            skill_match: 0.30, // 30% - 技能匹配
            difficulty_match: 0.20, // 20% - 难度匹配
            domain_match: 0.15, // 15% - 领域匹配
            growth_potential: 0.15, // 15% - 成长潜力
            reliability: 0.10, // 10% - 可靠性
            preference: 0.10, // 10% - 偏好匹配
        };
    }
    /**
     * 计算余弦相似度
     */
    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have same length');
        }
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            mag1 += vec1[i] * vec1[i];
            mag2 += vec2[i] * vec2[i];
        }
        const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }
    /**
     * 维度1：技能匹配
     */
    async calculateSkillMatch(task, student) {
        try {
            // 解析任务所需技能
            const requiredSkills = task.required_skills || {};
            const studentSkills = student.skills || {};
            // 计算向量相似度
            const taskVector = JSON.parse(task.combined_embedding || '[]');
            const studentVector = JSON.parse(student.combined_vector || '[]');
            let vectorSimilarity = 0;
            if (taskVector.length > 0 && studentVector.length > 0) {
                vectorSimilarity = this.cosineSimilarity(taskVector, studentVector);
            }
            // 计算技能覆盖率
            const requiredSkillList = Object.keys(requiredSkills);
            const studentSkillList = Object.keys(studentSkills);
            const matchedSkills = requiredSkillList.filter(skill => studentSkillList.includes(skill));
            const coverageRate = requiredSkillList.length > 0
                ? matchedSkills.length / requiredSkillList.length
                : 0;
            // 综合评分（向量相似度60% + 技能覆盖率40%）
            const score = (vectorSimilarity * 0.6 + coverageRate * 0.4);
            return {
                score: Math.min(Math.max(score, 0), 1),
                reason: matchedSkills.length > 0
                    ? `匹配技能: ${matchedSkills.join(', ')}`
                    : '技能不完全匹配，但有学习潜力',
                details: {
                    vectorSimilarity,
                    coverageRate,
                    matchedSkills,
                    missingSkills: requiredSkillList.filter(s => !matchedSkills.includes(s)),
                },
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating skill match:', error);
            return { score: 0.5, reason: '技能匹配评估失败' };
        }
    }
    /**
     * 维度2：难度匹配
     */
    calculateDifficultyMatch(task, student) {
        try {
            const taskLevel = task.level || 0;
            const studentLevel = student.level || 0;
            const tasksCompleted = student.tasks_completed || 0;
            // 计算难度差距
            const levelDiff = Math.abs(taskLevel - studentLevel);
            // 最佳匹配：任务难度 = 学生等级 或 学生等级+1（挑战区）
            let score = 0;
            let reason = '';
            if (levelDiff === 0) {
                score = 1.0;
                reason = '难度完全匹配';
            }
            else if (levelDiff === 1 && taskLevel > studentLevel) {
                score = 0.9;
                reason = '适度挑战，有利于成长';
            }
            else if (levelDiff === 1 && taskLevel < studentLevel) {
                score = 0.8;
                reason = '略低于当前水平，可快速完成';
            }
            else if (levelDiff === 2) {
                score = 0.6;
                reason = levelDiff > 0 ? '挑战较大，需要努力' : '任务相对简单';
            }
            else {
                score = 0.3;
                reason = levelDiff > 0 ? '难度过高，不建议' : '任务过于简单';
            }
            // 考虑学生经验：完成任务数越多，容忍度越高
            const experienceBonus = Math.min(tasksCompleted / 50, 0.2);
            score = Math.min(score + experienceBonus, 1.0);
            return {
                score,
                reason,
                details: { taskLevel, studentLevel, levelDiff, experienceBonus },
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating difficulty match:', error);
            return { score: 0.5, reason: '难度匹配评估失败' };
        }
    }
    /**
     * 维度3：领域匹配
     */
    calculateDomainMatch(task, student) {
        try {
            const taskTrack = task.track || 'unknown';
            const preferredTypes = student.preferred_task_types || [];
            // 检查任务类型是否在学生偏好中
            const isPreferred = preferredTypes.includes(taskTrack);
            let score = 0.5; // 默认中性
            let reason = '';
            if (isPreferred) {
                score = 0.9;
                reason = `擅长${taskTrack}领域`;
            }
            else if (preferredTypes.length === 0) {
                score = 0.7;
                reason = '新手，可尝试各类任务';
            }
            else {
                score = 0.5;
                reason = '非主要方向，可拓展技能';
            }
            return {
                score,
                reason,
                details: { taskTrack, preferredTypes },
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating domain match:', error);
            return { score: 0.5, reason: '领域匹配评估失败' };
        }
    }
    /**
     * 维度4：成长潜力
     */
    calculateGrowthPotential(task, student) {
        try {
            const qualityTrend = student.quality_trend || 'stable';
            const growthRate = student.growth_rate || 0.5;
            const avgQuality = student.avg_task_quality || 0.5;
            let score = 0.5;
            let reason = '';
            // 成长趋势加分
            if (qualityTrend === 'improving') {
                score += 0.3;
                reason = '质量持续提升';
            }
            else if (qualityTrend === 'stable' && avgQuality > 0.7) {
                score += 0.2;
                reason = '表现稳定优秀';
            }
            else if (qualityTrend === 'declining') {
                score -= 0.2;
                reason = '近期表现下滑';
            }
            // 成长速度加分
            if (growthRate > 0.7) {
                score += 0.2;
                reason += ', 成长速度快';
            }
            score = Math.min(Math.max(score, 0), 1);
            return {
                score,
                reason: reason || '具备一定成长潜力',
                details: { qualityTrend, growthRate, avgQuality },
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating growth potential:', error);
            return { score: 0.5, reason: '成长潜力评估失败' };
        }
    }
    /**
     * 维度5：可靠性
     */
    calculateReliability(task, student) {
        try {
            const onTimeRate = student.on_time_delivery_rate || 0.5;
            const avgSatisfaction = student.avg_client_satisfaction || 0.5;
            const tasksCompleted = student.tasks_completed || 0;
            // 按时交付率（40%）
            const timelinessScore = onTimeRate;
            // 客户满意度（40%）
            const satisfactionScore = avgSatisfaction;
            // 经验值（20%）
            const experienceScore = Math.min(tasksCompleted / 20, 1);
            const score = timelinessScore * 0.4 + satisfactionScore * 0.4 + experienceScore * 0.2;
            let reason = '';
            if (score > 0.8) {
                reason = '非常可靠';
            }
            else if (score > 0.6) {
                reason = '表现良好';
            }
            else if (score > 0.4) {
                reason = '基本可靠';
            }
            else {
                reason = '经验较少';
            }
            return {
                score,
                reason,
                details: { onTimeRate, avgSatisfaction, tasksCompleted },
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating reliability:', error);
            return { score: 0.5, reason: '可靠性评估失败' };
        }
    }
    /**
     * 维度6：偏好匹配
     */
    calculatePreferenceAlignment(task, student) {
        try {
            const taskBudget = task.budget || 0;
            const taskDuration = task.duration || 0;
            const maxHoursPerWeek = student.max_hours_per_week || 20;
            const workStyle = student.work_style || {};
            let score = 0.5;
            let reason = '';
            // 工作时长匹配
            if (taskDuration > 0 && maxHoursPerWeek > 0) {
                const requiredWeeks = taskDuration / maxHoursPerWeek;
                if (requiredWeeks <= 2) {
                    score += 0.2;
                    reason = '工作时长合适';
                }
                else if (requiredWeeks > 4) {
                    score -= 0.1;
                    reason = '工作周期较长';
                }
            }
            // 预算偏好（假设学生偏好中高预算任务）
            if (taskBudget > 1000) {
                score += 0.2;
                reason += ', 预算充足';
            }
            score = Math.min(Math.max(score, 0), 1);
            return {
                score,
                reason: reason || '工作偏好基本匹配',
                details: { taskBudget, taskDuration, maxHoursPerWeek },
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating preference alignment:', error);
            return { score: 0.5, reason: '偏好匹配评估失败' };
        }
    }
    /**
     * 计算单个任务与学生的匹配度
     */
    async matchTaskWithStudent(taskId, studentId) {
        const client = await db_1.pool.connect();
        try {
            // 获取任务信息
            const taskResult = await client.query(`SELECT t.*, tt.difficulty_overall
         FROM tasks t
         LEFT JOIN task_translations tt ON t.id = tt.task_id
         WHERE t.id = $1`, [taskId]);
            if (taskResult.rows.length === 0) {
                throw new Error(`Task not found: ${taskId}`);
            }
            const task = taskResult.rows[0];
            // 获取学生能力信息
            const studentResult = await client.query(`SELECT sc.*, u.name, u.level
         FROM student_capabilities sc
         JOIN users u ON sc.student_id = u.id
         WHERE sc.student_id = $1`, [studentId]);
            if (studentResult.rows.length === 0) {
                throw new Error(`Student capability not found: ${studentId}`);
            }
            const student = studentResult.rows[0];
            // 计算6个维度的分数
            const skillMatch = await this.calculateSkillMatch(task, student);
            const difficultyMatch = this.calculateDifficultyMatch(task, student);
            const domainMatch = this.calculateDomainMatch(task, student);
            const growthPotential = this.calculateGrowthPotential(task, student);
            const reliability = this.calculateReliability(task, student);
            const preference = this.calculatePreferenceAlignment(task, student);
            // 计算综合分数（加权平均）
            const overallScore = skillMatch.score * this.weights.skill_match +
                difficultyMatch.score * this.weights.difficulty_match +
                domainMatch.score * this.weights.domain_match +
                growthPotential.score * this.weights.growth_potential +
                reliability.score * this.weights.reliability +
                preference.score * this.weights.preference;
            // 构建匹配详情
            const matchBreakdown = {
                skillMatch: {
                    score: skillMatch.score,
                    reason: skillMatch.reason,
                    details: skillMatch.details,
                },
                difficultyMatch: {
                    score: difficultyMatch.score,
                    reason: difficultyMatch.reason,
                },
                domainMatch: {
                    score: domainMatch.score,
                    reason: domainMatch.reason,
                },
                growthPotential: {
                    score: growthPotential.score,
                    reason: growthPotential.reason,
                },
                reliability: {
                    score: reliability.score,
                    reason: reliability.reason,
                },
                preference: {
                    score: preference.score,
                    reason: preference.reason,
                },
                weights: this.weights,
            };
            return {
                overall_score: Number(overallScore.toFixed(2)),
                skill_match_score: Number(skillMatch.score.toFixed(2)),
                difficulty_match_score: Number(difficultyMatch.score.toFixed(2)),
                domain_match_score: Number(domainMatch.score.toFixed(2)),
                growth_potential_score: Number(growthPotential.score.toFixed(2)),
                reliability_score: Number(reliability.score.toFixed(2)),
                preference_score: Number(preference.score.toFixed(2)),
                match_breakdown: matchBreakdown,
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 找出最适合任务的学生（Top K）
     */
    async findBestStudentsForTask(taskId, limit = 100) {
        const client = await db_1.pool.connect();
        try {
            logger_1.default.info(`Finding best students for task: ${taskId}`);
            // 获取所有有能力画像的学生
            const studentsResult = await client.query(`SELECT sc.student_id, u.name
         FROM student_capabilities sc
         JOIN users u ON sc.student_id = u.id
         WHERE u.role = 'student' AND u.is_active = true
         LIMIT 200`);
            const students = studentsResult.rows;
            logger_1.default.info(`Found ${students.length} candidate students`);
            // 计算每个学生的匹配分数
            const matchResults = [];
            for (const student of students) {
                try {
                    const match_score = await this.matchTaskWithStudent(taskId, student.student_id);
                    matchResults.push({
                        student_id: student.student_id,
                        student_name: student.name,
                        match_score: match_score,
                        rank: 0, // 稍后排序后设置
                    });
                }
                catch (error) {
                    logger_1.default.error(`Error matching student ${student.student_id}:`, error);
                }
            }
            // 按匹配分数排序
            matchResults.sort((a, b) => b.match_score.overall_score - a.match_score.overall_score);
            // 设置排名并返回Top K
            return matchResults.slice(0, limit).map((result, index) => ({
                ...result,
                rank: index + 1,
            }));
        }
        finally {
            client.release();
        }
    }
    /**
     * 找出最适合学生的任务
     */
    async findBestTasksForStudent(studentId, limit = 20) {
        const client = await db_1.pool.connect();
        try {
            logger_1.default.info(`Finding best tasks for student: ${studentId}`);
            // 获取所有未分配的任务
            const tasksResult = await client.query(`SELECT id, title
         FROM tasks
         WHERE status = 'open' AND assigned_student_id IS NULL
         ORDER BY created_at DESC
         LIMIT 100`);
            const tasks = tasksResult.rows;
            logger_1.default.info(`Found ${tasks.length} available tasks`);
            // 计算每个任务的匹配分数
            const matchResults = [];
            for (const task of tasks) {
                try {
                    const match_score = await this.matchTaskWithStudent(task.id, studentId);
                    matchResults.push({
                        task_id: task.id,
                        task_title: task.title,
                        match_score: match_score,
                        rank: 0,
                    });
                }
                catch (error) {
                    logger_1.default.error(`Error matching task ${task.id}:`, error);
                }
            }
            // 按匹配分数排序
            matchResults.sort((a, b) => b.match_score.overall_score - a.match_score.overall_score);
            // 设置排名并返回Top K
            return matchResults.slice(0, limit).map((result, index) => ({
                ...result,
                rank: index + 1,
            }));
        }
        finally {
            client.release();
        }
    }
    /**
     * 保存匹配结果到数据库
     */
    async saveMatchResults(taskId, matchResults) {
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 删除该任务的旧匹配记录
            await client.query('DELETE FROM task_student_matches WHERE task_id = $1', [taskId]);
            // 插入新的匹配记录
            for (const result of matchResults) {
                await client.query(`INSERT INTO task_student_matches (
            task_id, student_id, overall_score,
            skill_match_score, difficulty_match_score, domain_match_score,
            growth_potential_score, reliability_score, preference_score,
            match_breakdown, rank_in_task
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
                    taskId,
                    result.student_id,
                    result.match_score.overall_score,
                    result.match_score.skill_match_score,
                    result.match_score.difficulty_match_score,
                    result.match_score.domain_match_score,
                    result.match_score.growth_potential_score,
                    result.match_score.reliability_score,
                    result.match_score.preference_score,
                    JSON.stringify(result.match_score.match_breakdown),
                    result.rank,
                ]);
            }
            // 更新tasks表的匹配信息
            await client.query(`UPDATE tasks SET
          matched_students_count = $1,
          top_match_score = $2,
          matching_completed_at = NOW()
        WHERE id = $3`, [
                matchResults.length,
                matchResults[0]?.match_score.overall_score || 0,
                taskId,
            ]);
            await client.query('COMMIT');
            logger_1.default.info(`Saved ${matchResults.length} match results for task ${taskId}`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Error saving match results:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.default = new SemanticMatchingEngine();
//# sourceMappingURL=semanticMatchingEngine.js.map