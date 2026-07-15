import axios from 'axios'
import NodeCache from 'node-cache'

/**
 * 微信小程序服务
 * 负责获取access_token和调用微信API
 */

// 创建缓存实例，TTL为7000秒（微信token有效期7200秒，提前200秒刷新）
const tokenCache = new NodeCache({ stdTTL: 7000 })

const WECHAT_MINIAPP_APPID = process.env.WECHAT_MINIAPP_APPID || ''
const WECHAT_MINIAPP_SECRET = process.env.WECHAT_MINIAPP_SECRET || ''

/**
 * 获取微信小程序 access_token
 * 自动处理缓存，避免频繁请求
 */
export async function getWechatAccessToken(): Promise<string> {
  // 1. 先从缓存读取
  const cachedToken = tokenCache.get<string>('wechat_access_token')
  if (cachedToken) {
    console.log('✅ 使用缓存的微信access_token')
    return cachedToken
  }

  // 2. 缓存不存在，从微信服务器获取
  console.log('🔄 从微信服务器获取新的access_token')

  if (!WECHAT_MINIAPP_APPID || !WECHAT_MINIAPP_SECRET) {
    throw new Error('微信小程序配置缺失：请在.env中配置 WECHAT_MINIAPP_APPID 和 WECHAT_MINIAPP_SECRET')
  }

  try {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_MINIAPP_APPID,
        secret: WECHAT_MINIAPP_SECRET
      },
      timeout: 10000
    })

    const { access_token, errcode, errmsg } = response.data

    if (access_token) {
      // 缓存token
      tokenCache.set('wechat_access_token', access_token)
      console.log('✅ 成功获取并缓存微信access_token')
      return access_token
    } else {
      console.error('❌ 获取微信access_token失败:', errcode, errmsg)
      throw new Error(`获取微信access_token失败: [${errcode}] ${errmsg}`)
    }
  } catch (error: any) {
    console.error('❌ 调用微信API失败:', error.message)
    throw new Error(`调用微信API失败: ${error.message}`)
  }
}

/**
 * 图片内容安全检查
 * @param imageBuffer 图片Buffer数据
 * @returns 检查结果
 */
export async function checkImageSecurity(imageBuffer: Buffer): Promise<{
  pass: boolean
  reason: string
}> {
  try {
    const accessToken = await getWechatAccessToken()

    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('media', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    })

    const response = await axios.post(
      `https://api.weixin.qq.com/wxa/img_sec_check?access_token=${accessToken}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 10000
      }
    )

    const { errcode, errmsg } = response.data

    if (errcode === 0) {
      // 检查通过
      return {
        pass: true,
        reason: 'ok'
      }
    } else if (errcode === 87014) {
      // 图片违规
      return {
        pass: false,
        reason: '图片包含违规内容'
      }
    } else {
      // 其他错误
      console.error('微信imgSecCheck错误:', errcode, errmsg)
      throw new Error(`微信图片检查失败: [${errcode}] ${errmsg}`)
    }
  } catch (error: any) {
    console.error('图片安全检查失败:', error.message)
    throw error
  }
}

/**
 * 文本内容安全检查
 * @param content 待检查文本
 * @param openid 用户的openid
 * @param scene 场景值 1=资料；2=评论；3=论坛；4=社交日志
 * @returns 检查结果
 */
export async function checkTextSecurity(
  content: string,
  openid: string,
  scene: 1 | 2 | 3 | 4 = 2
): Promise<{
  pass: boolean
  reason: string
}> {
  try {
    // 空内容直接通过
    if (!content || content.trim().length === 0) {
      return {
        pass: true,
        reason: 'empty'
      }
    }

    const accessToken = await getWechatAccessToken()

    const response = await axios.post(
      `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
      {
        version: 2,
        openid: openid,
        scene: scene,
        content: content.trim()
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    const { errcode, errmsg, result } = response.data

    if (errcode === 0) {
      // 检查成功
      const suggest = result?.suggest

      if (suggest === 'pass') {
        // 内容正常
        return {
          pass: true,
          reason: result?.label || '100'
        }
      } else if (suggest === 'risky' || suggest === 'review') {
        // 内容可疑或需要审核
        return {
          pass: false,
          reason: `内容包含敏感信息: ${result?.label || 'unknown'}`
        }
      } else {
        // 其他情况
        return {
          pass: false,
          reason: '内容检查未通过'
        }
      }
    } else {
      // 接口调用失败
      console.error('微信msgSecCheck错误:', errcode, errmsg)
      throw new Error(`微信文本检查失败: [${errcode}] ${errmsg}`)
    }
  } catch (error: any) {
    console.error('文本安全检查失败:', error.message)
    throw error
  }
}

/**
 * 清除缓存的access_token（用于测试或强制刷新）
 */
export function clearWechatTokenCache(): void {
  tokenCache.del('wechat_access_token')
  console.log('🗑️ 已清除微信access_token缓存')
}
