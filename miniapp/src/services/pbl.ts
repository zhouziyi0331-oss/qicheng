import Taro from '@tarojs/taro'
import { getApiUrl } from '../config'

const BASE_URL = getApiUrl('/api/v1')

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

  if (needAuth) {
    // 使用tokenManager统一管理
    const token = tokenManager.getAccessToken()
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
      // Token过期，使用tokenManager清除
      await tokenManager.clearTokens()
      Taro.redirectTo({ url: '/pages/login/index' })
      throw new Error('请先登录')
    } else {
      throw new Error(response.data?.message || '请求失败')
    }
  } catch (error: any) {
    console.error('Request error:', error)
    throw error
  }
}

// ==================== PBL项目API ====================

export const pblAPI = {
  // 统一对话接口（情感 + 项目融合）
  chat: (message: string, options?: {
    sessionId?: string
    taskId?: string
    projectId?: string
    forceMode?: 'emotional' | 'project'
  }) => {
    return request('/mentor/chat', {
      method: 'POST',
      data: { message, ...options }
    })
  },

  // 初始化新项目
  initProject: (data: {
    initialProblem: string
    title?: string
    domain?: string
    learningGoals?: string[]
  }) => {
    return request('/mentor/projects/init', {
      method: 'POST',
      data
    })
  },

  // 获取我的项目列表
  getMyProjects: (status?: string) => {
    const query = status ? `?status=${status}` : ''
    return request(`/mentor/projects${query}`)
  },

  // 获取项目详情
  getProjectDetail: (projectId: string) => {
    return request(`/mentor/projects/${projectId}`)
  },

  // 任务拆解引导
  guideDecomposition: (projectId: string, taskDescription: string) => {
    return request(`/mentor/projects/${projectId}/decompose`, {
      method: 'POST',
      data: { taskDescription }
    })
  },

  // 评估任务拆解
  evaluateDecomposition: (projectId: string, tasks: Array<{
    title: string
    description: string
  }>) => {
    return request(`/mentor/projects/${projectId}/evaluate-decomposition`, {
      method: 'POST',
      data: { tasks }
    })
  },

  // 执行代码
  executeCode: (projectId: string, data: {
    language: string
    code: string
    timeout?: number
  }) => {
    return request(`/mentor/projects/${projectId}/execute-code`, {
      method: 'POST',
      data
    })
  },

  // 获取代码执行历史
  getExecutionHistory: (projectId: string, limit: number = 10) => {
    return request(`/mentor/projects/${projectId}/execution-history?limit=${limit}`)
  },

  // 上传文件
  uploadFile: async (projectId: string, filePath: string, options?: {
    purpose?: string
    aiAnalyze?: boolean
  }) => {
    const token = Taro.getStorageSync('accessToken')

    return Taro.uploadFile({
      url: `${BASE_URL}/mentor/projects/${projectId}/upload`,
      filePath,
      name: 'file',
      formData: {
        purpose: options?.purpose || 'input',
        aiAnalyze: options?.aiAnalyze !== false ? 'true' : 'false'
      },
      header: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  // 获取项目文件列表
  getProjectFiles: (projectId: string, fileType?: string) => {
    const query = fileType ? `?fileType=${fileType}` : ''
    return request(`/mentor/projects/${projectId}/files${query}`)
  },

  // 删除文件
  deleteFile: (fileId: string) => {
    return request(`/mentor/files/${fileId}`, {
      method: 'DELETE'
    })
  },

  // 引导反思
  guideReflection: (projectId: string, reflectionType: string) => {
    return request(`/mentor/projects/${projectId}/reflect`, {
      method: 'POST',
      data: { reflectionType }
    })
  },

  // 保存反思日志
  saveReflectionLog: (projectId: string, data: {
    reflectionType: string
    whatLearned?: string
    whatWorked?: string
    whatDidntWork?: string
    whatSurprised?: string
    nextSteps?: string
    emotionalState?: string
  }) => {
    return request(`/mentor/projects/${projectId}/reflection-log`, {
      method: 'POST',
      data
    })
  },

  // 切换导师模式
  switchMode: (mode: 'emotional' | 'project' | 'auto') => {
    return request('/mentor/switch-mode', {
      method: 'POST',
      data: { mode }
    })
  },

  // 获取导师使用统计
  getStats: () => {
    return request('/mentor/stats')
  },

  // 公开项目
  publishProject: (projectId: string, data: {
    isPublic: boolean
    showcaseUrl?: string
  }) => {
    return request(`/student/projects/${projectId}/publish`, {
      method: 'POST',
      data
    })
  },

  // 查看项目统计
  getProjectStats: (projectId: string) => {
    return request(`/student/projects/${projectId}/stats`)
  }
}

export default pblAPI
