import { Router } from 'express'
import { paymentController } from '../controllers/payment.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// 创建支付订单
router.post('/create-order', authMiddleware, (req, res) =>
  paymentController.createOrder(req, res))

// 模拟支付成功（仅开发/测试环境）
router.post('/mock-pay', authMiddleware, (req, res) =>
  paymentController.mockPayment(req, res))

// 微信支付回调（不需要认证）
router.post('/notify', (req, res) =>
  paymentController.wechatNotify(req, res))

// 查询支付状态
router.post('/check-status', authMiddleware, (req, res) =>
  paymentController.checkPaymentStatus(req, res))

// 获取支付历史
router.get('/history', authMiddleware, (req, res) =>
  paymentController.getPaymentHistory(req, res))

export default router
