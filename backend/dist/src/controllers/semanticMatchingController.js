"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedTasks = exports.pushToStudents = exports.getMatchedStudents = exports.triggerMatching = void 0;
const semanticMatchingEngine_1 = __importDefault(require("../services/semanticMatchingEngine"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 语义匹配控制器
 * 连接AI匹配引擎到API端点
 */
/**
 * 触发任务匹配
 * POST /api/v1/tasks/:taskId/trigger-matching
 */
const triggerMatching = async (req, res) => {
    const { taskId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    try {
        logger_1.default.info(`Triggering matching for task ${taskId}, limit ${limit}`);
        // 调用AI匹配引擎
        const matches = await semanticMatchingEngine_1.default.findBestStudentsForTask(taskId, limit);
        if (matches.length === 0) {
            return res.json({
                success: true,
                matchedCount: 0,
                message: '未找到合适的学生，请检查任务要求或学生数据'
            });
        }
        res.json({
            success: true,
            matchedCount: matches.length,
            topScore: matches[0]?.overallScore || 0,
            message: `成功为任务匹配${matches.length}个学生`
        });
    }
    catch (error) {
        logger_1.default.error('Trigger matching failed:', error);
        res.status(500).json({
            error: '匹配失败',
            message: error.message
        });
    }
};
exports.triggerMatching = triggerMatching;
/**
 * 获取任务的匹配学生列表
 * GET /api/v1/tasks/:taskId/matched-students
 */
const getMatchedStudents = async (req, res) => {
    const { taskId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const matches = await semanticMatchingEngine_1.default.getMatchedStudentsForTask(taskId, limit);
        res.json({
            success: true,
            students: matches.map(match => ({
                studentId: match.student_id,
                nickname: match.student_nickname,
                avatar: match.student_avatar,
                level: match.student_level,
                overallScore: Math.round(match.overallScore * 100),
                skillMatch: Math.round(match.skillMatch * 100),
                difficultyMatch: Math.round(match.difficultyMatch * 100),
                domainMatch: Math.round(match.domainMatch * 100),
                growthPotential: Math.round(match.growthPotential * 100),
                reliability: Math.round(match.reliability * 100),
                preferenceAlignment: Math.round(match.preferenceAlignment * 100),
                matchReason: match.match_reason,
                matchedAt: match.created_at
            }))
        });
    }
    catch (error) {
        logger_1.default.error('Get matched students failed:', error);
        res.status(500).json({
            error: '获取失败',
            message: error.message
        });
    }
};
exports.getMatchedStudents = getMatchedStudents;
/**
 * 推送任务给选中的学生
 * POST /api/v1/tasks/:taskId/push-to-students
 */
const pushToStudents = async (req, res) => {
    const { taskId } = req.params;
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: 'studentIds必须是非空数组' });
    }
    try {
        const result = await semanticMatchingEngine_1.default.pushTaskToStudents(taskId, studentIds);
        res.json({
            success: true,
            pushedCount: result.pushedCount,
            message: `成功推送任务给${result.pushedCount}个学生`
        });
    }
    catch (error) {
        logger_1.default.error('Push to students failed:', error);
        res.status(500).json({
            error: '推送失败',
            message: error.message
        });
    }
};
exports.pushToStudents = pushToStudents;
/**
 * 学生查看推荐任务
 * GET /api/v1/students/recommended-tasks
 */
const getRecommendedTasks = async (req, res) => {
    const studentId = req.user?.id;
    if (!studentId) {
        return res.status(401).json({ error: '未登录' });
    }
    try {
        const tasks = await semanticMatchingEngine_1.default.getRecommendedTasksForStudent(studentId);
        res.json({
            success: true,
            tasks: tasks.map(task => ({
                taskId: task.task_id,
                title: task.task_title,
                description: task.task_description,
                track: task.task_track,
                level: task.task_level,
                budget: task.task_budget,
                duration: task.task_duration,
                match_score: Math.round(task.overallScore * 100),
                matchReason: task.match_reason,
                studentFriendlyTitle: task.student_friendly_title,
                whatYouWillDo: task.what_you_will_do,
                whatYouWillLearn: task.what_you_will_learn,
                estimatedHours: task.estimated_hours,
                pushedAt: task.pushed_at
            }))
        });
    }
    catch (error) {
        logger_1.default.error('Get recommended tasks failed:', error);
        res.status(500).json({
            error: '获取失败',
            message: error.message
        });
    }
};
exports.getRecommendedTasks = getRecommendedTasks;
//# sourceMappingURL=semanticMatchingController.js.map