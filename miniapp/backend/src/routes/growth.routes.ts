import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import * as growthController from '../controllers/growth.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// OC测评相关
router.post('/assessment', growthController.submitAssessment)
router.get('/assessments', growthController.getAssessments)
router.get('/assessment/latest', growthController.getLatestAssessment)

// 能力雷达图相关
router.get('/ability-radar', growthController.getAbilityRadarHistory)
router.get('/ability-radar/latest', growthController.getLatestAbilityRadar)
router.get('/ability-radar/compare', growthController.compareRadars)

// 深度对比报告
router.get('/comparison-reports', growthController.getComparisonReports)
router.get('/comparison-reports/latest', growthController.getLatestComparisonReport)

// 动态成长路径
router.post('/growth-path/generate', growthController.generateGrowthPath)
router.get('/growth-path/latest', growthController.getLatestGrowthPath)
router.get('/growth-path/history', growthController.getGrowthPathHistory)
router.post('/growth-path/milestone', growthController.updateMilestone)

// 毕业报告 - 暂时注释，待修复类型问题
// router.post('/graduation-report/generate', growthController.generateGraduationReport)
// router.get('/graduation-report', growthController.getGraduationReport)
// router.post('/graduation-report/unlock', growthController.unlockGraduationReport)

export default router
