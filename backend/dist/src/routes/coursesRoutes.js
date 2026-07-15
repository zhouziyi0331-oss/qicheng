"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// 获取课程列表
router.get('/courses', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const query = await database_1.pool.query(`SELECT
        t.id,
        t.title as name,
        t.description,
        t.icon,
        t.level as difficulty,
        t.estimated_hours,
        0 as user_sessions
       FROM tasks t
       ORDER BY t.created_at DESC
       LIMIT 50`, []);
        const courses = query.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon || '📚',
            difficulty: row.difficulty || 'Lv.1',
            estimatedHours: row.estimated_hours || 0
        }));
        res.json({ success: true, data: { courses } });
    }
    catch (error) {
        console.error('获取课程列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});
// 获取课程的赛道列表
router.get('/courses/:courseId/sectors', async (req, res) => {
    try {
        const { courseId } = req.params;
        const query = await database_1.pool.query(`SELECT
        s.id,
        s.name,
        s.description,
        s.icon,
        s.careers as skills
       FROM sectors s
       ORDER BY s.order_index`, []);
        const sectors = query.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon,
            skills: row.skills || []
        }));
        res.json({ success: true, data: { sectors } });
    }
    catch (error) {
        console.error('获取赛道列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});
// 创建学习会话
router.post('/learning-sessions', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { courseId, sectorId } = req.body;
        const result = await database_1.pool.query(`INSERT INTO learning_sessions (user_id, course_id, sector_id, status, current_stage, progress)
       VALUES ($1, $2, $3, 'in_progress', '情境化', 0)
       RETURNING id`, [userId, courseId, sectorId]);
        res.json({
            success: true,
            data: { sessionId: result.rows[0].id }
        });
    }
    catch (error) {
        console.error('创建学习会话失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});
exports.default = router;
//# sourceMappingURL=coursesRoutes.js.map