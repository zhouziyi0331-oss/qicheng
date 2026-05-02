import { Router } from 'express';
import { OPCV2AssessmentController } from '../controllers/opcV2AssessmentController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';

const router = Router();

// OPC能力画像测试 v2.0 路由

// 开始测试
router.post('/start', authenticate, requireRole('student'), OPCV2AssessmentController.startAssessment);

// 提交答案
router.post('/answer', authenticate, requireRole('student'), OPCV2AssessmentController.submitAnswer);

// 完成测试
router.post('/:assessmentId/complete', authenticate, requireRole('student'), OPCV2AssessmentController.completeAssessment);

// 获取测试进度
router.get('/:assessmentId/progress', authenticate, requireRole('student'), OPCV2AssessmentController.getProgress);

// 获取测试结果
router.get('/:assessmentId/result', authenticate, requireRole('student'), OPCV2AssessmentController.getAssessmentResult);

// 获取最新测试结果
router.get('/latest', authenticate, requireRole('student'), OPCV2AssessmentController.getLatestResult);

export default router;
