"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// 获取跨板块推荐
router.get('/projects/:projectId/recommendations', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { projectId } = req.params;
        // 简化查询，返回推荐课程
        const completedProject = {
            name: '已完成项目',
            sectorName: 'AI应用'
        };
        // 同板块推荐
        const sameSectorQuery = await database_1.pool.query(`SELECT
        t.id,
        t.title as name,
        t.description,
        t.icon,
        t.level as difficulty
       FROM tasks t
       ORDER BY t.created_at DESC
       LIMIT 3`, []);
        const sameSectorCourses = sameSectorQuery.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon || '📚',
            difficulty: row.difficulty || 'Lv.1',
            skills: []
        }));
        // 跨板块推荐
        const crossSectorCourses = sameSectorCourses.map(c => ({
            ...c,
            similarity: 0.75
        }));
        res.json({
            success: true,
            data: {
                completedProject,
                sameSectorCourses,
                crossSectorCourses
            }
        });
    }
    catch (error) {
        console.error('获取推荐失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});
exports.default = router;
//# sourceMappingURL=recommendationsRoutes.js.map