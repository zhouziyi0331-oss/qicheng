"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("./taskController");
const router = (0, express_1.Router)();
// 项目列表
router.get('/', taskController_1.getTaskList);
// 待审核项目列表
router.get('/pending-review', taskController_1.getPendingReviewTasks);
// 项目分类标签统计
router.get('/categories', taskController_1.getTaskCategories);
// 项目详情
router.get('/:id', taskController_1.getTaskDetail);
// 审核项目
router.post('/:id/review', taskController_1.reviewTask);
// 上下架项目
router.post('/:id/toggle-status', taskController_1.toggleTaskStatus);
// 更新项目信息
router.put('/:id', taskController_1.updateTask);
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map