import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userRole?: string
    }
  }
}

interface JWTPayload {
  userId: string
  openId: string
  role?: string
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从header获取token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证token' })
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key'

    // 验证token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload

    // 将用户信息附加到request
    req.userId = decoded.userId
    req.userRole = decoded.role

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token已过期' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: '无效的Token' })
    }
    return res.status(500).json({ error: '认证失败' })
  }
}

// 别名导出，保持向后兼容
export const authenticateToken = authMiddleware

// 可选的认证中间件（token可选）
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const jwtSecret = process.env.JWT_SECRET || 'default-secret-key'
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload
      req.userId = decoded.userId
      req.userRole = decoded.role
    }
    next()
  } catch (error) {
    // 忽略错误，继续处理请求
    next()
  }
}

// 管理员权限中间件（必须先经过authMiddleware）
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: '未授权' })
    }

    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '权限不足，需要管理员权限' })
    }

    next()
  } catch (error) {
    return res.status(500).json({ error: '权限验证失败' })
  }
}
