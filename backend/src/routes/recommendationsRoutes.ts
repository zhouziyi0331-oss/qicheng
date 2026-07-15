import { Router } from 'express';
import { pool } from '../config/database';

import { authenticate } from '../middleware/auth';
const router = Router();

router.use(authenticate);
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
    const sameSectorQuery = await pool.query(
      `SELECT
        t.id,
        t.title as name,
        t.description,
        t.icon,
        t.level as difficulty
       FROM tasks t
       ORDER BY t.created_at DESC
       LIMIT 3`,
      []
    );

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
  } catch (error) {
    console.error('获取推荐失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
