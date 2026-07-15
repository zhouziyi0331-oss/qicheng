import { Router } from 'express';
import { pool } from '../config/database';

import { authenticate } from '../middleware/auth';
const router = Router();

router.use(authenticate);
// 获取作品集
router.get('/portfolio', async (req, res) => {
  try {
    const userId = req.user?.userId;

    // 简化查询，返回空数组（因为deliverables表不存在）
    const deliverables = [];

    res.json({
      success: true,
      data: { deliverables }
    });
  } catch (error) {
    console.error('获取作品集失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

function formatTime(date: Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export default router;
