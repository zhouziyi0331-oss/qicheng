import Taro from '@tarojs/taro'
import { getApiUrl } from '../config'
import { tokenManager } from '../utils/token'

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

  // 添加认证token - 使用tokenManager统一管理
  if (needAuth) {
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
      timeout: 60000 // 设置60秒超时，AI回复需要较长时间
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
  register: (data: { phone: string; code: string; password: string; role: 'student' | 'company'; userType: 'student' | 'company' }) =>
    request('/auth/register', { method: 'POST', data, needAuth: false }),

  // 登录
  login: (data: { phone: string; password?: string; code?: string }) =>
    request('/auth/login', { method: 'POST', data, needAuth: false }),

  // 发送验证码
  sendCode: (phone: string) =>
    request('/auth/send-code', { method: 'POST', data: { phone }, needAuth: false }),

  // 获取当前用户信息
  getCurrentUser: () => request('/auth/me'),

  // 更新用户资料
  updateProfile: (data: { nickname?: string; avatar?: string; bio?: string }) =>
    request('/auth/profile', { method: 'PUT', data }),

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request('/auth/change-password', { method: 'POST', data }),

  // 更新用户设置
  updateSettings: (data: { soundEnabled?: boolean; vibrationEnabled?: boolean; autoSave?: boolean; pushEnabled?: boolean }) =>
    request('/auth/settings', { method: 'PUT', data }),

  // 获取用户设置
  getSettings: () => request('/auth/settings'),

  // 提交意见反馈
  submitFeedback: (data: { type: string; content: string; contact?: string }) =>
    request('/feedback', { method: 'POST', data })
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

  // 获取任务列表 - 使用市场端点
  getList: (params?: { status?: string; track?: string; page?: number; limit?: number }) =>
    request('/tasks/market', { method: 'GET', data: params }),

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

  // 获取任务邀请列表
  getInvitations: () =>
    request('/tasks/flow/invitations'),

  // 接受任务邀请
  acceptInvitation: (taskId: string) =>
    request(`/tasks/flow/${taskId}/accept`, { method: 'POST' }),

  // 拒绝任务邀请
  rejectInvitation: (taskId: string, reason?: string) =>
    request(`/tasks/flow/${taskId}/reject`, { method: 'POST', data: { reason } }),

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

  // 获取成长对比数据（入驻时 vs 当前）
  getGrowthComparison: () => request('/ability/growth-comparison'),

  // 获取成长仪表盘数据
  getGrowthDashboard: () => request('/ability/growth-dashboard'),

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
  order: (data: { reportType: string; paymentMethod?: string }) =>
    request('/reports/order', { method: 'POST', data }),

  // 获取报告详情
  getDetail: (id: string) => request(`/reports/${id}`),

  // 下载PDF
  downloadPDF: (id: string) => {
    const token = Taro.getStorageSync('token')
    return Taro.downloadFile({
      url: `${BASE_URL}/reports/${id}/pdf`,
      header: {
        Authorization: `Bearer ${token}`
      }
    })
  }
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
  checkLevelUp: () => request('/student/level/check'),

  // 获取用户等级信息（新OPC系统）
  getUserLevel: (userId: string) => request(`/level/${userId}`),

  // 检查升级条件（新OPC系统）
  checkUpgrade: (userId: string) => request(`/level/check-upgrade/${userId}`),

  // 执行升级（新OPC系统）
  upgrade: (userId: string) => request('/level/upgrade', { method: 'POST', data: { userId } }),

  // 申请跳级挑战
  applyChallenge: (userId: string, taskId: string) =>
    request('/level/challenge', { method: 'POST', data: { userId, taskId } }),

  // 完成跳级挑战
  completeChallenge: (challengeId: string, success: boolean) =>
    request('/level/challenge/complete', { method: 'POST', data: { challengeId, success } })
}

// 跳级系统API（新）
export const jumpLevelAPI = {
  // 检查跳级资格
  checkEligibility: () => request('/students/jump-eligibility'),

  // 申请跳级测试
  applyJumpTest: () => request('/students/jump-test/apply', { method: 'POST' }),

  // 获取跳级测试记录
  getJumpTestRecords: () => request('/students/jump-test/records'),

  // 提交跳级测试交付物
  submitJumpTest: (recordId: string, data: { description: string; images?: string[]; links?: string[] }) =>
    request(`/students/jump-test/${recordId}/submit`, { method: 'POST', data })
}

// 组队系统API（新）
export const teamAPI = {
  // 创建队伍
  createTeam: (data: { name: string; track: string; description: string; maxMembers: number; requiredSkills?: string[] }) =>
    request('/teams', { method: 'POST', data }),

  // 获取我的队伍列表
  getMyTeams: () => request('/teams/my'),

  // 获取队伍详情
  getTeamDetail: (teamId: string) => request(`/teams/${teamId}`),

  // 申请加入队伍
  applyToJoin: (teamId: string, message?: string) =>
    request(`/teams/${teamId}/apply`, { method: 'POST', data: { message } }),

  // 审核加入申请（队长）
  reviewApplication: (teamId: string, applicationId: string, action: 'approve' | 'reject') =>
    request(`/teams/${teamId}/applications/${applicationId}`, { method: 'PUT', data: { action } }),

  // 邀请成员
  inviteMember: (teamId: string, userId: string) =>
    request(`/teams/${teamId}/invite`, { method: 'POST', data: { userId } }),

  // 离开队伍
  leaveTeam: (teamId: string) =>
    request(`/teams/${teamId}/leave`, { method: 'POST' }),

  // 解散队伍（队长）
  disbandTeam: (teamId: string) =>
    request(`/teams/${teamId}`, { method: 'DELETE' })
}

// 社区板块API（新）
export const communityAPI = {
  // 获取社区帖子列表
  getPosts: (params?: { type?: string; track?: string; page?: number; limit?: number }) =>
    request('/community/posts', { method: 'GET', data: params }),

  // 发布帖子
  createPost: (data: { type: string; title: string; content: string; requiredSkills?: string[]; track?: string; vacancyCount?: number }) =>
    request('/community/posts', { method: 'POST', data }),

  // 获取帖子详情
  getPostDetail: (postId: string) => request(`/community/posts/${postId}`),

  // 申请加入招募帖
  applyToPost: (postId: string, message?: string) =>
    request(`/community/posts/${postId}/apply`, { method: 'POST', data: { message } }),

  // 点赞帖子
  likePost: (postId: string) =>
    request(`/community/posts/${postId}/like`, { method: 'POST' }),

  // 评论帖子
  commentPost: (postId: string, content: string) =>
    request(`/community/posts/${postId}/comments`, { method: 'POST', data: { content } })
}

// OPC测试系统API（新36题系统）
export const opcAPI = {
  // 提交OPC测试结果
  submitTest: (userId: string, answers: Array<{ questionId: number; answer: string; score: number }>) =>
    request('/opc/submit', { method: 'POST', data: { userId, answers } }),

  // 获取用户OPC测试结果
  getResult: (userId: string) => request(`/opc/result/${userId}`),

  // 生成OPC成长报告
  generateReport: (userId: string) => request(`/opc/report/${userId}`)
}

// OPC v2.0 能力画像测试 API
export const opcV2API = {
  // 开始测试
  startAssessment: () =>
    request('/opc-v2/start', { method: 'POST' }),

  // 提交答案（前置题或选择题）
  submitAnswer: (assessmentId: string, data: {
    questionId: string;
    answerType: 'definition' | 'choice';
    answerText?: string;
    selectedOption?: string;
  }) =>
    request('/opc-v2/answer', { method: 'POST', data: { assessmentId, ...data } }),

  // 完成测试
  completeAssessment: (assessmentId: string) =>
    request(`/opc-v2/${assessmentId}/complete`, { method: 'POST' }),

  // 获取测试进度
  getProgress: (assessmentId: string) =>
    request(`/opc-v2/${assessmentId}/progress`),

  // 获取测试结果
  getResult: (assessmentId: string) =>
    request(`/opc-v2/${assessmentId}/result`),

  // 获取最新测试结果
  getLatestResult: () =>
    request('/opc-v2/latest'),

  // Phase 2.1: 生成身份卡片
  generateIdentityCard: (options?: { theme?: string; includeStats?: boolean }) =>
    request('/opc/identity-cards', { method: 'POST', data: options }),

  // 获取身份卡片列表
  getIdentityCards: (limit?: number) =>
    request(`/opc/identity-cards?limit=${limit || 10}`),

  // 获取单个身份卡片详情
  getIdentityCardById: (cardId: string) =>
    request(`/opc/identity-cards/${cardId}`, { needAuth: false }),

  // 删除身份卡片
  deleteIdentityCard: (cardId: string) =>
    request(`/opc/identity-cards/${cardId}`, { method: 'DELETE' })
}

// Phase 2.2: 资产仪表盘API
export const assetDashboardAPI = {
  // 获取资产仪表盘
  getDashboard: () =>
    request('/asset-dashboard'),

  // 获取能力价值详情
  getAbilityDetail: (abilityName: string) =>
    request(`/asset-dashboard/ability/${encodeURIComponent(abilityName)}`),

  // 获取市场价值对比
  getMarketComparison: () =>
    request('/asset-dashboard/market-comparison')
}

// Phase 2.3: 成长对比API
export const growthComparisonAPI = {
  // 获取成长对比数据
  getComparison: () =>
    request('/growth-comparison')
}

// Phase 2.4: 真实案例库API
export const caseLibraryAPI = {
  // 搜索案例
  searchCases: (params: {
    caseType?: 'stuck' | 'breakthrough' | 'success'
    category?: string
    difficulty?: number
    tags?: string[]
    search?: string
    limit?: number
    offset?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params.caseType) queryParams.append('caseType', params.caseType)
    if (params.category) queryParams.append('category', params.category)
    if (params.difficulty) queryParams.append('difficulty', params.difficulty.toString())
    if (params.tags) params.tags.forEach(tag => queryParams.append('tags[]', tag))
    if (params.search) queryParams.append('search', params.search)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())

    return request(`/case-library/search?${queryParams.toString()}`)
  },

  // 获取案例详情
  getCaseById: (caseId: string) =>
    request(`/case-library/cases/${caseId}`),

  // 标记案例为有帮助
  markCaseHelpful: (caseId: string) =>
    request(`/case-library/cases/${caseId}/helpful`, { method: 'POST' }),

  // 获取案例统计
  getStats: () =>
    request('/case-library/stats')
}

// Phase 3.1: 引路人机制API
export const mentorRelationshipAPI = {
  // 检查引路人资格
  checkQualification: () =>
    request('/mentor-relationship/qualification/check'),

  // 申请成为引路人
  applyToBeMentor: (data: {
    bio?: string
    maxMentees?: number
    specialties?: string[]
  }) =>
    request('/mentor-relationship/apply', { method: 'POST', data: {
      applicationReason: data.bio || '希望帮助更多学弟学妹成长',
      experienceSummary: data.bio,
      specialties: data.specialties
    } }),

  // 匹配引路人
  findMentors: () =>
    request('/mentor-relationship/match'),

  // 建立引路人关系
  connectWithMentor: (data: {
    mentorStudentId: string
    matchedReason?: string
  }) =>
    request('/mentor-relationship/connect', { method: 'POST', data }),

  // 记录互动
  recordInteraction: (data: {
    relationshipId: string
    interactionType: 'message' | 'advice' | 'encouragement' | 'resource_share'
    content: string
    menteeStudentId: string
    context?: any
  }) =>
    request('/mentor-relationship/interaction', { method: 'POST', data })
}

// Phase 3.2: OPC故事墙API
export const opcStoryAPI = {
  // 创建故事
  createStory: (data: {
    title: string
    storyContent: string
    storyType: 'discovery' | 'breakthrough' | 'acceptance' | 'growth'
    emotionTags?: string[]
    lifeQuestion?: string
    beforeState?: string
    afterState?: string
    keyMoment?: string
    reflection?: string
  }) =>
    request('/opc-stories', { method: 'POST', data }),

  // 搜索故事
  searchStories: (params: {
    personalityType?: string
    storyType?: 'discovery' | 'breakthrough' | 'acceptance' | 'growth'
    emotionTags?: string[]
    featured?: boolean
    search?: string
    limit?: number
    offset?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params.personalityType) queryParams.append('personalityType', params.personalityType)
    if (params.storyType) queryParams.append('storyType', params.storyType)
    if (params.emotionTags) params.emotionTags.forEach(tag => queryParams.append('emotionTags[]', tag))
    if (params.featured !== undefined) queryParams.append('featured', params.featured.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())

    return request(`/opc-stories/search?${queryParams.toString()}`)
  },

  // 获取故事详情
  getStoryById: (storyId: string) =>
    request(`/opc-stories/${storyId}`),

  // 点赞故事
  likeStory: (storyId: string) =>
    request(`/opc-stories/${storyId}/like`, { method: 'POST' }),

  // 标记共鸣
  markResonance: (storyId: string, data: {
    resonanceType: 'similar_experience' | 'same_feeling' | 'inspired'
    note?: string
  }) =>
    request(`/opc-stories/${storyId}/resonate`, { method: 'POST', data }),

  // 获取故事统计
  getStats: () =>
    request('/opc-stories-stats'),

  // 推荐相似故事
  getSimilarStories: (storyId: string, limit?: number) =>
    request(`/opc-stories/${storyId}/similar${limit ? `?limit=${limit}` : ''}`),

  // 获取公共故事列表（用于故事墙展示）
  getPublicStories: (params?: {
    limit?: number
    offset?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    return request(`/opc-stories/public${queryParams.toString() ? '?' + queryParams.toString() : ''}`, { needAuth: false })
  },

  // 获取故事详情（公共访问）
  getStoryDetail: (storyId: string) =>
    request(`/opc-stories/public/${storyId}`, { needAuth: false }),

  // 获取故事统计数据
  getStoryStats: () =>
    request('/opc-stories/public/stats', { needAuth: false }),

  // 切换点赞状态
  toggleLike: (storyId: string) =>
    request(`/opc-stories/${storyId}/like`, { method: 'POST' })
}

// Phase 3.3: 企业-学生端打通API
export const companyStudentBridgeAPI = {
  // 学生获取自己的声誉标签
  getMyReputationTags: () =>
    request('/company-student-bridge/my-reputation'),

  // 学生获取自己的成长里程碑
  getMyMilestones: (params?: {
    milestoneType?: string
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.milestoneType) queryParams.append('milestoneType', params.milestoneType)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    return request(`/company-student-bridge/my-milestones${queryParams.toString() ? '?' + queryParams.toString() : ''}`)
  },

  // 企业订阅学生成长（企业端）
  subscribeToStudent: (data: {
    studentId: string
    subscriptionType?: 'normal' | 'priority' | 'potential'
    notificationPreferences?: any
  }) =>
    request('/company-student-bridge/subscribe', { method: 'POST', data }),

  // 企业添加学生声誉标签（企业端）
  addReputationTag: (studentId: string, data: {
    tagType: 'strength' | 'potential' | 'concern'
    tagName: string
    description?: string
    evidence?: string
    sourceTaskId?: string
    confidenceScore?: number
    isVisibleToStudent?: boolean
  }) =>
    request('/company-student-bridge/reputation-tag', {
      method: 'POST',
      data: {
        studentId,
        tagType: data.tagType,
        tagName: data.tagName,
        tagDescription: data.description,
        evidence: data.evidence,
        sourceTaskId: data.sourceTaskId,
        confidenceScore: data.confidenceScore,
        isVisibleToStudent: data.isVisibleToStudent
      }
    }),

  // 企业获取成长通知（企业端）
  getCompanyNotifications: (params?: {
    onlyUnread?: boolean
    limit?: number
    offset?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.onlyUnread) queryParams.append('unreadOnly', 'true')
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    return request(`/company-student-bridge/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`)
  },

  // 标记通知为已读（企业端）
  markNotificationAsRead: (notificationId: number) =>
    request(`/company-student-bridge/notifications/${notificationId}/read`, { method: 'POST' })
}

// Phase 3.4: 需求自动拆解推送API
export const demandDecompositionAPI = {
  // 企业提交大需求拆解（企业端）
  decomposeTask: (data: {
    taskId: string
    taskTitle: string
    taskDescription: string
    totalBudget?: number
  }) =>
    request('/demand-decomposition/decompose', { method: 'POST', data }),

  // 推送子任务给学生（企业端）
  pushSubtask: (subtaskId: string, maxPushCount?: number) =>
    request(`/demand-decomposition/subtasks/${subtaskId}/push`, {
      method: 'POST',
      data: { maxPushCount }
    }),

  // 学生查看收到的子任务推送
  getMyPushes: (params?: {
    responseStatus?: 'pending' | 'accepted' | 'rejected' | 'ignored'
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.responseStatus) queryParams.append('responseStatus', params.responseStatus)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    return request(`/demand-decomposition/my-pushes${queryParams.toString() ? '?' + queryParams.toString() : ''}`)
  },

  // 学生响应子任务推送
  respondToSubtask: (subtaskId: string, data: {
    response: 'accepted' | 'rejected'
    rejectionReason?: string
  }) =>
    request(`/demand-decomposition/subtasks/${subtaskId}/respond`, { method: 'POST', data })
}

// 项目匹配系统API
export const matchAPI = {
  // 智能项目匹配（基于OPC人格标签）- 使用后端已有的 recommended 端点
  getMatchedTasks: (userId: string, limit = 20) =>
    request(`/tasks/recommended?limit=${limit}`),

  // 获取任务详情（含匹配理由）
  getTaskDetail: (taskId: string, userId: string) =>
    request(`/tasks/${taskId}/detail/${userId}`)
}

// AI导师系统API（新）
export const mentorNewAPI = {
  // 记录导师观察
  recordObservation: (data: {
    studentId: string;
    taskId: string;
    observationType: 'stuck_point' | 'breakthrough' | 'habit_formed';
    observationContent: string;
    observationData?: any;
  }) => request('/mentor/observe', { method: 'POST', data }),

  // 检测学生卡点（定时任务）
  detectStuck: () => request('/mentor/detect-stuck', { method: 'POST' }),

  // 生成AI导师欢迎消息
  generateWelcome: (studentId: string, taskId: string) =>
    request('/mentor/welcome-message', { method: 'POST', data: { studentId, taskId } }),

  // 生成里程碑夸奖消息
  generateMilestone: (studentId: string, taskId: string, milestoneType: string) =>
    request('/mentor/milestone-message', { method: 'POST', data: { studentId, taskId, milestoneType } }),

  // 生成打回修改消息
  generateRejection: (studentId: string, taskId: string, rejectionReason: string, goodPoints: string[]) =>
    request('/mentor/rejection-message', { method: 'POST', data: { studentId, taskId, rejectionReason, goodPoints } }),

  // 检测习惯形成（定时任务）
  detectHabits: () => request('/mentor/detect-habits', { method: 'POST' })
}

// AI导师4阶段系统API
export const mentorStageAPI = {
  // ========== 基础会话功能 ==========

  // 获取任务的导师会话
  getSession: (taskId: string) =>
    request(`/mentor-stage/tasks/${taskId}/session`),

  // 获取会话消息历史
  getMessages: (sessionId: string, limit = 50, offset = 0) =>
    request(`/mentor-stage/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`),

  // 发送消息给导师
  sendMessage: (sessionId: string, content: string) =>
    request(`/mentor-stage/sessions/${sessionId}/messages`, {
      method: 'POST',
      data: { content }
    }),

  // 请求质量预审
  requestQualityReview: (taskId: string, submission: string) =>
    request(`/mentor-stage/tasks/${taskId}/quality-review`, {
      method: 'POST',
      data: { submission }
    }),

  // 获取会话统计
  getSessionStats: (sessionId: string) =>
    request(`/mentor-stage/sessions/${sessionId}/stats`),

  // 确认需求理解
  confirmRequirement: (sessionId: string, productFramework?: string, score?: number) =>
    request(`/mentor-stage/sessions/${sessionId}/confirm-requirement`, {
      method: 'POST',
      data: { productFramework, score }
    }),

  // ========== 灵魂系统 - 情绪与成长 ==========

  // 获取学生成长仪表盘
  getGrowthDashboard: (studentId: string) =>
    request(`/mentor-stage/soul/growth-dashboard/${studentId}`),

  // 获取最近情绪记录
  getRecentEmotions: (studentId: string, limit = 10) =>
    request(`/mentor-stage/soul/emotions/${studentId}?limit=${limit}`),

  // 获取成长里程碑
  getMilestones: (studentId: string, limit = 20) =>
    request(`/mentor-stage/soul/milestones/${studentId}?limit=${limit}`),

  // 获取导师记忆
  getMemories: (studentId: string, limit = 20) =>
    request(`/mentor-stage/soul/memories/${studentId}?limit=${limit}`),

  // 获取学习档案
  getLearningProfile: (studentId: string) =>
    request(`/mentor-stage/soul/profile/${studentId}`),

  // 获取情绪统计
  getEmotionStats: (studentId: string, days = 7) =>
    request(`/mentor-stage/soul/emotion-stats/${studentId}?days=${days}`),

  // 获取成长统计
  getGrowthStats: (studentId: string) =>
    request(`/mentor-stage/soul/growth-stats/${studentId}`),

  // 获取未庆祝的里程碑
  getUncelebratedMilestones: (studentId: string) =>
    request(`/mentor-stage/soul/uncelebrated-milestones/${studentId}`),

  // 庆祝里程碑
  celebrateMilestone: (milestoneId: string) =>
    request(`/mentor-stage/soul/celebrate-milestone/${milestoneId}`, {
      method: 'POST'
    }),

  // ========== 工具推荐系统 ==========

  // 获取推荐工具
  getRecommendedTools: (taskId: string) =>
    request(`/mentor-stage/tools/recommend/${taskId}`),

  // 提交工具使用反馈
  submitToolFeedback: (data: {
    recommendationId: string;
    used: boolean;
    helpful?: boolean;
    feedback?: string;
  }) =>
    request('/mentor-stage/tools/feedback', {
      method: 'POST',
      data
    }),

  // 获取热门工具
  getPopularTools: (limit = 10) =>
    request(`/mentor-stage/tools/popular?limit=${limit}`),

  // ========== 深度引导系统 ==========

  // 获取学生的深层模式
  getDeepPatterns: (studentId: string) =>
    request(`/mentor-stage/deep/patterns/${studentId}`),

  // 获取信念转变记录
  getBeliefShifts: (studentId: string, limit = 10) =>
    request(`/mentor-stage/deep/belief-shifts/${studentId}?limit=${limit}`),

  // 获取成长挑战
  getGrowthChallenges: (studentId: string, status?: 'active' | 'completed') =>
    request(`/mentor-stage/deep/challenges/${studentId}${status ? `?status=${status}` : ''}`),

  // 接受挑战
  acceptChallenge: (challengeId: string) =>
    request(`/mentor-stage/deep/challenges/${challengeId}/accept`, {
      method: 'POST'
    }),

  // 拒绝挑战
  declineChallenge: (challengeId: string, reason?: string) =>
    request(`/mentor-stage/deep/challenges/${challengeId}/decline`, {
      method: 'POST',
      data: { reason }
    }),

  // 更新挑战进度
  updateChallengeProgress: (challengeId: string, progress: string) =>
    request(`/mentor-stage/deep/challenges/${challengeId}/progress`, {
      method: 'POST',
      data: { progress }
    }),

  // 完成挑战
  completeChallenge: (challengeId: string, reflection: string) =>
    request(`/mentor-stage/deep/challenges/${challengeId}/complete`, {
      method: 'POST',
      data: { reflection }
    }),

  // ========== 导师报告系统 ==========

  // 获取导师报告列表
  getMentorReports: (studentId: string) =>
    request(`/mentor-stage/reports/${studentId}`),

  // 生成导师报告
  generateReport: (studentId: string, reportType: 'weekly' | 'monthly') =>
    request(`/mentor-stage/reports/${studentId}/generate`, {
      method: 'POST',
      data: { reportType }
    }),

  // 导出报告（PDF/图片）
  exportReport: (reportId: string, format: 'pdf' | 'image' = 'pdf') =>
    request(`/mentor-stage/reports/${reportId}/export?format=${format}`),

  // 下载报告文件
  downloadReport: (reportId: string, format: 'pdf' | 'image' = 'pdf') => {
    // 使用tokenManager统一管理
    const token = tokenManager.getAccessToken()
    return Taro.downloadFile({
      url: `${BASE_URL}/mentor-stage/reports/${reportId}/download?format=${format}`,
      header: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  // ========== 主动跟进系统 ==========

  // 获取跟进消息（学生端查看导师的主动关心）
  getFollowUpMessages: (studentId: string, limit = 10) =>
    request(`/mentor-stage/follow-up/messages/${studentId}?limit=${limit}`),

  // 标记跟进消息已读
  markFollowUpRead: (messageId: string) =>
    request(`/mentor-stage/follow-up/messages/${messageId}/read`, {
      method: 'POST'
    })
}

// 里程碑系统API
export const milestoneAPI = {
  // 第2单完成触发器
  handleSecondTask: (userId: string) =>
    request('/milestone/second-task-complete', { method: 'POST', data: { userId } }),

  // 获取OPC故事墙
  getStoryWall: () => request('/story-wall'),

  // 提交故事到故事墙
  submitStory: (userId: string, storyText: string, currentStatus: string) =>
    request('/story-wall/submit', { method: 'POST', data: { userId, storyText, currentStatus } })
}

// 生命问题API
export const lifeQuestionAPI = {
  // 保存/更新生命问题
  save: (userId: string, question: string) =>
    request('/life-question/save', { method: 'POST', data: { userId, question } }),

  // 获取生命问题
  get: (userId: string) => request(`/life-question/${userId}`),

  // 添加反思记录
  addReflection: (userId: string, taskId: string, reflection: string) =>
    request('/life-question/reflection', { method: 'POST', data: { userId, taskId, reflection } })
}

// 热情火花API
export const passionSparkAPI = {
  // 捕捉热情火花
  capture: (studentId: string, taskId: string, sparkText: string, context: string) =>
    request('/passion-spark/capture', { method: 'POST', data: { studentId, taskId, sparkText, context } }),

  // 获取热情火花列表
  getList: (studentId: string) => request(`/passion-spark/${studentId}`),

  // 标记想要继续探索
  markExplore: (sparkId: string, wantExplore: boolean) =>
    request('/passion-spark/mark-explore', { method: 'POST', data: { sparkId, wantExplore } }),

  // 获取想要探索的火花
  getWantExplore: (studentId: string) => request(`/passion-spark/${studentId}/want-explore`)
}

// 合伙人关系API
export const partnershipAPI = {
  // 获取企业与学生的合伙关系
  getPartnership: (companyId: string, studentId: string) =>
    request(`/partnerships/${companyId}/${studentId}`),

  // 更新合作次数（任务完成后自动调用）
  updateCollaborationCount: (companyId: string, studentId: string) =>
    request('/partnerships/update-count', { method: 'POST', data: { companyId, studentId } }),

  // 企业发起合伙人邀请
  invitePartner: (companyId: string, studentId: string, partnershipTerms: any) =>
    request('/partnerships/invite', { method: 'POST', data: { companyId, studentId, partnershipTerms } }),

  // 学生接受/拒绝合伙人邀请
  respondToInvitation: (companyId: string, studentId: string, accept: boolean) =>
    request('/partnerships/respond', { method: 'POST', data: { companyId, studentId, accept } }),

  // 获取学生的所有合伙关系
  getStudentPartnerships: (studentId: string) =>
    request(`/partnerships/student/${studentId}`),

  // 获取企业的所有合伙关系
  getCompanyPartnerships: (companyId: string) =>
    request(`/partnerships/company/${companyId}`),

  // 记录合伙人互动
  recordInteraction: (companyId: string, studentId: string, interactionType: string, interactionData: any) =>
    request('/partnerships/interaction', { method: 'POST', data: { companyId, studentId, interactionType, interactionData } })
}

// 探索模式加速器API
export const explorationAPI = {
  // 为任务添加探索标签
  addExplorationTag: (taskId: string, tagType: string, tagLabel: string, explorationDescription: string) =>
    request('/exploration/tag', { method: 'POST', data: { taskId, tagType, tagLabel, explorationDescription } }),

  // 获取任务的探索标签
  getTaskExplorationTags: (taskId: string) =>
    request(`/exploration/tags/${taskId}`),

  // 提交探索反思
  submitReflection: (studentId: string, taskId: string, reflections: any[]) =>
    request('/exploration/reflection', { method: 'POST', data: { studentId, taskId, reflections } }),

  // 获取学生的探索反思历史
  getStudentReflections: (studentId: string) =>
    request(`/exploration/reflections/${studentId}`),

  // 获取学生的探索模式库
  getStudentPatterns: (studentId: string) =>
    request(`/exploration/patterns/${studentId}`),

  // 标记模式想应用到生活中
  markPatternForLife: (patternId: string, wantApply: boolean) =>
    request('/exploration/pattern/mark-life', { method: 'POST', data: { patternId, wantApply } }),

  // 记录模式应用
  recordPatternApplication: (patternId: string) =>
    request('/exploration/pattern/apply', { method: 'POST', data: { patternId } }),

  // AI生成探索建议
  generateExplorationSuggestions: (taskId: string, taskDescription: string) =>
    request('/exploration/suggestions', { method: 'POST', data: { taskId, taskDescription } })
}

// OPC孵化计划API
export const incubationAPI = {
  // 检查孵化资格
  checkEligibility: (studentId: string) =>
    request(`/incubation/eligibility/${studentId}`),

  // 申请加入孵化计划
  applyForIncubation: (studentId: string, passionDirection: string) =>
    request('/incubation/apply', { method: 'POST', data: { studentId, passionDirection } }),

  // 获取孵化状态
  getIncubationStatus: (studentId: string) =>
    request(`/incubation/status/${studentId}`),

  // 提交月度更新
  submitMonthlyUpdate: (studentId: string, updateMonth: string, growthSummary: string, explorationStories: string, challengesFaced: string, nextMonthPlan: string) =>
    request('/incubation/monthly-update', { method: 'POST', data: { studentId, updateMonth, growthSummary, explorationStories, challengesFaced, nextMonthPlan } }),

  // 对接创业资源
  connectResource: (studentId: string, resourceType: string, resourceName: string, resourceDescription: string, contactInfo: string) =>
    request('/incubation/resource', { method: 'POST', data: { studentId, resourceType, resourceName, resourceDescription, contactInfo } }),

  // 毕业
  graduate: (studentId: string) =>
    request('/incubation/graduate', { method: 'POST', data: { studentId } })
}

// 联合体API
export const allianceAPI = {
  // 创建联合体
  createAlliance: (founderId: string, name: string, description: string, vision: string) =>
    request('/alliances/create', { method: 'POST', data: { founderId, name, description, vision } }),

  // 邀请成员
  inviteMember: (allianceId: string, inviterId: string, inviteeId: string, invitationMessage: string) =>
    request('/alliances/invite', { method: 'POST', data: { allianceId, inviterId, inviteeId, invitationMessage } }),

  // 响应邀请
  respondToInvitation: (invitationId: string, accept: boolean) =>
    request('/alliances/respond', { method: 'POST', data: { invitationId, accept } }),

  // 获取学生的联合体
  getStudentAlliances: (studentId: string) =>
    request(`/alliances/student/${studentId}`),

  // 获取联合体详情
  getAllianceDetail: (allianceId: string) =>
    request(`/alliances/${allianceId}`),

  // 创建联合体项目
  createAllianceProject: (allianceId: string, projectName: string, projectDescription: string, assignedMembers: string[], revenueShare: any) =>
    request('/alliances/project', { method: 'POST', data: { allianceId, projectName, projectDescription, assignedMembers, revenueShare } }),

  // 获取待处理邀请
  getPendingInvitations: (studentId: string) =>
    request(`/alliances/invitations/${studentId}`)
}

// 通知中心API
export const notificationAPI = {
  // 获取通知列表
  getList: () => request('/notifications'),

  // 标记单个通知为已读
  markRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'POST' }),

  // 标记全部通知为已读
  markAllRead: () =>
    request('/notifications/read-all', { method: 'POST' }),

  // 获取未读通知数量
  getUnreadCount: () => request('/notifications/unread-count')
}

// 钱包相关API
export const walletAPI = {
  // 获取账户信息
  getAccount: () => request('/escrow/account'),

  // 获取交易流水
  getTransactions: () =>
    request('/escrow/transactions'),

  // 申请提现
  requestWithdrawal: (data: {
    amount: number
    withdrawalMethod: 'wechat' | 'alipay'
    accountName: string
    accountNumber: string
  }) => request('/escrow/withdrawal', {
    method: 'POST',
    data
  }),

  // 获取提现记录
  getWithdrawalHistory: () =>
    request('/escrow/withdrawals')
}

// 沟通中转API
export const communicationAPI = {
  // 企业补充说明
  addClarification: (taskId: string, content: string) =>
    request('/communication/clarifications', { method: 'POST', data: { taskId, content } }),

  // 获取任务说明列表
  getClarifications: (taskId: string) =>
    request(`/communication/clarifications/${taskId}`),

  // 学生提问
  askQuestion: (taskId: string, question: string) =>
    request('/communication/questions', { method: 'POST', data: { taskId, question } }),

  // 获取问题列表
  getQuestions: (taskId: string) =>
    request(`/communication/questions/${taskId}`),

  // 企业回答问题
  answerQuestion: (questionId: string, answer: string) =>
    request(`/communication/questions/${questionId}/answer`, { method: 'POST', data: { answer } }),

  // 获取中转消息
  getRelayMessages: (taskId: string) =>
    request(`/communication/relay-messages/${taskId}`),

  // 发送中转消息
  sendRelayMessage: (taskId: string, content: string) =>
    request('/communication/relay-messages', { method: 'POST', data: { taskId, content } }),

  // 获取未读消息数
  getUnreadCount: (taskId: string) =>
    request(`/communication/unread-count/${taskId}`)
}

// 协议与授权API
export const agreementAPI = {
  // 获取协议列表
  getAgreements: () =>
    request('/agreement/agreements'),

  // 获取协议详情
  getAgreementDetail: (agreementId: string) =>
    request(`/agreement/agreements/${agreementId}`),

  // 签署协议
  signAgreement: (agreementId: string, ipAddress: string) =>
    request('/agreement/sign', { method: 'POST', data: { agreementId, ipAddress } }),

  // 获取签署记录
  getSignatureHistory: () =>
    request('/agreement/signatures'),

  // 获取数据授权设置
  getAuthorizationSettings: () =>
    request('/agreement/authorization-settings'),

  // 更新数据授权
  updateAuthorization: (authorizationType: string, isAuthorized: boolean) =>
    request('/agreement/authorization', { method: 'POST', data: { authorizationType, isAuthorized } }),

  // 获取授权历史
  getAuthorizationHistory: () =>
    request('/agreement/authorization-history'),

  // 获取必读条款
  getMandatoryTerms: () =>
    request('/agreement/mandatory-terms'),

  // 获取生效中的协议（用于注册流程）
  getActiveAgreements: (type?: string) =>
    request('/agreement/active', { method: 'GET', data: { type } }),

  // 确认必读条款
  confirmTerm: (termType: string) =>
    request('/agreement/mandatory-terms/confirm', { method: 'POST', data: { termType } })
}

// 跳级挑战与毕业API
export const challengeGraduationAPI = {
  // 获取可用挑战
  getAvailableChallenges: () =>
    request('/challenge-graduation/challenges/available'),

  // 创建挑战任务
  createChallenge: (targetLevel: number, taskDescription: string, requiredAbilities: any) =>
    request('/challenge-graduation/challenges', { method: 'POST', data: { targetLevel, taskDescription, requiredAbilities } }),

  // 提交挑战
  submitChallenge: (challengeId: string, submissionUrl: string, description: string) =>
    request(`/challenge-graduation/challenges/${challengeId}/submit`, { method: 'POST', data: { submissionUrl, description } }),

  // 获取挑战历史
  getChallengeHistory: () =>
    request('/challenge-graduation/challenges/history'),

  // 审核挑战（企业端）
  reviewChallenge: (attemptId: string, passed: boolean, feedback: string) =>
    request(`/challenge-graduation/challenges/attempts/${attemptId}/review`, { method: 'POST', data: { passed, feedback } }),

  // 申请毕业
  applyForGraduation: (portfolioUrl: string, achievements: string, futureGoals: string) =>
    request('/challenge-graduation/graduation/apply', { method: 'POST', data: { portfolioUrl, achievements, futureGoals } }),

  // 获取毕业申请状态
  getGraduationStatus: () =>
    request('/challenge-graduation/graduation/status'),

  // 审核毕业申请（管理员）
  reviewGraduation: (applicationId: string, approved: boolean, feedback: string) =>
    request(`/challenge-graduation/graduation/${applicationId}/review`, { method: 'POST', data: { approved, feedback } }),

  // 获取毕业权益
  getGraduationBenefits: () =>
    request('/challenge-graduation/graduation/benefits'),

  // 检查毕业资格
  checkEligibility: () =>
    request('/challenge-graduation/graduation/eligibility'),

  // 获取毕业生权益
  getGraduateBenefits: () =>
    request('/challenge-graduation/graduation/graduate-benefits'),

  // 开始挑战
  startChallenge: (challengeTaskId: number) =>
    request('/challenge-graduation/challenges/start', { method: 'POST', data: { challengeTaskId } })
}

// AI引擎API
export const aiEngineAPI = {
  // 需求确认对话
  startRequirementChat: (taskId: string, initialDescription: string) =>
    request('/ai-engine/requirement/start', { method: 'POST', data: { taskId, initialDescription } }),

  // 继续需求对话
  continueRequirementChat: (sessionId: string, userMessage: string) =>
    request('/ai-engine/requirement/continue', { method: 'POST', data: { sessionId, userMessage } }),

  // 获取需求确认结果
  getRequirementResult: (sessionId: string) =>
    request(`/ai-engine/requirement/${sessionId}/result`),

  // 任务拆解
  decomposeTask: (taskId: string, confirmedRequirements: any) =>
    request('/ai-engine/decompose', { method: 'POST', data: { taskId, confirmedRequirements } }),

  // 获取拆解结果
  getDecompositionResult: (taskId: string) =>
    request(`/ai-engine/decompose/${taskId}`),

  // 提交作品审核
  submitForReview: (taskId: string, submissionUrl: string, description: string) =>
    request('/ai-engine/review/submit', { method: 'POST', data: { taskId, submissionUrl, description } }),

  // 获取审核结果
  getReviewResult: (reviewId: string) =>
    request(`/ai-engine/review/${reviewId}`),

  // AI问答
  askAI: (question: string, context?: any) =>
    request('/ai-engine/qa', { method: 'POST', data: { question, context } }),

  // 获取问答历史
  getQAHistory: () =>
    request('/ai-engine/qa/history')
}

// OPC测评与成长报告API
export const opcGrowthAPI = {
  // 提交OPC测评
  submitAssessment: (answers: any) =>
    request('/opc-growth/assessments', { method: 'POST', data: { answers } }),

  // 获取测评结果
  getAssessmentResult: (assessmentId: string) =>
    request(`/opc-growth/assessments/${assessmentId}`),

  // 获取成长报告
  getGrowthReport: (reportId: string) =>
    request(`/opc-growth/reports/${reportId}`),

  // 获取成长报告列表
  getGrowthReports: () =>
    request('/opc-growth/reports'),

  // 生成成长报告
  generateGrowthReport: (startDate: string, endDate: string) =>
    request('/opc-growth/reports/generate', { method: 'POST', data: { startDate, endDate } }),

  // 获取能力雷达图数据
  getAbilityRadar: () =>
    request('/opc-growth/ability-radar'),

  // 获取成长轨迹
  getGrowthTrajectory: () =>
    request('/opc-growth/trajectory')
}

// 社群与作品展示API
export const communityPortfolioAPI = {
  // 获取社群列表
  getCommunities: () =>
    request('/community-portfolio/communities'),

  // 加入社群
  joinCommunity: (communityId: string) =>
    request(`/community-portfolio/communities/${communityId}/join`, { method: 'POST' }),

  // 退出社群
  leaveCommunity: (communityId: string) =>
    request(`/community-portfolio/communities/${communityId}/leave`, { method: 'POST' }),

  // 获取社群帖子
  getCommunityPosts: (communityId: string) =>
    request(`/community-portfolio/communities/${communityId}/posts`),

  // 发布帖子
  createPost: (communityId: string, content: string, images?: string[]) =>
    request('/community-portfolio/posts', { method: 'POST', data: { communityId, content, images } }),

  // 点赞帖子
  likePost: (postId: string) =>
    request(`/community-portfolio/posts/${postId}/like`, { method: 'POST' }),

  // 评论帖子
  commentPost: (postId: string, content: string) =>
    request(`/community-portfolio/posts/${postId}/comments`, { method: 'POST', data: { content } }),

  // 获取作品集
  getPortfolio: (userId: string) =>
    request(`/community-portfolio/portfolios/${userId}`),

  // 添加作品
  addPortfolioItem: (title: string, description: string, coverImage: string, contentUrl: string, tags: string[]) =>
    request('/community-portfolio/portfolios/items', { method: 'POST', data: { title, description, coverImage, contentUrl, tags } }),

  // 获取热门作品
  getTrendingPortfolios: () =>
    request('/community-portfolio/portfolios/trending')
}

// 评价系统API（学生端）
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

  // 获取任务的评价
  getByTask: (taskId: string) => request(`/ratings-new/task/${taskId}`),

  // 获取我的评价
  getMyRatings: (params?: { page?: number; limit?: number }) =>
    request('/ratings-new/user/me', { method: 'GET', data: params }),

  // 获取评价统计
  getMyStats: () => request('/ratings-new/user/me/stats'),

  // 获取评价标签
  getTags: () => request('/ratings-new/tags')
}

// 托管提现API（学生端）
export const escrowAPI = {
  // 获取账户信息
  getAccount: () => request('/escrow/account'),

  // 获取交易记录
  getTransactions: (params?: { page?: number; limit?: number; type?: string }) =>
    request('/escrow/transactions', { method: 'GET', data: params }),

  // 获取订单资金状态（分阶段支付详情）
  getOrderStatus: (orderId: string) =>
    request(`/escrow/orders/${orderId}/payment-status`),

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

export default {
  auth: authAPI,
  test: testAPI,
  task: taskAPI,
  mentor: mentorAPI,
  ability: abilityAPI,
  story: storyAPI,
  report: reportAPI,
  withdraw: withdrawAPI,
  level: levelAPI,
  opc: opcAPI,
  mentorStage: mentorStageAPI,
  milestone: milestoneAPI,
  communityPortfolio: communityPortfolioAPI,
  rating: ratingAPI,
  escrow: escrowAPI,
  notification: notificationAPI,
  match: matchAPI,
  mentorNew: mentorNewAPI,
  lifeQuestion: lifeQuestionAPI,
  passionSpark: passionSparkAPI,
  partnership: partnershipAPI,
  exploration: explorationAPI,
  incubation: incubationAPI,
  alliance: allianceAPI,
  wallet: walletAPI,
  communication: communicationAPI,
  agreement: agreementAPI,
  challengeGraduation: challengeGraduationAPI,
  aiEngine: aiEngineAPI,
  opcGrowth: opcGrowthAPI,
  security: securityAPI,
  analytics: analyticsAPI,
  talent: talentAPI,
  stats: statsAPI,
  dailyTasks: dailyTasksAPI,
  companyRating: companyRatingAPI,
  taskTranslation: taskTranslationAPI,
  studentRecommendation: studentRecommendationAPI,
  taskFlow: taskFlowAPI,
  submission: submissionAPI
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

// 分析统计API（游戏化相关）
export const analyticsAPI = {
  // 获取用户统计数据（包含思考点数）
  getStats: () => request('/analytics/user/stats'),

  // 获取活动日志
  getActivityLog: (limit: number = 50) =>
    request(`/analytics/activity?limit=${limit}`)
}

// 天赋标签系统API（语义级精准匹配）
export const talentAPI = {
  // 获取学生天赋画像
  getProfile: (studentId?: string) =>
    request(`/talent/profile${studentId ? '/' + studentId : ''}`),

  // 获取学生成长统计
  getStats: (studentId?: string) =>
    request(`/talent/stats${studentId ? '/' + studentId : ''}`),

  // 获取所有天赋标签列表（供企业选择）
  getTags: () => request('/talent/tags'),

  // 获取所有业务场景标签
  getScenarios: () => request('/talent/scenarios'),

  // 为任务匹配学生（使用天赋匹配算法）
  matchStudentsForTask: (taskId: string, topN?: number) =>
    request(`/talent/match/task/${taskId}${topN ? '?topN=' + topN : ''}`),

  // 手动触发天赋推断（通常自动触发）
  inferFromOPC: (opcScores: any) =>
    request('/talent/infer/opc', { method: 'POST', data: { opcScores } }),

  // 手动触发能力提取（通常在任务完成时自动触发）
  extractFromTask: (taskId: string) =>
    request(`/talent/extract/task/${taskId}`, { method: 'POST' }),

  // 创建任务需求拆解
  createBreakdown: (taskId: string, breakdown: any[]) =>
    request(`/talent/breakdown/${taskId}`, { method: 'POST', data: { breakdown } }),

  // 获取任务需求拆解
  getBreakdown: (taskId: string) =>
    request(`/talent/breakdown/${taskId}`),

  // 为子需求匹配学生
  matchStudentsForRequirement: (taskId: string, requirementId: string, topN?: number) =>
    request(`/talent/match/requirement/${taskId}/${requirementId}${topN ? '?topN=' + topN : ''}`)
}

// 统计数据API
export const statsAPI = {
  // 获取人格标签统计（同类数据）
  getPersonalityStats: (tag: string) =>
    request(`/stats/personality/${tag}`, { needAuth: false }),

  // 获取赛道统计
  getTrackStats: (track: string) =>
    request(`/stats/track/${track}`, { needAuth: false }),

  // 获取学生能力估值
  getStudentValuation: () =>
    request('/stats/student-valuation')
}

// 每日任务API
export const dailyTasksAPI = {
  // 获取每日任务列表
  getDailyTasks: () => request('/daily-tasks'),

  // 完成每日任务
  completeTask: (taskId: string) =>
    request(`/daily-tasks/${taskId}/complete`, { method: 'POST' })
}

// 评价系统API（新版 - 企业评价）
export const companyRatingAPI = {
  // 获取待评价任务列表
  getPendingRatings: () => request('/rating/pending'),

  // 检查任务是否可评价
  checkCanRate: (taskId: string) => request(`/rating/check/${taskId}`),

  // 获取评价标签预设
  getTagPresets: () => request('/rating/tags/presets'),

  // 提交企业评价
  submitRating: (data: {
    taskId: number;
    overallRating: number;
    requirementClarity: number;
    communicationQuality: number;
    paymentTimeliness: number;
    comment: string;
    tags: string[];
    isAnonymous: boolean;
  }) => request('/rating/submit', { method: 'POST', data })
}

// 任务翻译API（启程老师）
export const taskTranslationAPI = {
  // 获取任务翻译
  getTranslation: (taskId: string) => request(`/tasks/${taskId}/translation`),

  // 接受任务推荐
  acceptRecommendation: (taskId: string) =>
    request(`/tasks/${taskId}/accept-recommendation`, { method: 'POST' })
}

// 学生推荐任务API
export const studentRecommendationAPI = {
  // 获取推荐任务列表
  getRecommendedTasks: () => request('/students/recommended-tasks'),

  // 检查是否首单
  isFirstOrder: () => request('/student/is-first-order')
}

// 任务流程API
export const taskFlowAPI = {
  // 更新任务进度
  updateProgress: (taskId: string, data: { progressPercent: number; note?: string }) =>
    request(`/tasks/flow/${taskId}/progress`, { method: 'POST', data }),

  // 提交交付物
  submitDeliverable: (taskId: string, data: {
    description: string;
    fileUrls: string[];
    links: string[];
  }) => request(`/tasks/flow/${taskId}/deliverable`, { method: 'POST', data })
}

// 提交预审核API
export const submissionAPI = {
  // AI预审核
  preCheck: (data: { taskId: string; submissionContent: string }) =>
    request('/submissions/pre-check', { method: 'POST', data })
}
