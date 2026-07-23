import { Request, Response } from 'express'
import { realProjectService } from '../services/realProject.service'
import { scientificRecommendationService } from '../services/scientificRecommendation.service'
import { vectorCoreService } from '../services/vectorCore.service'
import { log } from '../utils/logger'

/**
 * 真实项目控制器
 * 使用科学推荐算法 v2.0
 */

/**
 * 根据分数获取匹配等级
 */
function getMatchLevel(score: number): string {
  if (score >= 0.9) return '完美匹配'
  if (score >= 0.8) return '优秀匹配'
  if (score >= 0.7) return '良好匹配'
  if (score >= 0.6) return '尚可匹配'
  if (score >= 0.5) return '较弱匹配'
  return '不匹配'
}

/**
 * GET /api/real-projects/available
 * 获取可接单的项目列表（科学推荐算法）
 */
export const getAvailableProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { category, difficulty, minBudget, maxBudget, limit } = req.query

    // 🎯 使用科学推荐算法 v2.0
    const recommendations = await scientificRecommendationService.getRecommendations(
      userId,
      parseInt(limit as string) || 20
    )

    // 应用额外的过滤条件
    let filteredRecommendations = recommendations

    if (category) {
      filteredRecommendations = filteredRecommendations.filter(
        r => r.project.category === category
      )
    }
    if (difficulty) {
      filteredRecommendations = filteredRecommendations.filter(
        r => r.project.difficulty === difficulty
      )
    }
    if (minBudget) {
      filteredRecommendations = filteredRecommendations.filter(
        r => (r.project.budget || 0) >= parseFloat(minBudget as string)
      )
    }
    if (maxBudget) {
      filteredRecommendations = filteredRecommendations.filter(
        r => (r.project.budget || 0) <= parseFloat(maxBudget as string)
      )
    }

    // 转换为前端需要的格式
    const projects = filteredRecommendations.map((rec, index) => ({
      // 项目基本信息
      projectId: rec.project.projectId,
      title: rec.project.title,
      category: rec.project.category,
      budget: rec.project.budget,
      difficulty: rec.project.difficulty,
      tags: rec.project.tags,

      // 推荐信息
      matchScore: Math.round(rec.scores.overall * 100),
      matchLevel: getMatchLevel(rec.scores.overall),
      rank: index + 1,

      // 详细得分（科学计算）
      scores: {
        skillMatch: Math.round(rec.scores.skillMatch * 100),
        difficultyFit: Math.round(rec.scores.difficultyFit * 100),
        successProb: Math.round(rec.scores.successProb * 100),
        interestMatch: Math.round(rec.scores.interestMatch * 100),
        budgetFit: Math.round(rec.scores.budgetFit * 100),
        timeFit: Math.round(rec.scores.timeFit * 100)
      },

      // 推荐理由
      reasons: rec.explanation,
      matchedSkills: rec.matchedSkills,
      challengeLevel: rec.challengeLevel,

      // 预测
      completionProbability: Math.round(rec.scores.successProb * 100),

      // 调试信息（开发环境）
      _debug: process.env.NODE_ENV === 'development' ? {
        shouldFilter: rec.shouldFilter,
        filterReason: rec.filterReason
      } : undefined
    }))

    res.json({
      success: true,
      data: {
        total: filteredRecommendations.length,
        projects,
        message: '科学推荐算法 v2.0',
        algorithm: 'scientific-v2.0'
      }
    })

  } catch (error: any) {
    log.error('获取可用项目失败', { error: error.message })

    // 降级方案：如果向量匹配失败，使用传统查询
    try {
      const { category, difficulty, minBudget, maxBudget } = req.query

      const filters: any = {}
      if (category) filters.category = category
      if (difficulty) filters.difficulty = difficulty
      if (minBudget) filters.minBudget = parseFloat(minBudget as string)
      if (maxBudget) filters.maxBudget = parseFloat(maxBudget as string)

      const projects = await realProjectService.getAvailableProjects(filters)

      res.json({
        success: true,
        data: {
          total: projects.length,
          projects,
          message: '传统筛选'
        }
      })
    } catch (fallbackError: any) {
      res.status(500).json({ error: '获取可用项目失败' })
    }
  }
}

/**
 * POST /api/real-projects/:id/apply
 * 申请项目
 */
export const applyForProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { id } = req.params

    const project = await realProjectService.applyForProject(userId, id)

    res.json({
      success: true,
      data: project
    })

  } catch (error: any) {
    log.error('申请项目失败', { error: error.message })
    res.status(400).json({ error: error.message || '申请项目失败' })
  }
}

/**
 * POST /api/real-projects/:id/accept
 * 接受项目（开始工作）
 */
export const acceptProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { id } = req.params

    const project = await realProjectService.acceptProject(userId, id)

    res.json({
      success: true,
      data: project
    })

  } catch (error: any) {
    log.error('接受项目失败', { error: error.message })
    res.status(400).json({ error: error.message || '接受项目失败' })
  }
}

/**
 * POST /api/real-projects/:id/complete
 * 完成项目（触发向量更新）
 */
export const completeProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { id } = req.params
    const { deliverables } = req.body

    if (!deliverables || !Array.isArray(deliverables)) {
      return res.status(400).json({ error: '请提供交付物' })
    }

    // 1. 更新项目状态
    const project = await realProjectService.completeProject(userId, id, deliverables)

    // 2. 🎯 触发向量更新（核心改动）
    try {
      // 从项目中提取新标签（简化版，实际应该AI分析）
      const newTags = [
        {
          tagId: 'temp_tag_id', // 实际应该从标签库查找
          weight: 0.8,
          source: 'project_complete'
        }
      ]

      // 触发向量更新，获取完整响应
      const vectorResponse = await vectorCoreService.updateStudentVector(
        userId,
        newTags,
        {
          trigger: 'project_complete',
          projectId: id
        }
      )

      // 3. 返回项目完成 + 向量驱动的内容
      res.json({
        success: true,
        data: {
          // 基础项目信息
          project,

          // 🎯 向量驱动的成长报告
          growthReport: {
            summary: vectorResponse.growth.summary,
            movement: {
              distance: vectorResponse.growth.movement.distance,
              direction: vectorResponse.growth.movement.direction
            }
          },

          // 新解锁的成就
          newAchievements: vectorResponse.achievements
            .filter((a: any) => a.unlocked && a.progress === 100)
            .slice(0, 3),

          // 下一个推荐项目
          nextProjects: vectorResponse.recommendations.slice(0, 3),

          // 职业路径更新
          careerPaths: vectorResponse.careerPaths.slice(0, 2),

          // 导师建议
          mentorAdvice: vectorResponse.mentorAdvice
        },
        message: '项目已完成，收入已到账'
      })

    } catch (vectorError: any) {
      // 向量更新失败，但项目完成成功
      log.warn('向量更新失败，降级返回基础信息', { error: vectorError.message })

      res.json({
        success: true,
        data: project,
        message: '项目已完成，收入已到账'
      })
    }

  } catch (error: any) {
    log.error('完成项目失败', { error: error.message })
    res.status(400).json({ error: error.message || '完成项目失败' })
  }
}

/**
 * GET /api/real-projects/my-projects
 * 获取用户的项目列表
 */
export const getMyProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { status } = req.query

    const projects = await realProjectService.getUserProjects(
      userId,
      status as string | undefined
    )

    res.json({
      success: true,
      data: {
        total: projects.length,
        projects
      }
    })

  } catch (error: any) {
    log.error('获取我的项目失败', { error: error.message })
    res.status(500).json({ error: '获取我的项目失败' })
  }
}

/**
 * GET /api/real-projects/stats
 * 获取项目统计
 */
export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const stats = await realProjectService.getUserProjectStats(userId)

    res.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    log.error('获取项目统计失败', { error: error.message })
    res.status(500).json({ error: '获取项目统计失败' })
  }
}

/**
 * GET /api/real-projects/:id
 * 获取项目详情
 */
export const getProjectDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const project = await realProjectService.getProjectDetail(id)

    res.json({
      success: true,
      data: project
    })

  } catch (error: any) {
    log.error('获取项目详情失败', { error: error.message })
    res.status(404).json({ error: error.message || '获取项目详情失败' })
  }
}
