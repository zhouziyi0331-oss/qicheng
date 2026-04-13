"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ratingController_1 = require("./ratingController");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// 提交评价
router.post('/submit', ratingController_1.submitRating);
// 获取任务的评价
router.get('/task/:taskId', ratingController_1.getTaskRatings);
// 获取用户的评分统计
router.get('/stats/:userId', ratingController_1.getUserRatingStats);
// 获取用户收到的评价列表
router.get('/received/:userId', ratingController_1.getUserReceivedRatings);
// 获取用户发出的评价列表
router.get('/given', ratingController_1.getUserGivenRatings);
// 企业回复评价
router.post('/:ratingId/reply', ratingController_1.replyToRating);
// 获取评价标签预设
router.get('/tags/presets', ratingController_1.getRatingTagPresets);
// 检查任务是否可以评价
router.get('/check/:taskId', ratingController_1.checkRatingEligibility);
// 获取待评价任务列表
router.get('/pending', ratingController_1.getPendingRatingTasks);
exports.default = router;
//# sourceMappingURL=index.js.map