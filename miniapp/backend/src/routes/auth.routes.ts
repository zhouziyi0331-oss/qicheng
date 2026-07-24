import { Router } from 'express'
import { authController } from '../controllers/auth.controller.enhanced'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// ========== 手机号相关 ==========
// 发送验证码
router.post('/send-code', (req, res) => authController.sendCode(req, res))

// 检查手机号是否注册
router.post('/check-phone', (req, res) => authController.checkPhone(req, res))

// 手机号注册
router.post('/register-phone', (req, res) => authController.registerByPhone(req, res))

// 手机号登录
router.post('/login-phone', (req, res) => authController.loginByPhone(req, res))

// 绑定手机号（微信登录后）
router.post('/bind-phone', (req, res) => authController.bindPhone(req, res))

// ========== 微信相关 ==========
// 微信小程序登录
router.post('/wechat-login', (req, res) => authController.wechatLogin(req, res))

// ========== 用户信息相关 ==========
// 刷新Token
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res))

// 获取用户信息（需要认证）
router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res))

// 更新用户信息（需要认证）
router.put('/profile', authenticateToken, (req, res) => authController.updateProfile(req, res))

export default router
