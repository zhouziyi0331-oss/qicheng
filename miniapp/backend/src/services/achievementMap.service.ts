import { StudentTagProfile, Tag } from '../models/Tag'
import { User } from '../models/User'
import { RealProject } from '../models/RealProject'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 成就地图服务
 * 基于标签体系解锁成就板块
 */

// 成就板块定义
interface AchievementBadge {
  id: string
  name: string
  description: string
  icon: string
  category: 'design' | 'development' | 'content' | 'marketing' | 'comprehensive'
  unlockConditions: {
    requiredTags: string[]        // 必需标签
    optionalTags?: string[]       // 可选标签（满足任意一个）
    minProjects?: number          // 最少项目数
    minProjectType?: string       // 特定类型项目数
  }
  rewards: {
    exp?: number                  // 经验值奖励
    title?: string                // 称号奖励
    badge?: string                // 徽章
  }
}

// 预定义成就板块
const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  // ========== 设计类成就 ==========
  {
    id: 'design_master',
    name: '设计大师',
    description: '在设计领域展现出专业水平',
    icon: '🎨',
    category: 'design',
    unlockConditions: {
      requiredTags: [
        '擅长平面设计',
        '擅长UI设计',
        '做过品牌设计项目'
      ],
      minProjects: 5,
      minProjectType: '设计'
    },
    rewards: {
      exp: 500,
      title: '设计大师',
      badge: 'design_master_badge'
    }
  },
  {
    id: 'visual_storyteller',
    name: '视觉叙事者',
    description: '擅长用视觉讲故事',
    icon: '📖',
    category: 'design',
    unlockConditions: {
      requiredTags: [
        '擅长用图像讲故事',
        '擅长视觉叙事',
        '对色彩敏感'
      ],
      minProjects: 3
    },
    rewards: {
      exp: 300,
      title: '视觉叙事者',
      badge: 'visual_storyteller_badge'
    }
  },
  {
    id: 'brand_designer',
    name: '品牌设计师',
    description: '品牌视觉设计专家',
    icon: '🏷️',
    category: 'design',
    unlockConditions: {
      requiredTags: [
        '擅长品牌设计',
        '做过品牌设计项目'
      ],
      optionalTags: [
        '擅长Logo设计',
        '擅长VI设计'
      ],
      minProjects: 3,
      minProjectType: '品牌设计'
    },
    rewards: {
      exp: 400,
      title: '品牌设计师',
      badge: 'brand_designer_badge'
    }
  },

  // ========== 开发类成就 ==========
  {
    id: 'full_stack_developer',
    name: '全栈开发者',
    description: '前后端全栈开发能力',
    icon: '💻',
    category: 'development',
    unlockConditions: {
      requiredTags: [
        '擅长前端开发',
        '擅长后端开发',
        '擅长数据库设计'
      ],
      minProjects: 5
    },
    rewards: {
      exp: 600,
      title: '全栈开发者',
      badge: 'full_stack_badge'
    }
  },
  {
    id: 'frontend_expert',
    name: '前端专家',
    description: '前端开发领域专家',
    icon: '🌐',
    category: 'development',
    unlockConditions: {
      requiredTags: [
        '擅长前端开发',
        '做过网站开发项目'
      ],
      optionalTags: [
        '擅长UI界面设计',
        '擅长响应式设计'
      ],
      minProjects: 5,
      minProjectType: '前端开发'
    },
    rewards: {
      exp: 500,
      title: '前端专家',
      badge: 'frontend_expert_badge'
    }
  },
  {
    id: 'system_architect',
    name: '系统架构师',
    description: '系统架构设计专家',
    icon: '🏗️',
    category: 'development',
    unlockConditions: {
      requiredTags: [
        '擅长架构设计',
        '擅长系统思考',
        '喜欢从全局思考'
      ],
      minProjects: 8
    },
    rewards: {
      exp: 800,
      title: '系统架构师',
      badge: 'architect_badge'
    }
  },

  // ========== 内容类成就 ==========
  {
    id: 'content_creator',
    name: '内容创作者',
    description: '优秀的内容创作能力',
    icon: '✍️',
    category: 'content',
    unlockConditions: {
      requiredTags: [
        '擅长原创内容',
        '做过短视频创作'
      ],
      optionalTags: [
        '做过文案策划',
        '做过内容运营'
      ],
      minProjects: 5
    },
    rewards: {
      exp: 400,
      title: '内容创作者',
      badge: 'content_creator_badge'
    }
  },
  {
    id: 'video_master',
    name: '视频制作大师',
    description: '视频创作与剪辑专家',
    icon: '🎬',
    category: 'content',
    unlockConditions: {
      requiredTags: [
        '做过短视频创作',
        '做过视频剪辑'
      ],
      minProjects: 10,
      minProjectType: '短视频'
    },
    rewards: {
      exp: 600,
      title: '视频制作大师',
      badge: 'video_master_badge'
    }
  },

  // ========== 营销类成就 ==========
  {
    id: 'growth_hacker',
    name: '增长黑客',
    description: '用户增长专家',
    icon: '📈',
    category: 'marketing',
    unlockConditions: {
      requiredTags: [
        '擅长数据分析',
        '擅长用户增长'
      ],
      optionalTags: [
        '做过数据分析',
        '做过用户运营'
      ],
      minProjects: 5
    },
    rewards: {
      exp: 500,
      title: '增长黑客',
      badge: 'growth_hacker_badge'
    }
  },
  {
    id: 'operation_expert',
    name: '运营专家',
    description: '全面的运营能力',
    icon: '🎯',
    category: 'marketing',
    unlockConditions: {
      requiredTags: [
        '做过内容运营',
        '做过用户运营'
      ],
      optionalTags: [
        '做过活动运营',
        '做过社群运营'
      ],
      minProjects: 8
    },
    rewards: {
      exp: 600,
      title: '运营专家',
      badge: 'operation_expert_badge'
    }
  },

  // ========== 综合类成就 ==========
  {
    id: 'creative_executor',
    name: '创意执行者',
    description: '既有创意又能落地',
    icon: '⚡',
    category: 'comprehensive',
    unlockConditions: {
      requiredTags: [
        '既有想法又能落地',
        '快速原型能力',
        '擅长创意发散'
      ],
      minProjects: 5
    },
    rewards: {
      exp: 500,
      title: '创意执行者',
      badge: 'creative_executor_badge'
    }
  },
  {
    id: 'problem_solver',
    name: '问题解决者',
    description: '擅长分析和解决问题',
    icon: '🔍',
    category: 'comprehensive',
    unlockConditions: {
      requiredTags: [
        '擅长问题诊断',
        '解决过技术难题'
      ],
      optionalTags: [
        '克服过设计瓶颈',
        '处理过紧急需求'
      ],
      minProjects: 5
    },
    rewards: {
      exp: 400,
      title: '问题解决者',
      badge: 'problem_solver_badge'
    }
  },
  {
    id: 'fast_learner',
    name: '快速学习者',
    description: '超强的学习能力',
    icon: '🚀',
    category: 'comprehensive',
    unlockConditions: {
      requiredTags: [
        '擅长快速上手',
        '擅长知识迁移',
        '从不会到精通某技能'
      ],
      minProjects: 5
    },
    rewards: {
      exp: 400,
      title: '快速学习者',
      badge: 'fast_learner_badge'
    }
  },
  {
    id: 'team_player',
    name: '团队协作者',
    description: '优秀的团队协作能力',
    icon: '🤝',
    category: 'comprehensive',
    unlockConditions: {
      requiredTags: [
        '擅长团队协作',
        '跨部门协作过'
      ],
      optionalTags: [
        '带过团队',
        '擅长沟通'
      ],
      minProjects: 5
    },
    rewards: {
      exp: 350,
      title: '团队协作者',
      badge: 'team_player_badge'
    }
  },
  {
    id: 'innovator',
    name: '创新者',
    description: '不断探索和创新',
    icon: '💡',
    category: 'comprehensive',
    unlockConditions: {
      requiredTags: [
        '擅长跨界探索',
        '敢于尝试未知',
        '好奇心强'
      ],
      minProjects: 5
    },
    rewards: {
      exp: 450,
      title: '创新者',
      badge: 'innovator_badge'
    }
  }
]

export class AchievementMapService {

  /**
   * 检查用户解锁的成就
   */
  async checkUnlockedAchievements(userId: string) {
    try {
      log.info('检查用户成就解锁情况', { userId })

      // 1. 获取学生标签画像
      const studentProfile = await StudentTagProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).populate('tags.tagId')

      if (!studentProfile) {
        throw new Error('学生标签画像不存在')
      }

      // 2. 获取完成的项目统计
      const projectStats = await this.getProjectStats(userId)

      // 3. 检查每个成就是否解锁
      const achievements = []
      for (const badge of ACHIEVEMENT_BADGES) {
        const unlocked = this.checkAchievementUnlocked(
          badge,
          studentProfile,
          projectStats
        )

        achievements.push({
          ...badge,
          unlocked,
          progress: unlocked ? 100 : this.calculateProgress(badge, studentProfile, projectStats)
        })
      }

      // 4. 按类别分组
      const achievementsByCategory = {
        design: achievements.filter(a => a.category === 'design'),
        development: achievements.filter(a => a.category === 'development'),
        content: achievements.filter(a => a.category === 'content'),
        marketing: achievements.filter(a => a.category === 'marketing'),
        comprehensive: achievements.filter(a => a.category === 'comprehensive')
      }

      // 5. 统计
      const stats = {
        totalAchievements: achievements.length,
        unlockedCount: achievements.filter(a => a.unlocked).length,
        unlockedRate: Math.round(
          (achievements.filter(a => a.unlocked).length / achievements.length) * 100
        )
      }

      log.info('成就检查完成', {
        userId,
        unlocked: stats.unlockedCount,
        total: stats.totalAchievements
      })

      return {
        achievements: achievementsByCategory,
        stats
      }
    } catch (error: any) {
      log.error('检查成就解锁失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 检查单个成就是否解锁
   */
  private checkAchievementUnlocked(
    badge: AchievementBadge,
    studentProfile: any,
    projectStats: any
  ): boolean {
    // 1. 检查必需标签
    const hasRequiredTags = badge.unlockConditions.requiredTags.every(tagName =>
      studentProfile.tags.some((t: any) => t.tagId.name === tagName)
    )

    if (!hasRequiredTags) {
      return false
    }

    // 2. 检查可选标签（如果有）
    if (badge.unlockConditions.optionalTags && badge.unlockConditions.optionalTags.length > 0) {
      const hasOptionalTag = badge.unlockConditions.optionalTags.some(tagName =>
        studentProfile.tags.some((t: any) => t.tagId.name === tagName)
      )

      if (!hasOptionalTag) {
        return false
      }
    }

    // 3. 检查项目数
    if (badge.unlockConditions.minProjects) {
      if (projectStats.totalProjects < badge.unlockConditions.minProjects) {
        return false
      }
    }

    // 4. 检查特定类型项目数
    if (badge.unlockConditions.minProjectType) {
      const typeCount = projectStats.projectsByType[badge.unlockConditions.minProjectType] || 0
      if (typeCount < (badge.unlockConditions.minProjects || 1)) {
        return false
      }
    }

    return true
  }

  /**
   * 计算成就进度
   */
  private calculateProgress(
    badge: AchievementBadge,
    studentProfile: any,
    projectStats: any
  ): number {
    let progress = 0
    let totalChecks = 0

    // 检查必需标签
    const requiredTagsCount = badge.unlockConditions.requiredTags.length
    const hasRequiredTagsCount = badge.unlockConditions.requiredTags.filter(tagName =>
      studentProfile.tags.some((t: any) => t.tagId.name === tagName)
    ).length

    progress += (hasRequiredTagsCount / requiredTagsCount) * 50
    totalChecks += 50

    // 检查项目数
    if (badge.unlockConditions.minProjects) {
      const projectProgress = Math.min(
        projectStats.totalProjects / badge.unlockConditions.minProjects,
        1
      )
      progress += projectProgress * 50
      totalChecks += 50
    }

    return Math.round((progress / totalChecks) * 100)
  }

  /**
   * 获取项目统计
   */
  private async getProjectStats(userId: string) {
    const projects = await RealProject.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'completed'
    })

    const projectsByType: Record<string, number> = {}
    for (const project of projects) {
      const type = project.category || 'other'
      projectsByType[type] = (projectsByType[type] || 0) + 1
    }

    return {
      totalProjects: projects.length,
      projectsByType
    }
  }

  /**
   * 获取新解锁的成就（用于完成项目后通知）
   */
  async getNewlyUnlockedAchievements(userId: string, beforeTags: string[]) {
    const currentResult = await this.checkUnlockedAchievements(userId)
    const allAchievements = [
      ...currentResult.achievements.design,
      ...currentResult.achievements.development,
      ...currentResult.achievements.content,
      ...currentResult.achievements.marketing,
      ...currentResult.achievements.comprehensive
    ]

    // 返回刚解锁的成就
    return allAchievements.filter(a => a.unlocked && a.progress === 100)
  }
}

export const achievementMapService = new AchievementMapService()
