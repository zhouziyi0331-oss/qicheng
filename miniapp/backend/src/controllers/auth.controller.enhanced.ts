import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { User } from '../models/User'
import { smsService } from '../services/sms.service'

interface WechatLoginRequest {
  code: string
  nickname?: string
  avatar?: string
  accountType?: 'student' | 'enterprise'
}

interface PhoneRegisterRequest {
  phone: string
  code: string
  accountType: 'student' | 'enterprise'
  nickname?: string
}

interface PhoneLoginRequest {
  phone: string
  code: string
}

interface BindPhoneRequest {
  phone: string
  code: string
  openid?: string
}

interface WechatSession {
  openid: string
  session_key: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

export class AuthController {
  /**
   * POST /api/auth/send-code
   * 发送手机验证码
   */
  async sendCode(req: Request, res: Response) {
    try {
      const { phone, type = 'login' } = req.body

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: '请输入手机号'
        })
      }

      if (!['login', 'register'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: '无效的验证码类型'
        })
      }

      // 发送验证码
      await smsService.sendVerifyCode(phone, type as 'login' | 'register')

      res.json({
        success: true,
        message: '验证码已发送'
      })

    } catch (error: any) {
      console.error('发送验证码失败:', error)
      res.status(400).json({
        success: false,
        error: error.message || '发送验证码失败'
      })
    }
  }

  /**
   * POST /api/auth/check-phone
   * 检查手机号是否已注册
   */
  async checkPhone(req: Request, res: Response) {
    try {
      const { phone } = req.body

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: '请输入手机号'
        })
      }

      const user = await User.findOne({ phone })

      res.json({
        success: true,
        registered: !!user,
        accountType: user?.account_type || null
      })

    } catch (error) {
      console.error('检查手机号失败:', error)
      res.status(500).json({
        success: false,
        error: '检查失败'
      })
    }
  }

  /**
   * POST /api/auth/register-phone
   * 手机号注册
   */
  async registerByPhone(req: Request, res: Response) {
    try {
      const { phone, code, accountType, nickname } = req.body as PhoneRegisterRequest

      // 1. 参数验证
      if (!phone || !code || !accountType) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数'
        })
      }

      if (!['student', 'enterprise'].includes(accountType)) {
        return res.status(400).json({
          success: false,
          error: '无效的账号类型'
        })
      }

      // 2. 验证验证码
      try {
        await smsService.verifyCode(phone, code, 'register')
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        })
      }

      // 3. 检查手机号是否已注册
      const existing = await User.findOne({ phone })

      if (existing) {
        return res.status(400).json({
          success: false,
          error: `该手机号已注册为${existing.account_type === 'student' ? '学生' : '企业'}账号`
        })
      }

      // 4. 创建用户
      const user = new User({
        phone,
        nickname: nickname || `${accountType === 'student' ? '学生' : '企业'}${phone.slice(-4)}`,
        account_type: accountType,
        level: accountType === 'student' ? 0 : undefined,
        hasCompletedOnboarding: false, // 标记未完成入职测评
        createdAt: new Date()
      })

      await user.save()

      // 5. 生成token
      const token = this.generateToken(user._id.toString(), user.phone!, accountType)

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          phone: user.phone,
          nickname: user.nickname,
          accountType: user.account_type,
          needsOnboarding: true // 需要完成入职测评
        }
      })

    } catch (error: any) {
      console.error('手机号注册失败:', error)
      res.status(500).json({
        success: false,
        error: error.message || '注册失败'
      })
    }
  }

  /**
   * POST /api/auth/login-phone
   * 手机号登录
   */
  async loginByPhone(req: Request, res: Response) {
    try {
      const { phone, code } = req.body as PhoneLoginRequest

      // 1. 参数验证
      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数'
        })
      }

      // 2. 验证验证码
      try {
        await smsService.verifyCode(phone, code, 'login')
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        })
      }

      // 3. 查找用户
      const user = await User.findOne({ phone })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: '该手机号未注册，请先注册'
        })
      }

      // 4. 生成token
      const token = this.generateToken(
        user._id.toString(),
        user.phone!,
        user.account_type || 'student'
      )

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          phone: user.phone,
          nickname: user.nickname,
          accountType: user.account_type,
          needsOnboarding: user.hasCompletedOnboarding === false
        }
      })

    } catch (error: any) {
      console.error('手机号登录失败:', error)
      res.status(500).json({
        success: false,
        error: error.message || '登录失败'
      })
    }
  }

  /**
   * POST /api/auth/wechat-login
   * 微信小程序登录（增强版）
   */
  async wechatLogin(req: Request, res: Response) {
    try {
      const { code, nickname, avatar, accountType = 'student' } = req.body as WechatLoginRequest

      if (!code) {
        return res.status(400).json({
          success: false,
          error: '缺少code参数'
        })
      }

      // 1. 调用微信接口获取openid
      const wxSession = await this.getWechatSession(code)

      if (wxSession.errcode) {
        return res.status(400).json({
          success: false,
          error: '微信登录失败',
          message: wxSession.errmsg
        })
      }

      const { openid, unionid } = wxSession

      // 2. 查找用户
      let user = await User.findOne({ openId: openid })

      if (!user) {
        // 新用户，需要绑定手机号
        return res.json({
          success: true,
          needsBindPhone: true,
          openid,
          unionid,
          accountType
        })
      }

      // 3. 老用户，更新信息
      if (nickname) user.nickname = nickname
      if (avatar) user.avatar = avatar
      await user.save()

      // 4. 生成token
      const token = this.generateToken(
        user._id.toString(),
        user.openId!,
        user.account_type || 'student'
      )

      res.json({
        success: true,
        token,
        needsBindPhone: !user.phone,
        user: {
          id: user._id,
          openId: user.openId,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          accountType: user.account_type,
          needsOnboarding: user.hasCompletedOnboarding === false
        }
      })

    } catch (error) {
      console.error('微信登录失败:', error)
      res.status(500).json({
        success: false,
        error: '登录失败'
      })
    }
  }

  /**
   * POST /api/auth/bind-phone
   * 绑定手机号（微信登录后）
   */
  async bindPhone(req: Request, res: Response) {
    try {
      const { phone, code, openid } = req.body as BindPhoneRequest
      const accountType = req.body.accountType || 'student'

      // 1. 参数验证
      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数'
        })
      }

      // 2. 验证验证码
      try {
        await smsService.verifyCode(phone, code, 'register')
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: error.message
        })
      }

      // 3. 检查手机号是否已被占用
      const existingPhone = await User.findOne({ phone })
      if (existingPhone && existingPhone.openId !== openid) {
        return res.status(400).json({
          success: false,
          error: `该手机号已被其他${existingPhone.account_type === 'student' ? '学生' : '企业'}账号绑定`
        })
      }

      // 4. 创建或更新用户
      let user: any

      if (openid) {
        // 有openid，查找或创建用户
        user = await User.findOne({ openId: openid })

        if (user) {
          // 更新手机号
          user.phone = phone
          if (!user.account_type) user.account_type = accountType
          await user.save()
        } else {
          // 创建新用户
          user = new User({
            openId: openid,
            phone,
            nickname: `${accountType === 'student' ? '学生' : '企业'}${phone.slice(-4)}`,
            account_type: accountType,
            level: accountType === 'student' ? 0 : undefined,
            hasCompletedOnboarding: false
          })
          await user.save()
        }
      } else {
        // 没有openid，纯手机号注册
        user = await User.findOne({ phone })

        if (!user) {
          user = new User({
            phone,
            nickname: `${accountType === 'student' ? '学生' : '企业'}${phone.slice(-4)}`,
            account_type: accountType,
            level: accountType === 'student' ? 0 : undefined,
            hasCompletedOnboarding: false
          })
          await user.save()
        }
      }

      // 5. 生成token
      const token = this.generateToken(
        user._id.toString(),
        user.openId || user.phone!,
        user.account_type || 'student'
      )

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          openId: user.openId,
          phone: user.phone,
          nickname: user.nickname,
          accountType: user.account_type,
          needsOnboarding: user.hasCompletedOnboarding === false
        }
      })

    } catch (error: any) {
      console.error('绑定手机号失败:', error)
      res.status(500).json({
        success: false,
        error: error.message || '绑定失败'
      })
    }
  }

  /**
   * POST /api/auth/refresh-token
   * 刷新Token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const { token } = req.body

      if (!token) {
        return res.status(400).json({ error: '缺少token参数' })
      }

      // 验证旧Token（即使过期也验证）
      const jwtSecret = process.env.JWT_SECRET || 'default-secret-key'
      const decoded = jwt.verify(token, jwtSecret, { ignoreExpiration: true }) as any

      // 生成新Token
      const newToken = this.generateToken(decoded.userId, decoded.openId, decoded.accountType)

      res.json({
        success: true,
        token: newToken
      })

    } catch (error) {
      console.error('刷新Token失败:', error)
      res.status(401).json({ error: 'Token无效' })
    }
  }

  /**
   * GET /api/auth/profile
   * 获取用户信息
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未认证' })
      }

      const user = await User.findById(userId)

      if (!user) {
        return res.status(404).json({ error: '用户不存在' })
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          openId: user.openId,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          accountType: user.account_type,
          level: user.level,
          needsOnboarding: user.hasCompletedOnboarding === false
        }
      })

    } catch (error) {
      console.error('获取用户信息失败:', error)
      res.status(500).json({ error: '获取用户信息失败' })
    }
  }

  /**
   * PUT /api/auth/profile
   * 更新用户信息
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.userId
      const { nickname, phone, email, wechatId, company, track } = req.body

      if (!userId) {
        return res.status(401).json({ error: '未认证' })
      }

      const user = await User.findById(userId)

      if (!user) {
        return res.status(404).json({ error: '用户不存在' })
      }

      // 更新允许修改的字段
      if (nickname) user.nickname = nickname
      if (phone) user.phone = phone
      if (email) user.email = email
      if (wechatId) user.wechatId = wechatId
      if (company) user.company = company
      if (track && ['content', 'dev'].includes(track)) user.track = track

      await user.save()

      res.json({
        success: true,
        message: '更新成功',
        user: {
          id: user._id,
          nickname: user.nickname,
          phone: user.phone,
          email: user.email,
          wechatId: user.wechatId,
          company: user.company,
          track: user.track
        }
      })

    } catch (error) {
      console.error('更新用户信息失败:', error)
      res.status(500).json({ error: '更新失败' })
    }
  }

  /**
   * 调用微信接口获取session
   */
  private async getWechatSession(code: string): Promise<WechatSession> {
    const appId = process.env.WECHAT_APP_ID
    const appSecret = process.env.WECHAT_APP_SECRET

    if (!appId || !appSecret) {
      // 开发环境：返回模拟数据
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  开发模式：使用模拟微信登录')
        return {
          openid: `dev_openid_${Date.now()}`,
          session_key: 'dev_session_key',
          unionid: `dev_unionid_${Date.now()}`
        }
      }
      throw new Error('未配置微信AppID和AppSecret')
    }

    try {
      const url = 'https://api.weixin.qq.com/sns/jscode2session'
      const response = await axios.get(url, {
        params: {
          appid: appId,
          secret: appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      })

      return response.data
    } catch (error) {
      console.error('调用微信接口失败:', error)
      throw error
    }
  }

  /**
   * 生成JWT Token
   */
  private generateToken(userId: string, identifier: string, accountType: string = 'student'): string {
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key'

    return jwt.sign(
      {
        userId,
        openId: identifier,
        accountType,
        role: 'user'
      },
      jwtSecret,
      { expiresIn: '30d' }
    )
  }
}

export const authController = new AuthController()
