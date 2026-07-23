/**
 * 等级体系配置
 * "使命是河" - 从涉水到河成的成长旅程
 */

export interface LevelConfig {
  level: number
  name: string
  title: string
  description: string
  requiredExp: number // 升到下一级需要的总经验
  icon: string
  color: string
  unlocks: string[] // 解锁的功能/权益
  milestones: string[] // 这个等级的里程碑
}

/**
 * 等级体系：6个等级
 *
 * 理念："使命是河"
 * - 每个人都在河流中找到自己的节奏
 * - 不是竞争，是探索和成长
 * - 从试探到掌握，从跟随到创造
 */
export const LEVEL_SYSTEM: LevelConfig[] = [
  {
    level: 1,
    name: '涉水者',
    title: 'Wader',
    description: '刚刚踏入河流，小心翼翼地试探水的深浅。你在观察、感受、试探。',
    requiredExp: 1000,
    icon: '🦶',
    color: '#A8DADC',
    unlocks: [
      '接简单项目（easy难度）',
      '使用AI导师基础对话',
      '查看自己的能力雷达图',
      '记录热情火花'
    ],
    milestones: [
      '完成第一次OPC测评',
      '接下第一个项目',
      '和AI导师对话10次',
      '发现第一个热情火花'
    ]
  },
  {
    level: 2,
    name: '试流者',
    title: 'Flow Seeker',
    description: '开始感受水流的力量，学会顺着河流前进。你在尝试、调整、适应。',
    requiredExp: 3000,
    icon: '🌊',
    color: '#457B9D',
    unlocks: [
      '接中等项目（medium难度）',
      '解锁冒险项目推荐',
      '使用任务拆解功能',
      '查看成长对比报告'
    ],
    milestones: [
      '完成3个项目',
      '累计收入达到¥10,000',
      '捕捉到5个热情火花',
      '体验1次穿越感时刻'
    ]
  },
  {
    level: 3,
    name: '行舟者',
    title: 'Navigator',
    description: '能够驾驭小舟，在河流中自如移动。你在掌握、实践、精进。',
    requiredExp: 6000,
    icon: '⛵',
    color: '#1D3557',
    unlocks: [
      '接困难项目（hard难度）',
      '发布自己的项目到市场',
      '成为其他学生的"过河人"',
      '解锁秘密空间高级功能'
    ],
    milestones: [
      '完成10个项目',
      '累计收入达到¥30,000',
      '获得5次客户5星评价',
      '帮助3个新人完成首单'
    ]
  },
  {
    level: 4,
    name: '知向者',
    title: 'Direction Finder',
    description: '不仅懂得水流，还能判断方向。你在选择、决策、引领。',
    requiredExp: 10000,
    icon: '🧭',
    color: '#E63946',
    unlocks: [
      '接专家项目（expert难度）',
      '开设自己的工作室',
      '发起合作项目',
      '解锁生命问题深度探索'
    ],
    milestones: [
      '完成20个项目',
      '累计收入达到¥60,000',
      '连接生命问题与3个项目',
      '培养5个"行舟者"'
    ]
  },
  {
    level: 5,
    name: '自流者',
    title: 'Self Flow',
    description: '找到了自己的水流节奏，不再需要外界的指引。你在创造、表达、涌现。',
    requiredExp: 15000,
    icon: '💫',
    color: '#F4A261',
    unlocks: [
      '定制项目难度',
      '成为平台认证导师',
      '开设专属成长课程',
      '解锁故事墙展示位'
    ],
    milestones: [
      '完成50个项目',
      '累计收入达到¥100,000',
      '形成独特的工作风格',
      '影响10个"知向者"'
    ]
  },
  {
    level: 6,
    name: '河成者',
    title: 'River Maker',
    description: '你已经不只是在河中流动，而是成为河流本身。你在共创、传承、生生不息。',
    requiredExp: 999999, // 最高等级
    icon: '🌈',
    color: '#2A9D8F',
    unlocks: [
      '所有功能全部解锁',
      '成为平台合伙人',
      '参与平台决策',
      '永久故事墙殿堂'
    ],
    milestones: [
      '完成100个项目',
      '累计收入达到¥200,000',
      '培养20个"自流者"',
      '创造属于自己的河流'
    ]
  }
]

/**
 * 获取等级配置
 */
export function getLevelConfig(level: number): LevelConfig | undefined {
  return LEVEL_SYSTEM.find(l => l.level === level)
}

/**
 * 根据经验值获取等级
 */
export function getLevelByExp(exp: number): LevelConfig {
  for (let i = LEVEL_SYSTEM.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_SYSTEM[i].requiredExp) {
      return LEVEL_SYSTEM[i]
    }
  }
  return LEVEL_SYSTEM[0] // 默认返回第一级
}

/**
 * 计算升级进度
 */
export function calculateLevelProgress(exp: number): {
  currentLevel: LevelConfig
  nextLevel: LevelConfig | null
  currentLevelExp: number // 当前等级起始经验
  nextLevelExp: number // 下一等级起始经验
  progress: number // 升级进度 0-100
  expToNext: number // 距离升级还需要多少经验
} {
  const currentLevel = getLevelByExp(exp)
  const currentIndex = LEVEL_SYSTEM.findIndex(l => l.level === currentLevel.level)
  const nextLevel = currentIndex < LEVEL_SYSTEM.length - 1 ? LEVEL_SYSTEM[currentIndex + 1] : null

  if (!nextLevel) {
    // 已经是最高等级
    return {
      currentLevel,
      nextLevel: null,
      currentLevelExp: currentLevel.requiredExp,
      nextLevelExp: currentLevel.requiredExp,
      progress: 100,
      expToNext: 0
    }
  }

  const currentLevelExp = currentLevel.requiredExp
  const nextLevelExp = nextLevel.requiredExp
  const expInCurrentLevel = exp - currentLevelExp
  const expNeededForNext = nextLevelExp - currentLevelExp
  const progress = Math.min(100, Math.round((expInCurrentLevel / expNeededForNext) * 100))
  const expToNext = nextLevelExp - exp

  return {
    currentLevel,
    nextLevel,
    currentLevelExp,
    nextLevelExp,
    progress,
    expToNext
  }
}

/**
 * 经验值获取规则
 */
export const EXP_RULES = {
  // 完成项目
  completeProject: {
    easy: 100,
    medium: 200,
    hard: 400,
    expert: 800
  },

  // 客户评价奖励
  clientRating: {
    5: 50, // 5星
    4: 30, // 4星
    3: 10, // 3星
    2: 0,  // 2星
    1: 0   // 1星
  },

  // 首次达成
  firstTime: {
    completeOPC: 50,
    firstProject: 100,
    firstPassionSpark: 20,
    firstFlowMoment: 30,
    connectLifeQuestion: 50
  },

  // 里程碑
  milestones: {
    projects5: 100,
    projects10: 200,
    projects20: 500,
    projects50: 1000,
    income10k: 100,
    income30k: 300,
    income60k: 600,
    rating5count5: 200,
    helpNewbie: 150
  },

  // 成长行为
  growth: {
    aiChatDeep: 10, // 深度对话（超过5轮）
    passionSpark: 20, // 捕捉热情火花
    flowMoment: 30, // 体验穿越感
    selfReflection: 15, // 自我反思（秘密空间记录）
    shareStory: 50 // 分享成长故事
  },

  // 社区贡献
  community: {
    helpOthers: 50, // 帮助他人
    shareExperience: 30, // 分享经验
    mentoringSession: 100 // 指导新人
  }
}

/**
 * 计算项目完成经验值
 */
export function calculateProjectExp(
  difficulty: 'easy' | 'medium' | 'hard' | 'expert',
  rating?: number,
  isFirstProject?: boolean
): number {
  let exp = EXP_RULES.completeProject[difficulty]

  // 客户评价奖励
  if (rating && rating >= 3) {
    exp += EXP_RULES.clientRating[rating as 5 | 4 | 3]
  }

  // 首次完成奖励
  if (isFirstProject) {
    exp += EXP_RULES.firstTime.firstProject
  }

  return exp
}
