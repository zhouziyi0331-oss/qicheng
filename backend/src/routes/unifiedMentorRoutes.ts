import { Router } from 'express';
import { unifiedMentorController } from '../controllers/unifiedMentorController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 统一对话接口
router.post('/chat', unifiedMentorController.chat.bind(unifiedMentorController));

// 切换导师模式
router.post('/mode/switch', unifiedMentorController.switchMode.bind(unifiedMentorController));

// 获取对话历史
router.get('/history/:session_id', unifiedMentorController.getHistory.bind(unifiedMentorController));

// 创建情感-项目关联
router.post('/link/emotion-project', unifiedMentorController.linkEmotionToProject.bind(unifiedMentorController));

// 获取成长旅程
router.get('/journey', unifiedMentorController.getGrowthJourney.bind(unifiedMentorController));

export default router;
