/**
 * 企业端安全工具模块
 * 提供客户端侧的安全防护功能
 */

import Taro from '@tarojs/taro'
import CryptoJS from 'crypto-js'

// ==================== 配置常量 ====================

const ENCRYPTION_KEY = 'YOUR_ENCRYPTION_KEY_HERE' // 需要配置32字节密钥
const MAX_REQUEST_PER_MINUTE = 60 // 客户端频率限制：60次/分钟
const SENSITIVE_WORDS = [
  '暴力', '色情', '赌博', '毒品', '恐怖', '政治', '反动',
  '法轮功', '六四', '台独', '藏独', '疆独', '习近平',
  '自杀', '杀人', '爆炸', '枪支', '炸弹'
]

// ==================== 类型定义 ====================

interface SecurityCheckResult {
  success: boolean
  error?: string
  message?: string
}

interface RequestRecord {
  timestamp: number
  count: number
}

// ==================== 内存存储 ====================

const requestRecords = new Map<string, RequestRecord>()
const blacklist = new Set<string>()

// ==================== 1. 输入验证与过滤 ====================

/**
 * XSS检测
 */
export function checkXSS(text: string): SecurityCheckResult {
  if (!text) return { success: true }

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*onerror/gi,
    /<svg[^>]*onload/gi
  ]

  for (const pattern of xssPatterns) {
    if (pattern.test(text)) {
      return {
        success: false,
        error: 'XSS_DETECTED',
        message: '检测到潜在的XSS攻击'
      }
    }
  }

  return { success: true }
}

/**
 * SQL注入检测
 */
export function checkSQLInjection(text: string): SecurityCheckResult {
  if (!text) return { success: true }

  const sqlPatterns = [
    /(\bor\b|\band\b).*?[=<>]/gi,
    /union.*?select/gi,
    /insert.*?into/gi,
    /delete.*?from/gi,
    /update.*?set/gi,
    /drop.*?table/gi,
    /exec(\s|\+)+(s|x)p\w+/gi,
    /--/g,
    /;.*?(drop|delete|update|insert)/gi
  ]

  for (const pattern of sqlPatterns) {
    if (pattern.test(text)) {
      return {
        success: false,
        error: 'SQL_INJECTION_DETECTED',
        message: '检测到潜在的SQL注入攻击'
      }
    }
  }

  return { success: true }
}

/**
 * 敏感词检测
 */
export function checkSensitiveWords(text: string): SecurityCheckResult {
  if (!text) return { success: true }

  const lowerText = text.toLowerCase()

  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return {
        success: false,
        error: 'SENSITIVE_CONTENT',
        message: '内容包含敏感词，请修改后重试'
      }
    }
  }

  return { success: true }
}

/**
 * 提示词注入检测
 */
export function checkPromptInjection(text: string): SecurityCheckResult {
  if (!text) return { success: true }

  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
    /disregard\s+(all\s+)?(previous|above|prior)/gi,
    /forget\s+(all\s+)?(previous|above|prior)/gi,
    /system\s*prompt/gi,
    /you\s+are\s+now/gi,
    /new\s+instructions?:/gi,
    /override\s+instructions?/gi,
    /act\s+as\s+(a\s+)?(different|new)/gi
  ]

  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      return {
        success: false,
        error: 'PROMPT_INJECTION_DETECTED',
        message: '检测到提示词注入尝试'
      }
    }
  }

  return { success: true }
}

/**
 * 综合输入验证
 */
export function validateInput(text: string): SecurityCheckResult {
  // 1. XSS检测
  const xssCheck = checkXSS(text)
  if (!xssCheck.success) return xssCheck

  // 2. SQL注入检测
  const sqlCheck = checkSQLInjection(text)
  if (!sqlCheck.success) return sqlCheck

  // 3. 敏感词检测
  const sensitiveCheck = checkSensitiveWords(text)
  if (!sensitiveCheck.success) return sensitiveCheck

  // 4. 提示词注入检测
  const promptCheck = checkPromptInjection(text)
  if (!promptCheck.success) return promptCheck

  return { success: true }
}

// ==================== 2. PII脱敏 ====================

/**
 * 手机号脱敏
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 身份证脱敏
 */
export function maskIDCard(idCard: string): string {
  if (!idCard || idCard.length < 15) return idCard
  return idCard.replace(/(\d{3})\d+(\d{4})/, '$1***********$2')
}

/**
 * 邮箱脱敏
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [username, domain] = email.split('@')
  const maskedUsername = username.substring(0, 3) + '***'
  return `${maskedUsername}@${domain}`
}

/**
 * 综合PII脱敏
 */
export function maskPII(text: string): string {
  if (!text) return text

  let masked = text

  // 脱敏手机号
  masked = masked.replace(/1[3-9]\d{9}/g, (match) => maskPhone(match))

  // 脱敏身份证
  masked = masked.replace(/\d{17}[\dXx]/g, (match) => maskIDCard(match))

  // 脱敏邮箱
  masked = masked.replace(/[\w.-]+@[\w.-]+\.\w+/g, (match) => maskEmail(match))

  return masked
}

// ==================== 3. 数据加密 ====================

/**
 * AES-256加密
 */
export function encrypt(text: string, key: string = ENCRYPTION_KEY): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, key).toString()
    return encrypted
  } catch (error) {
    console.error('加密失败:', error)
    throw new Error('数据加密失败')
  }
}

/**
 * AES-256解密
 */
export function decrypt(encryptedText: string, key: string = ENCRYPTION_KEY): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key)
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('解密失败:', error)
    throw new Error('数据解密失败')
  }
}

// ==================== 4. 频率限制 ====================

/**
 * 客户端频率限制检查
 */
export function checkRateLimit(userId: string): SecurityCheckResult {
  const now = Date.now()
  const record = requestRecords.get(userId)

  if (!record) {
    // 首次请求
    requestRecords.set(userId, { timestamp: now, count: 1 })
    return { success: true }
  }

  const timeDiff = now - record.timestamp

  if (timeDiff < 60000) {
    // 1分钟内
    if (record.count >= MAX_REQUEST_PER_MINUTE) {
      return {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试'
      }
    }
    record.count++
  } else {
    // 超过1分钟，重置计数
    record.timestamp = now
    record.count = 1
  }

  return { success: true }
}

/**
 * 清理过期的请求记录
 */
export function cleanupRequestRecords() {
  const now = Date.now()
  const expireTime = 5 * 60 * 1000 // 5分钟

  for (const [userId, record] of requestRecords.entries()) {
    if (now - record.timestamp > expireTime) {
      requestRecords.delete(userId)
    }
  }
}

// 定期清理（每5分钟）
setInterval(cleanupRequestRecords, 5 * 60 * 1000)

// ==================== 5. 黑名单管理 ====================

/**
 * 检查是否在黑名单
 */
export function isBlacklisted(userId: string): boolean {
  return blacklist.has(userId)
}

/**
 * 添加到黑名单
 */
export function addToBlacklist(userId: string) {
  blacklist.add(userId)
  // 持久化到本地存储
  const list = Array.from(blacklist)
  Taro.setStorageSync('blacklist', list)
}

/**
 * 从黑名单移除
 */
export function removeFromBlacklist(userId: string) {
  blacklist.delete(userId)
  // 更新本地存储
  const list = Array.from(blacklist)
  Taro.setStorageSync('blacklist', list)
}

/**
 * 初始化黑名单（从本地存储加载）
 */
export function initBlacklist() {
  try {
    const list = Taro.getStorageSync('blacklist') || []
    list.forEach((userId: string) => blacklist.add(userId))
  } catch (error) {
    console.error('加载黑名单失败:', error)
  }
}

// ==================== 6. Token管理 ====================

/**
 * 安全保存Token
 */
export function saveToken(accessToken: string, refreshToken?: string) {
  try {
    const encryptedAccessToken = encrypt(accessToken)
    Taro.setStorageSync('encrypted_accessToken', encryptedAccessToken)
    Taro.setStorageSync('accessToken', accessToken) // 保留明文用于API调用
    
    if (refreshToken) {
      const encryptedRefreshToken = encrypt(refreshToken)
      Taro.setStorageSync('encrypted_refreshToken', encryptedRefreshToken)
      Taro.setStorageSync('refreshToken', refreshToken)
    }
  } catch (error) {
    console.error('保存Token失败:', error)
  }
}

/**
 * 安全获取Token
 */
export function getToken(): string | null {
  try {
    return Taro.getStorageSync('accessToken')
  } catch (error) {
    console.error('获取Token失败:', error)
    return null
  }
}

/**
 * 清除Token
 */
export function clearToken() {
  try {
    Taro.removeStorageSync('accessToken')
    Taro.removeStorageSync('refreshToken')
    Taro.removeStorageSync('encrypted_accessToken')
    Taro.removeStorageSync('encrypted_refreshToken')
    Taro.removeStorageSync('userInfo')
  } catch (error) {
    console.error('清除Token失败:', error)
  }
}

/**
 * 验证Token是否过期
 */
export function isTokenExpired(token: string): boolean {
  try {
    // 解析JWT Token
    const parts = token.split('.')
    if (parts.length !== 3) return true

    const payload = JSON.parse(atob(parts[1]))
    const exp = payload.exp * 1000 // 转换为毫秒

    return Date.now() >= exp
  } catch (error) {
    console.error('验证Token失败:', error)
    return true
  }
}

// ==================== 7. 安全日志 ====================

interface SecurityLog {
  timestamp: number
  userId: string
  action: string
  resource: string
  success: boolean
  error?: string
  details?: any
}

const securityLogs: SecurityLog[] = []
const MAX_LOGS = 100

/**
 * 记录安全日志
 */
export function logSecurityEvent(log: Omit<SecurityLog, 'timestamp'>) {
  const fullLog: SecurityLog = {
    timestamp: Date.now(),
    ...log
  }

  securityLogs.push(fullLog)

  // 限制日志数量
  if (securityLogs.length > MAX_LOGS) {
    securityLogs.shift()
  }

  // 如果是安全事件，上报到服务器
  if (!log.success) {
    reportSecurityEvent(fullLog)
  }
}

/**
 * 上报安全事件到服务器
 */
async function reportSecurityEvent(log: SecurityLog) {
  try {
    // 这里应该调用后端API上报安全事件
    console.warn('安全事件:', log)
  } catch (error) {
    console.error('上报安全事件失败:', error)
  }
}

/**
 * 获取安全日志
 */
export function getSecurityLogs(): SecurityLog[] {
  return [...securityLogs]
}

// ==================== 8. 请求拦截器 ====================

/**
 * 安全请求拦截器
 * 在发送请求前进行安全检查
 */
export function secureRequestInterceptor(config: any): SecurityCheckResult & { config?: any } {
  const userId = Taro.getStorageSync('user')?.id || 'anonymous'

  // 1. 黑名单检查
  if (isBlacklisted(userId)) {
    logSecurityEvent({
      userId,
      action: 'REQUEST_BLOCKED',
      resource: config.url,
      success: false,
      error: 'USER_BLACKLISTED'
    })
    return {
      success: false,
      error: 'USER_BLACKLISTED',
      message: '您的账号已被限制访问'
    }
  }

  // 2. 频率限制检查
  const rateLimitCheck = checkRateLimit(userId)
  if (!rateLimitCheck.success) {
    logSecurityEvent({
      userId,
      action: 'RATE_LIMIT_EXCEEDED',
      resource: config.url,
      success: false,
      error: rateLimitCheck.error
    })
    return rateLimitCheck
  }

  // 3. Token检查
  const token = getToken()
  if (token && isTokenExpired(token)) {
    clearToken()
    logSecurityEvent({
      userId,
      action: 'TOKEN_EXPIRED',
      resource: config.url,
      success: false,
      error: 'TOKEN_EXPIRED'
    })
    return {
      success: false,
      error: 'TOKEN_EXPIRED',
      message: '登录已过期，请重新登录'
    }
  }

  // 4. 输入验证（如果有data）
  if (config.data) {
    const dataStr = JSON.stringify(config.data)
    const validationCheck = validateInput(dataStr)
    if (!validationCheck.success) {
      logSecurityEvent({
        userId,
        action: 'INPUT_VALIDATION_FAILED',
        resource: config.url,
        success: false,
        error: validationCheck.error
      })
      return validationCheck
    }
  }

  return { success: true, config }
}

// ==================== 9. 初始化 ====================

/**
 * 初始化安全模块
 */
export function initSecurity() {
  console.log('🔒 企业端安全模块初始化...')

  // 加载黑名单
  initBlacklist()

  // 清理过期的请求记录
  cleanupRequestRecords()

  console.log('✅ 企业端安全模块初始化完成')
}

// ==================== 导出 ====================

export default {
  // 输入验证
  validateInput,
  checkXSS,
  checkSQLInjection,
  checkSensitiveWords,
  checkPromptInjection,

  // PII脱敏
  maskPII,
  maskPhone,
  maskEmail,
  maskIDCard,

  // 数据加密
  encrypt,
  decrypt,

  // 频率限制
  checkRateLimit,
  cleanupRequestRecords,

  // 黑名单
  isBlacklisted,
  addToBlacklist,
  removeFromBlacklist,
  initBlacklist,

  // Token管理
  saveToken,
  getToken,
  clearToken,
  isTokenExpired,

  // 安全日志
  logSecurityEvent,
  getSecurityLogs,

  // 请求拦截
  secureRequestInterceptor,

  // 初始化
  initSecurity
}
