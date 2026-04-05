"use strict";
// AI导师系统 - 路由
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
// 学生发送消息给AI导师
router.post('/message', auth_1.authenticate, controller_1.handleStuckMessage);
// 获取对话历史
router.get('/conversations/:taskId', auth_1.authenticate, controller_1.getConversations);
exports.default = router;
//# sourceMappingURL=index.js.map