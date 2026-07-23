import { Router } from 'express'
import { backgroundTaskController } from '../controllers/backgroundTask.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// 获取用户任务列表
router.get('/', authMiddleware, (req, res) =>
  backgroundTaskController.getUserTasks(req, res))

// 获取任务统计
router.get('/stats', authMiddleware, (req, res) =>
  backgroundTaskController.getTaskStats(req, res))

// 获取任务详情
router.get('/:taskId', authMiddleware, (req, res) =>
  backgroundTaskController.getTaskDetail(req, res))

// 重试失败的任务
router.post('/:taskId/retry', authMiddleware, (req, res) =>
  backgroundTaskController.retryTask(req, res))

export default router
