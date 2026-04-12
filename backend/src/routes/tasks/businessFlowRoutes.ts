import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

// 导入控制器
import * as businessFlowController from './businessFlowController';
import * as studentFlowController from './studentFlowController';
import * as verificationFlowController from './verificationFlowController';

const router = Router();

// ============================================
// 企业端 - 发布任务流程
// ============================================

// 1. 获取AI价格建议
router.post(
  '/ai-price-suggestion',
  authenticate,
  businessFlowController.getAIPriceSuggestion
);

// 2. 发布任务并支付定金
router.post(
  '/publish-with-deposit',
  authenticate,
  businessFlowController.publishTaskWithDeposit
);

// 3. 查看AI匹配的10个学生
router.get(
  '/:taskId/matched-students',
  authenticate,
  businessFlowController.getMatchedStudents
);

// 4. 从10个中选择5个学生发送邀请
router.post(
  '/:taskId/select-students',
  authenticate,
  businessFlowController.selectStudentsForInvitation
);

// ============================================
// 学生端 - 接单流程
// ============================================

// 1. 查看收到的任务邀请
router.get(
  '/invitations',
  authenticate,
  studentFlowController.getTaskInvitations
);

// 2. 接受任务邀请
router.post(
  '/:taskId/accept',
  authenticate,
  studentFlowController.acceptTaskInvitation
);

// 3. 拒绝任务邀请
router.post(
  '/:taskId/reject',
  authenticate,
  studentFlowController.rejectTaskInvitation
);

// 4. 更新任务进度
router.post(
  '/:taskId/progress',
  authenticate,
  studentFlowController.updateTaskProgress
);

// 5. 提交交付物
router.post(
  '/:taskId/deliverables',
  authenticate,
  studentFlowController.submitDeliverables
);

// ============================================
// 企业端 - 验收和支付流程
// ============================================

// 1. 查看交付物
router.get(
  '/:taskId/deliverables',
  authenticate,
  verificationFlowController.getTaskDeliverables
);

// 2. 验收通过并支付尾款
router.post(
  '/:taskId/approve-and-pay',
  authenticate,
  verificationFlowController.approveAndPayFinal
);

// 3. 最终确认
router.post(
  '/:taskId/final-confirm',
  authenticate,
  verificationFlowController.finalConfirmation
);

// 4. 企业补充需求
router.post(
  '/:taskId/supplement',
  authenticate,
  verificationFlowController.addRequirementSupplement
);

export default router;
