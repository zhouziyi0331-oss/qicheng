import { Router } from 'express';
import { pool } from '../config/database';

import { authenticate } from '../middleware/auth';
const router = Router();

router.use(authenticate);
// 获取项目完成数据
router.get('/projects/:projectId/completion', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { projectId } = req.params;

    // 简化查询，返回模拟奖励数据
    const rewards = {
      thinkingPoints: 50,
      fragments: 10,
      badges: []
    };

    // 能力提升数据
    const abilitiesQuery = await pool.query(
      `SELECT
        a.name,
        0 as old_level,
        1 as new_level,
        100 as progress
       FROM abilities a
       LIMIT 3`,
      []
    );

    const abilities = abilitiesQuery.rows.map(row => ({
      name: row.name,
      oldLevel: row.old_level,
      newLevel: row.new_level,
      progress: row.progress
    }));

    res.json({
      success: true,
      data: {
        rewards,
        abilities
      }
    });
  } catch (error) {
    console.error('获取完成数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
