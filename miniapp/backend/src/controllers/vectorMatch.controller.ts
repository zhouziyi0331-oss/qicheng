import { Request, Response } from 'express'
import { vectorMatchService } from '../services/vectorMatch.service'
import { Tag, StudentTagProfile, ProjectTagProfile } from '../models/Tag'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 向量匹配控制器
 */

/**
 * 获取智能推荐项目（基于向量匹配）
 */
export const getRecommendedProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const limit = parseInt(req.query.limit as string) || 20

    const recommendations = await vectorMatchService.recommendProjects(userId, limit)

    res.json({
      success: true,
      data: {
        recommendations: recommendations.map(r => ({
          project: r.project,
          scores: {
            overall: r.overallScore,
            vectorSimilarity: r.vectorSimilarity,
            skillMatch: r.skillMatchScore,
            personalityMatch: r.personalityMatchScore,
            interestMatch: r.interestMatchScore
          },
          matchedTags: r.matchedTags,
          missingRequiredSkills: r.missingRequiredSkills,
          isStretchProject: r.isStretchProject
        })),
        total: recommendations.length
      }
    })
  } catch (error: any) {
    log.error('获取智能推荐失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 初始化学生标签画像
 */
export const initializeProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const profile = await vectorMatchService.initializeStudentProfile(userId)

    res.json({
      success: true,
      data: profile,
      message: '学生标签画像初始化成功'
    })
  } catch (error: any) {
    log.error('初始化学生画像失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取学生标签画像
 */
export const getStudentProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const profile = await StudentTagProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    })
      .populate('tags.tagId')
      .populate('skillLevels.tagId')
      .populate('interests.tagId')

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: '未找到标签画像，请先初始化'
      })
    }

    res.json({
      success: true,
      data: profile
    })
  } catch (error: any) {
    log.error('获取学生画像失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 添加学生标签
 */
export const addStudentTag = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { tagId, weight, source } = req.body

    if (!tagId || weight === undefined || !source) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: tagId, weight, source'
      })
    }

    if (weight < 0 || weight > 1) {
      return res.status(400).json({
        success: false,
        error: 'weight必须在0-1之间'
      })
    }

    if (!['opc', 'project', 'self', 'system'].includes(source)) {
      return res.status(400).json({
        success: false,
        error: 'source必须是: opc, project, self, system'
      })
    }

    const profile = await vectorMatchService.addStudentTag(userId, tagId, weight, source)

    res.json({
      success: true,
      data: profile,
      message: '标签添加成功'
    })
  } catch (error: any) {
    log.error('添加学生标签失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 搜索标签
 */
export const searchTags = async (req: Request, res: Response) => {
  try {
    const { keyword, category, limit = 20 } = req.query

    const query: any = { isActive: true }

    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' }
    }

    if (category) {
      query.category = category
    }

    const tags = await Tag.find(query)
      .sort({ usageCount: -1 })
      .limit(parseInt(limit as string))

    res.json({
      success: true,
      data: tags
    })
  } catch (error: any) {
    log.error('搜索标签失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取所有标签分类
 */
export const getTagCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Tag.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          tags: { $push: { _id: '$_id', name: '$name', weight: '$weight' } }
        }
      },
      { $sort: { count: -1 } }
    ])

    res.json({
      success: true,
      data: categories
    })
  } catch (error: any) {
    log.error('获取标签分类失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 为项目创建标签画像
 */
export const createProjectProfile = async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      projectType,
      tags,
      industries,
      requiredSkills,
      suitablePersonalities
    } = req.body

    if (!projectId || !projectType) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: projectId, projectType'
      })
    }

    const profile = await vectorMatchService.createProjectProfile(
      projectId,
      projectType,
      tags || [],
      industries || [],
      requiredSkills || [],
      suitablePersonalities || []
    )

    res.json({
      success: true,
      data: profile,
      message: '项目标签画像创建成功'
    })
  } catch (error: any) {
    log.error('创建项目画像失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取项目标签画像
 */
export const getProjectProfile = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { projectType } = req.query

    if (!projectType) {
      return res.status(400).json({
        success: false,
        error: '缺少projectType参数'
      })
    }

    const profile = await ProjectTagProfile.findOne({
      projectId: new mongoose.Types.ObjectId(projectId),
      projectType
    })
      .populate('tags.tagId')
      .populate('industries')
      .populate('requiredSkills.tagId')
      .populate('suitablePersonalities')

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: '未找到项目标签画像'
      })
    }

    res.json({
      success: true,
      data: profile
    })
  } catch (error: any) {
    log.error('获取项目画像失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 批量创建标签
 */
export const batchCreateTags = async (req: Request, res: Response) => {
  try {
    const { tags } = req.body

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: 'tags必须是数组'
      })
    }

    const results = await vectorMatchService.batchCreateTags(tags)

    res.json({
      success: true,
      data: results,
      message: `成功创建${results.length}个标签`
    })
  } catch (error: any) {
    log.error('批量创建标签失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
