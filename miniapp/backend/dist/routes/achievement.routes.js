"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const achievement_controller_1 = require("../controllers/achievement.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticateToken);
// 获取成就统计
router.get('/stats', achievement_controller_1.achievementController.getAchievementStats.bind(achievement_controller_1.achievementController));
// 检查并更新所有成就
router.post('/check', achievement_controller_1.achievementController.checkAllAchievements.bind(achievement_controller_1.achievementController));
// 获取用户成就列表
router.get('/', achievement_controller_1.achievementController.getUserAchievements.bind(achievement_controller_1.achievementController));
// 切换成就展示状态
router.put('/:achievementId/display', achievement_controller_1.achievementController.toggleAchievementDisplay.bind(achievement_controller_1.achievementController));
exports.default = router;
//# sourceMappingURL=achievement.routes.js.map