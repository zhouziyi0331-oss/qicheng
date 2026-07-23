import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import * as realProjectController from '../controllers/realProject.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 浏览可用项目
router.get('/available', realProjectController.getAvailableProjects)
router.get('/:id', realProjectController.getProjectDetail)

// 用户的项目
router.get('/my/projects', realProjectController.getMyProjects)
router.get('/my/stats', realProjectController.getProjectStats)

// 项目操作
router.post('/:id/apply', realProjectController.applyForProject)
router.post('/:id/accept', realProjectController.acceptProject)
router.post('/:id/complete', realProjectController.completeProject)

export default router
