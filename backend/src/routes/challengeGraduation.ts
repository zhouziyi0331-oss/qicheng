import express from 'express';
import { ChallengeController, GraduationController } from '../controllers/challengeGraduationController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';

const router = express.Router();

// 跳级挑战路由
router.get('/challenges/available', authenticate, requireRole('student'), ChallengeController.getAvailableChallenges);
router.post('/challenges/start', authenticate, requireRole('student'), ChallengeController.startChallenge);
router.post('/challenges/:challengeId/submit', authenticate, requireRole('student'), ChallengeController.submitChallenge);
router.post('/challenges/:challengeId/review', authenticate, requireRole('admin'), ChallengeController.reviewChallenge);
router.get('/challenges/history', authenticate, requireRole('student'), ChallengeController.getChallengeHistory);

// 毕业系统路由
router.get('/graduation/eligibility', authenticate, requireRole('student'), GraduationController.checkEligibility);
router.post('/graduation/apply', authenticate, requireRole('student'), GraduationController.applyForGraduation);
router.post('/graduation/:applicationId/review', authenticate, requireRole('admin'), GraduationController.reviewGraduation);
router.get('/graduation/benefits', authenticate, requireRole('student'), GraduationController.getGraduateBenefits);
router.get('/graduation/applications', authenticate, requireRole('admin'), GraduationController.getApplications);

export default router;
