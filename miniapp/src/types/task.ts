// 任务赛道类型
export type TaskTrack = 'content' | 'tool'

// 任务等级
export type TaskLevel = 0 | 1 | 2 | 3 | 4

// 赛道A：AI内容创作线
export const CONTENT_TRACK_LEVELS = {
  0: {
    level: 0,
    name: 'Lv.0 入门',
    contentTask: 'AI生成单张图片/简单图文',
    toolTask: 'AI辅助简单文档/表格',
    requirement: '完成初始测试，零基础入门',
    reward: '50-200元',
    skills: ['AI工具基础使用', '提示词编写入门']
  },
  1: {
    level: 1,
    name: 'Lv.1 初级',
    contentTask: 'AI生成系列图/短视频',
    toolTask: 'AI生成简单小程序/工具',
    requirement: '完成Lv.0任务2个 + 升级测试',
    reward: '200-800元',
    skills: ['系列内容策划', '视频剪辑基础', '小程序开发入门']
  },
  2: {
    level: 2,
    name: 'Lv.2 中级',
    contentTask: 'AI生成完整视频/短剧',
    toolTask: 'AI搭建功能性小程序',
    requirement: '完成Lv.1任务3个 + 升级测试',
    reward: '800-2000元',
    skills: ['完整作品交付', '用户体验设计', 'Agent开发基础']
  },
  3: {
    level: 3,
    name: 'Lv.3 高级',
    contentTask: 'AI生成长漫剧/系列内容',
    toolTask: 'AI搭建基础Agent',
    requirement: '完成Lv.2任务3个 + 升级测试',
    reward: '2000-5000元',
    skills: ['IP运营', '自动化系统', '复杂Agent开发']
  },
  4: {
    level: 4,
    name: 'Lv.4 专家',
    contentTask: '品牌内容矩阵/IP运营',
    toolTask: '复杂Agent/自动化系统',
    requirement: '完成Lv.3任务3个 + 专家评审',
    reward: '5000-20000元',
    skills: ['内容战略/团队协作', '大型平台/产品级项目']
  }
} as const

// 任务接口
export interface Task {
  id: string
  title: string
  description: string
  track: TaskTrack // 'content' 或 'tool'
  level: TaskLevel // 0-4

  // 能力要求（六维）
  requiredAbilities: {
    openness: number      // 开放性
    persistence: number   // 坚持性
    creativity: number    // 创造性
  }

  // 项目信息
  budget: number           // 预算
  budgetRange: string      // 预算区间显示
  deadline: string         // 截止时间
  duration: string         // 预计时长
  deliverables: string[]   // 交付物清单

  // 企业信息
  companyId: string
  companyName: string
  companyRating: number
  companyVerified: boolean // 是否为线下验证的真实企业

  // 匹配信息（学生端显示）
  matchScore?: number      // 匹配度评分 0-100
  matchReason?: string     // 匹配理由
  difficultyAssessment?: string // 难度评估
  growthValue?: string     // 能力提升价值

  // 状态
  status: 'pending' | 'in-progress' | 'completed' | 'rejected'
  tags: string[]
}

// 学生能力画像（六维）
export interface StudentAbility {
  userId: string

  // OPC六维能力
  openness: number         // 开放性 0-100
  persistence: number      // 坚持性 0-100
  creativity: number       // 创造性 0-100

  // 当前赛道和等级
  primaryTrack: TaskTrack  // 主赛道
  currentLevel: TaskLevel  // 当前等级

  // 完成任务统计
  completedTasks: {
    total: number
    byLevel: Record<TaskLevel, number>
    byTrack: Record<TaskTrack, number>
  }

  // 技能标签
  skills: string[]

  // 成长轨迹
  growthHistory: Array<{
    date: string
    level: TaskLevel
    track: TaskTrack
    milestone: string
  }>
}

// 匹配结果
export interface MatchResult {
  task: Task
  matchScore: number       // 匹配度 0-100
  matchReasons: string[]   // 匹配理由
  difficultyLevel: 'easy' | 'moderate' | 'challenging' | 'stretch'
  estimatedGrowth: {
    openness: number
    persistence: number
    creativity: number
  }
}
