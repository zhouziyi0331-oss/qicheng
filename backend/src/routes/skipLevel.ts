import express from 'express';
import skipLevelController from '../controllers/skipLevelController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * 跳级系统路由
 * 所有路由都需要认证
 */

// 检查跳级资格
router.get('/eligibility', authenticate, skipLevelController.checkEligibility);

// 申请跳级
router.post('/apply', authenticate, skipLevelController.applySkipLevel);

// 获取任务详情
router.get('/task/:taskId', authenticate, skipLevelController.getTask);

// 领取任务
router.post('/task/:taskId/receive', authenticate, skipLevelController.receiveTask);

// 获取任务进度
router.get('/progress/:taskId', authenticate, skipLevelController.getProgress);

// 更新子任务进度
router.put('/progress/:taskId/subtask/:subTaskId', authenticate, skipLevelController.updateSubTaskProgress);

// 提交作品
router.post('/submit/:taskId', authenticate, skipLevelController.submitWork);

// 申请评分
router.post('/score/:taskId/request', authenticate, skipLevelController.requestScore);

// 获取评分结果
router.get('/score/:taskId', authenticate, skipLevelController.getScore);

// 获取奖励信息
router.get('/rewards/:taskId', authenticate, skipLevelController.getRewards);

// 领取奖励
router.post('/rewards/:taskId/claim', authenticate, skipLevelController.claimRewards);

// 获取改进建议
router.get('/improvement/:taskId', authenticate, skipLevelController.getImprovementGuide);

export default router;
