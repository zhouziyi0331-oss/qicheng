import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as projectSummaryController from '../controllers/projectSummary.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 生成项目完成总结
 * POST /api/project-summary/generate
 * Body: { projectId }
 */
router.post('/generate', projectSummaryController.generateProjectSummary)

export default router
