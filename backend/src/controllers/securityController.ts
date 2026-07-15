import { Request, Response } from 'express'
import { checkImageSecurity, checkTextSecurity } from '../services/wechatService'
import { pool } from '../config/database'

/**
 * 图片内容安全检查控制器
 * POST /api/v1/security/imgSecCheck
 */
export async function imgSecCheck(req: Request, res: Response) {
  try {
    const { imageBase64, filePath } = req.body

    // 验证参数
    if (!imageBase64 && !filePath) {
      return res.status(400).json({
        success: false,
        message: '缺少imageBase64或filePath参数'
      })
    }

    let imageBuffer: Buffer

    // 方案1: 接收base64编码的图片
    if (imageBase64) {
      try {
        // 移除data:image前缀（如果有）
        const base64Data = imageBase64.includes(',')
          ? imageBase64.split(',')[1]
          : imageBase64

        imageBuffer = Buffer.from(base64Data, 'base64')
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'base64解码失败'
        })
      }
    }
    // 方案2: 接收文件路径（暂不实现，因为小程序临时文件无法直接访问）
    else {
      return res.status(400).json({
        success: false,
        message: '暂不支持filePath方式，请使用imageBase64'
      })
    }

    // 调用微信安全检查
    const result = await checkImageSecurity(imageBuffer)

    return res.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('图片安全检查失败:', error)

    // 微信API错误
    if (error.message && error.message.includes('微信')) {
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }

    // 其他错误
    return res.status(500).json({
      success: false,
      message: '图片安全检查失败，请稍后重试'
    })
  }
}

/**
 * 文本内容安全检查控制器
 * POST /api/v1/security/msgSecCheck
 */
export async function msgSecCheck(req: Request, res: Response) {
  try {
    const { content, scene } = req.body

    // 验证参数
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '缺少content参数或参数类型错误'
      })
    }

    // 空内容直接通过
    if (content.trim().length === 0) {
      return res.json({
        success: true,
        data: {
          pass: true,
          reason: 'empty'
        }
      })
    }

    // 获取用户的openid
    // @ts-ignore - req.user由认证中间件注入
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      })
    }

    // 从数据库查询用户的openid
    const userQuery = await pool.query(
      'SELECT wechat_openid FROM students WHERE id = $1',
      [userId]
    )

    const wechatOpenid = userQuery.rows[0]?.wechat_openid

    if (!wechatOpenid) {
      // 如果用户没有openid，记录警告但仍允许通过
      // 因为有些用户可能不是通过微信登录的
      console.warn(`⚠️ 用户 ${userId} 没有微信openid，跳过安全检查`)
      return res.json({
        success: true,
        data: {
          pass: true,
          reason: 'no_openid'
        }
      })
    }

    // 场景值验证（默认为2-评论）
    const sceneValue = scene && [1, 2, 3, 4].includes(scene) ? scene : 2

    // 调用微信安全检查
    const result = await checkTextSecurity(content, wechatOpenid, sceneValue)

    return res.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('文本安全检查失败:', error)

    // 微信API错误
    if (error.message && error.message.includes('微信')) {
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }

    // 其他错误
    return res.status(500).json({
      success: false,
      message: '文本安全检查失败，请稍后重试'
    })
  }
}
