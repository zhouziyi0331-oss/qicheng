"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingRatingTasks = exports.checkRatingEligibility = exports.getRatingTagPresets = exports.replyToRating = exports.getUserGivenRatings = exports.getUserReceivedRatings = exports.getUserRatingStats = exports.getTaskRatings = exports.submitRating = void 0;
const db_1 = __importDefault(require("../../utils/db"));
/**
 * 评价系统控制器
 */
// 1. 提交评价
const submitRating = async (req, res) => {
    const client = await db_1.default.connect();
    try {
        const userId = req.user?.id;
        const userType = req.user?.role; // 'student' or 'company'
        const { taskId, overallRating, requirementClarity, communicationQuality, paymentTimeliness, workQuality, deliveryTimeliness, professionalAttitude, comment, tags, isAnonymous } = req.body;
        // 验证必填字段
        if (!taskId || !overallRating) {
            return res.status(400).json({ error: '缺少必填字段' });
        }
        // 验证评分范围
        if (overallRating < 1 || overallRating > 5) {
            return res.status(400).json({ error: '评分必须在1-5之间' });
        }
        await client.query('BEGIN');
        // 获取任务信息
        const taskResult = await client.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: '任务不存在' });
        }
        const task = taskResult.rows[0];
        // 验证任务状态（必须是已完成）
        if (task.status !== 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: '只能评价已完成的任务' });
        }
        // 确定被评价者
        let rateeId;
        let rateeType;
        if (userType === 'student') {
            // 学生评价企业
            rateeId = task.company_id;
            rateeType = 'company';
            // 检查是否已评价
            if (task.student_rated) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: '您已经评价过此任务' });
            }
        }
        else if (userType === 'company') {
            // 企业评价学生
            rateeId = task.student_id;
            rateeType = 'student';
            // 检查是否已评价
            if (task.company_rated) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: '您已经评价过此任务' });
            }
        }
        else {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: '无权限评价' });
        }
        // 验证是否为任务参与者
        if (userType === 'student' && task.student_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: '您不是此任务的学生' });
        }
        if (userType === 'company' && task.company_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: '您不是此任务的企业' });
        }
        // 插入评价
        const ratingResult = await client.query(`INSERT INTO task_ratings (
        task_id, rater_id, rater_type, ratee_id, ratee_type,
        overall_rating, requirement_clarity, communication_quality, payment_timeliness,
        work_quality, delivery_timeliness, professional_attitude,
        comment, tags, is_anonymous
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`, [
            taskId, userId, userType, rateeId, rateeType,
            overallRating, requirementClarity, communicationQuality, paymentTimeliness,
            workQuality, deliveryTimeliness, professionalAttitude,
            comment, JSON.stringify(tags || []), isAnonymous || false
        ]);
        // 更新任务的评价状态
        if (userType === 'student') {
            await client.query('UPDATE tasks SET student_rated = true WHERE id = $1', [taskId]);
        }
        else {
            await client.query('UPDATE tasks SET company_rated = true WHERE id = $1', [taskId]);
        }
        // 标记评价提醒为已完成
        await client.query('UPDATE rating_reminders SET is_completed = true WHERE task_id = $1 AND user_id = $2', [taskId, userId]);
        await client.query('COMMIT');
        res.json({
            message: '评价提交成功',
            rating: ratingResult.rows[0]
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('提交评价失败:', error);
        res.status(500).json({ error: '提交评价失败' });
    }
    finally {
        client.release();
    }
};
exports.submitRating = submitRating;
// 2. 获取任务的评价
const getTaskRatings = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id;
        const result = await db_1.default.query(`SELECT
        tr.*,
        rater.nickname as rater_nickname,
        rater.avatar_url as rater_avatar,
        ratee.nickname as ratee_nickname,
        ratee.avatar_url as ratee_avatar
      FROM task_ratings tr
      LEFT JOIN users rater ON tr.rater_id = rater.id
      LEFT JOIN users ratee ON tr.ratee_id = ratee.id
      WHERE tr.task_id = $1 AND (tr.is_public = true OR tr.rater_id = $2 OR tr.ratee_id = $2)
      ORDER BY tr.created_at DESC`, [taskId, userId]);
        // 如果是匿名评价，隐藏评价者信息
        const ratings = result.rows.map(rating => {
            if (rating.is_anonymous && rating.rater_id !== userId) {
                return {
                    ...rating,
                    rater_nickname: '匿名用户',
                    rater_avatar: null
                };
            }
            return rating;
        });
        res.json({ ratings });
    }
    catch (error) {
        console.error('获取任务评价失败:', error);
        res.status(500).json({ error: '获取任务评价失败' });
    }
};
exports.getTaskRatings = getTaskRatings;
// 3. 获取用户的评分统计
const getUserRatingStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db_1.default.query('SELECT * FROM user_rating_stats WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.json({
                stats: {
                    total_ratings: 0,
                    average_rating: 0,
                    five_star_count: 0,
                    four_star_count: 0,
                    three_star_count: 0,
                    two_star_count: 0,
                    one_star_count: 0
                }
            });
        }
        res.json({ stats: result.rows[0] });
    }
    catch (error) {
        console.error('获取用户评分统计失败:', error);
        res.status(500).json({ error: '获取用户评分统计失败' });
    }
};
exports.getUserRatingStats = getUserRatingStats;
// 4. 获取用户收到的评价列表
const getUserReceivedRatings = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const result = await db_1.default.query(`SELECT
        tr.*,
        rater.nickname as rater_nickname,
        rater.avatar_url as rater_avatar,
        t.title as task_title,
        t.status as task_status
      FROM task_ratings tr
      LEFT JOIN users rater ON tr.rater_id = rater.id
      LEFT JOIN tasks t ON tr.task_id = t.id
      WHERE tr.ratee_id = $1 AND tr.is_public = true
      ORDER BY tr.created_at DESC
      LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        const countResult = await db_1.default.query('SELECT COUNT(*) FROM task_ratings WHERE ratee_id = $1 AND is_public = true', [userId]);
        // 处理匿名评价
        const ratings = result.rows.map(rating => {
            if (rating.is_anonymous) {
                return {
                    ...rating,
                    rater_nickname: '匿名用户',
                    rater_avatar: null
                };
            }
            return rating;
        });
        res.json({
            ratings,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count)
            }
        });
    }
    catch (error) {
        console.error('获取用户评价列表失败:', error);
        res.status(500).json({ error: '获取用户评价列表失败' });
    }
};
exports.getUserReceivedRatings = getUserReceivedRatings;
// 5. 获取用户发出的评价列表
const getUserGivenRatings = async (req, res) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const result = await db_1.default.query(`SELECT
        tr.*,
        ratee.nickname as ratee_nickname,
        ratee.avatar_url as ratee_avatar,
        t.title as task_title,
        t.status as task_status
      FROM task_ratings tr
      LEFT JOIN users ratee ON tr.ratee_id = ratee.id
      LEFT JOIN tasks t ON tr.task_id = t.id
      WHERE tr.rater_id = $1
      ORDER BY tr.created_at DESC
      LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        const countResult = await db_1.default.query('SELECT COUNT(*) FROM task_ratings WHERE rater_id = $1', [userId]);
        res.json({
            ratings: result.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count)
            }
        });
    }
    catch (error) {
        console.error('获取用户发出的评价失败:', error);
        res.status(500).json({ error: '获取用户发出的评价失败' });
    }
};
exports.getUserGivenRatings = getUserGivenRatings;
// 6. 企业回复评价
const replyToRating = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userType = req.user?.role;
        const { ratingId } = req.params;
        const { reply } = req.body;
        if (userType !== 'company') {
            return res.status(403).json({ error: '只有企业可以回复评价' });
        }
        if (!reply || reply.trim().length === 0) {
            return res.status(400).json({ error: '回复内容不能为空' });
        }
        // 验证评价是否存在且是评价该企业的
        const ratingResult = await db_1.default.query('SELECT * FROM task_ratings WHERE id = $1 AND ratee_id = $2 AND ratee_type = $3', [ratingId, userId, 'company']);
        if (ratingResult.rows.length === 0) {
            return res.status(404).json({ error: '评价不存在或无权限回复' });
        }
        // 更新回复
        const result = await db_1.default.query(`UPDATE task_ratings
       SET company_reply = $1, company_reply_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`, [reply, ratingId]);
        res.json({
            message: '回复成功',
            rating: result.rows[0]
        });
    }
    catch (error) {
        console.error('回复评价失败:', error);
        res.status(500).json({ error: '回复评价失败' });
    }
};
exports.replyToRating = replyToRating;
// 7. 获取评价标签预设
const getRatingTagPresets = async (req, res) => {
    try {
        const { tagType } = req.query;
        let query = 'SELECT * FROM rating_tag_presets WHERE is_active = true';
        const params = [];
        if (tagType) {
            query += ' AND tag_type = $1';
            params.push(tagType);
        }
        query += ' ORDER BY display_order ASC';
        const result = await db_1.default.query(query, params);
        res.json({ tags: result.rows });
    }
    catch (error) {
        console.error('获取评价标签失败:', error);
        res.status(500).json({ error: '获取评价标签失败' });
    }
};
exports.getRatingTagPresets = getRatingTagPresets;
// 8. 检查任务是否可以评价
const checkRatingEligibility = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userType = req.user?.role;
        const { taskId } = req.params;
        // 获取任务信息
        const taskResult = await db_1.default.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: '任务不存在' });
        }
        const task = taskResult.rows[0];
        // 验证是否为任务参与者
        if (userType === 'student' && task.student_id !== userId) {
            return res.status(403).json({ error: '您不是此任务的学生' });
        }
        if (userType === 'company' && task.company_id !== userId) {
            return res.status(403).json({ error: '您不是此任务的企业' });
        }
        // 检查任务状态
        if (task.status !== 'completed') {
            return res.json({
                canRate: false,
                reason: '任务尚未完成'
            });
        }
        // 检查是否已评价
        const hasRated = userType === 'student' ? task.student_rated : task.company_rated;
        if (hasRated) {
            return res.json({
                canRate: false,
                reason: '您已经评价过此任务'
            });
        }
        res.json({
            canRate: true,
            task: {
                id: task.id,
                title: task.title,
                status: task.status
            }
        });
    }
    catch (error) {
        console.error('检查评价资格失败:', error);
        res.status(500).json({ error: '检查评价资格失败' });
    }
};
exports.checkRatingEligibility = checkRatingEligibility;
// 9. 获取待评价任务列表
const getPendingRatingTasks = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userType = req.user?.role;
        let query = `
      SELECT t.*,
        u.nickname as other_party_nickname,
        u.avatar_url as other_party_avatar
      FROM tasks t
    `;
        if (userType === 'student') {
            query += `
        LEFT JOIN users u ON t.company_id = u.id
        WHERE t.student_id = $1 AND t.status = 'completed' AND t.student_rated = false
      `;
        }
        else if (userType === 'company') {
            query += `
        LEFT JOIN users u ON t.student_id = u.id
        WHERE t.company_id = $1 AND t.status = 'completed' AND t.company_rated = false
      `;
        }
        else {
            return res.status(403).json({ error: '无权限' });
        }
        query += ' ORDER BY t.completed_at DESC';
        const result = await db_1.default.query(query, [userId]);
        res.json({ tasks: result.rows });
    }
    catch (error) {
        console.error('获取待评价任务失败:', error);
        res.status(500).json({ error: '获取待评价任务失败' });
    }
};
exports.getPendingRatingTasks = getPendingRatingTasks;
exports.default = {
    submitRating: exports.submitRating,
    getTaskRatings: exports.getTaskRatings,
    getUserRatingStats: exports.getUserRatingStats,
    getUserReceivedRatings: exports.getUserReceivedRatings,
    getUserGivenRatings: exports.getUserGivenRatings,
    replyToRating: exports.replyToRating,
    getRatingTagPresets: exports.getRatingTagPresets,
    checkRatingEligibility: exports.checkRatingEligibility,
    getPendingRatingTasks: exports.getPendingRatingTasks
};
//# sourceMappingURL=ratingController.js.map