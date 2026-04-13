"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatController_1 = require("./chatController");
const router = express_1.default.Router();
/**
 * 聊天系统路由
 * 基础路径: /api/chat
 */
// 获取或创建聊天会话
router.post('/sessions', chatController_1.getOrCreateSession);
// 获取用户的所有聊天会话列表
router.get('/sessions', chatController_1.getChatSessions);
// 获取会话的聊天记录
router.get('/sessions/:sessionId/messages', chatController_1.getChatMessages);
// 发送消息
router.post('/sessions/:sessionId/messages', chatController_1.sendMessage);
// 标记消息为已读
router.post('/sessions/:sessionId/read', chatController_1.markMessagesAsRead);
// 获取未读消息总数
router.get('/unread-count', chatController_1.getUnreadCount);
// 归档会话
router.post('/sessions/:sessionId/archive', chatController_1.archiveSession);
exports.default = router;
//# sourceMappingURL=index.js.map