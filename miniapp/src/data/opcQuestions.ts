// OPC测评题目设计 - 基于六维能力模型
// 每个维度4-5题，共25题

export const OPC_DIMENSIONS = {
  information_processing: {
    name: '信息处理',
    description: '你如何处理和组织信息：拆解型 vs 整合型'
  },
  creation_drive: {
    name: '创作驱动',
    description: '你的创作灵感来源：视觉型 vs 逻辑型'
  },
  tool_learning: {
    name: '工具学习',
    description: '你如何学习新工具：探索型 vs 手册型'
  },
  task_execution: {
    name: '任务执行',
    description: '你的执行风格：规划型 vs 迭代型'
  },
  collaboration: {
    name: '协作倾向',
    description: '你的工作偏好：独立型 vs 协作型'
  },
  risk_attitude: {
    name: '风险态度',
    description: '你对不确定性的态度：稳健型 vs 冒险型'
  }
}

export const testQuestions = [
  // ===== 信息处理 (5题) =====
  {
    id: 1,
    dimension: 'information_processing',
    question: '面对一个复杂项目时，你会？',
    options: [
      { text: '先看整体，理解各部分如何组合', value: 80, trait: 'integrative' },
      { text: '既看整体也看细节，灵活切换', value: 50, trait: 'balanced' },
      { text: '拆成小块，逐个理解每个部分', value: 20, trait: 'analytical' }
    ]
  },
  {
    id: 2,
    dimension: 'information_processing',
    question: '阅读技术文档时，你倾向于？',
    options: [
      { text: '快速浏览全文，把握主要脉络', value: 80, trait: 'holistic' },
      { text: '先看目录结构，再深入关键章节', value: 50, trait: 'structured' },
      { text: '从头到尾仔细阅读，不漏细节', value: 20, trait: 'detailed' }
    ]
  },
  {
    id: 3,
    dimension: 'information_processing',
    question: '做品牌设计时，你更关注？',
    options: [
      { text: '整体视觉风格和品牌一致性', value: 85, trait: 'systematic' },
      { text: '在统一基调下突出重点元素', value: 50, trait: 'adaptive' },
      { text: '每个设计元素的精确执行', value: 15, trait: 'precise' }
    ]
  },
  {
    id: 4,
    dimension: 'information_processing',
    question: '学习新领域知识时，你会？',
    options: [
      { text: '先建立知识地图，理解各概念关系', value: 75, trait: 'connective' },
      { text: '按照学习路径，从基础到进阶', value: 50, trait: 'progressive' },
      { text: '深钻单个概念，完全掌握再继续', value: 25, trait: 'thorough' }
    ]
  },
  {
    id: 5,
    dimension: 'information_processing',
    question: '整理笔记时，你更喜欢？',
    options: [
      { text: '用思维导图连接所有知识点', value: 80, trait: 'networked' },
      { text: '分类归档，建立清晰目录', value: 50, trait: 'organized' },
      { text: '按时间顺序，详细记录每一条', value: 20, trait: 'chronological' }
    ]
  },

  // ===== 创作驱动 (5题) =====
  {
    id: 6,
    dimension: 'creation_drive',
    question: '你在思考问题时，脑海中首先出现的是？',
    options: [
      { text: '画面、颜色、场景等视觉意象', value: 20, trait: 'visual' },
      { text: '时而是画面，时而是逻辑', value: 50, trait: 'mixed' },
      { text: '流程、结构、关系等逻辑框架', value: 80, trait: 'structural' }
    ]
  },
  {
    id: 7,
    dimension: 'creation_drive',
    question: '描述一个想法时，你更倾向？',
    options: [
      { text: '用比喻和视觉化描述', value: 15, trait: 'metaphorical' },
      { text: '结合画面和逻辑说明', value: 50, trait: 'comprehensive' },
      { text: '用清晰的逻辑步骤说明', value: 85, trait: 'logical' }
    ]
  },
  {
    id: 8,
    dimension: 'creation_drive',
    question: '解决设计问题时，你的灵感来自？',
    options: [
      { text: '看到美的事物，激发灵感', value: 20, trait: 'aesthetic' },
      { text: '既从美学也从功能出发', value: 50, trait: 'balanced' },
      { text: '分析用户需求和逻辑关系', value: 80, trait: 'analytical' }
    ]
  },
  {
    id: 9,
    dimension: 'creation_drive',
    question: '做PPT时，你更关注？',
    options: [
      { text: '视觉冲击力和美感', value: 25, trait: 'visual_first' },
      { text: '内容和视觉的平衡', value: 50, trait: 'harmonious' },
      { text: '信息架构和逻辑清晰', value: 75, trait: 'structure_first' }
    ]
  },
  {
    id: 10,
    dimension: 'creation_drive',
    question: '你认为好的设计是？',
    options: [
      { text: '让人眼前一亮，产生情感共鸣', value: 20, trait: 'emotional' },
      { text: '既美观又实用', value: 50, trait: 'pragmatic' },
      { text: '清晰传达信息，逻辑易懂', value: 80, trait: 'functional' }
    ]
  },

  // ===== 工具学习 (5题) =====
  {
    id: 11,
    dimension: 'tool_learning',
    question: '拿到一个新AI工具时，你会？',
    options: [
      { text: '直接打开，边试边学', value: 20, trait: 'experimental' },
      { text: '看一下教程，再动手试', value: 50, trait: 'guided' },
      { text: '先看完整文档，理解原理再用', value: 80, trait: 'systematic' }
    ]
  },
  {
    id: 12,
    dimension: 'tool_learning',
    question: '学Midjourney这类工具时，你倾向？',
    options: [
      { text: '看别人作品，直接模仿尝试', value: 25, trait: 'imitative' },
      { text: '跟着教程实操，逐步掌握', value: 50, trait: 'tutorial_based' },
      { text: '研究参数逻辑，系统学习', value: 75, trait: 'principle_based' }
    ]
  },
  {
    id: 13,
    dimension: 'tool_learning',
    question: '遇到工具Bug或不会用的功能时？',
    options: [
      { text: '换个方式试试，通常能绕过去', value: 20, trait: 'adaptive' },
      { text: '搜索一下解决方案', value: 50, trait: 'resourceful' },
      { text: '查官方文档，搞清楚为什么', value: 80, trait: 'investigative' }
    ]
  },
  {
    id: 14,
    dimension: 'tool_learning',
    question: '你认为最高效的学习方式是？',
    options: [
      { text: '在实际项目中快速上手', value: 15, trait: 'project_driven' },
      { text: '做小练习，熟悉常用功能', value: 50, trait: 'practice_based' },
      { text: '系统学习，掌握完整能力', value: 85, trait: 'comprehensive' }
    ]
  },
  {
    id: 15,
    dimension: 'tool_learning',
    question: '完成3个项目后，你对工具的掌握？',
    options: [
      { text: '能做出想要的效果，但不清楚原理', value: 20, trait: 'intuitive' },
      { text: '掌握常用功能，知道大概逻辑', value: 50, trait: 'practical' },
      { text: '理解底层机制，能发挥高级功能', value: 80, trait: 'mastery' }
    ]
  },

  // ===== 任务执行 (5题) =====
  {
    id: 16,
    dimension: 'task_execution',
    question: '接到新任务时，你会？',
    options: [
      { text: '列详细计划，每步都想清楚再动手', value: 20, trait: 'planned' },
      { text: '有大致思路，边做边调整', value: 50, trait: 'flexible' },
      { text: '快速出第一版，再根据反馈迭代', value: 80, trait: 'iterative' }
    ]
  },
  {
    id: 17,
    dimension: 'task_execution',
    question: '做设计时，你的流程是？',
    options: [
      { text: '先构思完整方案，再开始制作', value: 25, trait: 'pre_planned' },
      { text: '边做边想，适时调整方向', value: 50, trait: 'emergent' },
      { text: '快速做多个草稿，选最好的深化', value: 75, trait: 'explorative' }
    ]
  },
  {
    id: 18,
    dimension: 'task_execution',
    question: '项目进行到一半，发现方向不对？',
    options: [
      { text: '重新规划，从头开始', value: 20, trait: 'restart' },
      { text: '调整部分方向，保留可用部分', value: 50, trait: 'adaptive' },
      { text: '这很正常，快速试新方向', value: 80, trait: 'agile' }
    ]
  },
  {
    id: 19,
    dimension: 'task_execution',
    question: '你觉得什么时候该交付？',
    options: [
      { text: '达到设想的标准才交付', value: 20, trait: 'perfectionist' },
      { text: '完成核心需求就可以交付', value: 50, trait: 'pragmatic' },
      { text: '先交付60%，根据反馈快速迭代', value: 80, trait: 'lean' }
    ]
  },
  {
    id: 20,
    dimension: 'task_execution',
    question: '回顾项目时，你更关注？',
    options: [
      { text: '计划执行得怎么样', value: 25, trait: 'process_oriented' },
      { text: '结果和过程的平衡', value: 50, trait: 'balanced' },
      { text: '学到什么，下次如何更快', value: 75, trait: 'learning_oriented' }
    ]
  },

  // ===== 协作倾向 (3题) =====
  {
    id: 21,
    dimension: 'collaboration',
    question: '你更喜欢的工作方式是？',
    options: [
      { text: '独立完成整个项目，自己掌控', value: 20, trait: 'independent' },
      { text: '看项目情况，独立或协作都可以', value: 50, trait: 'versatile' },
      { text: '和他人分工协作，发挥各自优势', value: 80, trait: 'collaborative' }
    ]
  },
  {
    id: 22,
    dimension: 'collaboration',
    question: '在团队项目中，你倾向？',
    options: [
      { text: '负责一个独立模块，减少沟通成本', value: 25, trait: 'modular' },
      { text: '既能独立负责，也能协作配合', value: 50, trait: 'flexible' },
      { text: '和团队密切配合，频繁沟通对齐', value: 75, trait: 'integrative' }
    ]
  },
  {
    id: 23,
    dimension: 'collaboration',
    question: '收到合作者反馈时，你的感受？',
    options: [
      { text: '更喜欢按自己想法做，反馈会打乱节奏', value: 20, trait: 'autonomous' },
      { text: '适度采纳反馈，保持自己的主线', value: 50, trait: 'selective' },
      { text: '喜欢在讨论中碰撞，完善想法', value: 80, trait: 'collaborative' }
    ]
  },

  // ===== 风险态度 (2题) =====
  {
    id: 24,
    dimension: 'risk_attitude',
    question: '选择任务时，你更倾向？',
    options: [
      { text: '选有把握的，确保能高质量交付', value: 20, trait: 'conservative' },
      { text: '在能力范围内，接受适度挑战', value: 50, trait: 'moderate' },
      { text: '愿意尝试没做过的，边做边学', value: 80, trait: 'adventurous' }
    ]
  },
  {
    id: 25,
    dimension: 'risk_attitude',
    question: '对"失败"的看法？',
    options: [
      { text: '尽量避免，失败影响信心', value: 20, trait: 'risk_averse' },
      { text: '可以接受，但要控制在范围内', value: 50, trait: 'calculated' },
      { text: '失败是成长机会，快速试错', value: 80, trait: 'growth_mindset' }
    ]
  }
]

// 计算六维分数
export function calculateDimensionScores(answers: { questionId: number, value: number }[]): any {
  const dimensionScores: any = {
    information_processing: [],
    creation_drive: [],
    tool_learning: [],
    task_execution: [],
    collaboration: [],
    risk_attitude: []
  }

  // 按维度收集分数
  answers.forEach(answer => {
    const question = testQuestions.find(q => q.id === answer.questionId)
    if (question) {
      dimensionScores[question.dimension].push(answer.value)
    }
  })

  // 计算每个维度的平均分
  const scores: any = {}
  Object.keys(dimensionScores).forEach(dimension => {
    const values = dimensionScores[dimension]
    if (values.length > 0) {
      scores[dimension] = Math.round(
        values.reduce((sum: number, val: number) => sum + val, 0) / values.length
      )
    } else {
      scores[dimension] = 50 // 默认值
    }
  })

  return scores
}
