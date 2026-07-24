import { Router } from 'express'
import { checkLevelUp, getLevelDialog, submitAnswer, confirmLevelUp } from '../controllers/levelUp.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

/**
 * 晋级验证路由
 */

// 检查是否满足晋级条件
router.post('/check', authenticateToken, checkLevelUp)

// 获取晋级对话内容
router.post('/dialog', authenticateToken, getLevelDialog)

// 提交晋级答案
router.post('/answer', authenticateToken, submitAnswer)

// 确认晋级
router.post('/confirm', authenticateToken, confirmLevelUp)

export default router
