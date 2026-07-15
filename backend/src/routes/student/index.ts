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
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';
import * as timelineCtrl from './timeline';
import * as mentorCtrl from './mentor';
import * as peerStatsCtrl from './peer-stats';
import * as growthTimelineCtrl from './growth-timeline';
import * as clientContactCtrl from './client-contact';
import * as capabilityCtrl from './capability-verify';
import { TalentController } from '../../controllers/talentController';

const router = Router();
router.use(authenticate, requireRole('student'));

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
router.get('/talent-tags', TalentController.getStudentTalentProfile);

export default router;
