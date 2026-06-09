"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const unifiedMentorController_1 = require("../controllers/unifiedMentorController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// 统一对话接口
router.post('/chat', unifiedMentorController_1.unifiedMentorController.chat.bind(unifiedMentorController_1.unifiedMentorController));
// 切换导师模式
router.post('/mode/switch', unifiedMentorController_1.unifiedMentorController.switchMode.bind(unifiedMentorController_1.unifiedMentorController));
// 获取对话历史
router.get('/history/:session_id', unifiedMentorController_1.unifiedMentorController.getHistory.bind(unifiedMentorController_1.unifiedMentorController));
// 创建情感-项目关联
router.post('/link/emotion-project', unifiedMentorController_1.unifiedMentorController.linkEmotionToProject.bind(unifiedMentorController_1.unifiedMentorController));
// 获取成长旅程
router.get('/journey', unifiedMentorController_1.unifiedMentorController.getGrowthJourney.bind(unifiedMentorController_1.unifiedMentorController));
exports.default = router;
//# sourceMappingURL=unifiedMentorRoutes.js.map