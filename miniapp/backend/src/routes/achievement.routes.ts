import { Router } from 'express'
import { achievementController } from '../controllers/achievement.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取成就统计
router.get('/stats', achievementController.getAchievementStats.bind(achievementController))

// 检查并更新所有成就
router.post('/check', achievementController.checkAllAchievements.bind(achievementController))

// 获取用户成就列表
router.get('/', achievementController.getUserAchievements.bind(achievementController))

// 切换成就展示状态
router.put('/:achievementId/display', achievementController.toggleAchievementDisplay.bind(achievementController))

export default router
