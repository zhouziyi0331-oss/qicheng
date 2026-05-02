"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const opcGrowthController_1 = require("../controllers/opcGrowthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// OPC测评
router.post('/assessment/start', auth_1.authenticate, opcGrowthController_1.OPCGrowthController.startAssessment);
router.post('/assessment/answer', auth_1.authenticate, opcGrowthController_1.OPCGrowthController.submitAnswer);
router.post('/assessment/:assessmentId/complete', auth_1.authenticate, opcGrowthController_1.OPCGrowthController.completeAssessment);
router.get('/assessment/:assessmentId/result', auth_1.authenticate, opcGrowthController_1.OPCGrowthController.getAssessmentResult);
// 成长报告
router.post('/report/generate', auth_1.authenticate, opcGrowthController_1.OPCGrowthController.generateGrowthReport);
router.post('/snapshot/create', auth_1.authenticate, opcGrowthController_1.OPCGrowthController.createAbilitySnapshot);
exports.default = router;
//# sourceMappingURL=opcGrowth.js.map