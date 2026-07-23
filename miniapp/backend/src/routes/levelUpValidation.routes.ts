import express from 'express'
import { authenticateToken } from '../middleware/auth'
import * as levelUpValidationController from '../controllers/levelUpValidation.controller'

const router = express.Router()

/**
 * 晋级验证路由
 */

// 生成晋级验证内容
router.post('/generate', authenticateToken, levelUpValidationController.generateValidation)

// 提交晋级验证答案
router.post('/submit', authenticateToken, levelUpValidationController.submitValidation)

// 获取晋级历史
router.get('/history', authenticateToken, levelUpValidationController.getValidationHistory)

export default router
