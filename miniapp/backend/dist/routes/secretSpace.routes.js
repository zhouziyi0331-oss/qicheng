"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const secretSpace_controller_1 = require("../controllers/secretSpace.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticateToken);
// 获取空间统计
router.get('/stats', secretSpace_controller_1.secretSpaceController.getSpaceStats.bind(secretSpace_controller_1.secretSpaceController));
// 获取心情记录
router.get('/mood', secretSpace_controller_1.secretSpaceController.getMoodRecords.bind(secretSpace_controller_1.secretSpaceController));
// 获取秘密空间
router.get('/', secretSpace_controller_1.secretSpaceController.getSecretSpace.bind(secretSpace_controller_1.secretSpaceController));
// 签到
router.post('/check-in', secretSpace_controller_1.secretSpaceController.checkIn.bind(secretSpace_controller_1.secretSpaceController));
// 记录心情
router.post('/mood', secretSpace_controller_1.secretSpaceController.recordMood.bind(secretSpace_controller_1.secretSpaceController));
// 添加私密笔记
router.post('/notes', secretSpace_controller_1.secretSpaceController.addPrivateNote.bind(secretSpace_controller_1.secretSpaceController));
// 更新私密笔记
router.put('/notes/:noteId', secretSpace_controller_1.secretSpaceController.updatePrivateNote.bind(secretSpace_controller_1.secretSpaceController));
// 删除私密笔记
router.delete('/notes/:noteId', secretSpace_controller_1.secretSpaceController.deletePrivateNote.bind(secretSpace_controller_1.secretSpaceController));
// 添加个人里程碑
router.post('/milestones', secretSpace_controller_1.secretSpaceController.addPersonalMilestone.bind(secretSpace_controller_1.secretSpaceController));
// 完成个人里程碑
router.put('/milestones/:milestoneId/complete', secretSpace_controller_1.secretSpaceController.completeMilestone.bind(secretSpace_controller_1.secretSpaceController));
// 添加名言收藏
router.post('/quotes', secretSpace_controller_1.secretSpaceController.addFavoriteQuote.bind(secretSpace_controller_1.secretSpaceController));
// 更新空间设置
router.put('/settings', secretSpace_controller_1.secretSpaceController.updateSettings.bind(secretSpace_controller_1.secretSpaceController));
exports.default = router;
//# sourceMappingURL=secretSpace.routes.js.map