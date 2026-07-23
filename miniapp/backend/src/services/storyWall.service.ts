import { Story } from '../models/Story'
import { StoryLike } from '../models/StoryLike'
import { PassionSpark } from '../models/PassionSpark'
import { User } from '../models/User'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 故事墙服务
 * 管理成长故事、热情火花、穿越感时刻的分享和展示
 */
export class StoryWallService {

  /**
   * 创建故事
   */
  async createStory(
    userId: string,
    data: {
      type: 'growth_story' | 'passion_spark' | 'flow_moment' | 'life_question'
      title: string
      content: string
      relatedProjectId?: string
      relatedOPCResultId?: string
      tags?: string[]
      isPublic?: boolean
      metadata?: any
    }
  ) {
    try {
      const story = await Story.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: data.type,
        title: data.title,
        content: data.content,
        relatedProjectId: data.relatedProjectId ? new mongoose.Types.ObjectId(data.relatedProjectId) : undefined,
        relatedOPCResultId: data.relatedOPCResultId ? new mongoose.Types.ObjectId(data.relatedOPCResultId) : undefined,
        tags: data.tags || [],
        isPublic: data.isPublic !== false,
        metadata: data.metadata,
        publishedAt: data.isPublic !== false ? new Date() : undefined
      })

      log.info('故事创建成功', { userId, storyId: story._id, type: data.type })

      // 增加经验值
      await this.addExpForStory(userId, data.type)

      return story
    } catch (error: any) {
      log.error('创建故事失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 获取故事墙列表（公开故事）
   */
  async getPublicStories(filters?: {
    type?: string
    tags?: string[]
    limit?: number
    offset?: number
    sortBy?: 'latest' | 'popular'
  }) {
    try {
      const query: any = { isPublic: true }

      if (filters?.type) {
        query.type = filters.type
      }

      if (filters?.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags }
      }

      const limit = filters?.limit || 20
      const offset = filters?.offset || 0
      const sortBy = filters?.sortBy || 'latest'

      let sort: any = { createdAt: -1 }
      if (sortBy === 'popular') {
        sort = { likeCount: -1, createdAt: -1 }
      }

      const stories = await Story.find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .populate('userId', 'username avatar personalityTag level')
        .populate('relatedProjectId', 'title category difficulty')

      const total = await Story.countDocuments(query)

      return {
        stories,
        total,
        hasMore: offset + stories.length < total
      }
    } catch (error: any) {
      log.error('获取故事墙列表失败', { error: error.message })
      throw error
    }
  }

  /**
   * 获取用户的故事列表
   */
  async getUserStories(userId: string, includePrivate: boolean = false) {
    try {
      const query: any = { userId: new mongoose.Types.ObjectId(userId) }

      if (!includePrivate) {
        query.isPublic = true
      }

      const stories = await Story.find(query)
        .sort({ createdAt: -1 })
        .populate('relatedProjectId', 'title category difficulty')

      return stories
    } catch (error: any) {
      log.error('获取用户故事列表失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 获取故事详情
   */
  async getStoryDetail(storyId: string, viewerId?: string) {
    try {
      const story = await Story.findById(storyId)
        .populate('userId', 'username avatar personalityTag level')
        .populate('relatedProjectId', 'title category difficulty budget')

      if (!story) {
        throw new Error('故事不存在')
      }

      // 增加浏览量
      story.viewCount += 1
      await story.save()

      // 检查浏览者是否点赞
      let isLiked = false
      if (viewerId) {
        const like = await StoryLike.findOne({
          userId: new mongoose.Types.ObjectId(viewerId),
          storyId: new mongoose.Types.ObjectId(storyId)
        })
        isLiked = !!like
      }

      return {
        story,
        isLiked
      }
    } catch (error: any) {
      log.error('获取故事详情失败', { storyId, error: error.message })
      throw error
    }
  }

  /**
   * 点赞故事
   */
  async likeStory(userId: string, storyId: string) {
    try {
      const story = await Story.findById(storyId)
      if (!story) {
        throw new Error('故事不存在')
      }

      // 检查是否已点赞
      const existingLike = await StoryLike.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        storyId: new mongoose.Types.ObjectId(storyId)
      })

      if (existingLike) {
        // 取消点赞
        await StoryLike.deleteOne({ _id: existingLike._id })
        story.likeCount = Math.max(0, story.likeCount - 1)
        await story.save()

        log.info('取消点赞故事', { userId, storyId })

        return {
          liked: false,
          likeCount: story.likeCount
        }
      } else {
        // 点赞
        await StoryLike.create({
          userId: new mongoose.Types.ObjectId(userId),
          storyId: new mongoose.Types.ObjectId(storyId)
        })

        story.likeCount += 1
        await story.save()

        log.info('点赞故事', { userId, storyId })

        return {
          liked: true,
          likeCount: story.likeCount
        }
      }
    } catch (error: any) {
      log.error('点赞故事失败', { userId, storyId, error: error.message })
      throw error
    }
  }

  /**
   * 记录热情火花
   */
  async recordPassionSpark(
    userId: string,
    data: {
      content: string
      trigger: string
      relatedProjectId?: string
      intensity: number
      tags?: string[]
      isShared?: boolean
    }
  ) {
    try {
      const passionSpark = await PassionSpark.create({
        userId: new mongoose.Types.ObjectId(userId),
        content: data.content,
        trigger: data.trigger,
        relatedProjectId: data.relatedProjectId ? new mongoose.Types.ObjectId(data.relatedProjectId) : undefined,
        intensity: data.intensity,
        tags: data.tags || [],
        isShared: data.isShared || false
      })

      log.info('热情火花记录成功', { userId, sparkId: passionSpark._id })

      // 如果选择分享，自动创建故事
      if (data.isShared) {
        const story = await this.createStory(userId, {
          type: 'passion_spark',
          title: `热情火花 - ${data.trigger}`,
          content: data.content,
          relatedProjectId: data.relatedProjectId,
          tags: data.tags,
          isPublic: true,
          metadata: {
            intensity: data.intensity,
            trigger: data.trigger
          }
        })

        // 关联故事ID
        passionSpark.storyId = story._id as mongoose.Types.ObjectId
        await passionSpark.save()
      }

      // 增加经验值
      await this.addExpForPassionSpark(userId)

      return passionSpark
    } catch (error: any) {
      log.error('记录热情火花失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 获取用户的热情火花列表
   */
  async getUserPassionSparks(userId: string) {
    try {
      const sparks = await PassionSpark.find({
        userId: new mongoose.Types.ObjectId(userId)
      })
        .sort({ createdAt: -1 })
        .populate('relatedProjectId', 'title category')

      return sparks
    } catch (error: any) {
      log.error('获取热情火花列表失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 获取故事墙统计数据
   */
  async getStoryWallStats() {
    try {
      const [
        totalStories,
        totalLikes,
        totalViews,
        storyTypeDistribution
      ] = await Promise.all([
        Story.countDocuments({ isPublic: true }),

        Story.aggregate([
          { $match: { isPublic: true } },
          { $group: { _id: null, total: { $sum: '$likeCount' } } }
        ]),

        Story.aggregate([
          { $match: { isPublic: true } },
          { $group: { _id: null, total: { $sum: '$viewCount' } } }
        ]),

        Story.aggregate([
          { $match: { isPublic: true } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ])

      return {
        totalStories,
        totalLikes: totalLikes[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0,
        storyTypeDistribution: storyTypeDistribution.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {} as Record<string, number>)
      }
    } catch (error: any) {
      log.error('获取故事墙统计失败', { error: error.message })
      throw error
    }
  }

  /**
   * 获取用户的故事统计
   */
  async getUserStoryStats(userId: string) {
    try {
      const [
        totalStories,
        totalLikes,
        totalViews,
        totalPassionSparks
      ] = await Promise.all([
        Story.countDocuments({
          userId: new mongoose.Types.ObjectId(userId)
        }),

        Story.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$likeCount' } } }
        ]),

        Story.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$viewCount' } } }
        ]),

        PassionSpark.countDocuments({
          userId: new mongoose.Types.ObjectId(userId)
        })
      ])

      return {
        totalStories,
        totalLikes: totalLikes[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0,
        totalPassionSparks
      }
    } catch (error: any) {
      log.error('获取用户故事统计失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 分享故事时增加经验值
   */
  private async addExpForStory(userId: string, type: string) {
    try {
      const { levelService } = require('./level.service')
      await levelService.addExp(
        userId,
        50,
        `分享${this.getStoryTypeName(type)}`,
        { type }
      )
    } catch (error: any) {
      log.error('添加分享故事经验值失败', { error: error.message })
    }
  }

  /**
   * 记录热情火花时增加经验值
   */
  private async addExpForPassionSpark(userId: string) {
    try {
      const { levelService } = require('./level.service')
      await levelService.addExp(
        userId,
        20,
        '捕捉热情火花',
        { type: 'passion_spark' }
      )
    } catch (error: any) {
      log.error('添加热情火花经验值失败', { error: error.message })
    }
  }

  /**
   * 获取故事类型名称
   */
  private getStoryTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'growth_story': '成长故事',
      'passion_spark': '热情火花',
      'flow_moment': '穿越感时刻',
      'life_question': '生命问题探索'
    }
    return typeMap[type] || '故事'
  }
}

export const storyWallService = new StoryWallService()
