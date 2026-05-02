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
      timeout: 60000 // 设置60秒超时，AI回复需要较长时间
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
    request('/opc-v2/latest')
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
  getAccount: () => request('/api/v1/escrow/account'),

  // 获取交易流水
  getTransactions: () =>
    request('/api/v1/escrow/transactions'),

  // 申请提现
  requestWithdrawal: (data: {
    amount: number
    withdrawalMethod: 'wechat' | 'alipay'
    accountName: string
    accountNumber: string
  }) => request('/api/v1/escrow/withdrawal', {
    method: 'POST',
    data
  }),

  // 获取提现记录
  getWithdrawalHistory: () =>
    request('/api/v1/escrow/withdrawals')
}

// 沟通中转API
export const communicationAPI = {
  // 企业补充说明
  addClarification: (taskId: string, content: string) =>
    request('/api/v1/communication/clarifications', { method: 'POST', data: { taskId, content } }),

  // 获取任务说明列表
  getClarifications: (taskId: string) =>
    request(`/api/v1/communication/clarifications/${taskId}`),

  // 学生提问
  askQuestion: (taskId: string, question: string) =>
    request('/api/v1/communication/questions', { method: 'POST', data: { taskId, question } }),

  // 获取问题列表
  getQuestions: (taskId: string) =>
    request(`/api/v1/communication/questions/${taskId}`),

  // 企业回答问题
  answerQuestion: (questionId: string, answer: string) =>
    request(`/api/v1/communication/questions/${questionId}/answer`, { method: 'POST', data: { answer } }),

  // 获取中转消息
  getRelayMessages: (taskId: string) =>
    request(`/api/v1/communication/relay-messages/${taskId}`),

  // 发送中转消息
  sendRelayMessage: (taskId: string, content: string) =>
    request('/api/v1/communication/relay-messages', { method: 'POST', data: { taskId, content } }),

  // 获取未读消息数
  getUnreadCount: (taskId: string) =>
    request(`/api/v1/communication/unread-count/${taskId}`)
}

// 协议与授权API
export const agreementAPI = {
  // 获取协议列表
  getAgreements: () =>
    request('/api/v1/agreement/agreements'),

  // 获取协议详情
  getAgreementDetail: (agreementId: string) =>
    request(`/api/v1/agreement/agreements/${agreementId}`),

  // 签署协议
  signAgreement: (agreementId: string, ipAddress: string) =>
    request('/api/v1/agreement/sign', { method: 'POST', data: { agreementId, ipAddress } }),

  // 获取签署记录
  getSignatureHistory: () =>
    request('/api/v1/agreement/signatures'),

  // 获取数据授权设置
  getAuthorizationSettings: () =>
    request('/api/v1/agreement/authorization-settings'),

  // 更新数据授权
  updateAuthorization: (authorizationType: string, isAuthorized: boolean) =>
    request('/api/v1/agreement/authorization', { method: 'POST', data: { authorizationType, isAuthorized } }),

  // 获取授权历史
  getAuthorizationHistory: () =>
    request('/api/v1/agreement/authorization-history'),

  // 获取必读条款
  getMandatoryTerms: () =>
    request('/api/v1/agreement/mandatory-terms'),

  // 获取生效中的协议（用于注册流程）
  getActiveAgreements: (type?: string) =>
    request('/api/v1/agreement/active', { method: 'GET', data: { type } }),

  // 确认必读条款
  confirmTerm: (termType: string) =>
    request('/api/v1/agreement/mandatory-terms/confirm', { method: 'POST', data: { termType } })
}

// 跳级挑战与毕业API
export const challengeGraduationAPI = {
  // 获取可用挑战
  getAvailableChallenges: () =>
    request('/api/v1/challenge-graduation/challenges/available'),

  // 创建挑战任务
  createChallenge: (targetLevel: number, taskDescription: string, requiredAbilities: any) =>
    request('/api/v1/challenge-graduation/challenges', { method: 'POST', data: { targetLevel, taskDescription, requiredAbilities } }),

  // 提交挑战
  submitChallenge: (challengeId: string, submissionUrl: string, description: string) =>
    request(`/api/v1/challenge-graduation/challenges/${challengeId}/submit`, { method: 'POST', data: { submissionUrl, description } }),

  // 获取挑战历史
  getChallengeHistory: () =>
    request('/api/v1/challenge-graduation/challenges/history'),

  // 审核挑战（企业端）
  reviewChallenge: (attemptId: string, passed: boolean, feedback: string) =>
    request(`/api/v1/challenge-graduation/challenges/attempts/${attemptId}/review`, { method: 'POST', data: { passed, feedback } }),

  // 申请毕业
  applyForGraduation: (portfolioUrl: string, achievements: string, futureGoals: string) =>
    request('/api/v1/challenge-graduation/graduation/apply', { method: 'POST', data: { portfolioUrl, achievements, futureGoals } }),

  // 获取毕业申请状态
  getGraduationStatus: () =>
    request('/api/v1/challenge-graduation/graduation/status'),

  // 审核毕业申请（管理员）
  reviewGraduation: (applicationId: string, approved: boolean, feedback: string) =>
    request(`/api/v1/challenge-graduation/graduation/${applicationId}/review`, { method: 'POST', data: { approved, feedback } }),

  // 获取毕业权益
  getGraduationBenefits: () =>
    request('/api/v1/challenge-graduation/graduation/benefits'),

  // 检查毕业资格
  checkEligibility: () =>
    request('/api/v1/challenge-graduation/graduation/eligibility'),

  // 获取毕业生权益
  getGraduateBenefits: () =>
    request('/api/v1/challenge-graduation/graduation/graduate-benefits'),

  // 开始挑战
  startChallenge: (challengeTaskId: number) =>
    request('/api/v1/challenge-graduation/challenges/start', { method: 'POST', data: { challengeTaskId } })
}

// AI引擎API
export const aiEngineAPI = {
  // 需求确认对话
  startRequirementChat: (taskId: string, initialDescription: string) =>
    request('/api/v1/ai-engine/requirement/start', { method: 'POST', data: { taskId, initialDescription } }),

  // 继续需求对话
  continueRequirementChat: (sessionId: string, userMessage: string) =>
    request('/api/v1/ai-engine/requirement/continue', { method: 'POST', data: { sessionId, userMessage } }),

  // 获取需求确认结果
  getRequirementResult: (sessionId: string) =>
    request(`/api/v1/ai-engine/requirement/${sessionId}/result`),

  // 任务拆解
  decomposeTask: (taskId: string, confirmedRequirements: any) =>
    request('/api/v1/ai-engine/decompose', { method: 'POST', data: { taskId, confirmedRequirements } }),

  // 获取拆解结果
  getDecompositionResult: (taskId: string) =>
    request(`/api/v1/ai-engine/decompose/${taskId}`),

  // 提交作品审核
  submitForReview: (taskId: string, submissionUrl: string, description: string) =>
    request('/api/v1/ai-engine/review/submit', { method: 'POST', data: { taskId, submissionUrl, description } }),

  // 获取审核结果
  getReviewResult: (reviewId: string) =>
    request(`/api/v1/ai-engine/review/${reviewId}`),

  // AI问答
  askAI: (question: string, context?: any) =>
    request('/api/v1/ai-engine/qa', { method: 'POST', data: { question, context } }),

  // 获取问答历史
  getQAHistory: () =>
    request('/api/v1/ai-engine/qa/history')
}

// OPC测评与成长报告API
export const opcGrowthAPI = {
  // 提交OPC测评
  submitAssessment: (answers: any) =>
    request('/api/v1/opc-growth/assessments', { method: 'POST', data: { answers } }),

  // 获取测评结果
  getAssessmentResult: (assessmentId: string) =>
    request(`/api/v1/opc-growth/assessments/${assessmentId}`),

  // 获取成长报告
  getGrowthReport: (reportId: string) =>
    request(`/api/v1/opc-growth/reports/${reportId}`),

  // 获取成长报告列表
  getGrowthReports: () =>
    request('/api/v1/opc-growth/reports'),

  // 生成成长报告
  generateGrowthReport: (startDate: string, endDate: string) =>
    request('/api/v1/opc-growth/reports/generate', { method: 'POST', data: { startDate, endDate } }),

  // 获取能力雷达图数据
  getAbilityRadar: () =>
    request('/api/v1/opc-growth/ability-radar'),

  // 获取成长轨迹
  getGrowthTrajectory: () =>
    request('/api/v1/opc-growth/trajectory')
}

// 社群与作品展示API
export const communityPortfolioAPI = {
  // 获取社群列表
  getCommunities: () =>
    request('/api/v1/community-portfolio/communities'),

  // 加入社群
  joinCommunity: (communityId: string) =>
    request(`/api/v1/community-portfolio/communities/${communityId}/join`, { method: 'POST' }),

  // 退出社群
  leaveCommunity: (communityId: string) =>
    request(`/api/v1/community-portfolio/communities/${communityId}/leave`, { method: 'POST' }),

  // 获取社群帖子
  getCommunityPosts: (communityId: string) =>
    request(`/api/v1/community-portfolio/communities/${communityId}/posts`),

  // 发布帖子
  createPost: (communityId: string, content: string, images?: string[]) =>
    request('/api/v1/community-portfolio/posts', { method: 'POST', data: { communityId, content, images } }),

  // 点赞帖子
  likePost: (postId: string) =>
    request(`/api/v1/community-portfolio/posts/${postId}/like`, { method: 'POST' }),

  // 评论帖子
  commentPost: (postId: string, content: string) =>
    request(`/api/v1/community-portfolio/posts/${postId}/comments`, { method: 'POST', data: { content } }),

  // 获取作品集
  getPortfolio: (userId: string) =>
    request(`/api/v1/community-portfolio/portfolios/${userId}`),

  // 添加作品
  addPortfolioItem: (title: string, description: string, coverImage: string, contentUrl: string, tags: string[]) =>
    request('/api/v1/community-portfolio/portfolios/items', { method: 'POST', data: { title, description, coverImage, contentUrl, tags } }),

  // 获取热门作品
  getTrendingPortfolios: () =>
    request('/api/v1/community-portfolio/portfolios/trending')
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
  match: matchAPI,
  mentorNew: mentorNewAPI,
  milestone: milestoneAPI,
  lifeQuestion: lifeQuestionAPI,
  passionSpark: passionSparkAPI,
  partnership: partnershipAPI,
  exploration: explorationAPI,
  incubation: incubationAPI,
  alliance: allianceAPI,
  notification: notificationAPI,
  wallet: walletAPI,
  communication: communicationAPI,
  agreement: agreementAPI,
  challengeGraduation: challengeGraduationAPI,
  aiEngine: aiEngineAPI,
  opcGrowth: opcGrowthAPI,
  communityPortfolio: communityPortfolioAPI
}
