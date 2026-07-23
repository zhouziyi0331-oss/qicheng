import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import * as levelController from '../controllers/level.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取用户等级信息
router.get('/info', levelController.getLevelInfo)

// 获取所有等级配置
router.get('/all', levelController.getAllLevels)

// 获取等级榜单
router.get('/leaderboard', levelController.getLeaderboard)

// 测试：手动增加经验值（仅开发环境）
router.post('/test-add-exp', levelController.testAddExp)

export default router
