import express from 'express';
import {
  AIRequirementController,
  AITaskDecompositionController,
  AITaskReviewController,
  AIQAController
} from '../controllers/aiEngineController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';

const router = express.Router();

// AI需求确认路由
router.post('/requirement/start', authenticate, requireRole('company'), AIRequirementController.startDialogue);
router.post('/requirement/message', authenticate, requireRole('company'), AIRequirementController.sendMessage);
router.get('/requirement/history/:sessionId', authenticate, AIRequirementController.getDialogueHistory);

// AI任务拆解路由
router.post('/decomposition/decompose', authenticate, requireRole('company'), AITaskDecompositionController.decomposeTask);
router.post('/decomposition/create-subtasks', authenticate, requireRole('company'), AITaskDecompositionController.createSubtasks);
router.get('/decomposition/subtasks/:taskId', authenticate, AITaskDecompositionController.getSubtasks);

// AI任务审核路由
router.post('/review/task', authenticate, requireRole('company'), AITaskReviewController.reviewTask);
router.post('/review/:reviewId/human', authenticate, requireRole('admin'), AITaskReviewController.humanReview);

// AI问答路由
router.post('/qa/ask', authenticate, AIQAController.askQuestion);
router.post('/qa/:historyId/helpful', authenticate, AIQAController.markHelpful);

export default router;
