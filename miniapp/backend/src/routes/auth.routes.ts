import { Router } from 'express'
import { authController } from '../controllers/auth.controller'

const router = Router()

// 微信小程序登录
router.post('/wechat-login', (req, res) => authController.wechatLogin(req, res))

// 刷新Token
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res))

// 获取用户信息
router.get('/profile', (req, res) => authController.getProfile(req, res))

// 更新用户信息
router.put('/profile', (req, res) => authController.updateProfile(req, res))

export default router
