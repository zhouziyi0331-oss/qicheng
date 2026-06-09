import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  saveTaskDraft,
  getTaskDraft,
  saveSubmitDraft,
  getSubmitDraft,
  deleteDraft
} from './draftController';
import {
  createAmendment,
  respondToAmendment,
  getTaskAmendments,
  getMyPendingAmendments
} from './amendmentController';

const router = Router();

// 草稿箱路由
router.post('/drafts/publish', authenticate, saveTaskDraft); // 保存任务发布草稿
router.get('/drafts/publish', authenticate, getTaskDraft); // 获取任务发布草稿
router.post('/drafts/submit', authenticate, saveSubmitDraft); // 保存任务提交草稿
router.get('/drafts/submit/:taskId', authenticate, getSubmitDraft); // 获取任务提交草稿
router.delete('/drafts/:draftId', authenticate, deleteDraft); // 删除草稿

// 任务追加需求路由
router.post('/amendments', authenticate, createAmendment); // 创建追加需求（企业端）
router.post('/amendments/:amendmentId/respond', authenticate, respondToAmendment); // 响应追加需求（学生端）
router.get('/amendments/pending', authenticate, getMyPendingAmendments); // 获取我的待处理追加需求（学生端）
router.get('/:taskId/amendments', authenticate, getTaskAmendments); // 获取任务的追加需求列表

export default router;
