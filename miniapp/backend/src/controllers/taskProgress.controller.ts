import { Request, Response } from 'express'
import { taskProgressService } from '../services/taskProgress.service'

/**
 * 任务进度控制器
 */
export class TaskProgressController {

  /**
   * 为项目生成任务拆解
   * POST /api/task-progress/generate
   */
  async generateTaskDecomposition(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { projectType, projectId } = req.body

      if (!projectType || !projectId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        })
      }

      const taskProgress = await taskProgressService.generateTaskDecomposition(
        userId,
        projectType,
        projectId
      )

      res.json({
        success: true,
        data: taskProgress,
        message: '任务拆解生成成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '生成任务拆解失败'
      })
    }
  }

  /**
   * 获取项目的任务进度
   * GET /api/task-progress/:projectId
   */
  async getTaskProgress(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { projectId } = req.params

      const taskProgress = await taskProgressService.getTaskProgress(userId, projectId)

      if (!taskProgress) {
        return res.status(404).json({
          success: false,
          message: '任务进度不存在'
        })
      }

      res.json({
        success: true,
        data: taskProgress
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取任务进度失败'
      })
    }
  }

  /**
   * 获取用户所有任务进度列表
   * GET /api/task-progress/my/list
   */
  async getMyTaskProgressList(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { status } = req.query

      const list = await taskProgressService.getUserTaskProgressList(
        userId,
        status as string
      )

      res.json({
        success: true,
        data: list,
        count: list.length
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取任务进度列表失败'
      })
    }
  }

  /**
   * 更新任务状态
   * PUT /api/task-progress/:progressId/task/:taskNumber
   */
  async updateTaskStatus(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { progressId, taskNumber } = req.params
      const updates = req.body

      const taskProgress = await taskProgressService.updateTaskStatus(
        userId,
        progressId,
        parseInt(taskNumber),
        updates
      )

      res.json({
        success: true,
        data: taskProgress,
        message: '任务状态更新成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '更新任务状态失败'
      })
    }
  }

  /**
   * 记录任务挑战
   * POST /api/task-progress/:progressId/task/:taskNumber/challenge
   */
  async addChallenge(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { progressId, taskNumber } = req.params
      const { problem, solution } = req.body

      if (!problem || !solution) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        })
      }

      const taskProgress = await taskProgressService.addChallenge(
        userId,
        progressId,
        parseInt(taskNumber),
        problem,
        solution
      )

      res.json({
        success: true,
        data: taskProgress,
        message: '挑战记录添加成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '添加挑战记录失败'
      })
    }
  }

  /**
   * 添加任务反思
   * POST /api/task-progress/:progressId/task/:taskNumber/reflection
   */
  async addReflection(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { progressId, taskNumber } = req.params
      const { whatWorked, whatToImprove, lessonsLearned } = req.body

      const taskProgress = await taskProgressService.addReflection(
        userId,
        progressId,
        parseInt(taskNumber),
        { whatWorked, whatToImprove, lessonsLearned }
      )

      res.json({
        success: true,
        data: taskProgress,
        message: '反思添加成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '添加反思失败'
      })
    }
  }

  /**
   * 生成项目完成总结
   * POST /api/task-progress/:progressId/summary
   */
  async generateProjectSummary(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { progressId } = req.params

      const taskProgress = await taskProgressService.generateProjectSummary(userId, progressId)

      res.json({
        success: true,
        data: taskProgress,
        message: '项目总结生成成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '生成项目总结失败'
      })
    }
  }
}

export const taskProgressController = new TaskProgressController()
