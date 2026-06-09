"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const vectorGenerationService_1 = __importDefault(require("./vectorGenerationService"));
/**
 * 语义匹配引擎
 * 实现6维度匹配算法：技能、难度、领域、成长潜力、可靠性、偏好
 */
class SemanticMatchingEngine {
    constructor() {
        // 6个维度的权重配置
        this.WEIGHTS = {
            skillMatch: 0.35, // 技能匹配 35%
            difficultyMatch: 0.20, // 难度匹配 20%
            domainMatch: 0.15, // 领域匹配 15%
            growthPotential: 0.15, // 成长潜力 15%
            reliability: 0.10, // 可靠性 10%
            preferenceAlignment: 0.05 // 偏好对齐 5%
        };
    }
    /**
     * 计算单个任务与学生的匹配度
     */
    async matchTaskWithStudent(taskId, studentId) {
        try {
            // 获取任务信息
            const task = await this.getTaskInfo(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            // 获取学生能力信息
            const student = await this.getStudentCapability(studentId);
            if (!student) {
                throw new Error(`Student ${studentId} not found`);
            }
            // 计算6个维度的分数
            const skillMatch = await this.calculateSkillMatch(task, student);
            const difficultyMatch = this.calculateDifficultyMatch(task, student);
            const domainMatch = this.calculateDomainMatch(task, student);
            const growthPotential = this.calculateGrowthPotential(task, student);
            const reliability = this.calculateReliability(task, student);
            const preferenceAlignment = this.calculatePreferenceAlignment(task, student);
            // 计算基础总分
            let overallScore = skillMatch.score * this.WEIGHTS.skillMatch +
                difficultyMatch.score * this.WEIGHTS.difficultyMatch +
                domainMatch.score * this.WEIGHTS.domainMatch +
                growthPotential.score * this.WEIGHTS.growthPotential +
                reliability.score * this.WEIGHTS.reliability +
                preferenceAlignment.score * this.WEIGHTS.preferenceAlignment;
            // 应用行为学习加权（第十一刀修复）
            try {
                const behaviorLearningService = require('./behaviorLearningService').default;
                const preferenceBoost = await behaviorLearningService.calculatePreferenceBoost(studentId, task.track_type || '', task.budget_max || 0, parseInt(task.level_required || '0'));
                overallScore += preferenceBoost;
                overallScore = Math.max(0, Math.min(1, overallScore)); // 限制在[0, 1]范围
            }
            catch (error) {
                logger_1.default.error('Failed to apply behavior learning boost:', error);
            }
            const matchScore = {
                overallScore: Math.round(overallScore * 100) / 100,
                skillMatch,
                difficultyMatch,
                domainMatch,
                growthPotential,
                reliability,
                preferenceAlignment,
                breakdown: {
                    taskTitle: task.title,
                    studentId: student.student_id,
                    calculatedAt: new Date().toISOString()
                }
            };
            return matchScore;
        }
        catch (error) {
            logger_1.default.error(`Failed to match task ${taskId} with student ${studentId}:`, error);
            throw error;
        }
    }
    /**
     * 找出最适合任务的学生（Top K）
     */
    async findBestStudentsForTask(taskId, limit = 100) {
        try {
            const task = await this.getTaskInfo(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            // 使用向量相似度快速筛选候选学生
            const candidates = await this.findCandidateStudents(task, limit * 2);
            // 对每个候选学生计算详细匹配分数
            const matches = [];
            for (const student of candidates) {
                try {
                    const matchScore = await this.matchTaskWithStudent(taskId, student.student_id);
                    matches.push({
                        taskId,
                        studentId: student.student_id,
                        matchScore
                    });
                }
                catch (error) {
                    logger_1.default.error(`Failed to match student ${student.student_id}:`, error);
                }
            }
            // 按总分排序
            matches.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore);
            // 添加排名
            matches.forEach((match, index) => {
                match.rank = index + 1;
            });
            // 返回Top K
            return matches.slice(0, limit);
        }
        catch (error) {
            logger_1.default.error(`Failed to find best students for task ${taskId}:`, error);
            throw error;
        }
    }
    /**
     * 找出最适合学生的任务
     */
    async findBestTasksForStudent(studentId, limit = 20) {
        try {
            const student = await this.getStudentCapability(studentId);
            if (!student) {
                throw new Error(`Student ${studentId} not found`);
            }
            // 使用向量相似度快速筛选候选任务
            const candidates = await this.findCandidateTasks(student, limit * 2);
            // 对每个候选任务计算详细匹配分数
            const matches = [];
            for (const task of candidates) {
                try {
                    const matchScore = await this.matchTaskWithStudent(task.id, studentId);
                    matches.push({
                        taskId: task.id,
                        studentId,
                        matchScore
                    });
                }
                catch (error) {
                    logger_1.default.error(`Failed to match task ${task.id}:`, error);
                }
            }
            // 按总分排序
            matches.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore);
            // 添加排名
            matches.forEach((match, index) => {
                match.rank = index + 1;
            });
            return matches.slice(0, limit);
        }
        catch (error) {
            logger_1.default.error(`Failed to find best tasks for student ${studentId}:`, error);
            throw error;
        }
    }
    /**
     * 维度1: 技能匹配 (35%)
     * 基于技能向量相似度 + 技能熟练度匹配
     */
    async calculateSkillMatch(task, student) {
        let score = 0;
        const details = [];
        // 1. 向量相似度 (60%)
        if (task.combined_embedding && student.combined_vector) {
            const vectorSimilarity = vectorGenerationService_1.default.cosineSimilarity(task.combined_embedding, student.combined_vector);
            score += vectorSimilarity * 0.6;
            details.push(`向量相似度: ${(vectorSimilarity * 100).toFixed(1)}%`);
        }
        // 2. 技能覆盖率 (40%)
        const requiredSkills = task.required_skills || [];
        const studentSkills = student.skills || {};
        if (requiredSkills.length > 0) {
            let matchedSkills = 0;
            let totalProficiency = 0;
            for (const skill of requiredSkills) {
                const studentSkill = studentSkills[skill];
                if (studentSkill && studentSkill.proficiency) {
                    matchedSkills++;
                    totalProficiency += studentSkill.proficiency;
                }
            }
            const coverageRate = matchedSkills / requiredSkills.length;
            const avgProficiency = matchedSkills > 0 ? totalProficiency / matchedSkills : 0;
            score += (coverageRate * 0.6 + avgProficiency * 0.4) * 0.4;
            details.push(`技能覆盖: ${matchedSkills}/${requiredSkills.length}`);
            details.push(`平均熟练度: ${(avgProficiency * 100).toFixed(1)}%`);
        }
        return {
            score: Math.min(score, 1),
            weight: this.WEIGHTS.skillMatch,
            details: details.join(', ')
        };
    }
    /**
     * 维度2: 难度匹配 (20%)
     * 任务难度与学生能力水平的匹配度
     */
    calculateDifficultyMatch(task, student) {
        let score = 0;
        const details = [];
        // 任务难度等级映射
        const difficultyMap = {
            'beginner': 1,
            'intermediate': 2,
            'advanced': 3,
            'expert': 4
        };
        const taskDifficulty = difficultyMap[task.level_required] || 2;
        // 学生能力等级（基于完成任务数和质量）
        const tasksCompleted = student.tasks_completed || 0;
        const avgQuality = student.avg_task_quality || 0;
        let studentLevel = 1;
        if (tasksCompleted >= 20 && avgQuality >= 0.85) {
            studentLevel = 4; // expert
        }
        else if (tasksCompleted >= 10 && avgQuality >= 0.75) {
            studentLevel = 3; // advanced
        }
        else if (tasksCompleted >= 3 && avgQuality >= 0.65) {
            studentLevel = 2; // intermediate
        }
        // 计算匹配度：最佳匹配是任务难度 = 学生水平 或 学生水平 + 1（挑战性）
        const levelDiff = Math.abs(taskDifficulty - studentLevel);
        if (levelDiff === 0) {
            score = 1.0; // 完美匹配
            details.push('难度完美匹配');
        }
        else if (taskDifficulty === studentLevel + 1) {
            score = 0.9; // 适度挑战
            details.push('适度挑战');
        }
        else if (taskDifficulty === studentLevel - 1) {
            score = 0.7; // 略简单
            details.push('略低于能力');
        }
        else if (levelDiff === 2) {
            score = 0.4; // 差距较大
            details.push('难度差距较大');
        }
        else {
            score = 0.2; // 差距很大
            details.push('难度不匹配');
        }
        details.push(`任务难度: ${task.level_required}, 学生水平: ${studentLevel}`);
        return {
            score,
            weight: this.WEIGHTS.difficultyMatch,
            details: details.join(', ')
        };
    }
    /**
     * 维度3: 领域匹配 (15%)
     * 任务类型与学生偏好领域的匹配
     */
    calculateDomainMatch(task, student) {
        let score = 0;
        const details = [];
        const taskType = task.track_type;
        const preferredTypes = student.preferred_task_types || [];
        // 检查是否匹配偏好类型
        if (preferredTypes.includes(taskType)) {
            score = 1.0;
            details.push(`匹配偏好类型: ${taskType}`);
        }
        else if (preferredTypes.length === 0) {
            score = 0.7; // 学生没有明确偏好，给中等分
            details.push('学生无明确偏好');
        }
        else {
            score = 0.4; // 不匹配偏好
            details.push('不匹配偏好类型');
        }
        // OPC性格匹配
        if (task.required_openness && student.opc_openness) {
            const opennessDiff = Math.abs(task.required_openness - student.opc_openness);
            const opcMatch = Math.max(0, 1 - opennessDiff / 100);
            score = score * 0.7 + opcMatch * 0.3;
            details.push(`OPC开放性匹配: ${(opcMatch * 100).toFixed(0)}%`);
        }
        return {
            score: Math.min(score, 1),
            weight: this.WEIGHTS.domainMatch,
            details: details.join(', ')
        };
    }
    /**
     * 维度4: 成长潜力 (15%)
     * 任务对学生的成长价值
     */
    calculateGrowthPotential(task, student) {
        let score = 0;
        const details = [];
        // 1. 技能成长空间 (50%)
        const requiredSkills = task.required_skills || [];
        const studentSkills = student.skills || {};
        let newSkillsCount = 0;
        let improvableSkillsCount = 0;
        for (const skill of requiredSkills) {
            const studentSkill = studentSkills[skill];
            if (!studentSkill) {
                newSkillsCount++; // 新技能
            }
            else if (studentSkill.proficiency < 0.8) {
                improvableSkillsCount++; // 可提升技能
            }
        }
        const growthScore = requiredSkills.length > 0
            ? (newSkillsCount * 1.0 + improvableSkillsCount * 0.6) / requiredSkills.length
            : 0.5;
        score += growthScore * 0.5;
        details.push(`新技能: ${newSkillsCount}, 可提升: ${improvableSkillsCount}`);
        // 2. 学生成长趋势 (30%)
        const growthRate = student.growth_rate || 0;
        score += Math.min(growthRate, 1) * 0.3;
        details.push(`成长率: ${(growthRate * 100).toFixed(1)}%`);
        // 3. 任务挑战性 (20%)
        const qualityTrend = student.quality_trend;
        if (qualityTrend === 'improving') {
            score += 0.2; // 学生在进步，适合挑战
            details.push('学生处于上升期');
        }
        else if (qualityTrend === 'stable') {
            score += 0.15;
            details.push('学生表现稳定');
        }
        else {
            score += 0.05;
        }
        return {
            score: Math.min(score, 1),
            weight: this.WEIGHTS.growthPotential,
            details: details.join(', ')
        };
    }
    /**
     * 维度5: 可靠性 (10%)
     * 学生的历史表现和可靠性
     */
    calculateReliability(task, student) {
        let score = 0;
        const details = [];
        // 1. 准时交付率 (40%)
        const onTimeRate = student.on_time_delivery_rate || 0;
        score += onTimeRate * 0.4;
        details.push(`准时率: ${(onTimeRate * 100).toFixed(1)}%`);
        // 2. 平均质量 (30%)
        const avgQuality = student.avg_task_quality || 0;
        score += avgQuality * 0.3;
        details.push(`平均质量: ${(avgQuality * 100).toFixed(1)}%`);
        // 3. 客户满意度 (20%)
        const satisfaction = student.avg_client_satisfaction || 0;
        score += satisfaction * 0.2;
        details.push(`满意度: ${(satisfaction * 100).toFixed(1)}%`);
        // 4. 响应速度 (10%)
        const responseTime = student.avg_response_time_hours || 24;
        const responseScore = Math.max(0, 1 - responseTime / 48); // 48小时内响应得满分
        score += responseScore * 0.1;
        details.push(`平均响应: ${responseTime.toFixed(1)}小时`);
        return {
            score: Math.min(score, 1),
            weight: this.WEIGHTS.reliability,
            details: details.join(', ')
        };
    }
    /**
     * 维度6: 偏好对齐 (5%)
     * 学生的工作偏好与任务特征的匹配
     */
    calculatePreferenceAlignment(task, student) {
        let score = 0.5; // 默认中等分
        const details = [];
        // OPC性格匹配
        if (task.required_persistence && student.opc_persistence) {
            const persistenceDiff = Math.abs(task.required_persistence - student.opc_persistence);
            const persistenceMatch = Math.max(0, 1 - persistenceDiff / 100);
            score = score * 0.5 + persistenceMatch * 0.5;
            details.push(`坚持性匹配: ${(persistenceMatch * 100).toFixed(0)}%`);
        }
        if (task.required_creativity && student.opc_creativity) {
            const creativityDiff = Math.abs(task.required_creativity - student.opc_creativity);
            const creativityMatch = Math.max(0, 1 - creativityDiff / 100);
            score = score * 0.5 + creativityMatch * 0.5;
            details.push(`创造力匹配: ${(creativityMatch * 100).toFixed(0)}%`);
        }
        return {
            score: Math.min(score, 1),
            weight: this.WEIGHTS.preferenceAlignment,
            details: details.join(', ')
        };
    }
    /**
     * 使用向量相似度快速筛选候选学生
     * 这是真正的语义匹配：理解"言外之意"
     */
    async findCandidateStudents(task, limit) {
        try {
            // 阶段一：结构化过滤
            // 过滤条件：项目状态=上架、需求等级≤学生等级+1、时间投入≤学生可用时间、赛道匹配
            if (!task.requirement_vector || task.requirement_vector.length === 0) {
                // 如果任务没有向量，使用结构化过滤返回活跃学生
                return await (0, db_1.query)(`SELECT sc.* FROM student_capabilities sc
           JOIN users u ON sc.student_id = u.id
           WHERE u.role = 'student'
             AND u.status = 'active'
             AND (sc.max_hours_per_week IS NULL OR sc.max_hours_per_week >= 10)
           ORDER BY sc.tasks_completed DESC
           LIMIT $1`, [limit]);
            }
            // 阶段二：语义相似度排序
            // 在结构化过滤后的候选集中，使用pgvector余弦相似度排序
            // <=> 是余弦距离运算符，1 - 距离 = 相似度
            const candidates = await (0, db_1.query)(`SELECT sc.*,
                1 - (sc.profile_vector <=> $1::vector) AS similarity
         FROM student_capabilities sc
         JOIN users u ON sc.student_id = u.id
         WHERE u.role = 'student'
           AND u.status = 'active'
           AND sc.profile_vector IS NOT NULL
           -- 结构化过滤条件
           AND (
             -- 时间投入过滤：学生可用时间充足
             sc.max_hours_per_week IS NULL
             OR sc.max_hours_per_week >= 10
           )
           AND (
             -- 赛道匹配：如果学生有偏好赛道，检查是否匹配
             sc.preferred_task_types IS NULL
             OR array_length(sc.preferred_task_types, 1) IS NULL
             OR $2 = ANY(sc.preferred_task_types)
           )
         ORDER BY sc.profile_vector <=> $1::vector
         LIMIT $3`, [
                `[${task.requirement_vector.join(',')}]`,
                task.track_type || '',
                limit
            ]);
            logger_1.default.info(`Found ${candidates.length} candidate students using two-stage filtering (structured + semantic)`);
            return candidates;
        }
        catch (error) {
            logger_1.default.error('Failed to find candidate students:', error);
            return [];
        }
    }
    /**
     * 使用两阶段检索筛选候选任务
     * 阶段一：结构化过滤（状态、等级、预算、赛道）
     * 阶段二：语义相似度排序
     */
    async findCandidateTasks(student, limit) {
        try {
            // 获取学生的用户信息（等级）
            const userInfo = await (0, db_1.queryOne)(`SELECT level FROM users WHERE id = $1`, [student.student_id]);
            const studentLevel = userInfo?.level || 1;
            if (!student.profile_vector || student.profile_vector.length === 0) {
                // 如果学生没有向量，使用结构化过滤返回活跃任务
                return await (0, db_1.query)(`SELECT * FROM tasks
           WHERE status = 'open'
             AND matching_enabled = true
             AND (level_required IS NULL OR level_required <= $1 + 1)
           ORDER BY created_at DESC
           LIMIT $2`, [studentLevel, limit]);
            }
            // 阶段二：语义相似度排序
            // 在结构化过滤后的候选集中，使用pgvector余弦相似度排序
            const candidates = await (0, db_1.query)(`SELECT t.*,
                1 - (t.requirement_vector <=> $1::vector) AS similarity
         FROM tasks t
         WHERE t.status = 'open'
           AND t.matching_enabled = true
           AND t.requirement_vector IS NOT NULL
           -- 结构化过滤条件
           AND (
             -- 等级过滤：任务等级 ≤ 学生等级+1
             t.level_required IS NULL
             OR t.level_required <= $2 + 1
           )
           AND (
             -- 赛道过滤：如果学生有偏好赛道，优先匹配
             $3 IS NULL
             OR array_length($3::text[], 1) IS NULL
             OR t.track_type = ANY($3::text[])
           )
         ORDER BY t.requirement_vector <=> $1::vector
         LIMIT $4`, [
                `[${student.profile_vector.join(',')}]`,
                studentLevel,
                student.preferred_task_types,
                limit
            ]);
            logger_1.default.info(`Found ${candidates.length} candidate tasks using two-stage filtering`);
            return candidates;
        }
        catch (error) {
            logger_1.default.error('Failed to find candidate tasks:', error);
            return [];
        }
    }
    /**
     * 获取任务信息
     */
    async getTaskInfo(taskId) {
        try {
            const task = await (0, db_1.queryOne)(`SELECT id, title, description, required_skills, track_type, level_required,
                budget_min, budget_max, combined_embedding,
                required_openness, required_persistence, required_creativity
         FROM tasks WHERE id = $1`, [taskId]);
            return task;
        }
        catch (error) {
            logger_1.default.error(`Failed to get task info for ${taskId}:`, error);
            return null;
        }
    }
    /**
     * 获取学生能力信息
     */
    async getStudentCapability(studentId) {
        try {
            const capability = await (0, db_1.queryOne)(`SELECT * FROM student_capabilities WHERE student_id = $1`, [studentId]);
            return capability;
        }
        catch (error) {
            logger_1.default.error(`Failed to get student capability for ${studentId}:`, error);
            return null;
        }
    }
}
exports.default = new SemanticMatchingEngine();
//# sourceMappingURL=semanticMatchingEngine.js.map