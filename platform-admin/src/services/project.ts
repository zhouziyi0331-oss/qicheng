// API服务层 - 平台管理端项目管理
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  token?: string
}

// 通用请求方法
async function request(url: string, options: RequestOptions = {}) {
  const { method = 'GET', data, token } = options

  const headers: any = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    })

    if (response.ok) {
      return await response.json()
    } else if (response.status === 401) {
      // 处理未授权
      window.location.href = '/login'
      throw new Error('请先登录')
    } else {
      const error = await response.json()
      throw new Error(error.message || '请求失败')
    }
  } catch (error: any) {
    console.error('Request error:', error)
    throw error
  }
}

// ==================== 平台管理端项目API ====================

export const adminProjectAPI = {
  // 获取待审核项目列表
  getPendingProjects: (params?: {
    domain?: string
    page?: number
    limit?: number
  }, token?: string) => {
    const query = new URLSearchParams()
    if (params?.domain) query.append('domain', params.domain)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/admin/projects/pending?${query.toString()}`, { token })
  },

  // 获取已审核项目列表
  getReviewedProjects: (params?: {
    status?: 'approved' | 'rejected'
    domain?: string
    page?: number
    limit?: number
  }, token?: string) => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.domain) query.append('domain', params.domain)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/admin/projects/reviewed?${query.toString()}`, { token })
  },

  // 审核项目
  reviewProject: (projectId: string, data: {
    status: 'approved' | 'rejected'
    reviewNotes?: string
    isFeatured?: boolean
  }, token?: string) => {
    return request(`/admin/projects/${projectId}/review`, {
      method: 'POST',
      data,
      token
    })
  },

  // 获取精选项目列表
  getFeaturedProjects: (params?: {
    domain?: string
    page?: number
    limit?: number
  }, token?: string) => {
    const query = new URLSearchParams()
    if (params?.domain) query.append('domain', params.domain)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/admin/projects/featured?${query.toString()}`, { token })
  },

  // 设置精选项目
  setFeatured: (projectId: string, data: {
    isFeatured: boolean
    featuredReason?: string
  }, token?: string) => {
    return request(`/admin/projects/${projectId}/featured`, {
      method: 'POST',
      data,
      token
    })
  },

  // 推荐项目给企业
  recommendToCompany: (projectId: string, data: {
    companyId: string
    recommendationText: string
  }, token?: string) => {
    return request(`/admin/projects/${projectId}/recommend`, {
      method: 'POST',
      data,
      token
    })
  },

  // 获取项目详情
  getProjectDetail: (projectId: string, token?: string) => {
    return request(`/admin/projects/${projectId}`, { token })
  },

  // 获取项目统计
  getProjectStats: (params?: {
    startDate?: string
    endDate?: string
    domain?: string
  }, token?: string) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.append('startDate', params.startDate)
    if (params?.endDate) query.append('endDate', params.endDate)
    if (params?.domain) query.append('domain', params.domain)

    return request(`/admin/projects/stats?${query.toString()}`, { token })
  },

  // 获取推荐记录
  getRecommendations: (params?: {
    projectId?: string
    companyId?: string
    page?: number
    limit?: number
  }, token?: string) => {
    const query = new URLSearchParams()
    if (params?.projectId) query.append('projectId', params.projectId)
    if (params?.companyId) query.append('companyId', params.companyId)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/admin/recommendations?${query.toString()}`, { token })
  },

  // 获取企业列表（用于推荐）
  getCompanies: (params?: {
    search?: string
    page?: number
    limit?: number
  }, token?: string) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/admin/companies?${query.toString()}`, { token })
  }
}

export default adminProjectAPI
