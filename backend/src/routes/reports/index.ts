/**
 * 指令5: OPC成长报告系统 (永远收费)
 * GET  /reports              — 报告列表 + 预览钩子
 * POST /reports/order        — 购买报告
 * GET  /reports/:id          — 获取已购报告内容
 *
 * Phase R5: 企业查看学生报告
 * GET  /reports/enterprise/student/:studentId  — 企业查看学生报告
 * POST /reports/enterprise/purchase            — 企业购买报告访问权限
 * GET  /reports/enterprise/access-history      — 企业查看访问历史
 * GET  /reports/enterprise/purchases           — 企业查看购买记录
 *
 * Phase R5.2: 学生报告功能扩展
 * GET  /reports/student/my-report              — 学生查看自己报告
 * GET  /reports/student/who-viewed             — 学生查看谁看了报告
 * PUT  /reports/student/visibility             — 学生设置报告可见性
 * GET  /reports/student/stats                  — 学生查看报告统计
 * POST /reports/student/share-link             — 学生生成分享链接
 * GET  /reports/student/share-links            — 学生查看分享链接
 * DELETE /reports/student/share-links/:linkId  — 学生删除分享链接
 *
 * Phase R5.2: 公共分享访问
 * GET  /reports/shared/:shareToken             — 通过分享链接访问报告（无需认证）
 * GET  /reports/shared/:shareToken/validate    — 验证分享链接
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';
import enterpriseRoutes from './enterpriseRoutes';
import studentRoutes from './studentRoutes';
import sharedRoutes from './sharedRoutes';

const router = Router();

// Phase R5: 企业报告路由（必须在学生路由之前，避免requireRole冲突）
router.use('/enterprise', enterpriseRoutes);

// Phase R5.2: 学生报告扩展路由
router.use('/student', studentRoutes);

// Phase R5.2: 公共分享访问路由（无需认证）
router.use('/shared', sharedRoutes);

// 学生报告路由（原有功能）
router.use(authenticate, requireRole('student'));
router.get('/', controller.listReports);
router.post('/order', controller.orderReport);
router.get('/:id', controller.getReport);
router.get('/:id/pdf', controller.downloadReportPDF);

export default router;
