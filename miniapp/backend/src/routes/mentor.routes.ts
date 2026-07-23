import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as mentorController from '../controllers/mentor.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

// AI对话（核心功能）
router.post('/chat', mentorController.chat)

// 以下路由暂时注释，等待mentor.service.ts类型问题修复
// router.get('/history/:taskId', mentorController.getHistory)
// router.get('/:taskId/first-step', mentorController.getFirstStep)
// router.post('/:taskId/stuck', mentorController.reportStuck)
// router.post('/:taskId/milestone', mentorController.celebrateMilestone)
// router.get('/passion-sparks', mentorController.getPassionSparks)
// router.get('/flow-moments', mentorController.getFlowMoments)
// router.get('/growth-stats', mentorController.getGrowthStats)

export default router
