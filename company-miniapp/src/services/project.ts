import Taro from '@tarojs/taro'

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

  if (needAuth) {
    const token = Taro.getStorageSync('accessToken')
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
      Taro.removeStorageSync('accessToken')
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

// ==================== 企业端项目查看API ====================

export const companyProjectAPI = {
  // 获取学生公开项目列表
  getStudentProjects: (params?: {
    domain?: string
    tags?: string[]
    sortBy?: 'latest' | 'popular' | 'recommended'
    page?: number
    limit?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.domain) query.append('domain', params.domain)
    if (params?.tags) params.tags.forEach(tag => query.append('tags', tag))
    if (params?.sortBy) query.append('sortBy', params.sortBy)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/company/student-projects?${query.toString()}`)
  },

  // 获取精选项目列表
  getFeaturedProjects: (params?: {
    domain?: string
    page?: number
    limit?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.domain) query.append('domain', params.domain)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/company/featured-projects?${query.toString()}`)
  },

  // 获取项目详情
  getProjectDetail: (projectId: string) => {
    return request(`/company/projects/${projectId}`)
  },

  // 记录项目浏览
  logProjectView: (projectId: string) => {
    return request(`/company/projects/${projectId}/view`, {
      method: 'POST'
    })
  },

  // 点赞项目
  likeProject: (projectId: string) => {
    return request(`/company/projects/${projectId}/like`, {
      method: 'POST'
    })
  },

  // 取消点赞
  unlikeProject: (projectId: string) => {
    return request(`/company/projects/${projectId}/unlike`, {
      method: 'POST'
    })
  },

  // 收藏项目
  favoriteProject: (projectId: string) => {
    return request(`/company/projects/${projectId}/favorite`, {
      method: 'POST'
    })
  },

  // 取消收藏
  unfavoriteProject: (projectId: string) => {
    return request(`/company/projects/${projectId}/unfavorite`, {
      method: 'POST'
    })
  },

  // 获取我的收藏
  getMyFavorites: (params?: {
    page?: number
    limit?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/company/my-favorites?${query.toString()}`)
  },

  // 联系学生
  contactStudent: (projectId: string, message: string) => {
    return request(`/company/projects/${projectId}/contact`, {
      method: 'POST',
      data: { message }
    })
  },

  // 获取项目推荐
  getRecommendations: (params?: {
    limit?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.limit) query.append('limit', params.limit.toString())

    return request(`/company/project-recommendations?${query.toString()}`)
  }
}

export default companyProjectAPI
