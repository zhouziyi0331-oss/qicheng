import express from 'express';
import {
  getOrCreateSession,
  getChatSessions,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  archiveSession
} from './chatController';

const router = express.Router();

/**
 * 聊天系统路由
 * 基础路径: /api/chat
 */

// 获取或创建聊天会话
router.post('/sessions', getOrCreateSession);

// 获取用户的所有聊天会话列表
router.get('/sessions', getChatSessions);

// 获取会话的聊天记录
router.get('/sessions/:sessionId/messages', getChatMessages);

// 发送消息
router.post('/sessions/:sessionId/messages', sendMessage);

// 标记消息为已读
router.post('/sessions/:sessionId/read', markMessagesAsRead);

// 获取未读消息总数
router.get('/unread-count', getUnreadCount);

// 归档会话
router.post('/sessions/:sessionId/archive', archiveSession);

export default router;
