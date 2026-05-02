/**
 * 指令4: 任务系统全流程
 * GET  /tasks/market               — 任务大厅 (登录即可看)
 * GET  /tasks/my                   — 学生: 我的任务列表
 * GET  /tasks/recommended          — 学生: 获取定向推送任务(2-3个)
 * GET  /tasks/:id                  — 任务详情
 * POST /tasks/:id/accept           — 学生: 接单
 * GET  /tasks/:id/steps            — 学生: 获取任务步骤
 * POST /tasks/:id/steps/:num/done  — 学生: 完成一个子步骤
 * POST /tasks/:id/submit           — 学生: 提交交付物
 * POST /company/tasks              — 企业: 发布任务
 * GET  /company/tasks              — 企业: 获取任务列表
 * POST /company/tasks/:id/approve  — 企业: 验收通过
 * POST /company/tasks/:id/reject   — 企业: 验收打回
 *
 * 完整业务流程路由 (新增):
 * POST /tasks/flow/ai-price-suggestion      — 企业: 获取AI价格建议
 * POST /tasks/flow/publish-with-deposit     — 企业: 发布任务并支付定金
 * GET  /tasks/flow/:taskId/matched-students — 企业: 查看AI匹配的10个学生
 * POST /tasks/flow/:taskId/select-students  — 企业: 选择5个学生发送邀请
 * GET  /tasks/flow/invitations              — 学生: 查看收到的任务邀请
 * POST /tasks/flow/:taskId/accept           — 学生: 接受任务邀请
 * POST /tasks/flow/:taskId/reject           — 学生: 拒绝任务邀请
 * POST /tasks/flow/:taskId/progress         — 学生: 更新任务进度
 * POST /tasks/flow/:taskId/deliverables     — 学生: 提交交付物
 * GET  /tasks/flow/:taskId/deliverables     — 企业: 查看交付物
 * POST /tasks/flow/:taskId/approve-and-pay  — 企业: 验收通过并支付尾款
 * POST /tasks/flow/:taskId/final-confirm    — 企业: 最终确认
 * POST /tasks/flow/:taskId/supplement       — 企业: 补充需求
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as studentCtrl from './studentController';
import * as companyCtrl from './companyController';
import businessFlowRoutes from './businessFlowRoutes';

const router = Router();

// ============================================
// 完整业务流程路由 (新增)
// ============================================
router.use('/flow', businessFlowRoutes);

// 公开/登录可见
router.get('/market', authenticate, studentCtrl.getMarketTasks);
router.get('/my', authenticate, requireRole('student'), studentCtrl.getMyTasks);
router.get('/recommended', authenticate, requireRole('student'), studentCtrl.getRecommendedTasks);
router.get('/:id', authenticate, studentCtrl.getTaskDetail);

// 学生端操作
router.post('/:id/accept', authenticate, requireRole('student'), studentCtrl.acceptTask);
router.get('/:id/steps', authenticate, requireRole('student'), studentCtrl.getTaskSteps);
router.post('/:id/steps/:num/done', authenticate, requireRole('student'), studentCtrl.completeStep);
router.post('/:id/submit', authenticate, requireRole('student'), studentCtrl.submitTask);
router.get('/:id/supplements', authenticate, requireRole('student'), studentCtrl.getTaskSupplements);
router.post('/:id/supplements/:supplementId/respond', authenticate, requireRole('student'), studentCtrl.respondToSupplement);

// 企业端
router.post('/company', authenticate, requireRole('company'), companyCtrl.createTask);
router.get('/company', authenticate, requireRole('company'), companyCtrl.getCompanyTasks);
router.post('/company/:id/approve', authenticate, requireRole('company'), companyCtrl.approveTask);
router.post('/company/:id/reject', authenticate, requireRole('company'), companyCtrl.rejectTask);

export default router;
