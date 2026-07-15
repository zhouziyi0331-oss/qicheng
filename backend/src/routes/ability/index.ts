/**
 * 指令5: 六维能力分析系统 + 成长时间线
 * GET /ability/radar          — 六维雷达图 (基础版免费)
 * GET /ability/radar/detailed — 详细版 (付费 ¥69)
 * GET /ability/timeline       — 成长时间线
 * GET /ability/emotion-state  — 获取情绪状态
 * GET /ability/growth-comparison — 成长对比数据（入驻时 vs 当前）
 * GET /ability/growth-dashboard — 成长仪表盘数据
 * POST /ability/update-after-task — 任务完成后更新能力
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();
router.use(authenticate, requireRole('student'));

router.get('/radar', controller.getRadar);
router.get('/radar/detailed', controller.getDetailedRadar);
router.get('/timeline', controller.getTimeline);
router.get('/emotion-state', controller.getEmotionState);
router.get('/growth-comparison', controller.getGrowthComparison);
router.get('/growth-dashboard', controller.getGrowthDashboard);
router.post('/update-after-task', controller.updateAfterTask);

export default router;
