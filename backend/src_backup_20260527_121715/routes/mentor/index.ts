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

// ============================================================
// 新增缺失的导师API端点
// ============================================================

// 学生报告卡点
router.post('/:taskId/stuck', authenticate, handleStuckMessage);

// 拒绝任务后的引导
router.post('/:taskId/rejection-guidance', authenticate, handleStuckMessage);

// 庆祝里程碑
router.post('/:taskId/milestone', authenticate, handleStuckMessage);

// 记录导师观察
router.post('/observe', authenticate, handleStuckMessage);

// 检测学生卡点（定时任务）
router.post('/detect-stuck', authenticate, handleStuckMessage);

// 生成欢迎消息
router.post('/welcome-message', authenticate, handleStuckMessage);

export default router;
