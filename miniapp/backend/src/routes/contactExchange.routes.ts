import { Router } from 'express'
import { contactExchangeController } from '../controllers/contactExchange.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

// 获取可交换联系方式的合作伙伴列表
router.get('/partners', (req, res) => contactExchangeController.getPartners(req, res))

// 请求交换联系方式
router.post('/request', (req, res) => contactExchangeController.requestExchange(req, res))

// 确认交换
router.post('/confirm', (req, res) => contactExchangeController.confirmExchange(req, res))

// 查询交换状态
router.get('/status/:partnerId', (req, res) => contactExchangeController.getExchangeStatus(req, res))

// 获取已交换的联系方式
router.get('/contact/:partnerId', (req, res) => contactExchangeController.getExchangedContact(req, res))

export default router
