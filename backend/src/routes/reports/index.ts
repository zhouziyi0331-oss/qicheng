/**
 * 指令5: OPC成长报告系统 (永远收费)
 * GET  /reports              — 报告列表 + 预览钩子
 * POST /reports/order        — 购买报告
 * GET  /reports/:id          — 获取已购报告内容
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();
router.use(authenticate, requireRole('student'));

router.get('/', controller.listReports);
router.post('/order', controller.orderReport);
router.get('/:id', controller.getReport);

export default router;
