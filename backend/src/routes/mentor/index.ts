// AI导师系统 - 路由

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { handleStuckMessage, getConversations } from './controller';
import { mentorChat, getHistory, getFirstStep } from '../../controllers/mentorController';

const router = Router();

// AI导师通用聊天接口
router.post('/chat', mentorChat);

// 获取对话历史
router.get('/:taskId/history', getHistory);

// 获取第一步引导
router.get('/:taskId/first-step', getFirstStep);

// 学生发送消息给AI导师
router.post('/message', authenticate, handleStuckMessage);

// 获取对话历史（旧接口）
router.get('/conversations/:taskId', authenticate, getConversations);

export default router;
