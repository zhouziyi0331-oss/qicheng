import { Router } from 'express';
import { pool } from '../config/database';

import { authenticate } from '../middleware/auth';
const router = Router();

router.use(authenticate);
// 获取每日任务
router.get('/daily-tasks', async (req, res) => {
  try {
    const userId = req.user?.id;
    const today = new Date().toISOString().split('T')[0];

    const query = await pool.query(
      `SELECT
        dt.id,
        dt.title,
        dt.description as desc,
        dt.icon,
        dt.reward,
        dt.target,
        COALESCE(udt.progress, 0) as progress,
        COALESCE(udt.completed, false) as completed
       FROM daily_tasks dt
       LEFT JOIN user_daily_tasks udt ON dt.id = udt.task_id
         AND udt.user_id = $1
         AND DATE(udt.date) = $2
       WHERE dt.active = true
       ORDER BY dt.order_index`,
      [userId, today]
    );

    const tasks = query.rows.map(row => ({
      id: row.id,
      title: row.title,
      desc: row.desc,
      icon: row.icon,
      reward: row.reward,
      progress: row.progress,
      target: row.target,
      progressPercent: Math.floor((row.progress / row.target) * 100),
      completed: row.completed
    }));

    const completedCount = tasks.filter(t => t.completed).length;
    const totalReward = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.reward, 0);

    res.json({
      success: true,
      data: {
        tasks,
        bonusReward: 50,
        completedCount,
        totalReward
      }
    });
  } catch (error) {
    console.error('获取每日任务失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
