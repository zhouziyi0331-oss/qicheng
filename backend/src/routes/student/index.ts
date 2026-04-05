/**
 * 指令1: 学生端个人信息
 * GET  /student/profile       — 获取学生档案
 * POST /student/profile       — 更新基础信息
 * GET  /student/test/questions — 获取25题测试题目
 * POST /student/test/submit   — 提交测试答案
 * GET  /student/onboarding    — 获取 Onboarding 状态
 * POST /student/onboarding/:step/complete — 完成某个 J 步骤
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';
import * as timelineCtrl from './timeline';

const router = Router();
router.use(authenticate, requireRole('student'));

router.get('/profile', controller.getProfile);
router.post('/profile', controller.updateProfile);
router.get('/test/questions', controller.getTestQuestions);
router.post('/test/submit', controller.submitTest);
router.get('/onboarding/status', controller.getOnboardingStatus);
router.post('/onboarding/:step/complete', controller.completeOnboardingStep);
router.get('/emotion-signals', controller.getEmotionSignals);
router.get('/timeline', timelineCtrl.getTimeline);

export default router;
