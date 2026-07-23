import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as userProfileController from '../controllers/userProfile.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 获取基于向量的完整用户画像
 * GET /api/profile/vector-state
 *
 * 返回：
 * - 基础信息（level, position）
 * - 核心能力
 * - 成就状态（已解锁 + 进行中）
 * - 职业路径
 * - 推荐项目
 * - 技能建议
 * - 导师寄语
 */
router.get('/vector-state', userProfileController.getVectorProfile)

/**
 * 获取成长轨迹
 * GET /api/profile/growth-trajectory
 */
router.get('/growth-trajectory', userProfileController.getGrowthTrajectory)

export default router
