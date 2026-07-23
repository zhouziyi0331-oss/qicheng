import { Request, Response } from 'express'
import { vectorCoreService } from '../services/vectorCore.service'
import { User } from '../models/User'
import { log } from '../utils/logger'

/**
 * 用户画像控制器（基于向量）
 */

/**
 * GET /api/profile/vector-state
 * 获取基于向量的完整用户画像
 */
export const getVectorProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    // 1. 获取基础用户信息
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 2. 🎯 获取向量驱动的画像
    const state = await vectorCoreService.getStudentState(userId)

    // 3. 构建完整画像
    res.json({
      success: true,
      data: {
        // 基础信息
        userId,
        nickname: (user as any).name || '学生',
        level: state.currentState.level,
        position: state.currentState.position,

        // 向量驱动的内容
        topAbilities: extractTopAbilities(state),

        // 成就（已解锁 + 进行中）
        achievements: {
          unlocked: state.achievements.filter(a => a.unlocked),
          inProgress: state.achievements
            .filter(a => !a.unlocked && a.progress > 50)
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3)
        },

        // 职业路径（top 3）
        careerPaths: state.careerPaths.slice(0, 3),

        // 推荐项目（top 5）
        recommendedProjects: state.recommendations.slice(0, 5),

        // 技能建议（需要提升的）
        skillSuggestions: state.skillSuggestions
          .filter(s => s.priority === 'high')
          .slice(0, 5),

        // 导师寄语
        mentorMessage: state.mentorAdvice.message
      }
    })

  } catch (error: any) {
    log.error('获取向量画像失败', { userId: (req as any).userId, error: error.message })
    res.status(500).json({ error: '获取用户画像失败' })
  }
}

/**
 * GET /api/profile/growth-trajectory
 * 获取成长轨迹（向量移动历史）
 */
export const getGrowthTrajectory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    // TODO: 从数据库读取历史向量记录
    // 暂时返回模拟数据
    res.json({
      success: true,
      data: {
        trajectory: [],
        message: '成长轨迹功能即将上线'
      }
    })

  } catch (error: any) {
    log.error('获取成长轨迹失败', { error: error.message })
    res.status(500).json({ error: '获取成长轨迹失败' })
  }
}

/**
 * 辅助函数：从向量状态中提取核心能力
 */
function extractTopAbilities(state: any): string[] {
  // 从最近的成就和职业路径推断核心能力
  const abilities = new Set<string>()

  // 从已解锁的成就提取
  state.achievements
    .filter((a: any) => a.unlocked)
    .slice(0, 3)
    .forEach((a: any) => {
      abilities.add(a.name)
    })

  // 从职业路径提取
  state.careerPaths
    .slice(0, 2)
    .forEach((c: any) => {
      abilities.add(c.careerName)
    })

  return Array.from(abilities).slice(0, 5)
}

export default {
  getVectorProfile,
  getGrowthTrajectory
}
