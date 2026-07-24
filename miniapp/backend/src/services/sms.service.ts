import Redis from 'ioredis'

/**
 * 短信验证码服务
 * 开发环境使用固定验证码，生产环境调用真实短信API
 */

// 开发环境使用固定验证码
const MOCK_CODE = '123456'
const isDev = process.env.NODE_ENV !== 'production'

class SMSService {
  private redis: Redis

  constructor() {
    // 初始化Redis连接
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    })

    this.redis.on('error', (err) => {
      console.error('Redis连接错误:', err)
    })
  }

  /**
   * 发送验证码
   * @param phone 手机号
   * @param type 类型：login(登录) 或 register(注册)
   */
  async sendVerifyCode(phone: string, type: 'login' | 'register'): Promise<void> {
    // 1. 检查手机号格式
    if (!this.isValidPhone(phone)) {
      throw new Error('手机号格式不正确')
    }

    // 2. 检查发送频率限制（60秒内只能发送一次）
    const rateLimitKey = `sms:rate:${phone}`
    const lastSent = await this.redis.get(rateLimitKey)

    if (lastSent) {
      const waitTime = 60 - Math.floor((Date.now() - parseInt(lastSent)) / 1000)
      throw new Error(`验证码发送太频繁，请${waitTime}秒后再试`)
    }

    // 3. 检查每日发送次数限制（每天最多10次）
    const dailyLimitKey = `sms:daily:${phone}`
    const dailyCount = await this.redis.get(dailyLimitKey)

    if (dailyCount && parseInt(dailyCount) >= 10) {
      throw new Error('今日验证码发送次数已达上限')
    }

    // 4. 生成或使用固定验证码
    let code: string

    if (isDev) {
      // 开发环境：使用固定验证码
      code = MOCK_CODE
      console.log(`📱 [开发环境] 手机号 ${phone} 的验证码: ${code}`)
    } else {
      // 生产环境：生成随机验证码并发送
      code = this.generateCode()
      await this.sendRealSMS(phone, code, type)
    }

    // 5. 存储验证码（5分钟有效期）
    const codeKey = `sms:code:${phone}:${type}`
    await this.redis.setex(codeKey, 300, code)

    // 6. 设置发送频率限制（60秒）
    await this.redis.setex(rateLimitKey, 60, Date.now().toString())

    // 7. 增加每日发送次数
    const currentCount = await this.redis.incr(dailyLimitKey)
    if (currentCount === 1) {
      // 第一次发送，设置过期时间为明天0点
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000)
      await this.redis.expire(dailyLimitKey, ttl)
    }
  }

  /**
   * 验证验证码
   * @param phone 手机号
   * @param code 验证码
   * @param type 类型：login(登录) 或 register(注册)
   * @returns 验证是否成功
   */
  async verifyCode(phone: string, code: string, type: 'login' | 'register'): Promise<boolean> {
    const codeKey = `sms:code:${phone}:${type}`
    const savedCode = await this.redis.get(codeKey)

    if (!savedCode) {
      throw new Error('验证码已过期或不存在，请重新获取')
    }

    if (savedCode !== code) {
      // 记录错误次数
      const errorKey = `sms:error:${phone}`
      const errorCount = await this.redis.incr(errorKey)

      if (errorCount === 1) {
        await this.redis.expire(errorKey, 300) // 5分钟内有效
      }

      if (errorCount >= 5) {
        // 错误次数过多，删除验证码并锁定
        await this.redis.del(codeKey)
        throw new Error('验证码错误次数过多，请重新获取')
      }

      throw new Error(`验证码错误，还可以尝试${5 - errorCount}次`)
    }

    // 验证成功后删除验证码和错误次数
    await this.redis.del(codeKey)
    await this.redis.del(`sms:error:${phone}`)

    return true
  }

  /**
   * 验证手机号格式
   */
  private isValidPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  /**
   * 生成6位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * 调用真实短信服务
   * TODO: 集成阿里云SMS或腾讯云SMS
   */
  private async sendRealSMS(phone: string, code: string, type: string): Promise<void> {
    // 这里接入真实的短信服务商
    // 示例：阿里云SMS
    /*
    const Core = require('@alicloud/pop-core')

    const client = new Core({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'https://dysmsapi.aliyuncs.com',
      apiVersion: '2017-05-25'
    })

    const params = {
      PhoneNumbers: phone,
      SignName: '启程OPC孵化',
      TemplateCode: type === 'register' ? 'SMS_REGISTER' : 'SMS_LOGIN',
      TemplateParam: JSON.stringify({ code })
    }

    const requestOption = {
      method: 'POST'
    }

    try {
      const result = await client.request('SendSms', params, requestOption)
      console.log('短信发送成功:', result)
    } catch (error) {
      console.error('短信发送失败:', error)
      throw new Error('短信发送失败，请稍后重试')
    }
    */

    // 临时实现：只打印日志
    console.log(`📱 [生产环境] 发送验证码到 ${phone}: ${code} (类型: ${type})`)
  }

  /**
   * 清理Redis连接
   */
  async close(): Promise<void> {
    await this.redis.quit()
  }
}

export const smsService = new SMSService()
