import Taro from '@tarojs/taro'
import { Task, StudentMatch, TaskTrack, TaskLevel } from '../types/task'

const BASE_URL = 'http://localhost:3000/api/v1'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}

// 通用请求方法
async function request(url: string, options: RequestOptions = {}) {
  const { method = 'GET', data, needAuth = true } = options

  const header: any = {
    'Content-Type': 'application/json'
  }

  // 添加认证token
  if (needAuth) {
    const token = Taro.getStorageSync('token')
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      timeout: 60000
    })

    if (response.statusCode === 200) {
      return response.data
    } else if (response.statusCode === 401) {
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('user')
      Taro.redirectTo({ url: '/pages/login/index' })
      throw new Error('请先登录')
    } else {
      throw new Error(response.data?.message || '请求失败')
    }
  } catch (error: any) {
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
  register: (data: { phone: string; code: string; companyName: string }) =>
    request('/auth/register', { method: 'POST', data: { ...data, role: 'company' }, needAuth: false }),

  // 登录
  login: (data: { phone: string; code: string }) =>
    request('/auth/login', { method: 'POST', data, needAuth: false }),

  // 发送验证码
  sendCode: (phone: string) =>
    request('/auth/send-code', { method: 'POST', data: { phone }, needAuth: false }),

  // 获取当前企业信息
  getCurrentUser: () => request('/auth/me')
}

// 聊天API
export const chatAPI = {
  // 获取聊天列表
  getChatList: () => request('/company/chats'),

  // 获取与学生的聊天记录
  getChatHistory: (studentId: string, taskId?: string) =>
    request(`/company/chats/${studentId}`, { method: 'GET', data: { taskId } }),

  // 发送消息
  sendMessage: (studentId: string, taskId: string, message: string) =>
    request('/company/chats/send', { method: 'POST', data: { studentId, taskId, message } })
}

// 支付API
export const paymentAPI = {
  // 获取余额
  getBalance: () => request('/company/balance'),

  // 充值
  recharge: (amount: number) =>
    request('/company/payments/recharge', { method: 'POST', data: { amount } }),

  // 获取支付记录
  getHistory: () => request('/company/payments/history')
}

export default {
  task: taskAPI,
  match: matchAPI,
  auth: authAPI,
  chat: chatAPI,
  payment: paymentAPI
}
