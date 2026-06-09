"use strict";
// 启程小猫 - 增强版AI导师路由
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const enhanced_controller_1 = require("./enhanced-controller");
const router = express_1.default.Router();
// ══════════════════════════════════════════════════════════════
// 阶段1：需求理解与确认
// ══════════════════════════════════════════════════════════════
// 任务匹配后，发起需求确认对话
router.post('/tasks/:taskId/requirement-confirmation/start', auth_1.authenticate, enhanced_controller_1.initiateRequirementConfirmation);
// 分析学生对需求的理解
router.post('/tasks/:taskId/requirement-confirmation/analyze', auth_1.authenticate, enhanced_controller_1.analyzeStudentUnderstanding);
// ══════════════════════════════════════════════════════════════
// 阶段2：执行引导（启发式教学）
// ══════════════════════════════════════════════════════════════
// 学生求助时的启发式引导
router.post('/tasks/:taskId/guidance/help', auth_1.authenticate, enhanced_controller_1.provideInspirationalGuidance);
// 学生完成步骤后的鼓励
router.post('/tasks/:taskId/guidance/celebrate', auth_1.authenticate, enhanced_controller_1.celebrateProgressAndGuideNext);
// ══════════════════════════════════════════════════════════════
// 阶段3：质量审核
// ══════════════════════════════════════════════════════════════
// AI审核学生提交的作品
router.post('/tasks/:taskId/review/submission', auth_1.authenticate, enhanced_controller_1.reviewSubmission);
// ══════════════════════════════════════════════════════════════
// 阶段4：沟通桥梁
// ══════════════════════════════════════════════════════════════
// 翻译企业反馈给学生
router.post('/tasks/:taskId/translate/company-feedback', auth_1.authenticate, enhanced_controller_1.translateCompanyFeedback);
// 翻译学生疑问给企业
router.post('/tasks/:taskId/translate/student-question', auth_1.authenticate, enhanced_controller_1.translateStudentQuestion);
exports.default = router;
//# sourceMappingURL=enhanced-routes.js.map