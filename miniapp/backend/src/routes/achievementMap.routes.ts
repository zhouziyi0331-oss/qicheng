import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as achievementMapController from '../controllers/achievementMap.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 获取用户成就地图
 * GET /api/achievement-map
 */
router.get('/', achievementMapController.getAchievementMap)

export default router
