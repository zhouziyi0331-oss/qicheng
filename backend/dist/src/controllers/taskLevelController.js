"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyTasks = exports.getTaskDetail = exports.acceptTask = exports.getRecommendedTasks = exports.getMatchedStudents = exports.confirmPublishTask = exports.publishTask = void 0;
const db_1 = require("../utils/db");
const matchingService_1 = require("../services/matchingService");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 企业发布任务（增强版，包含赛道和等级）
 */
const publishTask = async (req, res) => {
    const client = await db_1.pool.connect();
    try {
        const { title, description, track, // 'content' 或 'tool'
        level, // 0-4
        requiredAbilities, // { openness, persistence, creativity }
        budget, deadline, duration, deliverables, // 数组
        tags, } = req.body;
        const companyId = req.user?.userId;
        // 验证必填字段
        if (!title || !description || !track || level === undefined || !budget || !deadline) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段',
            });
        }
        // 验证赛道和等级
        if (!['content', 'tool'].includes(track)) {
            return res.status(400).json({
                success: false,
                message: '赛道必须是 content 或 tool',
            });
        }
        if (level < 0 || level > 4) {
            return res.status(400).json({
                success: false,
                message: '等级必须在 0-4 之间',
            });
        }
        await client.query('BEGIN');
        // 计算平台抽成（15%）
        const platformFeeRate = 0.15;
        const platformFee = budget * platformFeeRate;
        const studentPrice = budget - platformFee;
        // 生成预算区间显示
        const budgetRange = generateBudgetRange(level);
        // 插入任务
        const taskResult = await client.query(`INSERT INTO tasks
       (company_id, title, description, track, level,
        required_openness, required_persistence, required_creativity,
        company_price, student_price, platform_fee, budget_range,
        deadline, duration, deliverables, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft')
       RETURNING *`, [
            companyId,
            title,
            description,
            track,
            level,
            requiredAbilities?.openness || 50,
            requiredAbilities?.persistence || 50,
            requiredAbilities?.creativity || 50,
            budget,
            studentPrice,
            platformFee,
            budgetRange,
            deadline,
            duration,
            JSON.stringify(deliverables || []),
            JSON.stringify(tags || []),
        ]);
        const task = taskResult.rows[0];
        await client.query('COMMIT');
        res.json({
            success: true,
            message: '任务创建成功',
            data: {
                taskId: task.id,
                task: {
                    ...task,
                    deliverables: JSON.parse(task.deliverables || '[]'),
                    tags: JSON.parse(task.tags || '[]'),
                },
            },
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.default.error('Error publishing task', { error });
        res.status(500).json({
            success: false,
            message: '发布任务失败',
        });
    }
    finally {
        client.release();
    }
};
exports.publishTask = publishTask;
/**
 * 生成预算区间显示
 */
function generateBudgetRange(level) {
    const ranges = {
        0: '50-200元',
        1: '200-800元',
        2: '800-2000元',
        3: '2000-5000元',
        4: '5000-20000元',
    };
    return ranges[level] || '未知';
}
/**
 * 企业确认发布任务（从草稿到已发布）
 */
const confirmPublishTask = async (req, res) => {
    const client = await db_1.pool.connect();
    try {
        const { taskId } = req.params;
        const companyId = req.user?.userId;
        await client.query('BEGIN');
        // 验证任务所有权
        const taskResult = await client.query('SELECT * FROM tasks WHERE id = $1 AND company_id = $2', [taskId, companyId]);
        if (taskResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: '任务不存在或无权限',
            });
        }
        const task = taskResult.rows[0];
        // 更新任务状态为已发布
        await client.query(`UPDATE tasks SET status = 'published', published_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [taskId]);
        // 触发智能匹配
        const matches = await matchingService_1.matchingService.matchStudentsForTask(parseInt(taskId), 10);
        await matchingService_1.matchingService.saveMatchResults(matches);
        await client.query('COMMIT');
        res.json({
            success: true,
            message: '任务已发布，正在匹配合适的学生',
            data: {
                taskId: task.id,
                matchedStudentsCount: matches.length,
            },
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.default.error('Error confirming task publication', { error });
        res.status(500).json({
            success: false,
            message: '发布任务失败',
        });
    }
    finally {
        client.release();
    }
};
exports.confirmPublishTask = confirmPublishTask;
/**
 * 获取任务的匹配学生列表（Top 3）
 */
const getMatchedStudents = async (req, res) => {
    try {
        const { taskId } = req.params;
        const companyId = req.user?.userId;
        // 验证任务所有权
        const taskResult = await db_1.pool.query('SELECT * FROM tasks WHERE id = $1 AND company_id = $2', [taskId, companyId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '任务不存在或无权限',
            });
        }
        // 获取匹配的学生（Top 3）
        const matchedStudents = await matchingService_1.matchingService.getMatchedStudentsForTask(parseInt(taskId), 3);
        res.json({
            success: true,
            data: {
                students: matchedStudents,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting matched students', { error });
        res.status(500).json({
            success: false,
            message: '获取匹配学生失败',
        });
    }
};
exports.getMatchedStudents = getMatchedStudents;
/**
 * 学生获取推荐任务列表
 */
const getRecommendedTasks = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { limit = 20 } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '用户未登录',
            });
        }
        const userIdNum = parseInt(userId);
        // 检查是否已有匹配结果，如果没有则触发匹配
        const existingMatches = await db_1.pool.query('SELECT COUNT(*) FROM ai_matches WHERE student_id = $1', [userIdNum]);
        if (parseInt(existingMatches.rows[0].count) === 0) {
            // 首次访问，触发匹配
            const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
            const matches = await matchingService_1.matchingService.matchTasksForStudent(userIdNum, limitNum);
            await matchingService_1.matchingService.saveMatchResults(matches);
        }
        // 获取推荐任务
        const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
        const recommendedTasks = await matchingService_1.matchingService.getMatchedTasksForStudent(userIdNum, limitNum);
        res.json({
            success: true,
            data: {
                tasks: recommendedTasks,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting recommended tasks', { error });
        res.status(500).json({
            success: false,
            message: '获取推荐任务失败',
        });
    }
};
exports.getRecommendedTasks = getRecommendedTasks;
/**
 * 学生接受任务
 */
const acceptTask = async (req, res) => {
    const client = await db_1.pool.connect();
    try {
        const { taskId } = req.params;
        const studentId = req.user?.userId;
        await client.query('BEGIN');
        // 检查任务是否可接
        const taskResult = await client.query(`SELECT * FROM tasks
       WHERE id = $1 AND status = 'published' AND accepted_student_id IS NULL`, [taskId]);
        if (taskResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '任务不可接取',
            });
        }
        const task = taskResult.rows[0];
        // 检查学生等级是否符合
        const studentResult = await client.query('SELECT current_level FROM student_abilities WHERE user_id = $1', [studentId]);
        if (studentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '学生能力画像不存在',
            });
        }
        const studentLevel = studentResult.rows[0].current_level;
        const levelDiff = Math.abs(task.level - studentLevel);
        if (levelDiff > 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '任务等级与您的等级差距过大',
            });
        }
        // 更新任务状态
        await client.query(`UPDATE tasks
       SET accepted_student_id = $1, status = 'in_progress', accepted_at = CURRENT_TIMESTAMP
       WHERE id = $2`, [studentId, taskId]);
        // 更新匹配记录
        await client.query(`UPDATE ai_matches
       SET invitation_status = 'accepted', responded_at = CURRENT_TIMESTAMP
       WHERE task_id = $1 AND student_id = $2`, [taskId, studentId]);
        await client.query('COMMIT');
        res.json({
            success: true,
            message: '任务接取成功',
            data: {
                taskId: task.id,
            },
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.default.error('Error accepting task', { error });
        res.status(500).json({
            success: false,
            message: '接取任务失败',
        });
    }
    finally {
        client.release();
    }
};
exports.acceptTask = acceptTask;
/**
 * 获取任务详情（包含匹配信息）
 */
const getTaskDetail = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        // 获取任务基本信息
        const taskResult = await db_1.pool.query(`SELECT t.*, c.company_name, c.rating as company_rating
       FROM tasks t
       JOIN companies c ON t.company_id = c.id
       WHERE t.id = $1`, [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '任务不存在',
            });
        }
        const task = taskResult.rows[0];
        // 如果是学生，获取匹配信息
        let matchInfo = null;
        if (userRole === 'student') {
            const matchResult = await db_1.pool.query(`SELECT match_score, difficulty_level, match_reasons,
                estimated_growth_openness, estimated_growth_persistence, estimated_growth_creativity
         FROM ai_matches
         WHERE task_id = $1 AND student_id = $2`, [taskId, userId]);
            if (matchResult.rows.length > 0) {
                const match = matchResult.rows[0];
                matchInfo = {
                    matchScore: match.match_score,
                    difficultyLevel: match.difficulty_level,
                    matchReasons: match.match_reasons,
                    estimatedGrowth: {
                        openness: match.estimated_growth_openness,
                        persistence: match.estimated_growth_persistence,
                        creativity: match.estimated_growth_creativity,
                    },
                };
            }
        }
        res.json({
            success: true,
            data: {
                task: {
                    ...task,
                    deliverables: JSON.parse(task.deliverables || '[]'),
                    tags: JSON.parse(task.tags || '[]'),
                },
                matchInfo,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting task detail', { error });
        res.status(500).json({
            success: false,
            message: '获取任务详情失败',
        });
    }
};
exports.getTaskDetail = getTaskDetail;
/**
 * 企业获取任务列表
 */
const getCompanyTasks = async (req, res) => {
    try {
        const companyId = req.user?.userId;
        const { status, page = 1, limit = 20 } = req.query;
        let query = `
      SELECT t.*, COUNT(am.id) as matched_students_count
      FROM tasks t
      LEFT JOIN ai_matches am ON t.id = am.task_id
      WHERE t.company_id = $1
    `;
        const params = [companyId];
        if (status) {
            query += ` AND t.status = $${params.length + 1}`;
            params.push(status);
        }
        query += `
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        params.push(parseInt(limit));
        params.push((parseInt(page) - 1) * parseInt(limit));
        const result = await db_1.pool.query(query, params);
        res.json({
            success: true,
            data: {
                tasks: result.rows.map((task) => ({
                    ...task,
                    deliverables: JSON.parse(task.deliverables || '[]'),
                    tags: JSON.parse(task.tags || '[]'),
                })),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting company tasks', { error });
        res.status(500).json({
            success: false,
            message: '获取任务列表失败',
        });
    }
};
exports.getCompanyTasks = getCompanyTasks;
//# sourceMappingURL=taskLevelController.js.map