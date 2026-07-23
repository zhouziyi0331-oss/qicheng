import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import * as financialController from '../controllers/financial.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 余额相关
router.get('/balance', financialController.getBalance)

// 收入相关
router.get('/income', financialController.getIncomeRecords)
router.get('/income/stats', financialController.getIncomeStats)

// 提现相关
router.post('/withdrawal/request', financialController.requestWithdrawal)
router.get('/withdrawal', financialController.getWithdrawalRecords)
router.post('/withdrawal/:id/cancel', financialController.cancelWithdrawal)

export default router
