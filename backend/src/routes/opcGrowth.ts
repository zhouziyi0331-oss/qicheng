import { Router } from 'express';
import { OPCGrowthController } from '../controllers/opcGrowthController';
import { authenticate } from '../middleware/auth';

const router = Router();

// OPC测评
router.post('/assessment/start', authenticate, OPCGrowthController.startAssessment);
router.post('/assessment/answer', authenticate, OPCGrowthController.submitAnswer);
router.post('/assessment/:assessmentId/complete', authenticate, OPCGrowthController.completeAssessment);
router.get('/assessment/:assessmentId/result', authenticate, OPCGrowthController.getAssessmentResult);

// 成长报告
router.post('/report/generate', authenticate, OPCGrowthController.generateGrowthReport);
router.post('/snapshot/create', authenticate, OPCGrowthController.createAbilitySnapshot);

export default router;
