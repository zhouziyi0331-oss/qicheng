import Taro from '@tarojs/taro'

const BASE_URL = '/api/v1'

// 获取token
const getToken = () => {
  return Taro.getStorageSync('token')
}

// 通用请求方法
const request = async (options: {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}) => {
  const { url, method, data, needAuth = true } = options

  const header: any = {
    'Content-Type': 'application/json'
  }

  if (needAuth) {
    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }

  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header
    })

    if (res.statusCode === 200) {
      return res.data
    } else {
      throw new Error(res.data.message || '请求失败')
    }
  } catch (error: any) {
    console.error('API请求失败:', error)
    throw error
  }
}

/**
 * E-01a: 任务模板市场
 */
export const taskTemplateApi = {
  // 获取模板列表
  getTemplates: (category?: string) => {
    const url = category
      ? `/task-experience/templates?category=${encodeURIComponent(category)}`
      : '/task-experience/templates'
    return request({ url, method: 'GET', needAuth: false })
  },

  // 获取模板详情
  getTemplateById: (templateId: string) => {
    return request({
      url: `/task-experience/templates/${templateId}`,
      method: 'GET',
      needAuth: false
    })
  },

  // 使用模板创建草稿
  createDraftFromTemplate: (templateId: string, customData?: any) => {
    return request({
      url: `/task-experience/templates/${templateId}/use`,
      method: 'POST',
      data: customData
    })
  },

  // 获取分类列表
  getCategories: () => {
    return request({
      url: '/task-experience/templates/categories/list',
      method: 'GET',
      needAuth: false
    })
  },

  // 搜索模板
  searchTemplates: (keyword: string) => {
    return request({
      url: `/task-experience/templates/search?keyword=${encodeURIComponent(keyword)}`,
      method: 'GET',
      needAuth: false
    })
  }
}

/**
 * E-01b: 预算智能建议
 */
export const budgetSuggestionApi = {
  // 获取预算建议
  getSuggestion: (params: {
    task_category: string
    task_description?: string
    required_skills?: string[]
    quality_expectation?: 'basic' | 'standard' | 'premium'
  }) => {
    return request({
      url: '/task-experience/budget-suggestion',
      method: 'POST',
      data: params
    })
  }
}

/**
 * E-01d: 任务草稿箱
 */
export const taskDraftApi = {
  // 保存草稿
  saveDraft: (data: any) => {
    return request({
      url: '/task-experience/drafts',
      method: 'POST',
      data
    })
  },

  // 更新草稿
  updateDraft: (draftId: string, data: any) => {
    return request({
      url: `/task-experience/drafts/${draftId}`,
      method: 'PUT',
      data
    })
  },

  // 获取草稿列表
  getDrafts: () => {
    return request({
      url: '/task-experience/drafts',
      method: 'GET'
    })
  },

  // 删除草稿
  deleteDraft: (draftId: string) => {
    return request({
      url: `/task-experience/drafts/${draftId}`,
      method: 'DELETE'
    })
  }
}

/**
 * E-05a: 试稿机制
 */
export const trialInvitationApi = {
  // 创建试稿邀请
  create: (data: {
    task_id: string
    student_id: string
    trial_requirement: string
    trial_deadline: string
    trial_budget?: number
  }) => {
    return request({
      url: '/matching-enhancement/trial-invitations',
      method: 'POST',
      data
    })
  },

  // 获取试稿邀请列表
  getList: (status?: string) => {
    const url = status
      ? `/matching-enhancement/trial-invitations?status=${status}`
      : '/matching-enhancement/trial-invitations'
    return request({ url, method: 'GET' })
  },

  // 学生响应试稿邀请
  respond: (invitationId: string, accepted: boolean, response?: string) => {
    return request({
      url: `/matching-enhancement/trial-invitations/${invitationId}/respond`,
      method: 'POST',
      data: { accepted, response }
    })
  },

  // 学生提交试稿
  submit: (invitationId: string, submission: string, files?: any[]) => {
    return request({
      url: `/matching-enhancement/trial-invitations/${invitationId}/submit`,
      method: 'POST',
      data: { submission, files }
    })
  },

  // 企业评估试稿
  evaluate: (invitationId: string, evaluation: string, score: number, approved: boolean) => {
    return request({
      url: `/matching-enhancement/trial-invitations/${invitationId}/evaluate`,
      method: 'POST',
      data: { evaluation, score, approved }
    })
  }
}

/**
 * E-05b: 学生对比视图
 */
export const studentComparisonApi = {
  // 对比多个学生
  compare: (studentIds: string[], taskId?: string) => {
    return request({
      url: '/matching-enhancement/compare-students',
      method: 'POST',
      data: { student_ids: studentIds, task_id: taskId }
    })
  }
}

/**
 * E-05c: 手动搜索筛选
 */
export const studentSearchApi = {
  // 搜索学生
  search: (filters: any, taskId?: string) => {
    return request({
      url: '/matching-enhancement/search-students',
      method: 'POST',
      data: { filters, task_id: taskId }
    })
  }
}

/**
 * E-29: 逐项验收清单
 */
export const acceptanceChecklistApi = {
  // 创建验收清单
  create: (taskId: string, items: any[]) => {
    return request({
      url: `/acceptance/tasks/${taskId}/checklist`,
      method: 'POST',
      data: { items }
    })
  },

  // 更新清单项
  updateItem: (checklistId: string, itemId: number, status: string) => {
    return request({
      url: `/acceptance/checklists/${checklistId}/items/${itemId}`,
      method: 'PUT',
      data: { status }
    })
  },

  // 获取验收清单
  get: (taskId: string) => {
    return request({
      url: `/acceptance/tasks/${taskId}/checklist`,
      method: 'GET'
    })
  }
}

/**
 * E-30: 修改意见模板化
 */
export const revisionTemplateApi = {
  // 获取模板列表
  getList: (category?: string) => {
    const url = category
      ? `/acceptance/revision-templates?category=${category}`
      : '/acceptance/revision-templates'
    return request({ url, method: 'GET' })
  },

  // 使用模板生成修改意见
  apply: (templateId: string, placeholderValues: any) => {
    return request({
      url: `/acceptance/revision-templates/${templateId}/apply`,
      method: 'POST',
      data: { placeholder_values: placeholderValues }
    })
  }
}

/**
 * E-31: 维度化验收评分
 */
export const dimensionalScoreApi = {
  // 创建评分
  create: (taskId: string, data: any) => {
    return request({
      url: `/acceptance/tasks/${taskId}/dimensional-score`,
      method: 'POST',
      data
    })
  },

  // 获取评分
  get: (taskId: string) => {
    return request({
      url: `/acceptance/tasks/${taskId}/dimensional-score`,
      method: 'GET'
    })
  }
}

export default {
  taskTemplateApi,
  budgetSuggestionApi,
  taskDraftApi,
  trialInvitationApi,
  studentComparisonApi,
  studentSearchApi,
  acceptanceChecklistApi,
  revisionTemplateApi,
  dimensionalScoreApi
}
