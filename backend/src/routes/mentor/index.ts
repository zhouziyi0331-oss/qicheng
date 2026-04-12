// AI导师系统 - 路由

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { handleStuckMessage, getConversations } from './controller';
import { mentorChat } from '../../controllers/mentorController';

const router = Router();

// AI导师通用聊天接口
router.post('/chat', mentorChat);

// 学生发送消息给AI导师
router.post('/message', authenticate, handleStuckMessage);

// 获取对话历史
router.get('/conversations/:taskId', authenticate, getConversations);

export default router;
