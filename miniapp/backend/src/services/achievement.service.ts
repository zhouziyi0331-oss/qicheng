import { Achievement, IAchievement } from '../models/Achievement'
import { User } from '../models/User'
import { PracticeProject } from '../models/PracticeProject'
import { RealProject } from '../models/RealProject'
import { Assessment } from '../models/Assessment'
import { AbilityRadar } from '../models/AbilityRadar'
import { Income } from '../models/Income'
import mongoose from 'mongoose'

/**
 * 成就系统服务
 *
 * 核心功能：根据用户的真实行为自动解锁成就
 * 每个用户的成就列表完全不同，基于其实际活动
 */
export class AchievementService {

  /**
   * 初始化用户的成就系统（注册时调用）
   */
  async initializeUserAchievements(userId: string): Promise<void> {
    const achievements = [
      // 项目里程碑
      {
        type: 'project_milestone',
        title: '初试身手',
        description: '完成第1个项目',
        icon: 'rocket',
        level: 'bronze',
        progress: { current: 0, target: 1, unit: '个' },
        rarity: 'common',
        rewards: { exp: 50 }
      },
      {
        type: 'project_milestone',
        title: '渐入佳境',
        description: '完成5个项目',
        icon: 'star',
        level: 'silver',
        progress: { current: 0, target: 5, unit: '个' },
        rarity: 'rare',
        rewards: { exp: 200, badge: 'active_learner' }
      },
      {
        type: 'project_milestone',
        title: '经验老手',
        description: '完成10个项目',
        icon: 'medal',
        level: 'gold',
        progress: { current: 0, target: 10, unit: '个' },
        rarity: 'epic',
        rewards: { exp: 500, badge: 'veteran', title: '项目达人' }
      },

      // 收入里程碑
      {
        type: 'income_milestone',
        title: '首次收获',
        description: '赚取第一笔收入',
        icon: 'coin',
        level: 'bronze',
        progress: { current: 0, target: 1, unit: '元' },
        rarity: 'common',
        rewards: { exp: 30 }
      },
      {
        type: 'income_milestone',
        title: '小有所成',
        description: '累计收入达到1000元',
        icon: 'money_bag',
        level: 'silver',
        progress: { current: 0, target: 1000, unit: '元' },
        rarity: 'rare',
        rewards: { exp: 150 }
      },
      {
        type: 'income_milestone',
        title: '财富自由',
        description: '累计收入达到10000元',
        icon: 'treasure',
        level: 'gold',
        progress: { current: 0, target: 10000, unit: '元' },
        rarity: 'epic',
        rewards: { exp: 800, title: '收入达人' }
      },

      // 能力成长
      {
        type: 'ability_growth',
        title: '能力觉醒',
        description: '完成OC测评',
        icon: 'brain',
        level: 'bronze',
        progress: { current: 0, target: 1, unit: '次' },
        rarity: 'common',
        rewards: { exp: 20 }
      },
      {
        type: 'ability_growth',
        title: '全面提升',
        description: '8个能力维度全部达到60分以上',
        icon: 'diamond',
        level: 'platinum',
        progress: { current: 0, target: 8, unit: '个' },
        rarity: 'legendary',
        rewards: { exp: 1000, badge: 'all_rounder', title: '全能战士' }
      },

      // 学习连续性
      {
        type: 'learning_streak',
        title: '坚持就是胜利',
        description: '连续签到7天',
        icon: 'calendar',
        level: 'bronze',
        progress: { current: 0, target: 7, unit: '天' },
        rarity: 'common',
        rewards: { exp: 100 }
      },
      {
        type: 'learning_streak',
        title: '习惯养成',
        description: '连续签到30天',
        icon: 'fire',
        level: 'gold',
        progress: { current: 0, target: 30, unit: '天' },
        rarity: 'epic',
        rewards: { exp: 500, badge: 'persistent', title: '坚持者' }
      }
    ]

    // 批量创建成就
    const userAchievements = achievements.map(ach => ({
      ...ach,
      userId: new mongoose.Types.ObjectId(userId),
      isUnlocked: false,
      isDisplayed: true
    }))

    await Achievement.insertMany(userAchievements)
  }

  /**
   * 检查并更新项目相关成就
   */
  async checkProjectAchievements(userId: string): Promise<IAchievement[]> {
    const unlockedAchievements: IAchievement[] = []

    // 计算用户完成的项目总数
    const practiceCount = await PracticeProject.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'completed'
    })

    const realCount = await RealProject.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'completed'
    })

    const totalProjects = practiceCount + realCount

    // 查找所有项目里程碑成就
    const projectAchievements = await Achievement.find({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'project_milestone',
      isUnlocked: false
    })

    // 更新进度并检查是否解锁
    for (const achievement of projectAchievements) {
      achievement.progress.current = totalProjects

      if (totalProjects >= achievement.progress.target) {
        achievement.isUnlocked = true
        achievement.unlockedAt = new Date()

        // 奖励经验值
        if (achievement.rewards?.exp) {
          await this.grantExpReward(userId, achievement.rewards.exp)
        }

        unlockedAchievements.push(achievement)
      }

      await achievement.save()
    }

    return unlockedAchievements
  }

  /**
   * 检查并更新收入相关成就
   */
  async checkIncomeAchievements(userId: string): Promise<IAchievement[]> {
    const unlockedAchievements: IAchievement[] = []

    // 计算用户总收入
    const totalIncome = await Income.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ])

    const income = totalIncome.length > 0 ? totalIncome[0].total : 0

    // 查找所有收入里程碑成就
    const incomeAchievements = await Achievement.find({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'income_milestone',
      isUnlocked: false
    })

    // 更新进度并检查是否解锁
    for (const achievement of incomeAchievements) {
      achievement.progress.current = income

      if (income >= achievement.progress.target) {
        achievement.isUnlocked = true
        achievement.unlockedAt = new Date()

        if (achievement.rewards?.exp) {
          await this.grantExpReward(userId, achievement.rewards.exp)
        }

        unlockedAchievements.push(achievement)
      }

      await achievement.save()
    }

    return unlockedAchievements
  }

  /**
   * 检查并更新能力成长相关成就
   */
  async checkAbilityAchievements(userId: string): Promise<IAchievement[]> {
    const unlockedAchievements: IAchievement[] = []

    // 检查是否完成测评
    const assessmentCount = await Assessment.countDocuments({
      userId: new mongoose.Types.ObjectId(userId)
    })

    if (assessmentCount > 0) {
      const assessmentAchievement = await Achievement.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        title: '能力觉醒',
        isUnlocked: false
      })

      if (assessmentAchievement) {
        assessmentAchievement.progress.current = 1
        assessmentAchievement.isUnlocked = true
        assessmentAchievement.unlockedAt = new Date()

        if (assessmentAchievement.rewards?.exp) {
          await this.grantExpReward(userId, assessmentAchievement.rewards.exp)
        }

        await assessmentAchievement.save()
        unlockedAchievements.push(assessmentAchievement)
      }
    }

    // 检查能力全面提升
    const latestRadar = await AbilityRadar.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    if (latestRadar) {
      const dimensionsAbove60 = latestRadar.dimensions.filter(d => d.score >= 60).length

      const allRounderAchievement = await Achievement.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        title: '全面提升',
        isUnlocked: false
      })

      if (allRounderAchievement) {
        allRounderAchievement.progress.current = dimensionsAbove60

        if (dimensionsAbove60 >= 8) {
          allRounderAchievement.isUnlocked = true
          allRounderAchievement.unlockedAt = new Date()

          if (allRounderAchievement.rewards?.exp) {
            await this.grantExpReward(userId, allRounderAchievement.rewards.exp)
          }

          await allRounderAchievement.save()
          unlockedAchievements.push(allRounderAchievement)
        } else {
          await allRounderAchievement.save()
        }
      }
    }

    return unlockedAchievements
  }

  /**
   * 检查所有成就（综合检查）
   */
  async checkAllAchievements(userId: string): Promise<IAchievement[]> {
    const projectAchievements = await this.checkProjectAchievements(userId)
    const incomeAchievements = await this.checkIncomeAchievements(userId)
    const abilityAchievements = await this.checkAbilityAchievements(userId)

    return [...projectAchievements, ...incomeAchievements, ...abilityAchievements]
  }

  /**
   * 获取用户的成就列表
   */
  async getUserAchievements(
    userId: string,
    filter?: { isUnlocked?: boolean; type?: string }
  ): Promise<IAchievement[]> {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) }

    if (filter?.isUnlocked !== undefined) {
      query.isUnlocked = filter.isUnlocked
    }

    if (filter?.type) {
      query.type = filter.type
    }

    return await Achievement.find(query).sort({ isUnlocked: -1, unlockedAt: -1 })
  }

  /**
   * 获取成就统计
   */
  async getAchievementStats(userId: string): Promise<{
    total: number
    unlocked: number
    unlockRate: number
    byType: { type: string; total: number; unlocked: number }[]
    recentUnlocked: IAchievement[]
  }> {
    const allAchievements = await Achievement.find({
      userId: new mongoose.Types.ObjectId(userId)
    })

    const unlockedAchievements = allAchievements.filter(a => a.isUnlocked)

    // 按类型统计
    const typeStats = new Map<string, { total: number; unlocked: number }>()

    for (const achievement of allAchievements) {
      const type = achievement.type
      if (!typeStats.has(type)) {
        typeStats.set(type, { total: 0, unlocked: 0 })
      }

      const stats = typeStats.get(type)!
      stats.total++
      if (achievement.isUnlocked) {
        stats.unlocked++
      }
    }

    const byType = Array.from(typeStats.entries()).map(([type, stats]) => ({
      type,
      ...stats
    }))

    // 最近解锁的成就
    const recentUnlocked = await Achievement.find({
      userId: new mongoose.Types.ObjectId(userId),
      isUnlocked: true
    })
      .sort({ unlockedAt: -1 })
      .limit(5)

    return {
      total: allAchievements.length,
      unlocked: unlockedAchievements.length,
      unlockRate: allAchievements.length > 0
        ? Math.round((unlockedAchievements.length / allAchievements.length) * 100)
        : 0,
      byType,
      recentUnlocked
    }
  }

  /**
   * 切换成就展示状态
   */
  async toggleAchievementDisplay(userId: string, achievementId: string): Promise<IAchievement | null> {
    const achievement = await Achievement.findOne({
      _id: new mongoose.Types.ObjectId(achievementId),
      userId: new mongoose.Types.ObjectId(userId)
    })

    if (!achievement) {
      throw new Error('成就不存在')
    }

    achievement.isDisplayed = !achievement.isDisplayed
    await achievement.save()

    return achievement
  }

  /**
   * 授予经验值奖励（辅助方法）
   */
  private async grantExpReward(userId: string, exp: number): Promise<void> {
    const user = await User.findById(userId)
    if (user) {
      user.exp += exp
      await user.save()
    }
  }
}

export const achievementService = new AchievementService()
