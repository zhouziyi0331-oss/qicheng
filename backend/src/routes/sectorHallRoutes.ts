import { Router } from 'express';
import { pool } from '../config/database';

import { authenticate } from '../middleware/auth';
const router = Router();

router.use(authenticate);
// 获取板块大厅
router.get('/sector-hall', async (req, res) => {
  try {
    const userId = req.user?.userId;

    const query = await pool.query(
      `SELECT
        s.id,
        s.name,
        s.description,
        s.icon,
        s.bg_gradient,
        s.careers,
        0 as total_courses,
        0 as completed_courses
       FROM sectors s
       ORDER BY s.order_index`,
      []
    );

    const sectors = query.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      bgGradient: row.bg_gradient || 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
      careers: row.careers || [],
      totalCourses: 0,
      completedCourses: 0
    }));

    // 用户进度
    const userProgress = {};
    sectors.forEach(sector => {
      userProgress[sector.id] = { progress: 0 };
    });

    res.json({
      success: true,
      data: { sectors, userProgress }
    });
  } catch (error) {
    console.error('获取板块大厅失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
