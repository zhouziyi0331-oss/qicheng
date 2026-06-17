"use strict";
// 管理后台API - 获取所有数据
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = express_1.default.Router();
// ══════════════════════════════════════════════════════════════
// 统计数据API
// ══════════════════════════════════════════════════════════════
// 今日统计数据
router.get('/stats/today', async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        // 今日活跃学生数
        const activeStudents = await (0, db_1.queryOne)(`SELECT COUNT(DISTINCT student_id) as count 
       FROM mentor_conversations 
       WHERE DATE(created_at) = $1`, [today]);
        // 今日对话总数
        const totalConversations = await (0, db_1.queryOne)(`SELECT COUNT(*) as count 
       FROM mentor_conversations 
       WHERE DATE(created_at) = $1`, [today]);
        // 需求确认成功率
        const confirmationStats = await (0, db_1.queryOne)(`SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed
       FROM requirement_confirmation_sessions 
       WHERE DATE(started_at) = $1`, [today]);
        const confirmationRate = confirmationStats?.total
            ? Math.round((confirmationStats.confirmed / confirmationStats.total) * 100)
            : 0;
        // AI审核通过率
        const reviewStats = await (0, db_1.queryOne)(`SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE pass_review = true) as passed
       FROM ai_submission_reviews 
       WHERE DATE(created_at) = $1`, [today]);
        const reviewPassRate = reviewStats?.total
            ? Math.round((reviewStats.passed / reviewStats.total) * 100)
            : 0;
        res.json({
            success: true,
            data: {
                activeStudents: activeStudents?.count || 0,
                totalConversations: totalConversations?.count || 0,
                confirmationRate,
                reviewPassRate
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 总览数据（按时间段）
router.get('/overview/hourly', async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const hourlyData = await (0, db_1.query)(`SELECT 
         EXTRACT(HOUR FROM created_at) as hour,
         COUNT(*) as total_conversations,
         COUNT(*) FILTER (WHERE stage = 'requirement_confirmation') as requirement_confirmations,
         COUNT(*) FILTER (WHERE stage = 'execution_guidance') as guidance_sessions,
         COUNT(*) FILTER (WHERE stage = 'quality_review') as quality_reviews,
         AVG(accuracy_score) FILTER (WHERE accuracy_score IS NOT NULL) as avg_accuracy
       FROM mentor_conversations
       WHERE DATE(created_at) = $1
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour`, [today]);
        res.json({
            success: true,
            data: hourlyData
        });
    }
    catch (error) {
        next(error);
    }
});
// ══════════════════════════════════════════════════════════════
// 学生端数据API
// ══════════════════════════════════════════════════════════════
// 学生列表
router.get('/students', async (req, res, next) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = '';
        let params = [];
        if (search) {
            whereClause = 'WHERE u.nickname ILIKE $1 OR sp.opc_label ILIKE $1';
            params.push(`%${search}%`);
        }
        const students = await (0, db_1.query)(`SELECT 
         u.id,
         u.nickname,
         u.avatar,
         sp.opc_label,
         sp.level,
         sp.task_count,
         COUNT(DISTINCT mc.id) as ai_guidance_count,
         AVG(rcs.accuracy_score) as avg_understanding_accuracy,
         COUNT(DISTINCT asr.id) FILTER (WHERE asr.pass_review = true) as passed_submissions,
         COUNT(DISTINCT asr.id) as total_submissions
       FROM users u
       LEFT JOIN users u ON u.id = u.id
       LEFT JOIN mentor_conversations mc ON u.id = mc.student_id
       LEFT JOIN requirement_confirmation_sessions rcs ON u.id = rcs.student_id
       LEFT JOIN ai_submission_reviews asr ON u.id = asr.student_id
       ${whereClause}
       GROUP BY u.id, u.nickname, u.avatar, sp.opc_label, sp.level, sp.task_count
       ORDER BY sp.task_count DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
        // 计算通过率
        const studentsWithRate = students.map((s) => ({
            ...s,
            submission_pass_rate: s.total_submissions
                ? Math.round((s.passed_submissions / s.total_submissions) * 100)
                : 0
        }));
        res.json({
            success: true,
            data: studentsWithRate
        });
    }
    catch (error) {
        next(error);
    }
});
// 学生详情
router.get('/students/:studentId', async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const student = await (0, db_1.queryOne)(`SELECT 
         u.*,
         sp.*,
         COUNT(DISTINCT t.id) as total_tasks,
         COUNT(DISTINCT mc.id) as total_conversations,
         AVG(rcs.accuracy_score) as avg_accuracy
       FROM users u
       LEFT JOIN users u ON u.id = u.id
       LEFT JOIN task_assignments ta ON u.id = ta.student_id
       LEFT JOIN tasks t ON ta.task_id = t.id
       LEFT JOIN mentor_conversations mc ON u.id = mc.student_id
       LEFT JOIN requirement_confirmation_sessions rcs ON u.id = rcs.student_id
       WHERE u.id = $1
       GROUP BY u.id, u.id`, [studentId]);
        if (!student) {
            throw new errorHandler_1.AppError(404, '学生不存在');
        }
        // 获取最近的对话
        const recentConversations = await (0, db_1.query)(`SELECT * FROM mentor_conversations 
       WHERE student_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`, [studentId]);
        // 获取任务列表
        const tasks = await (0, db_1.query)(`SELECT t.*, ta.status, ta.started_at, ta.completed_at
       FROM tasks t
       JOIN task_assignments ta ON t.id = ta.task_id
       WHERE ta.student_id = $1
       ORDER BY ta.started_at DESC`, [studentId]);
        res.json({
            success: true,
            data: {
                student,
                recentConversations,
                tasks
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// ══════════════════════════════════════════════════════════════
// 企业端数据API
// ══════════════════════════════════════════════════════════════
// 企业列表
router.get('/companies', async (req, res, next) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = '';
        let params = [];
        if (search) {
            whereClause = 'WHERE u.nickname ILIKE $1 OR cp.company_name ILIKE $1';
            params.push(`%${search}%`);
        }
        const companies = await (0, db_1.query)(`SELECT 
         u.id,
         u.nickname,
         cp.company_name,
         COUNT(DISTINCT t.id) as total_tasks,
         COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
         COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
         AVG(tr.rating) as avg_rating,
         COUNT(DISTINCT mc.id) as ai_involvement_count
       FROM users u
       LEFT JOIN company_profiles cp ON u.id = cp.user_id
       LEFT JOIN tasks t ON u.id = t.company_id
       LEFT JOIN task_ratings tr ON t.id = tr.task_id
       LEFT JOIN mentor_conversations mc ON t.id = mc.task_id
       ${whereClause}
       GROUP BY u.id, u.nickname, cp.company_name
       ORDER BY total_tasks DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
        res.json({
            success: true,
            data: companies
        });
    }
    catch (error) {
        next(error);
    }
});
// 企业详情
router.get('/companies/:companyId', async (req, res, next) => {
    try {
        const { companyId } = req.params;
        const company = await (0, db_1.queryOne)(`SELECT 
         u.*,
         cp.*,
         COUNT(DISTINCT t.id) as total_tasks,
         AVG(tr.rating) as avg_rating
       FROM users u
       LEFT JOIN company_profiles cp ON u.id = cp.user_id
       LEFT JOIN tasks t ON u.id = t.company_id
       LEFT JOIN task_ratings tr ON t.id = tr.task_id
       WHERE u.id = $1
       GROUP BY u.id, cp.user_id`, [companyId]);
        if (!company) {
            throw new errorHandler_1.AppError(404, '企业不存在');
        }
        // 获取任务列表
        const tasks = await (0, db_1.query)(`SELECT t.*, 
         COUNT(DISTINCT mc.id) as ai_guidance_count,
         COUNT(DISTINCT asr.id) as ai_review_count
       FROM tasks t
       LEFT JOIN mentor_conversations mc ON t.id = mc.task_id
       LEFT JOIN ai_submission_reviews asr ON t.id = asr.task_id
       WHERE t.company_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`, [companyId]);
        res.json({
            success: true,
            data: {
                company,
                tasks
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// ══════════════════════════════════════════════════════════════
// AI对话记录API
// ══════════════════════════════════════════════════════════════
// 对话列表
router.get('/conversations', async (req, res, next) => {
    try {
        const { search, stage, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE 1=1';
        let params = [];
        let paramIndex = 1;
        if (search) {
            whereClause += ` AND (u.nickname ILIKE $${paramIndex} OR t.title ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (stage) {
            whereClause += ` AND mc.stage = $${paramIndex}`;
            params.push(stage);
            paramIndex++;
        }
        const conversations = await (0, db_1.query)(`SELECT 
         mc.*,
         u.nickname as student_name,
         t.title as task_title,
         COUNT(*) OVER (PARTITION BY mc.task_id, mc.student_id) as conversation_rounds
       FROM mentor_conversations mc
       LEFT JOIN users u ON mc.student_id = u.id
       LEFT JOIN tasks t ON mc.task_id = t.id
       ${whereClause}
       ORDER BY mc.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        res.json({
            success: true,
            data: conversations
        });
    }
    catch (error) {
        next(error);
    }
});
// 对话详情
router.get('/conversations/:taskId/:studentId', async (req, res, next) => {
    try {
        const { taskId, studentId } = req.params;
        const conversations = await (0, db_1.query)(`SELECT * FROM mentor_conversations 
       WHERE task_id = $1 AND student_id = $2 
       ORDER BY created_at ASC`, [taskId, studentId]);
        const task = await (0, db_1.queryOne)('SELECT * FROM tasks WHERE id = $1', [taskId]);
        const student = await (0, db_1.queryOne)('SELECT * FROM users WHERE id = $1', [studentId]);
        res.json({
            success: true,
            data: {
                conversations,
                task,
                student
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// ══════════════════════════════════════════════════════════════
// AI审核记录API
// ══════════════════════════════════════════════════════════════
// 审核列表
router.get('/reviews', async (req, res, next) => {
    try {
        const { search, passReview, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE 1=1';
        let params = [];
        let paramIndex = 1;
        if (search) {
            whereClause += ` AND (u.nickname ILIKE $${paramIndex} OR t.title ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (passReview !== undefined) {
            whereClause += ` AND asr.pass_review = $${paramIndex}`;
            params.push(passReview === 'true');
            paramIndex++;
        }
        const reviews = await (0, db_1.query)(`SELECT 
         asr.*,
         u.nickname as student_name,
         t.title as task_title,
         jsonb_array_length(asr.issues) as issue_count
       FROM ai_submission_reviews asr
       LEFT JOIN users u ON asr.student_id = u.id
       LEFT JOIN tasks t ON asr.task_id = t.id
       ${whereClause}
       ORDER BY asr.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        res.json({
            success: true,
            data: reviews
        });
    }
    catch (error) {
        next(error);
    }
});
// 审核详情
router.get('/reviews/:reviewId', async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const review = await (0, db_1.queryOne)(`SELECT 
         asr.*,
         u.nickname as student_name,
         t.title as task_title,
         ts.description as submission_description,
         ts.file_urls as submission_files
       FROM ai_submission_reviews asr
       LEFT JOIN users u ON asr.student_id = u.id
       LEFT JOIN tasks t ON asr.task_id = t.id
       LEFT JOIN task_submissions ts ON asr.submission_id = ts.id
       WHERE asr.id = $1`, [reviewId]);
        if (!review) {
            throw new errorHandler_1.AppError(404, '审核记录不存在');
        }
        res.json({
            success: true,
            data: review
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map