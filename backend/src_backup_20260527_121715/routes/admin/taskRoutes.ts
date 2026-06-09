import { Router } from 'express';
import {
  getTaskList,
  getTaskDetail,
  getPendingReviewTasks,
  reviewTask,
  toggleTaskStatus,
  getTaskCategories,
  updateTask
} from './taskController';

const router = Router();

// 项目列表
router.get('/', getTaskList);

// 待审核项目列表
router.get('/pending-review', getPendingReviewTasks);

// 项目分类标签统计
router.get('/categories', getTaskCategories);

// 项目详情
router.get('/:id', getTaskDetail);

// 审核项目
router.post('/:id/review', reviewTask);

// 上下架项目
router.post('/:id/toggle-status', toggleTaskStatus);

// 更新项目信息
router.put('/:id', updateTask);

export default router;
