"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pblAgentController_1 = require("../controllers/pblAgentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// 初始化项目
router.post('/projects/init', pblAgentController_1.pblAgentController.initializeProject.bind(pblAgentController_1.pblAgentController));
// 苏格拉底式对话
router.post('/chat', pblAgentController_1.pblAgentController.chat.bind(pblAgentController_1.pblAgentController));
// 任务拆解
router.post('/tasks/decompose', pblAgentController_1.pblAgentController.guideTaskDecomposition.bind(pblAgentController_1.pblAgentController));
router.post('/tasks/evaluate', pblAgentController_1.pblAgentController.evaluateDecomposition.bind(pblAgentController_1.pblAgentController));
// MVP方案
router.post('/mvp/suggest', pblAgentController_1.pblAgentController.suggestMVP.bind(pblAgentController_1.pblAgentController));
// 代码执行
router.post('/code/execute', pblAgentController_1.pblAgentController.executeCode.bind(pblAgentController_1.pblAgentController));
// 反思
router.post('/reflection/guide', pblAgentController_1.pblAgentController.guideReflection.bind(pblAgentController_1.pblAgentController));
router.post('/reflection/save', pblAgentController_1.pblAgentController.saveReflection.bind(pblAgentController_1.pblAgentController));
exports.default = router;
//# sourceMappingURL=pblAgentRoutes.js.map