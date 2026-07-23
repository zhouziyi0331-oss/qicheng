import { Request, Response } from 'express'
import { storyWallService } from '../services/storyWall.service'
import { log } from '../utils/logger'

/**
 * 故事墙控制器
 */
export class StoryWallController {

  /**
   * 创建故事
   */
  async createStory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        })
      }

      const { type, title, content, relatedProjectId, relatedOPCResultId, tags, isPublic, metadata } = req.body

      if (!type || !title || !content) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        })
      }

      const story = await storyWallService.createStory(userId, {
        type,
        title,
        content,
        relatedProjectId,
        relatedOPCResultId,
        tags,
        isPublic,
        metadata
      })

      res.json({
        success: true,
        data: story
      })
    } catch (error: any) {
      log.error('创建故事失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '创建故事失败'
      })
    }
  }

  /**
   * 获取故事墙列表
   */
  async getPublicStories(req: Request, res: Response) {
    try {
      const { type, tags, limit, offset, sortBy } = req.query

      const result = await storyWallService.getPublicStories({
        type: type as string,
        tags: tags ? (typeof tags === 'string' ? [tags] : tags as string[]) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as 'latest' | 'popular' | undefined
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error: any) {
      log.error('获取故事墙列表失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '获取故事墙列表失败'
      })
    }
  }

  /**
   * 获取用户的故事列表
   */
  async getUserStories(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      const { targetUserId, includePrivate } = req.query

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        })
      }

      const queryUserId = targetUserId as string || userId
      const canViewPrivate = queryUserId === userId

      const stories = await storyWallService.getUserStories(
        queryUserId,
        canViewPrivate && includePrivate === 'true'
      )

      res.json({
        success: true,
        data: stories
      })
    } catch (error: any) {
      log.error('获取用户故事列表失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '获取用户故事列表失败'
      })
    }
  }

  /**
   * 获取故事详情
   */
  async getStoryDetail(req: Request, res: Response) {
    try {
      const { storyId } = req.params
      const userId = (req as any).user?.userId

      const result = await storyWallService.getStoryDetail(storyId, userId)

      res.json({
        success: true,
        data: result
      })
    } catch (error: any) {
      log.error('获取故事详情失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '获取故事详情失败'
      })
    }
  }

  /**
   * 点赞/取消点赞故事
   */
  async likeStory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId
      const { storyId } = req.params

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        })
      }

      const result = await storyWallService.likeStory(userId, storyId)

      res.json({
        success: true,
        data: result
      })
    } catch (error: any) {
      log.error('点赞故事失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '点赞故事失败'
      })
    }
  }

  /**
   * 记录热情火花
   */
  async recordPassionSpark(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        })
      }

      const { content, trigger, relatedProjectId, intensity, tags, isShared } = req.body

      if (!content || !trigger || !intensity) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        })
      }

      const passionSpark = await storyWallService.recordPassionSpark(userId, {
        content,
        trigger,
        relatedProjectId,
        intensity,
        tags,
        isShared
      })

      res.json({
        success: true,
        data: passionSpark
      })
    } catch (error: any) {
      log.error('记录热情火花失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '记录热情火花失败'
      })
    }
  }

  /**
   * 获取用户的热情火花列表
   */
  async getUserPassionSparks(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        })
      }

      const sparks = await storyWallService.getUserPassionSparks(userId)

      res.json({
        success: true,
        data: sparks
      })
    } catch (error: any) {
      log.error('获取热情火花列表失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '获取热情火花列表失败'
      })
    }
  }

  /**
   * 获取故事墙统计
   */
  async getStoryWallStats(req: Request, res: Response) {
    try {
      const stats = await storyWallService.getStoryWallStats()

      res.json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      log.error('获取故事墙统计失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '获取故事墙统计失败'
      })
    }
  }

  /**
   * 获取用户的故事统计
   */
  async getUserStoryStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        })
      }

      const stats = await storyWallService.getUserStoryStats(userId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      log.error('获取用户故事统计失败', { error: error.message })
      res.status(500).json({
        success: false,
        message: error.message || '获取用户故事统计失败'
      })
    }
  }
}

export const storyWallController = new StoryWallController()
