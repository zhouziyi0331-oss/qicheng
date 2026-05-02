"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const challengeGraduationController_1 = require("../controllers/challengeGraduationController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = express_1.default.Router();
// 跳级挑战路由
router.get('/challenges/available', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), challengeGraduationController_1.ChallengeController.getAvailableChallenges);
router.post('/challenges/start', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), challengeGraduationController_1.ChallengeController.startChallenge);
router.post('/challenges/:challengeId/submit', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), challengeGraduationController_1.ChallengeController.submitChallenge);
router.post('/challenges/:challengeId/review', auth_1.authenticate, (0, roleCheck_1.requireRole)('admin'), challengeGraduationController_1.ChallengeController.reviewChallenge);
router.get('/challenges/history', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), challengeGraduationController_1.ChallengeController.getChallengeHistory);
// 毕业系统路由
router.get('/graduation/eligibility', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), challengeGraduationController_1.GraduationController.checkEligibility);
router.post('/graduation/apply', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), challengeGraduationController_1.GraduationController.applyForGraduation);
router.post('/graduation/:applicationId/review', auth_1.authenticate, (0, roleCheck_1.requireRole)('admin'), challengeGraduationController_1.GraduationController.reviewGraduation);
router.get('/graduation/benefits', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), challengeGraduationController_1.GraduationController.getGraduateBenefits);
router.get('/graduation/applications', auth_1.authenticate, (0, roleCheck_1.requireRole)('admin'), challengeGraduationController_1.GraduationController.getApplications);
exports.default = router;
//# sourceMappingURL=challengeGraduation.js.map