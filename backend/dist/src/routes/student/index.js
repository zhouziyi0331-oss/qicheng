"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 指令1: 学生端个人信息
 * GET  /student/profile       — 获取学生档案
 * POST /student/profile       — 更新基础信息
 * GET  /student/test/questions — 获取25题测试题目
 * POST /student/test/submit   — 提交测试答案
 * GET  /student/test/result   — 获取测试结果
 * GET  /student/onboarding    — 获取 Onboarding 状态
 * POST /student/onboarding/:step/complete — 完成某个 J 步骤
 * GET  /student/balance       — 获取余额信息
 * GET  /student/level         — 获取等级信息
 * GET  /student/level/check   — 检查是否可以升级
 * GET  /student/level/next    — 获取下一等级信息
 * GET  /student/timeline      — 获取成长时间线
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const timelineCtrl = __importStar(require("./timeline"));
const mentorCtrl = __importStar(require("./mentor"));
const peerStatsCtrl = __importStar(require("./peer-stats"));
const growthTimelineCtrl = __importStar(require("./growth-timeline"));
const clientContactCtrl = __importStar(require("./client-contact"));
const capabilityCtrl = __importStar(require("./capability-verify"));
const talentController_1 = require("../../controllers/talentController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)('student'));
router.get('/profile', controller.getProfile);
router.post('/profile', controller.updateProfile);
router.get('/test/questions', controller.getTestQuestions);
router.post('/test/submit', controller.submitTest);
router.get('/test/result', controller.getTestResult);
router.get('/onboarding/status', controller.getOnboardingStatus);
router.post('/onboarding/:step/complete', controller.completeOnboardingStep);
router.get('/emotion-signals', controller.getEmotionSignals);
router.get('/balance', controller.getBalance);
router.get('/level', controller.getLevel);
router.get('/level/check', controller.checkLevelUpgrade);
router.get('/level/next', controller.getNextLevel);
router.get('/is-first-order', controller.isFirstOrder);
router.get('/orders/:orderId/payment-status', controller.getPaymentStatus);
router.get('/available-skip-tests', controller.getAvailableSkipTests);
router.post('/apply-skip-test', controller.applySkipTest);
router.post('/submit-skip-test', controller.submitSkipTest);
router.get('/skip-test-result/:testId', controller.getSkipTestResult);
router.get('/growth-comparison', controller.getGrowthComparison);
router.get('/asset-dashboard', controller.getAssetDashboard);
router.post('/generate-identity-card', controller.generateIdentityCard);
router.get('/can-be-mentor', mentorCtrl.canBeMentor);
router.post('/become-mentor', mentorCtrl.becomeMentor);
router.get('/my-mentees', mentorCtrl.getMyMentees);
router.get('/peer-stats', peerStatsCtrl.getPeerStats);
router.get('/growth-timeline', growthTimelineCtrl.getGrowthTimeline);
router.get('/client-contact/:clientId', clientContactCtrl.getClientContactInfo);
router.post('/verify-capability', capabilityCtrl.verifyCapability);
router.get('/timeline', timelineCtrl.getTimeline);
// 获取学生天赋标签
router.get('/talent-tags', talentController_1.TalentController.getStudentTalentProfile);
exports.default = router;
//# sourceMappingURL=index.js.map