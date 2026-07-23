"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskProgress_controller_1 = require("../controllers/taskProgress.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticateToken);
// 生成任务拆解
router.post('/generate', taskProgress_controller_1.taskProgressController.generateTaskDecomposition.bind(taskProgress_controller_1.taskProgressController));
// 获取我的任务进度列表
router.get('/my/list', taskProgress_controller_1.taskProgressController.getMyTaskProgressList.bind(taskProgress_controller_1.taskProgressController));
// 获取项目的任务进度
router.get('/:projectId', taskProgress_controller_1.taskProgressController.getTaskProgress.bind(taskProgress_controller_1.taskProgressController));
// 更新任务状态
router.put('/:progressId/task/:taskNumber', taskProgress_controller_1.taskProgressController.updateTaskStatus.bind(taskProgress_controller_1.taskProgressController));
// 记录任务挑战
router.post('/:progressId/task/:taskNumber/challenge', taskProgress_controller_1.taskProgressController.addChallenge.bind(taskProgress_controller_1.taskProgressController));
// 添加任务反思
router.post('/:progressId/task/:taskNumber/reflection', taskProgress_controller_1.taskProgressController.addReflection.bind(taskProgress_controller_1.taskProgressController));
// 生成项目完成总结
router.post('/:progressId/summary', taskProgress_controller_1.taskProgressController.generateProjectSummary.bind(taskProgress_controller_1.taskProgressController));
exports.default = router;
//# sourceMappingURL=taskProgress.routes.js.map