"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const opcV2AssessmentController_1 = require("../controllers/opcV2AssessmentController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = (0, express_1.Router)();
// OPC能力画像测试 v2.0 路由
// 开始测试
router.post('/start', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), opcV2AssessmentController_1.OPCV2AssessmentController.startAssessment);
// 提交答案
router.post('/answer', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), opcV2AssessmentController_1.OPCV2AssessmentController.submitAnswer);
// 完成测试
router.post('/:assessmentId/complete', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), opcV2AssessmentController_1.OPCV2AssessmentController.completeAssessment);
// 获取测试进度
router.get('/:assessmentId/progress', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), opcV2AssessmentController_1.OPCV2AssessmentController.getProgress);
// 获取测试结果
router.get('/:assessmentId/result', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), opcV2AssessmentController_1.OPCV2AssessmentController.getAssessmentResult);
// 获取最新测试结果
router.get('/latest', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), opcV2AssessmentController_1.OPCV2AssessmentController.getLatestResult);
exports.default = router;
//# sourceMappingURL=opcV2Assessment.js.map