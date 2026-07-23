import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as taskBreakdownController from '../controllers/taskBreakdown.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 企业发布任务 - AI分析和拆解
 * POST /api/task-breakdown/analyze
 *
 * Body: {
 *   rawInput: "我要一个海报",
 *   industry?: "美妆",
 *   additionalInfo?: { ... }
 * }
 *
 * 返回：
 * - 如果需要追问：questions[]
 * - 如果信息足够：structuredTask + executionSteps + matchingTags
 */
router.post('/analyze', taskBreakdownController.analyzeTask)

/**
 * 基于拆解结果匹配学生
 * POST /api/task-breakdown/match-students
 *
 * Body: {
 *   matchingTags: [...],
 *   structuredTask: { ... }
 * }
 */
router.post('/match-students', taskBreakdownController.matchStudents)

/**
 * 学生执行任务时获取步骤指导
 * POST /api/task-breakdown/step-guidance
 *
 * Body: {
 *   taskId: "...",
 *   currentStep: 1,
 *   studentContext?: { ... }
 * }
 */
router.post('/step-guidance', taskBreakdownController.getStepGuidance)

/**
 * 基于拆解结果创建正式项目
 * POST /api/task-breakdown/create-project
 *
 * Body: {
 *   structuredTask: { ... },
 *   executionSteps: [...],
 *   matchingTags: [...]
 * }
 */
router.post('/create-project', taskBreakdownController.createProjectFromBreakdown)

export default router
