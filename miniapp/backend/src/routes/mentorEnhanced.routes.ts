import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as mentorEnhancedController from '../controllers/mentorEnhanced.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

// ========== PBL流程 ==========

// Step 1: 接单后的问题拆解（使用模糊词引导）
router.post('/pbl/:taskId/breakdown', mentorEnhancedController.pblBreakdownTask)

// Step 2: 学生用自己的话表达理解
router.post('/pbl/:taskId/confirm-understanding', mentorEnhancedController.pblConfirmUnderstanding)

// ========== 增强版卡点支持 ==========

// 报告卡点（含学习路径建议）
router.post('/enhanced/:taskId/stuck', mentorEnhancedController.reportStuckEnhanced)

// ========== 作品审核系统 ==========

// 提交作品给AI审核
router.post('/review/:taskId/submit', mentorEnhancedController.reviewWork)

// ========== 长记忆与成长对比 ==========

// 获取成长对比分析
router.get('/growth/comparison', mentorEnhancedController.analyzeGrowthComparison)

export default router
