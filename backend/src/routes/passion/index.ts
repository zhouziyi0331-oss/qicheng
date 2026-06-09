/**
 * 热情火花系统
 * GET  /passion/sparks/:userId              — 获取用户的热情火花记录
 * POST /passion/spark/record                — 记录热情火花
 * GET  /passion/analysis/:userId            — 获取热情分析
 * GET  /passion/recommendations/:userId     — 获取热情探索建议
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

router.get('/sparks/:userId', controller.getSparks);
router.post('/spark/record', controller.recordSpark);
router.get('/analysis/:userId', controller.getAnalysis);
router.get('/recommendations/:userId', controller.getRecommendations);

export default router;
