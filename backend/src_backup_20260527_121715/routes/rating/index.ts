import { Router } from 'express';
import {
  submitRating,
  getTaskRatings,
  getUserRatingStats,
  getUserReceivedRatings,
  getUserGivenRatings,
  replyToRating,
  getRatingTagPresets,
  checkRatingEligibility,
  getPendingRatingTasks
} from './ratingController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 提交评价
router.post('/submit', submitRating);

// 获取任务的评价
router.get('/task/:taskId', getTaskRatings);

// 获取用户的评分统计
router.get('/stats/:userId', getUserRatingStats);

// 获取用户收到的评价列表
router.get('/received/:userId', getUserReceivedRatings);

// 获取用户发出的评价列表
router.get('/given', getUserGivenRatings);

// 企业回复评价
router.post('/:ratingId/reply', replyToRating);

// 获取评价标签预设
router.get('/tags/presets', getRatingTagPresets);

// 检查任务是否可以评价
router.get('/check/:taskId', checkRatingEligibility);

// 获取待评价任务列表
router.get('/pending', getPendingRatingTasks);

export default router;
