import { Request, Response, NextFunction } from 'express'

/**
 * 请求验证中间件
 * 验证必需参数
 */

export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = []

    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field)
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: '缺少必要参数',
        missingFields
      })
    }

    next()
  }
}

/**
 * 分页参数验证
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20

  if (page < 1) {
    return res.status(400).json({ error: 'page必须大于0' })
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'limit必须在1-100之间' })
  }

  req.query.page = page.toString()
  req.query.limit = limit.toString()

  next()
}

/**
 * MongoDB ObjectId验证
 */
export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName]

    // 简单的ObjectId格式验证（24位十六进制字符）
    const objectIdPattern = /^[0-9a-fA-F]{24}$/

    if (!objectIdPattern.test(id)) {
      return res.status(400).json({
        error: `无效的${paramName}格式`
      })
    }

    next()
  }
}
