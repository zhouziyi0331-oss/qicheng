/**
 * 指令5: 六维能力分析系统 + 成长时间线
 * GET /ability/radar          — 六维雷达图 (基础版免费)
 * GET /ability/radar/detailed — 详细版 (付费 ¥69)
 * GET /ability/timeline       — 成长时间线
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();
router.use(authenticate, requireRole('student'));

router.get('/radar', controller.getRadar);
router.get('/radar/detailed', controller.getDetailedRadar);
router.get('/timeline', controller.getTimeline);

export default router;
