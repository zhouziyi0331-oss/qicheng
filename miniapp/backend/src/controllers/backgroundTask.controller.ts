import { Request, Response } from 'express'
import { backgroundTaskService } from '../services/backgroundTask.service'

/**
 * 后台任务控制器
 */
export class BackgroundTaskController {

  /**
   * GET /api/tasks
   * 获取用户的后台任务列表
   */
  async getUserTasks(req: Request, res: Response) {
    try {
      const userId = req.userId
      const { status, taskType, limit, skip } = req.query

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const tasks = await backgroundTaskService.getUserTasks(userId, {
        status: status as string,
        taskType: taskType as string,
        limit: limit ? parseInt(limit as string) : 20,
        skip: skip ? parseInt(skip as string) : 0
      })

      res.json({
        success: true,
        tasks: tasks.map(t => ({
          id: t._id,
          taskType: t.taskType,
          taskName: t.taskName,
          status: t.status,
          attempts: t.attempts,
          maxAttempts: t.maxAttempts,
          error: t.error,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
          lastAttemptAt: t.lastAttemptAt
        }))
      })

    } catch (error: any) {
      console.error('获取任务列表失败:', error)
      res.status(500).json({ error: error.message || '获取任务列表失败' })
    }
  }

  /**
   * GET /api/tasks/:taskId
   * 获取任务详情
   */
  async getTaskDetail(req: Request, res: Response) {
    try {
      const userId = req.userId
      const { taskId } = req.params

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const task = await backgroundTaskService.getTaskById(taskId)

      if (!task) {
        return res.status(404).json({ error: '任务不存在' })
      }

      if (task.userId.toString() !== userId) {
        return res.status(403).json({ error: '无权访问此任务' })
      }

      res.json({
        success: true,
        task: {
          id: task._id,
          taskType: task.taskType,
          taskName: task.taskName,
          status: task.status,
          attempts: task.attempts,
          maxAttempts: task.maxAttempts,
          error: task.error,
          errorStack: task.errorStack,
          result: task.result,
          metadata: task.metadata,
          relatedId: task.relatedId,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
          lastAttemptAt: task.lastAttemptAt
        }
      })

    } catch (error: any) {
      console.error('获取任务详情失败:', error)
      res.status(500).json({ error: error.message || '获取任务详情失败' })
    }
  }

  /**
   * POST /api/tasks/:taskId/retry
   * 重试失败的任务
   */
  async retryTask(req: Request, res: Response) {
    try {
      const userId = req.userId
      const { taskId } = req.params

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const task = await backgroundTaskService.getTaskById(taskId)

      if (!task) {
        return res.status(404).json({ error: '任务不存在' })
      }

      if (task.userId.toString() !== userId) {
        return res.status(403).json({ error: '无权操作此任务' })
      }

      const retriedTask = await backgroundTaskService.retryTask(taskId)

      res.json({
        success: true,
        message: '任务已重新加入队列',
        task: {
          id: retriedTask._id,
          status: retriedTask.status,
          attempts: retriedTask.attempts
        }
      })

    } catch (error: any) {
      console.error('重试任务失败:', error)
      res.status(400).json({ error: error.message || '重试任务失败' })
    }
  }

  /**
   * GET /api/tasks/stats
   * 获取任务统计
   */
  async getTaskStats(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const stats = await backgroundTaskService.getTaskStats(userId)

      res.json({
        success: true,
        stats
      })

    } catch (error: any) {
      console.error('获取任务统计失败:', error)
      res.status(500).json({ error: error.message || '获取任务统计失败' })
    }
  }
}

export const backgroundTaskController = new BackgroundTaskController()
