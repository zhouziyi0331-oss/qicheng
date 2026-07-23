import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as graduationReportController from '../controllers/graduationReport.controller'

const router = Router()

router.use(authenticate)

/**
 * 生成毕业报告
 * POST /api/graduation-report/generate
 */
router.post('/generate', graduationReportController.generateGraduationReport)

export default router
