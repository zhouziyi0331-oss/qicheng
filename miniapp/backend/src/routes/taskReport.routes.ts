import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as taskReportController from '../controllers/taskReport.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 生成任务总结报告
 * POST /api/task-report/generate
 * Body: { projectId }
 */
router.post('/generate', taskReportController.generateTaskReport)

export default router
