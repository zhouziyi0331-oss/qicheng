"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentList = getStudentList;
exports.getStudentDetail = getStudentDetail;
exports.getStudentAbility = getStudentAbility;
exports.getStudentGrowth = getStudentGrowth;
exports.updateStudentStatus = updateStudentStatus;
const db_1 = require("../../utils/db");
/**
 * 获取学生列表
 */
async function getStudentList(req, res) {
    try {
        const { page = 1, pageSize = 20, keyword, level, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        const offset = (Number(page) - 1) * Number(pageSize);
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        // 关键词搜索（姓名、手机号）
        if (keyword) {
            conditions.push(`(u.nickname LIKE $${paramIndex} OR u.phone LIKE $${paramIndex})`);
            params.push(`%${keyword}%`);
            paramIndex++;
        }
        // 等级筛选
        if (level) {
            conditions.push(`sp.level_a = $${paramIndex}`);
            params.push(level);
            paramIndex++;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        // 获取总数
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as total
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       ${whereClause}`, params);
        const total = parseInt(countResult[0].total);
        // 获取列表数据
        params.push(Number(pageSize), offset);
        const students = await (0, db_1.query)(`SELECT
        u.id,
        u.nickname,
        u.avatar_url,
        u.phone,
        u.created_at,
        sp.level_a,
        sp.level_b,
        sp.opc_label,
        sp.task_count,
        sp.total_earnings
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, params);
        res.json({
            list: students,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize))
            }
        });
    }
    catch (error) {
        console.error('获取学生列表失败:', error);
        res.status(500).json({ error: '获取学生列表失败' });
    }
}
/**
 * 获取学生详情
 */
async function getStudentDetail(req, res) {
    try {
        const { id } = req.params;
        // 基本信息
        const studentInfo = await (0, db_1.query)(`SELECT
        u.id,
        u.nickname,
        u.avatar_url,
        u.phone,
        u.created_at,
        sp.level_a,
        sp.level_b,
        sp.opc_label,
        sp.opc_label_secondary,
        sp.task_count,
        sp.total_earnings,
        sp.graduated_at,
        sp.onboarding_completed_at
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1`, [id]);
        if (studentInfo.length === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }
        // 订单统计
        const orderStatsResult = await (0, db_1.query)(`SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN student_price END), 0) as avg_order_value
       FROM tasks
       WHERE accepted_student_id = $1`, [id]);
        const orderStats = {
            total_orders: parseInt(orderStatsResult[0].total_orders),
            completed_orders: parseInt(orderStatsResult[0].completed_orders),
            in_progress_orders: parseInt(orderStatsResult[0].in_progress_orders),
            cancelled_orders: parseInt(orderStatsResult[0].cancelled_orders),
            avg_order_value: parseFloat(orderStatsResult[0].avg_order_value)
        };
        // 最近订单
        const recentOrders = await (0, db_1.query)(`SELECT
        t.id,
        t.title,
        t.status,
        t.student_price,
        t.created_at,
        t.deadline,
        cp.company_name
       FROM tasks t
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       WHERE t.accepted_student_id = $1
       ORDER BY t.created_at DESC
       LIMIT 5`, [id]);
        // 评价统计
        const ratingStatsResult = await (0, db_1.query)(`SELECT
        COUNT(*) as total_ratings,
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_ratings
       FROM task_reviews
       WHERE task_id IN (SELECT id FROM tasks WHERE accepted_student_id = $1)
       AND reviewer_type = 'company'`, [id]);
        const ratingStats = {
            total_ratings: parseInt(ratingStatsResult[0].total_ratings),
            avg_rating: parseFloat(ratingStatsResult[0].avg_rating).toFixed(1),
            positive_ratings: parseInt(ratingStatsResult[0].positive_ratings)
        };
        res.json({
            info: studentInfo[0],
            orderStats,
            recentOrders,
            ratingStats
        });
    }
    catch (error) {
        console.error('获取学生详情失败:', error);
        res.status(500).json({ error: '获取学生详情失败' });
    }
}
/**
 * 获取学生能力画像
 */
async function getStudentAbility(req, res) {
    try {
        const { id } = req.params;
        // 检查学生是否存在
        const student = await (0, db_1.query)(`SELECT user_id FROM student_profiles WHERE user_id = $1`, [id]);
        if (student.length === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }
        // 获取六维能力分数（从student_profiles表）
        const profileData = await (0, db_1.query)(`SELECT
        six_dim_d1, six_dim_d2, six_dim_d3,
        six_dim_d4, six_dim_d5, six_dim_d6
       FROM student_profiles
       WHERE user_id = $1`, [id]);
        const sixDimScores = profileData.length > 0 ? {
            d1: profileData[0].six_dim_d1 || 0,
            d2: profileData[0].six_dim_d2 || 0,
            d3: profileData[0].six_dim_d3 || 0,
            d4: profileData[0].six_dim_d4 || 0,
            d5: profileData[0].six_dim_d5 || 0,
            d6: profileData[0].six_dim_d6 || 0
        } : { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 };
        // 技能统计（基于完成的任务）
        const skillStats = await (0, db_1.query)(`SELECT
        t.category,
        COUNT(*) as count,
        AVG(tr.rating) as avg_rating
       FROM tasks t
       LEFT JOIN task_reviews tr ON t.id = tr.task_id AND tr.reviewer_type = 'company'
       WHERE t.accepted_student_id = $1 AND t.status = 'completed'
       GROUP BY t.category
       ORDER BY count DESC
       LIMIT 10`, [id]);
        // 项目类型统计
        const projectTypeStats = await (0, db_1.query)(`SELECT
        t.difficulty_level as type,
        COUNT(*) as count
       FROM tasks t
       WHERE t.accepted_student_id = $1 AND t.status = 'completed'
       GROUP BY t.difficulty_level
       ORDER BY count DESC`, [id]);
        res.json({
            sixDimScores,
            skillStats: skillStats.map((s) => ({
                skill: s.category || '未分类',
                count: parseInt(s.count),
                avgRating: s.avg_rating ? parseFloat(s.avg_rating).toFixed(1) : '0.0'
            })),
            projectTypeStats: projectTypeStats.map((p) => ({
                type: p.type || '未知',
                count: parseInt(p.count)
            }))
        });
    }
    catch (error) {
        console.error('获取学生能力画像失败:', error);
        res.status(500).json({ error: '获取学生能力画像失败' });
    }
}
/**
 * 获取学生成长轨迹
 */
async function getStudentGrowth(req, res) {
    try {
        const { id } = req.params;
        // 获取成长时间线（任务完成记录）
        const timeline = await (0, db_1.query)(`SELECT
        t.id,
        t.title,
        t.status,
        t.student_price,
        t.created_at,
        t.deadline,
        t.updated_at,
        cp.company_name,
        tr.rating,
        tr.comment
       FROM tasks t
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       LEFT JOIN task_reviews tr ON t.id = tr.task_id AND tr.reviewer_type = 'company'
       WHERE t.accepted_student_id = $1
       ORDER BY t.created_at DESC
       LIMIT 20`, [id]);
        // 获取成长曲线（按月统计）
        const growthCurve = await (0, db_1.query)(`SELECT
        DATE_TRUNC('month', t.created_at) as month,
        COUNT(*) as task_count,
        SUM(t.student_price) as total_earnings,
        AVG(tr.rating) as avg_rating
       FROM tasks t
       LEFT JOIN task_reviews tr ON t.id = tr.task_id AND tr.reviewer_type = 'company'
       WHERE t.accepted_student_id = $1 AND t.status = 'completed'
       GROUP BY DATE_TRUNC('month', t.created_at)
       ORDER BY month ASC`, [id]);
        res.json({
            timeline: timeline.map((item) => ({
                id: item.id,
                title: item.title,
                status: item.status,
                price: item.student_price,
                createdAt: item.created_at,
                deadline: item.deadline,
                completedAt: item.updated_at,
                companyName: item.company_name,
                rating: item.rating,
                comment: item.comment
            })),
            growthCurve: growthCurve.map((item) => ({
                month: item.month,
                taskCount: parseInt(item.task_count),
                totalEarnings: parseFloat(item.total_earnings) || 0,
                avgRating: item.avg_rating ? parseFloat(item.avg_rating).toFixed(1) : '0.0'
            }))
        });
    }
    catch (error) {
        console.error('获取学生成长轨迹失败:', error);
        res.status(500).json({ error: '获取学生成长轨迹失败' });
    }
}
/**
 * 更新学生状态
 */
async function updateStudentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        // 由于student_profiles表没有status字段，暂时只记录日志
        const adminId = req.user.userId;
        await (0, db_1.query)(`INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
       VALUES ($1, 'update_student_status', 'student', $2, $3)`, [adminId, id, JSON.stringify({ status, reason })]);
        res.json({ message: '状态更新成功' });
    }
    catch (error) {
        console.error('更新学生状态失败:', error);
        res.status(500).json({ error: '更新学生状态失败' });
    }
}
//# sourceMappingURL=studentController.js.map