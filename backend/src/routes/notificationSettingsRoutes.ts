import { Router } from 'express';

const router = Router();
import { authenticate } from '../middleware/auth';

// 通知设置路由暂时返回模拟数据
router.use(authenticate);
// 实际实现需要微信小程序订阅消息API

router.get('/notification-settings', async (req, res) => {
  try {
    // 返回当前用户的通知设置
    res.json({
      success: true,
      data: {
        settings: {
          dailyReminder: false,
          dailyReminderTime: '20:00',
          streakWarning: true,
          goalReminder: true,
          friendActivity: false,
          achievementUnlock: true,
          weeklyReport: true
        },
        quietHours: {
          start: '22:00',
          end: '08:00'
        }
      }
    });
  } catch (error) {
    console.error('获取通知设置失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
