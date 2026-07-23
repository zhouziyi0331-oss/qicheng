import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { User } from '../models/User'

interface WechatLoginRequest {
  code: string
  nickname?: string
  avatar?: string
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
   * POST /api/auth/wechat-login
   * 微信小程序登录
   */
  async wechatLogin(req: Request, res: Response) {
    try {
      const { code, nickname, avatar } = req.body as WechatLoginRequest

      if (!code) {
        return res.status(400).json({ error: '缺少code参数' })
      }

      // 1. 调用微信接口获取openid
      const wxSession = await this.getWechatSession(code)

      if (wxSession.errcode) {
        return res.status(400).json({
          error: '微信登录失败',
          message: wxSession.errmsg
        })
      }

      const { openid, unionid } = wxSession

      // 2. 查找或创建用户
      let user = await User.findOne({ openId: openid })

      if (!user) {
        // 新用户，创建记录
        user = new User({
          openId: openid,
          unionId: unionid,
          nickname: nickname || '新用户',
          avatar: avatar || '◆',
          level: 1,
          exp: 0,
          totalIncome: 0,
          totalProjects: 0,
          rating: 5.0
        })
        await user.save()
      } else if (nickname || avatar) {
        // 老用户，更新信息
        if (nickname) user.nickname = nickname
        if (avatar) user.avatar = avatar
        await user.save()
      }

      // 3. 生成JWT Token
      const token = this.generateToken(user._id.toString(), openid)

      // 4. 返回用户信息和Token
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          openId: user.openId,
          nickname: user.nickname,
          avatar: user.avatar,
          company: user.company,
          track: user.track,
          level: user.level,
          exp: user.exp,
          totalIncome: user.totalIncome,
          totalProjects: user.totalProjects,
          rating: user.rating
        }
      })

    } catch (error) {
      console.error('微信登录失败:', error)
      res.status(500).json({ error: '登录失败' })
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
      const newToken = this.generateToken(decoded.userId, decoded.openId)

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
        id: user._id,
        openId: user.openId,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
        wechatId: user.wechatId,
        company: user.company,
        track: user.track,
        level: user.level,
        exp: user.exp,
        totalIncome: user.totalIncome,
        totalProjects: user.totalProjects,
        rating: user.rating
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
      if (process.env.NODE_ENV === 'development') {
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
  private generateToken(userId: string, openId: string): string {
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key'

    return jwt.sign(
      {
        userId,
        openId,
        role: 'user'
      },
      jwtSecret,
      { expiresIn: '7d' }
    )
  }
}

export const authController = new AuthController()
