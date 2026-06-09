import Taro from '@tarojs/taro'
import { Task, StudentMatch, TaskTrack, TaskLevel } from '../types/task'
import security from '../utils/security'

const BASE_URL = 'http://localhost:3000/api/v1'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}

// 通用请求方法（集成安全防护）
async function request(url: string, options: RequestOptions = {}) {
  const { method = 'GET', data, needAuth = true } = options

  const header: any = {
    'Content-Type': 'application/json'
  }

  // ========== 安全检查开始 ==========

  // 1. 安全请求拦截器
  const securityCheck = security.secureRequestInterceptor({
    url,
    method,
    data,
    header
  })

  if (!securityCheck.success) {
    Taro.showToast({
      title: securityCheck.message || '安全检查失败',
      icon: 'none'
    })
    throw new Error(securityCheck.message || '安全检查失败')
  }

  // 2. 添加认证token
  if (needAuth) {
    const token = security.getToken()
    if (token) {
      // 检查token是否过期
      if (security.isTokenExpired(token)) {
        security.clearToken()
        Taro.redirectTo({ url: '/pages/login/index' })
        throw new Error('登录已过期，请重新登录')
      }
      header['Authorization'] = `Bearer ${token}`
    } else {
      // 需要认证但没有token
      Taro.redirectTo({ url: '/pages/login/index' })
      throw new Error('请先登录')
    }
  }

  // 3. 输入数据验证和PII脱敏（用于日志）
  if (data) {
    const dataStr = JSON.stringify(data)
    const validationResult = security.validateInput(dataStr)

    if (!validationResult.success) {
      security.logSecurityEvent({
        userId: Taro.getStorageSync('user')?.id || 'anonymous',
        action: 'INPUT_VALIDATION_FAILED',
        resource: url,
        success: false,
        error: validationResult.error,
        details: { method, url }
      })

      Taro.showToast({
        title: validationResult.message || '输入数据不合法',
        icon: 'none'
      })
      throw new Error(validationResult.message || '输入数据不合法')
    }
  }

  // ========== 安全检查结束 ==========

  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      timeout: 60000
    })

    // 记录成功的请求
    security.logSecurityEvent({
      userId: Taro.getStorageSync('user')?.id || 'anonymous',
      action: 'API_REQUEST_SUCCESS',
      resource: url,
      success: true,
      details: { method, statusCode: response.statusCode }
    })

    if (response.statusCode === 200) {
      return response.data
    } else if (response.statusCode === 401) {
      // 未授权，清除token并跳转登录
      security.clearToken()

      security.logSecurityEvent({
        userId: 'anonymous',
        action: 'UNAUTHORIZED_ACCESS',
        resource: url,
        success: false,
        error: 'UNAUTHORIZED'
      })

      Taro.redirectTo({ url: '/pages/login/index' })
      throw new Error('请先登录')
    } else if (response.statusCode === 403) {
      // 权限不足
      security.logSecurityEvent({
        userId: Taro.getStorageSync('user')?.id || 'anonymous',
        action: 'FORBIDDEN_ACCESS',
        resource: url,
        success: false,
        error: 'FORBIDDEN'
      })

      throw new Error('权限不足')
    } else if (response.statusCode === 429) {
      // 频率限制
      security.logSecurityEvent({
        userId: Taro.getStorageSync('user')?.id || 'anonymous',
        action: 'RATE_LIMIT_EXCEEDED_SERVER',
        resource: url,
        success: false,
        error: 'RATE_LIMIT_EXCEEDED'
      })

      throw new Error('请求过于频繁，请稍后再试')
    } else {
      throw new Error(response.data?.message || '请求失败')
    }
  } catch (error: any) {
    // 记录失败的请求
    security.logSecurityEvent({
      userId: Taro.getStorageSync('user')?.id || 'anonymous',
      action: 'API_REQUEST_FAILED',
      resource: url,
      success: false,
      error: error.message,
      details: { method, url }
    })

    Taro.showToast({
      title: error.message || '网络错误',
      icon: 'none'
    })
    throw error
  }
}

// 企业任务API
export const taskAPI = {
  // 发布任务
  publish: (data: {
    title: string
    description: string
    track: TaskTrack
    level: TaskLevel
    requiredAbilities: {
      openness: number
      persistence: number
      creativity: number
    }
    budget: number
    deadline: string
    duration: string
    deliverables: string[]
    tags: string[]
  }) => request('/company/tasks/publish', { method: 'POST', data }),

  // 获取企业发布的任务列表
  getMyTasks: (params?: { status?: string; page?: number; limit?: number }) =>
    request('/company/tasks', { method: 'GET', data: params }),

  // 获取任务详情
  getDetail: (taskId: string) => request(`/company/tasks/${taskId}`),

  // 获取任务的匹配学生列表（Top 3）
  getMatchedStudents: (taskId: string) =>
    request(`/company/tasks/${taskId}/matched-students`),

  // 选择学生执行任务
  assignStudent: (taskId: string, studentId: string) =>
    request(`/company/tasks/${taskId}/assign`, { method: 'POST', data: { studentId } }),

  // 验收任务
  verifyTask: (taskId: string, data: {
    approved: boolean
    feedback: string
    rating: number
  }) => request(`/company/tasks/${taskId}/verify`, { method: 'POST', data }),

  // 查看任务进度
  getProgress: (taskId: string) => request(`/company/tasks/${taskId}/progress`),

  // 取消任务
  cancel: (taskId: string, reason: string) =>
    request(`/company/tasks/${taskId}/cancel`, { method: 'POST', data: { reason } })
}

// 学生匹配API
export const matchAPI = {
  // 根据任务要求智能匹配学生（Top 3）
  matchStudents: (data: {
    track: TaskTrack
    level: TaskLevel
    requiredAbilities: {
      openness: number
      persistence: number
      creativity: number
    }
  }) => request('/company/match/students', { method: 'POST', data }),

  // 获取学生详细信息
  getStudentDetail: (studentId: string) =>
    request(`/company/students/${studentId}`)
}

// 企业认证API
export const authAPI = {
  // 注册
  register: async (data: { phone: string; code: string; companyName: string }) => {
    // 输入验证
    const phoneValidation = security.validateInput(data.phone)
    if (!phoneValidation.success) {
      throw new Error(phoneValidation.message)
    }

    const companyNameValidation = security.validateInput(data.companyName)
    if (!companyNameValidation.success) {
      throw new Error(companyNameValidation.message)
    }

    const result = await request('/auth/register', {
      method: 'POST',
      data: { ...data, role: 'company' },
      needAuth: false
    })

    // 保存token
    if (result.token) {
      security.saveToken(result.token)
    }

    return result
  },

  // 登录
  login: async (data: { phone: string; code: string }) => {
    // 输入验证
    const phoneValidation = security.validateInput(data.phone)
    if (!phoneValidation.success) {
      throw new Error(phoneValidation.message)
    }

    const result = await request('/auth/login', {
      method: 'POST',
      data,
      needAuth: false
    })

    // 保存token
    if (result.token) {
      security.saveToken(result.token)
    }

    return result
  },

  // 发送验证码
  sendCode: (phone: string) => {
    // 输入验证
    const phoneValidation = security.validateInput(phone)
    if (!phoneValidation.success) {
      throw new Error(phoneValidation.message)
    }

    return request('/auth/send-code', {
      method: 'POST',
      data: { phone },
      needAuth: false
    })
  },

  // 获取当前企业信息
  getCurrentUser: () => request('/auth/me'),

  // 登出
  logout: () => {
    security.clearToken()
    security.logSecurityEvent({
      userId: Taro.getStorageSync('user')?.id || 'anonymous',
      action: 'USER_LOGOUT',
      resource: 'auth',
      success: true
    })
  }
}

// 聊天API
export const chatAPI = {
  // 获取聊天列表
  getChatList: () => request('/company/chats'),

  // 获取与学生的聊天记录
  getChatHistory: (studentId: string, taskId?: string) =>
    request(`/company/chats/${studentId}`, { method: 'GET', data: { taskId } }),

  // 发送消息（带安全检查）
  sendMessage: async (studentId: string, taskId: string, message: string) => {
    // 输入验证
    const messageValidation = security.validateInput(message)
    if (!messageValidation.success) {
      Taro.showToast({
        title: messageValidation.message || '消息内容不合法',
        icon: 'none'
      })
      throw new Error(messageValidation.message)
    }

    // 敏感词检测
    const sensitiveCheck = security.checkSensitiveWords(message)
    if (!sensitiveCheck.success) {
      Taro.showToast({
        title: '消息包含敏感词，请修改后重试',
        icon: 'none'
      })
      throw new Error('消息包含敏感词')
    }

    return request('/company/chats/send', {
      method: 'POST',
      data: { studentId, taskId, message }
    })
  }
}

// 支付API
export const paymentAPI = {
  // 获取余额
  getBalance: () => request('/company/balance'),

  // 充值
  recharge: (amount: number) =>
    request('/company/payments/recharge', { method: 'POST', data: { amount } }),

  // 获取支付记录
  getHistory: (params?: { page?: number; limit?: number; status?: string }) =>
    request('/company/payments/history', { method: 'GET', data: params }),

  // 创建支付订单
  createPayment: (taskId: string, paymentType: 'deposit' | 'final', amount: number) =>
    request('/payments/create', { method: 'POST', data: { taskId, paymentType, amount } }),

  // 调用微信支付
  requestWechatPayment: async (paymentData: any) => {
    try {
      await Taro.requestPayment({
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType || 'RSA',
        paySign: paymentData.paySign
      })
      return { success: true }
    } catch (error: any) {
      if (error.errMsg === 'requestPayment:fail cancel') {
        return { success: false, cancelled: true }
      }
      throw error
    }
  },

  // 查询支付状态
  queryPaymentStatus: (orderId: string) =>
    request(`/payments/${orderId}/status`),

  // 申请退款
  requestRefund: (orderId: string, reason: string) =>
    request(`/payments/${orderId}/refund`, { method: 'POST', data: { reason } })
}

// 通知API
export const notificationAPI = {
  // 请求订阅消息权限
  requestSubscribeMessage: async (templateIds: string[]) => {
    try {
      if (process.env.TARO_ENV !== 'weapp') {
        console.log('非微信环境，跳过订阅消息')
        return { success: false }
      }
      const res = await Taro.requestSubscribeMessage({ tmplIds: templateIds })
      return { success: true, data: res }
    } catch (error: any) {
      console.error('请求订阅消息失败:', error)
      return { success: false, error }
    }
  },

  // 获取未读消息数量
  getUnreadCount: () => request('/notifications/unread-count'),

  // 获取消息列表
  getNotifications: (params?: { page?: number; limit?: number; type?: string }) =>
    request('/notifications', { method: 'GET', data: params }),

  // 标记消息为已读
  markAsRead: (notificationIds: number[]) =>
    request('/notifications/mark-read', { method: 'POST', data: { notificationIds } }),

  // 清空所有消息
  clearAll: () => request('/notifications/clear', { method: 'POST' }),

  // 更新TabBar徽标
  updateTabBarBadge: async () => {
    try {
      const result: any = await request('/notifications/unread-count')
      const unreadCount = result?.count || 0
      if (unreadCount > 0) {
        Taro.setTabBarBadge({
          index: 0,
          text: unreadCount > 99 ? '99+' : String(unreadCount)
        })
      } else {
        Taro.removeTabBarBadge({ index: 0 })
      }
    } catch (error) {
      console.error('更新TabBar徽标失败:', error)
    }
  }
}

// 任务草稿箱API
export const draftAPI = {
  // 获取草稿列表
  getList: (params?: { status?: string; page?: number; limit?: number }) =>
    request('/task-drafts', { method: 'GET', data: params }),

  // 获取草稿详情
  getDetail: (draftId: string) => request(`/task-drafts/${draftId}`),

  // 创建草稿
  create: (data: any) => request('/task-drafts', { method: 'POST', data }),

  // 更新草稿
  update: (draftId: string, data: any) =>
    request(`/task-drafts/${draftId}`, { method: 'PUT', data }),

  // 删除草稿
  delete: (draftId: string) => request(`/task-drafts/${draftId}`, { method: 'DELETE' }),

  // 发布草稿
  publish: (draftId: string) =>
    request(`/task-drafts/${draftId}/publish`, { method: 'POST' }),

  // 复制草稿
  duplicate: (draftId: string) =>
    request(`/task-drafts/${draftId}/duplicate`, { method: 'POST' })
}

// AI智能定价API
export const aiPricingAPI = {
  // 获取定价建议
  getSuggestion: (data: {
    title: string
    description: string
    category: string
    difficulty_level: 'easy' | 'medium' | 'hard' | 'expert'
    estimated_hours?: number
    required_skills?: string[]
    deliverables?: string[]
    deadline_days?: number
  }) => request('/ai-pricing/suggest', { method: 'POST', data }),

  // 获取定价历史
  getHistory: (params?: { page?: number; limit?: number }) =>
    request('/ai-pricing/history', { method: 'GET', data: params }),

  // 获取市场基准价
  getMarketBenchmark: (category: string, difficulty: string) =>
    request('/ai-pricing/market-benchmark', { method: 'GET', data: { category, difficulty } })
}

// 评价系统API
export const ratingAPI = {
  // 创建评价
  create: (data: {
    task_id: string
    ratee_id: string
    rating: number
    comment?: string
    tags?: string[]
    is_anonymous?: boolean
  }) => request('/ratings-new', { method: 'POST', data }),

  // 更新评价
  update: (ratingId: string, data: any) =>
    request(`/ratings-new/${ratingId}`, { method: 'PUT', data }),

  // 回复评价
  respond: (ratingId: string, response: string) =>
    request(`/ratings-new/${ratingId}/respond`, { method: 'POST', data: { response } }),

  // 获取任务的评价
  getByTask: (taskId: string) => request(`/ratings-new/task/${taskId}`),

  // 获取用户的评价
  getByUser: (userId: string, params?: { page?: number; limit?: number }) =>
    request(`/ratings-new/user/${userId}`, { method: 'GET', data: params }),

  // 获取用户评价统计
  getUserStats: (userId: string) => request(`/ratings-new/user/${userId}/stats`),

  // 标记有用性
  markHelpful: (ratingId: string, isHelpful: boolean) =>
    request(`/ratings-new/${ratingId}/helpful`, { method: 'POST', data: { is_helpful: isHelpful } }),

  // 举报评价
  report: (ratingId: string, reason: string, description?: string) =>
    request(`/ratings-new/${ratingId}/report`, { method: 'POST', data: { reason, description } }),

  // 获取评价标签
  getTags: () => request('/ratings-new/tags')
}

// 托管提现API
export const escrowAPI = {
  // 获取账户信息
  getAccount: () => request('/escrow/account'),

  // 托管资金
  deposit: (data: { task_id: string; amount: number }) =>
    request('/escrow/deposit', { method: 'POST', data }),

  // 释放资金
  release: (data: { task_id: string }) =>
    request('/escrow/release', { method: 'POST', data }),

  // 退款
  refund: (data: { task_id: string; reason: string }) =>
    request('/escrow/refund', { method: 'POST', data }),

  // 获取交易记录
  getTransactions: (params?: { page?: number; limit?: number; type?: string }) =>
    request('/escrow/transactions', { method: 'GET', data: params }),

  // 申请提现
  requestWithdrawal: (data: { amount: number; account_type: string; account_info: any }) =>
    request('/escrow/withdraw', { method: 'POST', data }),

  // 获取提现记录
  getWithdrawals: (params?: { page?: number; limit?: number; status?: string }) =>
    request('/escrow/withdrawals', { method: 'GET', data: params }),

  // 取消提现
  cancelWithdrawal: (withdrawalId: string) =>
    request(`/escrow/withdrawals/${withdrawalId}/cancel`, { method: 'POST' })
}

// 安全相关API
export const securityAPI = {
  // 获取安全承诺列表
  getCommitments: () => request('/security/commitments', { needAuth: false }),

  // 获取合作进度
  getCollaborationProgress: (studentId: string, companyId: string) =>
    request(`/security/collaboration-progress/${studentId}/${companyId}`),

  // 获取用户所有合作进度
  getMyCollaborations: () => request('/security/my-collaborations'),

  // 获取访问日志
  getAccessLogs: (resourceType: string, resourceId: string, limit?: number) =>
    request(`/security/access-logs/${resourceType}/${resourceId}`, {
      method: 'GET',
      data: { limit }
    }),

  // 获取用户访问历史
  getMyAccessLogs: (limit?: number) =>
    request('/security/my-access-logs', { method: 'GET', data: { limit } }),

  // 申请解锁联系方式
  requestUnlock: (data: { studentId: string; companyId: string; taskId: string }) =>
    request('/security/unlock-contact/request', { method: 'POST', data }),

  // 同意解锁
  approveUnlock: (data: { studentId: string; companyId: string }) =>
    request('/security/unlock-contact/approve', { method: 'POST', data }),

  // 拒绝解锁
  rejectUnlock: (data: { studentId: string; companyId: string }) =>
    request('/security/unlock-contact/reject', { method: 'POST', data }),

  // 获取已解锁的联系方式
  getUnlockedContact: (studentId: string, companyId: string) =>
    request(`/security/unlock-contact/${studentId}/${companyId}`),

  // 获取解锁状态
  getUnlockStatus: (studentId: string, companyId: string) =>
    request(`/security/unlock-status/${studentId}/${companyId}`),

  // 获取我的所有解锁请求
  getMyUnlockRequests: () => request('/security/my-unlock-requests')
}

export default {
  task: taskAPI,
  match: matchAPI,
  auth: authAPI,
  chat: chatAPI,
  payment: paymentAPI,
  notification: notificationAPI,
  draft: draftAPI,
  aiPricing: aiPricingAPI,
  rating: ratingAPI,
  escrow: escrowAPI,
  security: securityAPI
}
