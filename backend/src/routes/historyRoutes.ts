import { Router } from 'express';
import { pool } from '../config/database';

import { authenticate } from '../middleware/auth';
const router = Router();

router.use(authenticate);
// 获取学习历史
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.userId;

    // 统计数据 - 使用mentor_sessions
    const statsQuery = await pool.query(
      `SELECT
        COUNT(DISTINCT DATE(created_at)) as total_days,
        COALESCE(SUM(duration_minutes)/60.0, 0) as total_hours,
        COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as total_sessions
       FROM mentor_sessions
       WHERE student_id::text = $1`,
      [userId]
    );

    const stats = {
      totalDays: parseInt(statsQuery.rows[0].total_days) || 0,
      totalHours: parseInt(statsQuery.rows[0].total_hours) || 0,
      totalSessions: parseInt(statsQuery.rows[0].total_sessions) || 0
    };

    // 活动时间线
    const activitiesQuery = await pool.query(
      `SELECT
        a.id,
        a.type,
        a.description,
        a.metadata,
        a.created_at
       FROM user_activities a
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const activities = activitiesQuery.rows.map(row => ({
      id: row.id,
      icon: getActivityIcon(row.type),
      description: row.description,
      time: formatTime(row.created_at),
      metadata: row.metadata
    }));

    res.json({
      success: true,
      data: { stats, activities }
    });
  } catch (error) {
    console.error('获取学习历史失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

function getActivityIcon(type: string): string {
  const icons = {
    'session_start': '🚀',
    'session_complete': '✅',
    'level_up': '⬆️',
    'achievement': '🏆',
    'deliverable': '📦'
  };
  return icons[type] || '📌';
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(date).toLocaleDateString('zh-CN');
}

export default router;
