import { Router } from 'express';
import { pool } from '../config/database';

import { authenticate } from '../middleware/auth';
const router = Router();

router.use(authenticate);
// 获取学习会话列表
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.user?.userId;

    const query = await pool.query(
      `SELECT
        ms.id,
        ms.status,
        ms.completed_at,
        ms.updated_at,
        t.title as course_name
       FROM mentor_sessions ms
       LEFT JOIN tasks t ON (ms.task_id IS NOT NULL AND ms.task_id != '' AND ms.task_id::uuid = t.id)
       WHERE ms.student_id::text = $1
       ORDER BY ms.updated_at DESC`,
      [userId]
    );

    const sessions = query.rows.map(row => ({
      id: row.id,
      course: { name: row.course_name || '未命名项目' },
      career: { name: '未选择' },
      statusText: row.completed_at ? '已完成' : '进行中',
      progress: 0,
      currentStage: '学习中',
      lastActivityTime: formatTime(row.updated_at),
      iterationCount: 0,
      completedAt: row.completed_at
    }));

    res.json({ success: true, data: { sessions } });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除学习会话
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;

    await pool.query(
      `DELETE FROM mentor_sessions WHERE id::text = $1 AND student_id::text = $2`,
      [sessionId, userId]
    );

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除会话失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(date).toLocaleDateString('zh-CN');
}

export default router;
