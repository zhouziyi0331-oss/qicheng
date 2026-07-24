import Taro from '@tarojs/taro'

const BASE_URL = 'http://localhost:3000'

/**
 * 认证相关API
 */

interface SendCodeResponse {
  success: boolean
  message: string
}

interface CheckPhoneResponse {
  success: boolean
  registered: boolean
  accountType: 'student' | 'enterprise' | null
}

interface RegisterResponse {
  success: boolean
  token: string
  user: {
    id: string
    phone: string
    nickname: string
    accountType: 'student' | 'enterprise'
    needsOnboarding: boolean
  }
}

interface LoginResponse {
  success: boolean
  token: string
  user: {
    id: string
    phone: string
    nickname: string
    accountType: 'student' | 'enterprise'
    needsOnboarding: boolean
  }
}

interface WechatLoginResponse {
  success: boolean
  token?: string
  needsBindPhone?: boolean
  openid?: string
  unionid?: string
  accountType?: 'student' | 'enterprise'
  user?: {
    id: string
    openId: string
    phone?: string
    nickname: string
    accountType: 'student' | 'enterprise'
    needsOnboarding: boolean
  }
}

/**
 * 发送验证码
 */
export async function sendCode(
  phone: string,
  type: 'login' | 'register' = 'login'
): Promise<SendCodeResponse> {
  const res = await Taro.request({
    url: `${BASE_URL}/api/auth/send-code`,
    method: 'POST',
    data: { phone, type }
  })

  if (res.statusCode === 200) {
    return res.data
  }

  throw new Error(res.data.error || '发送验证码失败')
}

/**
 * 检查手机号是否已注册
 */
export async function checkPhone(phone: string): Promise<CheckPhoneResponse> {
  const res = await Taro.request({
    url: `${BASE_URL}/api/auth/check-phone`,
    method: 'POST',
    data: { phone }
  })

  if (res.statusCode === 200) {
    return res.data
  }

  throw new Error(res.data.error || '检查失败')
}

/**
 * 手机号注册
 */
export async function registerByPhone(
  phone: string,
  code: string,
  accountType: 'student' | 'enterprise',
  nickname?: string
): Promise<RegisterResponse> {
  const res = await Taro.request({
    url: `${BASE_URL}/api/auth/register-phone`,
    method: 'POST',
    data: { phone, code, accountType, nickname }
  })

  if (res.statusCode === 200 && res.data.success) {
    // 保存token
    Taro.setStorageSync('token', res.data.token)
    Taro.setStorageSync('userInfo', res.data.user)
    return res.data
  }

  throw new Error(res.data.error || '注册失败')
}

/**
 * 手机号登录
 */
export async function loginByPhone(
  phone: string,
  code: string
): Promise<LoginResponse> {
  const res = await Taro.request({
    url: `${BASE_URL}/api/auth/login-phone`,
    method: 'POST',
    data: { phone, code }
  })

  if (res.statusCode === 200 && res.data.success) {
    // 保存token
    Taro.setStorageSync('token', res.data.token)
    Taro.setStorageSync('userInfo', res.data.user)
    return res.data
  }

  throw new Error(res.data.error || '登录失败')
}

/**
 * 微信登录
 */
export async function wechatLogin(
  code: string,
  accountType: 'student' | 'enterprise' = 'student'
): Promise<WechatLoginResponse> {
  const res = await Taro.request({
    url: `${BASE_URL}/api/auth/wechat-login`,
    method: 'POST',
    data: { code, accountType }
  })

  if (res.statusCode === 200 && res.data.success) {
    if (res.data.token) {
      // 已绑定，保存token
      Taro.setStorageSync('token', res.data.token)
      Taro.setStorageSync('userInfo', res.data.user)
    }
    return res.data
  }

  throw new Error(res.data.error || '微信登录失败')
}

/**
 * 绑定手机号
 */
export async function bindPhone(
  phone: string,
  code: string,
  openid?: string,
  accountType: 'student' | 'enterprise' = 'student'
): Promise<RegisterResponse> {
  const res = await Taro.request({
    url: `${BASE_URL}/api/auth/bind-phone`,
    method: 'POST',
    data: { phone, code, openid, accountType }
  })

  if (res.statusCode === 200 && res.data.success) {
    // 保存token
    Taro.setStorageSync('token', res.data.token)
    Taro.setStorageSync('userInfo', res.data.user)
    return res.data
  }

  throw new Error(res.data.error || '绑定失败')
}

/**
 * 获取用户信息
 */
export async function getUserProfile() {
  const token = Taro.getStorageSync('token')

  const res = await Taro.request({
    url: `${BASE_URL}/api/auth/profile`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (res.statusCode === 200 && res.data.success) {
    return res.data.user
  }

  throw new Error(res.data.error || '获取用户信息失败')
}

/**
 * 登出
 */
export function logout() {
  Taro.removeStorageSync('token')
  Taro.removeStorageSync('userInfo')
  Taro.reLaunch({ url: '/packageAuth/pages/login/index' })
}

export const authAPI = {
  sendCode,
  checkPhone,
  registerByPhone,
  loginByPhone,
  wechatLogin,
  bindPhone,
  getUserProfile,
  logout
}
