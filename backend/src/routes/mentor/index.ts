// AI导师系统 - 路由

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { handleStuckMessage, getConversations } from './controller';

const router = Router();

// 学生发送消息给AI导师
router.post('/message', authenticate, handleStuckMessage);

// 获取对话历史
router.get('/conversations/:taskId', authenticate, getConversations);

export default router;
