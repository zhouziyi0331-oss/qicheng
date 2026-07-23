import { Request, Response, NextFunction } from 'express'

/**
 * 请求速率限制中间件
 * 防止API被滥用
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export const rateLimiter = (options: {
  windowMs: number  // 时间窗口（毫秒）
  maxRequests: number  // 最大请求数
  message?: string
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.userId || req.ip || 'anonymous'
    const now = Date.now()

    if (!store[key] || now > store[key].resetTime) {
      // 新的时间窗口
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs
      }
      return next()
    }

    store[key].count++

    if (store[key].count > options.maxRequests) {
      return res.status(429).json({
        error: options.message || '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      })
    }

    next()
  }
}

// 预设的限流器
export const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 100,
  message: '请求过于频繁，请15分钟后再试'
})

export const aiLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  maxRequests: 10,
  message: 'AI生成次数已达上限，请1小时后再试'
})

export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5,
  message: '登录尝试次数过多，请15分钟后再试'
})
