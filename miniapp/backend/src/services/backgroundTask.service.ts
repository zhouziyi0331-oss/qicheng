import { BackgroundTask } from '../models/BackgroundTask'
import { abilityRadarService } from './abilityRadar.service'
import { comparisonReportService } from './comparisonReport.service'
import { dynamicGrowthPathService } from './dynamicGrowthPath.service'
import { graduationReportService } from './graduationReport.service'
import { achievementService } from './achievement.service'
import { log } from '../utils/logger'

/**
 * 后台任务服务
 * 管理异步任务的创建、执行、重试和状态追踪
 */
export class BackgroundTaskService {

  /**
   * 创建后台任务
   */
  async createTask(data: {
    userId: string
    taskType: 'ability_radar' | 'comparison_report' | 'growth_path' | 'graduation_report' | 'achievement_check'
    taskName: string
    relatedId?: string
    metadata?: any
    maxAttempts?: number
  }) {
    const task = await BackgroundTask.create({
      userId: data.userId,
      taskType: data.taskType,
      taskName: data.taskName,
      relatedId: data.relatedId,
      metadata: data.metadata,
      status: 'pending',
      attempts: 0,
      maxAttempts: data.maxAttempts || 3
    })

    log.info('后台任务已创建', {
      taskId: task._id,
      taskType: data.taskType,
      userId: data.userId
    })

    // 立即尝试执行
    setImmediate(() => this.executeTask(task._id.toString()))

    return task
  }

  /**
   * 执行后台任务
   */
  async executeTask(taskId: string) {
    const task = await BackgroundTask.findById(taskId)

    if (!task) {
      log.error('任务不存在', { taskId })
      return
    }

    // 检查是否超过最大尝试次数
    if (task.attempts >= task.maxAttempts) {
      task.status = 'failed'
      task.error = '超过最大重试次数'
      await task.save()
      log.error('任务失败：超过最大重试次数', { taskId, attempts: task.attempts })
      return
    }

    // 更新任务状态
    task.status = 'processing'
    task.attempts += 1
    task.lastAttemptAt = new Date()
    await task.save()

    log.info('开始执行后台任务', {
      taskId,
      taskType: task.taskType,
      attempt: task.attempts,
      maxAttempts: task.maxAttempts
    })

    try {
      let result: any

      // 根据任务类型执行不同的逻辑
      switch (task.taskType) {
        case 'ability_radar':
          result = await abilityRadarService.generateAfterProjectCompletion(
            task.userId.toString(),
            task.relatedId!
          )
          break

        case 'comparison_report':
          result = await comparisonReportService.generateComparisonReport(
            task.userId.toString(),
            task.relatedId!
          )
          break

        case 'growth_path':
          result = await dynamicGrowthPathService.generateGrowthPath(
            task.userId.toString()
          )
          break

        case 'graduation_report':
          result = await graduationReportService.generateGraduationReport(
            task.userId.toString()
          )
          break

        case 'achievement_check':
          result = await achievementService.checkAllAchievements(
            task.userId.toString()
          )
          break

        default:
          throw new Error(`未知的任务类型: ${task.taskType}`)
      }

      // 任务成功
      task.status = 'completed'
      task.completedAt = new Date()
      task.result = result
      task.error = undefined
      task.errorStack = undefined
      await task.save()

      log.info('后台任务执行成功', {
        taskId,
        taskType: task.taskType,
        userId: task.userId
      })

    } catch (error: any) {
      log.error('后台任务执行失败', {
        taskId,
        taskType: task.taskType,
        attempt: task.attempts,
        error: error.message
      })

      task.error = error.message
      task.errorStack = error.stack

      // 如果还有重试机会，将任务状态设为pending，稍后重试
      if (task.attempts < task.maxAttempts) {
        task.status = 'pending'
        await task.save()

        // 延迟重试（指数退避）
        const retryDelay = Math.min(1000 * Math.pow(2, task.attempts - 1), 30000) // 最多30秒
        setTimeout(() => {
          this.executeTask(taskId)
        }, retryDelay)

        log.info('任务将在稍后重试', {
          taskId,
          retryDelay,
          nextAttempt: task.attempts + 1
        })

      } else {
        // 达到最大重试次数，标记为失败
        task.status = 'failed'
        await task.save()

        log.error('任务最终失败', {
          taskId,
          taskType: task.taskType,
          attempts: task.attempts
        })
      }
    }
  }

  /**
   * 获取用户的任务列表
   */
  async getUserTasks(userId: string, options?: {
    status?: string
    taskType?: string
    limit?: number
    skip?: number
  }) {
    const filter: any = { userId }

    if (options?.status) filter.status = options.status
    if (options?.taskType) filter.taskType = options.taskType

    const tasks = await BackgroundTask.find(filter)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 20)
      .skip(options?.skip || 0)

    return tasks
  }

  /**
   * 获取任务详情
   */
  async getTaskById(taskId: string) {
    return await BackgroundTask.findById(taskId)
  }

  /**
   * 重试失败的任务
   */
  async retryTask(taskId: string) {
    const task = await BackgroundTask.findById(taskId)

    if (!task) {
      throw new Error('任务不存在')
    }

    if (task.status !== 'failed') {
      throw new Error('只能重试失败的任务')
    }

    // 重置任务状态
    task.status = 'pending'
    task.attempts = 0
    task.error = undefined
    task.errorStack = undefined
    await task.save()

    // 立即执行
    setImmediate(() => this.executeTask(taskId))

    return task
  }

  /**
   * 获取任务统计
   */
  async getTaskStats(userId?: string) {
    const filter: any = {}
    if (userId) filter.userId = userId

    const [stats] = await BackgroundTask.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    }

    if (stats) {
      const grouped = await BackgroundTask.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])

      grouped.forEach((item: any) => {
        result[item._id as keyof typeof result] = item.count
      })
    }

    return result
  }

  /**
   * 清理旧任务（保留最近7天）
   */
  async cleanupOldTasks() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const result = await BackgroundTask.deleteMany({
      status: { $in: ['completed', 'failed'] },
      createdAt: { $lt: sevenDaysAgo }
    })

    log.info('清理旧任务完成', { deletedCount: result.deletedCount })

    return result.deletedCount
  }
}

export const backgroundTaskService = new BackgroundTaskService()
