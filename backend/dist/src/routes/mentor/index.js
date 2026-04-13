"use strict";
// AI导师系统 - 路由
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const mentorController_1 = require("../../controllers/mentorController");
const router = (0, express_1.Router)();
// AI导师通用聊天接口
router.post('/chat', mentorController_1.mentorChat);
// 获取对话历史
router.get('/:taskId/history', mentorController_1.getHistory);
// 获取第一步引导
router.get('/:taskId/first-step', mentorController_1.getFirstStep);
// 学生发送消息给AI导师
router.post('/message', auth_1.authenticate, controller_1.handleStuckMessage);
// 获取对话历史（旧接口）
router.get('/conversations/:taskId', auth_1.authenticate, controller_1.getConversations);
exports.default = router;
//# sourceMappingURL=index.js.map