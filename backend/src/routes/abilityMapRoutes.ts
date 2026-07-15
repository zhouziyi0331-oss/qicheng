import { Router } from 'express';
import { pool } from '../config/database';

import { authenticate } from '../middleware/auth';
const router = Router();

router.use(authenticate);
// 获取能力图谱
router.get('/ability-map', async (req, res) => {
  try {
    const userId = req.user?.userId;

    const query = await pool.query(
      `SELECT
        a.id,
        a.name,
        a.description,
        a.icon,
        ua.level,
        a.max_level,
        ua.experience,
        a.experience_per_level
       FROM abilities a
       LEFT JOIN user_abilities ua ON a.id = ua.ability_id AND ua.user_id = $1
       ORDER BY a.order_index`,
      [userId]
    );

    const abilities = query.rows.map(row => {
      const level = row.level || 0;
      const maxLevel = row.max_level || 10;
      const experience = row.experience || 0;
      const expPerLevel = row.experience_per_level || 100;
      const currentLevelExp = level * expPerLevel;
      const nextLevelExp = (level + 1) * expPerLevel;
      const progress = Math.floor(((experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100);

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        level,
        maxLevel,
        progress: Math.max(0, Math.min(100, progress)),
        relatedCourses: []
      };
    });

    res.json({
      success: true,
      data: { abilities }
    });
  } catch (error) {
    console.error('获取能力图谱失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
