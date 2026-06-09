import express from 'express';
import * as statsController from '../controllers/statsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * 统计API路由
 *
 * 核心原则：消除所有固定文案，用真实数据说话
 */

// 获取人格标签统计（用于"全国有X个和你一样的XX"）
router.get('/personality/:tag', statsController.getPersonalityStats);

// 获取赛道统计（用于市场均价等）
router.get('/track/:track', statsController.getTrackStats);

// 获取学生能力估值（需要登录）
router.get('/student-valuation', authenticateToken, statsController.getStudentValuation);

export default router;
