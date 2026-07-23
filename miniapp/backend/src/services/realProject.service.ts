import { RealProject } from '../models/RealProject'
import { Income } from '../models/Income'
import { User } from '../models/User'
import { abilityRadarService } from './abilityRadar.service'
import { comparisonReportService } from './comparisonReport.service'
import { dynamicGrowthPathService } from './dynamicGrowthPath.service'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 真实项目服务
 * 管理用户的真实接单项目
 */
export class RealProjectService {

  /**
   * 获取可接单的项目列表
   */
  async getAvailableProjects(filters?: {
    category?: string
    difficulty?: string
    minBudget?: number
    maxBudget?: number
    requiredAbilities?: string[]
  }) {
    const query: any = { status: 'available' }

    if (filters) {
      if (filters.category) query.category = filters.category
      if (filters.difficulty) query.difficulty = filters.difficulty
      if (filters.minBudget || filters.maxBudget) {
        query.budget = {}
        if (filters.minBudget) query.budget.$gte = filters.minBudget
        if (filters.maxBudget) query.budget.$lte = filters.maxBudget
      }
      if (filters.requiredAbilities && filters.requiredAbilities.length > 0) {
        query.requiredAbilities = { $in: filters.requiredAbilities }
      }
    }

    const projects = await RealProject.find(query)
      .sort({ createdAt: -1 })
      .limit(50)

    return projects
  }

  /**
   * 用户申请项目
   */
  async applyForProject(userId: string, projectId: string) {
    try {
      const project = await RealProject.findById(projectId)

      if (!project) {
        throw new Error('项目不存在')
      }

      if (project.status !== 'available') {
        throw new Error('项目不可申请')
      }

      // 更新状态
      project.status = 'applied'
      project.userId = new mongoose.Types.ObjectId(userId)
      project.appliedAt = new Date()
      await project.save()

      log.info('用户申请项目', { userId, projectId })

      return project

    } catch (error: any) {
      log.error('申请项目失败', { error: error.message, userId, projectId })
      throw new Error(error.message || '申请项目失败')
    }
  }

  /**
   * 接受项目（开始工作）
   */
  async acceptProject(userId: string, projectId: string) {
    try {
      const project = await RealProject.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        userId: new mongoose.Types.ObjectId(userId),
        status: 'applied'
      })

      if (!project) {
        throw new Error('项目不存在或状态不正确')
      }

      // 计算项目编号
      const completedCount = await RealProject.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        status: { $in: ['in_progress', 'completed'] }
      })

      project.projectNumber = completedCount + 1
      project.status = 'in_progress'
      project.acceptedAt = new Date()
      project.startedAt = new Date()
      await project.save()

      log.info('用户接受项目', { userId, projectId, projectNumber: project.projectNumber })

      return project

    } catch (error: any) {
      log.error('接受项目失败', { error: error.message, userId, projectId })
      throw new Error(error.message || '接受项目失败')
    }
  }

  /**
   * 完成项目
   */
  async completeProject(
    userId: string,
    projectId: string,
    deliverables: { type: string; url: string; description: string }[]
  ) {
    try {
      const project = await RealProject.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        userId: new mongoose.Types.ObjectId(userId),
        status: 'in_progress'
      })

      if (!project) {
        throw new Error('项目不存在或状态不正确')
      }

      // 更新项目状态
      project.status = 'completed'
      project.completedAt = new Date()
      project.deliverables = deliverables

      // 计算收入（假设平台抽成15%）
      project.actualEarnings = project.budget
      project.platformCommission = Math.round(project.budget * 0.15 * 100) / 100
      project.netIncome = Math.round((project.budget - project.platformCommission) * 100) / 100

      await project.save()

      // 创建收入记录
      await Income.create({
        userId: new mongoose.Types.ObjectId(userId),
        source: 'real_project',
        sourceRefId: project._id,
        amount: project.netIncome,
        description: `完成项目：${project.title}`,
        status: 'confirmed',
        confirmedAt: new Date()
      })

      // 实时更新用户余额和总收入
      await User.findByIdAndUpdate(userId, {
        $inc: {
          balance: project.netIncome,
          totalIncome: project.netIncome,
          totalProjects: 1
        }
      })

      log.info('项目完成，收入已到账', { userId, projectId, netIncome: project.netIncome })

      // 增加经验值
      await this.addExpForCompletion(userId, project)

      // 触发后续流程
      this.triggerPostCompletionTasks(userId, projectId)

      return project

    } catch (error: any) {
      log.error('完成项目失败', { error: error.message, userId, projectId })
      throw new Error(error.message || '完成项目失败')
    }
  }

  /**
   * 客户评价项目
   */
  async rateProject(
    projectId: string,
    rating: {
      score: number
      comment: string
      tags: string[]
    }
  ) {
    try {
      const project = await RealProject.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        status: 'completed'
      })

      if (!project) {
        throw new Error('项目不存在或未完成')
      }

      project.clientRating = rating
      await project.save()

      log.info('客户评价项目', { projectId, score: rating.score })

      return project

    } catch (error: any) {
      log.error('评价项目失败', { error: error.message, projectId })
      throw new Error(error.message || '评价项目失败')
    }
  }

  /**
   * 项目完成后的触发任务
   */
  private async triggerPostCompletionTasks(userId: string, projectId: string) {
    try {
      const { backgroundTaskService } = require('./backgroundTask.service')

      // 创建后台任务，异步执行
      await Promise.all([
        // 1. 生成新的能力雷达图
        backgroundTaskService.createTask({
          userId,
          taskType: 'ability_radar',
          taskName: '生成能力雷达图',
          relatedId: projectId
        }),

        // 2. 生成对比报告
        backgroundTaskService.createTask({
          userId,
          taskType: 'comparison_report',
          taskName: '生成对比报告',
          relatedId: projectId
        }),

        // 3. 更新成长路径
        backgroundTaskService.createTask({
          userId,
          taskType: 'growth_path',
          taskName: '更新成长路径'
        }),

        // 4. 检查成就
        backgroundTaskService.createTask({
          userId,
          taskType: 'achievement_check',
          taskName: '检查成就解锁'
        })
      ])

      log.info('项目完成后的任务已加入队列', { userId, projectId })

    } catch (error: any) {
      log.error('创建后台任务失败', { error: error.message, userId, projectId })
      // 不抛出错误，允许主流程继续
    }
  }

  /**
   * 获取用户的项目列表
   */
  async getUserProjects(userId: string, status?: string) {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) }

    if (status) {
      query.status = status
    }

    const projects = await RealProject.find(query)
      .sort({ createdAt: -1 })

    return projects
  }

  /**
   * 获取用户的项目统计
   */
  async getUserProjectStats(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const [
      totalApplied,
      inProgress,
      completed,
      totalEarnings,
      avgRating
    ] = await Promise.all([
      RealProject.countDocuments({
        userId: userObjectId,
        status: { $in: ['applied', 'in_progress', 'completed'] }
      }),
      RealProject.countDocuments({
        userId: userObjectId,
        status: 'in_progress'
      }),
      RealProject.countDocuments({
        userId: userObjectId,
        status: 'completed'
      }),
      RealProject.aggregate([
        {
          $match: {
            userId: userObjectId,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netIncome' }
          }
        }
      ]),
      RealProject.aggregate([
        {
          $match: {
            userId: userObjectId,
            status: 'completed',
            'clientRating.score': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$clientRating.score' }
          }
        }
      ])
    ])

    return {
      totalApplied,
      inProgress,
      completed,
      totalEarnings: totalEarnings[0]?.total || 0,
      avgRating: avgRating[0]?.avg ? Math.round(avgRating[0].avg * 10) / 10 : 0
    }
  }

  /**
   * 获取项目详情
   */
  async getProjectDetail(projectId: string) {
    const project = await RealProject.findById(projectId)

    if (!project) {
      throw new Error('项目不存在')
    }

    return project
  }

  /**
   * 项目完成时增加经验值
   */
  private async addExpForCompletion(userId: string, project: any) {
    try {
      const { levelService } = require('./level.service')

      await levelService.addExpForProjectCompletion(
        userId,
        project._id.toString(),
        project.difficulty,
        project.clientRating?.score
      )

      // 检查里程碑
      await levelService.checkMilestones(userId)

      log.info('项目完成经验值已添加', { userId, projectId: project._id })
    } catch (error: any) {
      log.error('添加项目完成经验值失败', { error: error.message })
      // 不影响主流程
    }
  }
}

export const realProjectService = new RealProjectService()
