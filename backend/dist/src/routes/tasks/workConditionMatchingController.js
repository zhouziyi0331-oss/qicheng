"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStudentProfile = generateStudentProfile;
exports.getStudentProfile = getStudentProfile;
exports.generateTaskRequirement = generateTaskRequirement;
exports.getTaskRequirement = getTaskRequirement;
exports.triggerWorkConditionMatching = triggerWorkConditionMatching;
exports.getWorkConditionMatches = getWorkConditionMatches;
exports.getRecommendedTasksForStudent = getRecommendedTasksForStudent;
exports.getMatchDetail = getMatchDetail;
const db_1 = require("../../utils/db");
const logger_1 = __importDefault(require("../../utils/logger"));
const opcAnalysisService_1 = __importDefault(require("../../services/opcAnalysisService"));
const projectAnalysisService_1 = __importDefault(require("../../services/projectAnalysisService"));
const workConditionMatchingEngine_1 = __importDefault(require("../../services/workConditionMatchingEngine"));
/**
 * 工作条件匹配控制器
 * 基于OPC测试结果的工作条件画像进行智能匹配
 */
/**
 * 学生完成OPC测试后，生成工作条件画像
 * POST /api/v1/work-condition/student/:studentId/generate-profile
 */
async function generateStudentProfile(req, res) {
    try {
        const { studentId } = req.params;
        const userId = req.user?.id;
        // 验证权限（学生只能生成自己的画像）
        if (userId !== studentId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: '无权操作' });
        }
        // 获取学生最新的OPC测试结果
        const opcResult = await (0, db_1.queryOne)(`SELECT id, student_id, answers, scores, completed_at
       FROM opc_v2_assessments
       WHERE student_id = $1 AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1`, [studentId]);
        if (!opcResult) {
            return res.status(404).json({ error: '未找到OPC测试结果，请先完成测试' });
        }
        // 生成工作条件画像
        const profile = await opcAnalysisService_1.default.generateWorkConditionProfile({
            studentId,
            answers: opcResult.answers,
            scores: opcResult.scores
        });
        // 保存到数据库
        await opcAnalysisService_1.default.saveWorkConditionProfile(profile);
        logger_1.default.info(`Generated work condition profile for student ${studentId}`);
        res.json({
            success: true,
            profile: {
                studentId: profile.studentId,
                informationReception: profile.informationReception,
                creationDrive: profile.creationDrive,
                learningApproach: profile.learningApproach,
                executionRhythm: profile.executionRhythm,
                autonomyNeed: profile.autonomyNeed,
                riskTolerance: profile.riskTolerance,
                coreStrengths: profile.coreStrengths,
                profileText: profile.profileText
            },
            message: '工作条件画像生成成功'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to generate student profile:', error);
        res.status(500).json({ error: '生成画像失败，请稍后重试' });
    }
}
/**
 * 获取学生的工作条件画像
 * GET /api/v1/work-condition/student/:studentId/profile
 */
async function getStudentProfile(req, res) {
    try {
        const { studentId } = req.params;
        const profile = await (0, db_1.queryOne)(`SELECT * FROM student_work_condition_profiles WHERE student_id = $1`, [studentId]);
        if (!profile) {
            return res.status(404).json({ error: '未找到工作条件画像' });
        }
        res.json({
            success: true,
            profile: {
                studentId: profile.student_id,
                informationReception: profile.information_reception,
                creationDrive: profile.creation_drive,
                learningApproach: profile.learning_approach,
                executionRhythm: profile.execution_rhythm,
                autonomyNeed: profile.autonomy_need,
                riskTolerance: profile.risk_tolerance,
                profileText: profile.profile_text,
                coreStrengths: profile.core_strengths,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get student profile:', error);
        res.status(500).json({ error: '获取画像失败' });
    }
}
/**
 * 企业发布任务后，生成需求条件画像
 * POST /api/v1/work-condition/task/:taskId/generate-requirement
 */
async function generateTaskRequirement(req, res) {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id;
        const { async = true } = req.body; // 支持同步/异步模式
        // 获取任务信息
        const task = await (0, db_1.queryOne)(`SELECT id, company_id, title, description, deliverable_type,
              duration_days, budget_min, budget_max
       FROM tasks WHERE id = $1`, [taskId]);
        if (!task) {
            return res.status(404).json({ error: '任务不存在' });
        }
        if (task.company_id !== userId) {
            return res.status(403).json({ error: '无权操作此任务' });
        }
        // 异步模式：添加到队列
        if (async) {
            const { enqueueAITask, AITaskType } = require('../../services/aiTaskQueue');
            await enqueueAITask({
                type: AITaskType.PROJECT_CONDITION_ANALYSIS,
                taskId,
                title: task.title,
                description: task.description,
                deliverableType: task.deliverable_type || '混合',
                cycle: task.duration_days || 14,
                budget: (task.budget_min + task.budget_max) / 2
            });
            logger_1.default.info(`Enqueued requirement profile generation for task ${taskId}`);
            return res.json({
                success: true,
                message: '需求条件画像生成任务已提交，请稍后查询结果',
                taskId,
                async: true
            });
        }
        // 同步模式：立即生成
        const hasReference = task.description.includes('参考') ||
            task.description.includes('案例') ||
            task.description.includes('示例');
        let communicationStyle = '适度';
        if (task.description.includes('频繁沟通') || task.description.includes('及时反馈')) {
            communicationStyle = '频繁';
        }
        else if (task.description.includes('独立完成') || task.description.includes('自主')) {
            communicationStyle = '放手';
        }
        const profile = await projectAnalysisService_1.default.generateRequirementProfile({
            taskId,
            title: task.title,
            description: task.description,
            deliverableType: task.deliverable_type || '混合',
            cycle: task.duration_days || 14,
            budget: (task.budget_min + task.budget_max) / 2,
            hasReference,
            clientCommunicationStyle: communicationStyle
        });
        await projectAnalysisService_1.default.saveRequirementProfile(profile);
        logger_1.default.info(`Generated requirement profile for task ${taskId}`);
        res.json({
            success: true,
            profile: {
                taskId: profile.taskId,
                informationReceptionNeed: profile.informationReceptionNeed,
                creationDriveNeed: profile.creationDriveNeed,
                learningApproachNeed: profile.learningApproachNeed,
                executionRhythmNeed: profile.executionRhythmNeed,
                autonomyNeed: profile.autonomyNeed,
                riskLevel: profile.riskLevel,
                projectType: profile.projectType,
                requirementText: profile.requirementText
            },
            message: '需求条件画像生成成功',
            async: false
        });
    }
    catch (error) {
        logger_1.default.error('Failed to generate task requirement:', error);
        res.status(500).json({ error: '生成需求画像失败，请稍后重试' });
    }
}
/**
 * 获取任务的需求条件画像
 * GET /api/v1/work-condition/task/:taskId/requirement
 */
async function getTaskRequirement(req, res) {
    try {
        const { taskId } = req.params;
        const profile = await (0, db_1.queryOne)(`SELECT * FROM project_requirement_profiles WHERE task_id = $1`, [taskId]);
        if (!profile) {
            return res.status(404).json({ error: '未找到需求条件画像' });
        }
        res.json({
            success: true,
            profile: {
                taskId: profile.task_id,
                informationReceptionNeed: profile.information_reception_need,
                creationDriveNeed: profile.creation_drive_need,
                learningApproachNeed: profile.learning_approach_need,
                executionRhythmNeed: profile.execution_rhythm_need,
                autonomyNeed: profile.autonomy_need,
                riskLevel: profile.risk_level,
                requirementText: profile.requirement_text,
                projectType: profile.project_type,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get task requirement:', error);
        res.status(500).json({ error: '获取需求画像失败' });
    }
}
/**
 * 触发工作条件匹配
 * POST /api/v1/work-condition/task/:taskId/match
 */
async function triggerWorkConditionMatching(req, res) {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id;
        // 验证任务存在且属于当前企业
        const task = await (0, db_1.queryOne)(`SELECT id, company_id FROM tasks WHERE id = $1`, [taskId]);
        if (!task) {
            return res.status(404).json({ error: '任务不存在' });
        }
        if (task.company_id !== userId) {
            return res.status(403).json({ error: '无权操作此任务' });
        }
        // 1. 确保任务有需求条件画像
        let taskProfile = await (0, db_1.queryOne)(`SELECT task_id FROM project_requirement_profiles WHERE task_id = $1`, [taskId]);
        if (!taskProfile) {
            // 自动生成需求条件画像
            const taskInfo = await (0, db_1.queryOne)(`SELECT title, description, deliverable_type, duration_days, budget_min, budget_max
         FROM tasks WHERE id = $1`, [taskId]);
            if (taskInfo) {
                const hasReference = taskInfo.description.includes('参考') ||
                    taskInfo.description.includes('案例');
                let communicationStyle = '适度';
                if (taskInfo.description.includes('频繁沟通')) {
                    communicationStyle = '频繁';
                }
                else if (taskInfo.description.includes('独立完成')) {
                    communicationStyle = '放手';
                }
                const profile = await projectAnalysisService_1.default.generateRequirementProfile({
                    taskId,
                    title: taskInfo.title,
                    description: taskInfo.description,
                    deliverableType: taskInfo.deliverable_type || '混合',
                    cycle: taskInfo.duration_days || 14,
                    budget: (taskInfo.budget_min + taskInfo.budget_max) / 2,
                    hasReference,
                    clientCommunicationStyle: communicationStyle
                });
                await projectAnalysisService_1.default.saveRequirementProfile(profile);
            }
        }
        // 2. 获取所有有工作条件画像的学生
        const students = await (0, db_1.query)(`SELECT student_id FROM student_work_condition_profiles`);
        if (students.length === 0) {
            return res.json({
                success: true,
                matchedCount: 0,
                message: '暂无学生完成工作条件画像'
            });
        }
        // 3. 对每个学生进行匹配
        const matches = [];
        for (const student of students) {
            const matchResult = await workConditionMatchingEngine_1.default.analyzeMatch(taskId, student.student_id);
            matches.push({
                studentId: student.student_id,
                ...matchResult
            });
        }
        // 4. 按匹配分数排序
        matches.sort((a, b) => b.fitScore - a.fitScore);
        // 5. 保存匹配结果到数据库
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            await (0, db_1.query)(`INSERT INTO work_condition_matches (
          task_id, student_id, overall_fit, fit_score,
          dimension_matches, match_points, friction_points,
          adjustment_suggestions, recommendation_for_student,
          recommendation_for_company, vector_similarity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (task_id, student_id) DO UPDATE SET
          overall_fit = EXCLUDED.overall_fit,
          fit_score = EXCLUDED.fit_score,
          dimension_matches = EXCLUDED.dimension_matches,
          match_points = EXCLUDED.match_points,
          friction_points = EXCLUDED.friction_points,
          adjustment_suggestions = EXCLUDED.adjustment_suggestions,
          recommendation_for_student = EXCLUDED.recommendation_for_student,
          recommendation_for_company = EXCLUDED.recommendation_for_company,
          vector_similarity = EXCLUDED.vector_similarity`, [
                taskId,
                match.studentId,
                match.overallFit,
                match.fitScore,
                JSON.stringify(match.dimensionMatches),
                match.matchPoints,
                match.frictionPoints || [],
                match.adjustmentSuggestions || [],
                match.recommendationForStudent,
                match.recommendationForCompany,
                0.0 // vector_similarity暂时设为0，后续可以添加向量匹配
            ]);
        }
        logger_1.default.info(`Work condition matching completed for task ${taskId}, found ${matches.length} students`);
        res.json({
            success: true,
            matchedCount: matches.length,
            topMatches: matches.slice(0, 10).map(m => ({
                studentId: m.studentId,
                fitScore: m.fitScore,
                overallFit: m.overallFit,
                matchPoints: m.matchPoints
            })),
            message: `成功匹配${matches.length}个学生`
        });
    }
    catch (error) {
        logger_1.default.error('Failed to trigger work condition matching:', error);
        res.status(500).json({ error: '匹配失败，请稍后重试' });
    }
}
/**
 * 企业查看工作条件匹配结果
 * GET /api/v1/work-condition/task/:taskId/matches
 */
async function getWorkConditionMatches(req, res) {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 20;
        // 验证任务存在且属于当前企业
        const task = await (0, db_1.queryOne)(`SELECT id, company_id FROM tasks WHERE id = $1`, [taskId]);
        if (!task) {
            return res.status(404).json({ error: '任务不存在' });
        }
        if (task.company_id !== userId) {
            return res.status(403).json({ error: '无权查看此任务的匹配结果' });
        }
        // 获取匹配结果
        const matches = await (0, db_1.query)(`SELECT
        wcm.student_id,
        wcm.overall_fit,
        wcm.fit_score,
        wcm.dimension_matches,
        wcm.match_points,
        wcm.friction_points,
        wcm.adjustment_suggestions,
        wcm.recommendation_for_company,
        u.username,
        u.avatar_url,
        u.bio,
        swcp.core_strengths
       FROM work_condition_matches wcm
       JOIN users u ON wcm.student_id = u.id
       LEFT JOIN student_work_condition_profiles swcp ON wcm.student_id = swcp.student_id
       WHERE wcm.task_id = $1
       ORDER BY wcm.fit_score DESC
       LIMIT $2`, [taskId, limit]);
        res.json({
            success: true,
            matches: matches.map(m => ({
                studentId: m.student_id,
                username: m.username,
                avatarUrl: m.avatar_url,
                bio: m.bio,
                coreStrengths: m.core_strengths || [],
                overallFit: m.overall_fit,
                fitScore: m.fit_score,
                dimensionMatches: m.dimension_matches,
                matchPoints: m.match_points,
                frictionPoints: m.friction_points || [],
                adjustmentSuggestions: m.adjustment_suggestions || [],
                recommendation: m.recommendation_for_company
            }))
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get work condition matches:', error);
        res.status(500).json({ error: '获取匹配结果失败' });
    }
}
/**
 * 学生查看推荐任务（基于工作条件匹配）
 * GET /api/v1/work-condition/student/recommended-tasks
 */
async function getRecommendedTasksForStudent(req, res) {
    try {
        const userId = req.user?.id;
        const minFitScore = parseFloat(req.query.minFitScore) || 0.6;
        // 获取推荐任务
        const tasks = await (0, db_1.query)(`SELECT
        wcm.task_id,
        wcm.overall_fit,
        wcm.fit_score,
        wcm.match_points,
        wcm.recommendation_for_student,
        t.title,
        t.description,
        t.budget_min,
        t.budget_max,
        t.duration_days,
        t.deliverable_type,
        u.username as company_name,
        prp.project_type,
        t.status
       FROM work_condition_matches wcm
       JOIN tasks t ON wcm.task_id = t.id
       JOIN users u ON t.company_id = u.id
       LEFT JOIN project_requirement_profiles prp ON t.id = prp.task_id
       WHERE wcm.student_id = $1
         AND wcm.fit_score >= $2
         AND t.status = 'open'
       ORDER BY wcm.fit_score DESC`, [userId, minFitScore]);
        res.json({
            success: true,
            tasks: tasks.map(t => ({
                taskId: t.task_id,
                title: t.title,
                description: t.description,
                budgetMin: t.budget_min,
                budgetMax: t.budget_max,
                durationDays: t.duration_days,
                deliverableType: t.deliverable_type,
                companyName: t.company_name,
                projectType: t.project_type,
                overallFit: t.overall_fit,
                fitScore: t.fit_score,
                matchPoints: t.match_points,
                recommendation: t.recommendation_for_student
            }))
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get recommended tasks for student:', error);
        res.status(500).json({ error: '获取推荐任务失败' });
    }
}
/**
 * 查看具体任务的匹配详情（学生视角）
 * GET /api/v1/work-condition/task/:taskId/match-detail
 */
async function getMatchDetail(req, res) {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id;
        // 获取匹配详情
        const match = await (0, db_1.queryOne)(`SELECT
        overall_fit,
        fit_score,
        dimension_matches,
        match_points,
        friction_points,
        adjustment_suggestions,
        recommendation_for_student
       FROM work_condition_matches
       WHERE task_id = $1 AND student_id = $2`, [taskId, userId]);
        if (!match) {
            return res.status(404).json({ error: '未找到匹配记录' });
        }
        res.json({
            success: true,
            match: {
                overallFit: match.overall_fit,
                fitScore: match.fit_score,
                dimensionMatches: match.dimension_matches,
                matchPoints: match.match_points,
                frictionPoints: match.friction_points || [],
                adjustmentSuggestions: match.adjustment_suggestions || [],
                recommendation: match.recommendation_for_student
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get match detail:', error);
        res.status(500).json({ error: '获取匹配详情失败' });
    }
}
//# sourceMappingURL=workConditionMatchingController.js.map