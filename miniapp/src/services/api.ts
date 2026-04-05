import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_APP_API_URL || 'http://localhost:3001/api/v1'

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
      header
    })

    if (response.statusCode === 200) {
      return response.data
    } else if (response.statusCode === 401) {
      // Token过期，跳转登录
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

// 用户相关API
export const authAPI = {
  // 注册
  register: (data: { phone: string; code: string; role: 'student' | 'company' }) =>
    request('/auth/register', { method: 'POST', data, needAuth: false }),

  // 登录
  login: (data: { phone: string; code: string }) =>
    request('/auth/login', { method: 'POST', data, needAuth: false }),

  // 发送验证码
  sendCode: (phone: string) =>
    request('/auth/send-code', { method: 'POST', data: { phone }, needAuth: false }),

  // 获取当前用户信息
  getCurrentUser: () => request('/auth/me')
}

// OPC测评API
export const testAPI = {
  // 获取测评题目
  getQuestions: () => request('/student/test/questions'),

  // 提交测评答案
  submitTest: (answers: number[]) =>
    request('/student/test/submit', { method: 'POST', data: { answers } }),

  // 获取测评结果
  getResult: () => request('/student/test/result')
}

// 任务相关API
export const taskAPI = {
  // 获取智能匹配任务（基于OPC标签、情绪状态、历史任务）
  getMatched: () => request('/tasks/matched'),

  // 获取智能推荐任务（基于OPC标签和情绪状态）
  getRecommended: () => request('/tasks/recommended'),

  // 获取任务列表
  getList: (params?: { status?: string; track?: string; page?: number; limit?: number }) =>
    request('/tasks', { method: 'GET', data: params }),

  // 获取任务详情
  getDetail: (id: string) => request(`/tasks/${id}`),

  // 接取任务（返回任务步骤拆解）
  accept: (id: string) =>
    request(`/tasks/${id}/accept`, { method: 'POST' }),

  // 接取任务（别名）
  acceptTask: (id: string) =>
    request(`/tasks/${id}/accept`, { method: 'POST' }),

  // 获取任务步骤拆解
  getTaskSteps: (id: string) => request(`/tasks/${id}/steps`),

  // 提交任务
  submitTask: (id: string, data: { description: string; images?: string[]; links?: string[] }) =>
    request(`/tasks/${id}/submit`, { method: 'POST', data }),

  // 获取我的任务
  getMyTasks: (status?: string) =>
    request('/tasks/my', { method: 'GET', data: { status } }),

  // 更新任务进度
  updateProgress: (id: string, stepIndex: number) =>
    request(`/tasks/${id}/progress`, { method: 'POST', data: { stepIndex } })
}

// AI导师API
export const mentorAPI = {
  // 发送消息（真实AI对话）
  sendMessage: (data: {
    taskId?: string;
    message: string;
    context?: 'task' | 'working' | 'stuck' | 'rejected' | 'milestone';
    emotionState?: any;
    conversationHistory?: Array<{ role: string; content: string }>;
  }) =>
    request('/mentor/chat', { method: 'POST', data }),

  // 获取对话历史
  getHistory: (taskId: string) => request(`/mentor/${taskId}/history`),

  // 获取第一步引导（接单后3秒推送）
  getFirstStep: (taskId: string) => request(`/mentor/${taskId}/first-step`),

  // 学生说"我卡住了"
  reportStuck: (taskId: string, stuckPoint: string) =>
    request(`/mentor/${taskId}/stuck`, { method: 'POST', data: { stuckPoint } }),

  // 任务被打回时的引导
  getRejectionGuidance: (taskId: string, rejectionReason: string) =>
    request(`/mentor/${taskId}/rejection-guidance`, { method: 'POST', data: { rejectionReason } }),

  // 完成里程碑时的见证
  celebrateMilestone: (taskId: string, milestone: string) =>
    request(`/mentor/${taskId}/milestone`, { method: 'POST', data: { milestone } })
}

// 能力相关API
export const abilityAPI = {
  // 获取六维雷达图数据（动态更新）
  getRadar: () => request('/ability/radar'),

  // 获取成长时间线
  getTimeline: () => request('/ability/timeline'),

  // 获取情绪状态（excited/calm/frustrated/cooling）
  getEmotionState: () => request('/ability/emotion-state'),

  // 任务完成后更新六维能力
  updateAfterTask: (taskId: string) =>
    request('/ability/update-after-task', { method: 'POST', data: { taskId } })
}

// 故事墙API
export const storyAPI = {
  // 获取故事列表
  getFeed: (page = 1) => request(`/story/feed?page=${page}`),

  // 发布故事
  post: (data: { content: string; images?: string[] }) =>
    request('/story/post', { method: 'POST', data }),

  // 点赞
  like: (id: string) => request(`/story/${id}/like`, { method: 'POST' }),

  // 评论
  comment: (id: string, content: string) =>
    request(`/story/${id}/comment`, { method: 'POST', data: { content } })
}

// OPC报告API
export const reportAPI = {
  // 获取报告列表
  getList: () => request('/reports'),

  // 购买报告
  order: () => request('/reports/order', { method: 'POST' }),

  // 获取报告详情
  getDetail: (id: string) => request(`/reports/${id}`)
}

// 提现API
export const withdrawAPI = {
  // 获取余额
  getBalance: () => request('/student/balance'),

  // 申请提现
  apply: (amount: number) =>
    request('/payments/withdraw', { method: 'POST', data: { amount } }),

  // 获取提现记录
  getHistory: () => request('/payments/withdraw/history')
}

// 成长时间线API
export const getGrowthTimeline = () => request('/student/timeline')

// 等级系统API
export const levelAPI = {
  // 获取当前等级信息
  getCurrentLevel: () => request('/student/level'),

  // 获取升级所需经验
  getNextLevelExp: () => request('/student/level/next'),

  // 检查是否可以升级
  checkLevelUp: () => request('/student/level/check')
}

export default {
  auth: authAPI,
  test: testAPI,
  task: taskAPI,
  mentor: mentorAPI,
  ability: abilityAPI,
  story: storyAPI,
  report: reportAPI,
  withdraw: withdrawAPI,
  level: levelAPI
}
