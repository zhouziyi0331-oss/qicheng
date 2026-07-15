// OPC测评题目V2 - 基于后端数据库的38题系统
// 2道开放题 + 36道选择题 (6个维度，每维度6题)

export interface OPCDimension {
  key: string
  name: string
  description: string
}

export interface OpenEndedQuestion {
  id: number
  type: 'open_ended'
  questionText: string
  promptText: string
  inputType: 'three_phrases' | 'multi_line'
  maxLength: number
}

export interface ChoiceOption {
  label: string
  text: string
  scoring: {
    dimension: string
    value: number
    direction: string
  }
}

export interface ChoiceQuestion {
  id: number
  type: 'choice'
  dimension: string
  questionText: string
  options: ChoiceOption[]
}

export type Question = OpenEndedQuestion | ChoiceQuestion

// 六个维度定义
export const OPC_DIMENSIONS: Record<string, OPCDimension> = {
  info_processing: {
    key: 'info_processing',
    name: '信息处理',
    description: '拆解型 ↔ 整合型'
  },
  creation_drive: {
    key: 'creation_drive',
    name: '创作驱动',
    description: '视觉型 ↔ 逻辑型'
  },
  tool_learning: {
    key: 'tool_learning',
    name: '工具学习',
    description: '探索型 ↔ 手册型'
  },
  task_execution: {
    key: 'task_execution',
    name: '任务执行',
    description: '规划型 ↔ 迭代型'
  },
  collaboration: {
    key: 'collaboration',
    name: '协作倾向',
    description: '独立型 ↔ 协作型'
  },
  risk_attitude: {
    key: 'risk_attitude',
    name: '风险态度',
    description: '稳健型 ↔ 冒险型'
  }
}

// 完整的38题
export const OPC_QUESTIONS_V2: Question[] = [
  // ===== 开放题 (2题) =====
  {
    id: 1,
    type: 'open_ended',
    questionText: '当你不能提及任何学校名称、专业、工作单位或光环头衔，你会如何用3个词或3句话介绍自己？剥去所有外在标签之后，你是谁？',
    promptText: '例如：好奇的 / 喜欢拆东西 / 想让事情变好一点\n不必修饰，想到什么写什么。',
    inputType: 'three_phrases',
    maxLength: 20
  },
  {
    id: 2,
    type: 'open_ended',
    questionText: '你做过的、让你自己觉得「还挺厉害的」一件事是什么？可以是任何领域的任何事——不必是大事，不必和成绩、奖项有关。我们看重的是你如何定义「厉害」。',
    promptText: '例如：搞定了一件特别麻烦的事 / 帮朋友度过了一个难关 / 坚持每天做一件事做了三个月 / 想出了一个别人没想到的办法……',
    inputType: 'multi_line',
    maxLength: 500
  },

  // ===== 信息处理 (6题, Q3-Q8) =====
  {
    id: 3,
    type: 'choice',
    dimension: 'info_processing',
    questionText: '接到一个模糊的需求时，你通常第一步做什么？',
    options: [
      { label: 'A', text: '先把需求拆成几个小块，逐个确认具体要什么', scoring: { dimension: 'info_processing', value: 3, direction: 'analytical' } },
      { label: 'B', text: '先问对方最终想要什么效果，倒推需要哪些东西', scoring: { dimension: 'info_processing', value: 3, direction: 'integrative' } },
      { label: 'C', text: '先找类似案例看看别人怎么做的', scoring: { dimension: 'info_processing', value: 1, direction: 'integrative' } },
      { label: 'D', text: '先自己画一个整体框架图，再和对方对齐', scoring: { dimension: 'info_processing', value: 2, direction: 'integrative' } }
    ]
  },
  {
    id: 4,
    type: 'choice',
    dimension: 'info_processing',
    questionText: '学习一个新领域时，你更习惯：',
    options: [
      { label: 'A', text: '先学最核心的几个概念，再向外扩展', scoring: { dimension: 'info_processing', value: 1, direction: 'analytical' } },
      { label: 'B', text: '先画出整个领域的知识地图，再决定从哪里切入', scoring: { dimension: 'info_processing', value: 3, direction: 'integrative' } },
      { label: 'C', text: '直接从具体案例入手，边做边理解', scoring: { dimension: 'info_processing', value: 2, direction: 'analytical' } },
      { label: 'D', text: '先找一本系统教材，按章节顺序学习', scoring: { dimension: 'info_processing', value: 2, direction: 'integrative' } }
    ]
  },
  {
    id: 5,
    type: 'choice',
    dimension: 'info_processing',
    questionText: '面对一个复杂问题时，你通常：',
    options: [
      { label: 'A', text: '先把它分解成几个小问题，一个一个解决', scoring: { dimension: 'info_processing', value: 3, direction: 'analytical' } },
      { label: 'B', text: '先找出问题的核心症结，只解决最关键的', scoring: { dimension: 'info_processing', value: 1, direction: 'integrative' } },
      { label: 'C', text: '先想几种可能的方案，快速测试哪个方向对', scoring: { dimension: 'info_processing', value: 1, direction: 'analytical' } },
      { label: 'D', text: '先收集足够的信息，确保理解全局后再动手', scoring: { dimension: 'info_processing', value: 2, direction: 'integrative' } }
    ]
  },
  {
    id: 6,
    type: 'choice',
    dimension: 'info_processing',
    questionText: '整理一份资料时，你更倾向于：',
    options: [
      { label: 'A', text: '按逻辑层级分类，层层递进', scoring: { dimension: 'info_processing', value: 2, direction: 'analytical' } },
      { label: 'B', text: '按应用场景分类，方便查找使用', scoring: { dimension: 'info_processing', value: 1, direction: 'integrative' } },
      { label: 'C', text: '按时间线或流程顺序整理', scoring: { dimension: 'info_processing', value: 1, direction: 'analytical' } },
      { label: 'D', text: '用思维导图把各部分关系画出来', scoring: { dimension: 'info_processing', value: 3, direction: 'integrative' } }
    ]
  },
  {
    id: 7,
    type: 'choice',
    dimension: 'info_processing',
    questionText: '别人问你一个你懂的问题，你通常：',
    options: [
      { label: 'A', text: '从最基础的概念开始讲，确保对方理解透彻', scoring: { dimension: 'info_processing', value: 1, direction: 'analytical' } },
      { label: 'B', text: '直接给出结论，然后解释为什么', scoring: { dimension: 'info_processing', value: 1, direction: 'integrative' } },
      { label: 'C', text: '用类比的方式讲，让对方快速建立直观理解', scoring: { dimension: 'info_processing', value: 2, direction: 'integrative' } },
      { label: 'D', text: '问清楚对方已经知道什么，只补充缺失的部分', scoring: { dimension: 'info_processing', value: 3, direction: 'analytical' } }
    ]
  },
  {
    id: 8,
    type: 'choice',
    dimension: 'info_processing',
    questionText: '做一个项目时，你更关注：',
    options: [
      { label: 'A', text: '每个环节是否按计划推进', scoring: { dimension: 'info_processing', value: 2, direction: 'analytical' } },
      { label: 'B', text: '最终成果是否达到预期效果', scoring: { dimension: 'info_processing', value: 1, direction: 'integrative' } },
      { label: 'C', text: '过程中是否发现了新的可能性', scoring: { dimension: 'info_processing', value: 2, direction: 'integrative' } },
      { label: 'D', text: '各个部分之间是否协调一致', scoring: { dimension: 'info_processing', value: 3, direction: 'integrative' } }
    ]
  },
  // ===== 创作驱动 (6题, Q9-Q14) =====
  {
    id: 9,
    type: 'choice',
    dimension: 'creation_drive',
    questionText: '看到一个好的作品，你更容易被什么打动？',
    options: [
      { label: 'A', text: '视觉冲击力——构图、色彩、光影', scoring: { dimension: 'creation_drive', value: 3, direction: 'visual' } },
      { label: 'B', text: '结构设计——信息组织、逻辑层次、叙事节奏', scoring: { dimension: 'creation_drive', value: 3, direction: 'logical' } },
      { label: 'C', text: '情感共鸣——传递的情绪和故事感', scoring: { dimension: 'creation_drive', value: 1, direction: 'visual' } },
      { label: 'D', text: '技术实现——背后的技术方案和实现难度', scoring: { dimension: 'creation_drive', value: 2, direction: 'logical' } }
    ]
  },
  {
    id: 10,
    type: 'choice',
    dimension: 'creation_drive',
    questionText: '你更享受哪种创作过程？',
    options: [
      { label: 'A', text: '在空白画布上从无到有地构建画面', scoring: { dimension: 'creation_drive', value: 3, direction: 'visual' } },
      { label: 'B', text: '把混乱的信息整理成清晰的结构', scoring: { dimension: 'creation_drive', value: 3, direction: 'logical' } },
      { label: 'C', text: '用已有素材拼贴组合出新的东西', scoring: { dimension: 'creation_drive', value: 1, direction: 'visual' } },
      { label: 'D', text: '设定一套规则，让系统自动生成内容', scoring: { dimension: 'creation_drive', value: 2, direction: 'logical' } }
    ]
  },
  {
    id: 11,
    type: 'choice',
    dimension: 'creation_drive',
    questionText: '描述一件事物时，你更习惯：',
    options: [
      { label: 'A', text: '用画面感的语言，让人"看到"', scoring: { dimension: 'creation_drive', value: 3, direction: 'visual' } },
      { label: 'B', text: '用结构化的语言，分点说明', scoring: { dimension: 'creation_drive', value: 3, direction: 'logical' } },
      { label: 'C', text: '用故事的方式讲，有起承转合', scoring: { dimension: 'creation_drive', value: 1, direction: 'visual' } },
      { label: 'D', text: '用类比和比喻，让人快速理解', scoring: { dimension: 'creation_drive', value: 1, direction: 'logical' } }
    ]
  },
  {
    id: 12,
    type: 'choice',
    dimension: 'creation_drive',
    questionText: '给你一个"设计一个AI助手"的任务，你最先想到的是：',
    options: [
      { label: 'A', text: '它的界面长什么样，交互方式是否自然', scoring: { dimension: 'creation_drive', value: 2, direction: 'visual' } },
      { label: 'B', text: '它能解决什么问题，功能逻辑怎么设计', scoring: { dimension: 'creation_drive', value: 3, direction: 'logical' } },
      { label: 'C', text: '它的"性格"是什么样的，说话语气如何', scoring: { dimension: 'creation_drive', value: 1, direction: 'visual' } },
      { label: 'D', text: '它的技术架构怎么搭，用哪些模型和工具', scoring: { dimension: 'creation_drive', value: 2, direction: 'logical' } }
    ]
  },
  {
    id: 13,
    type: 'choice',
    dimension: 'creation_drive',
    questionText: '你觉得自己在哪方面更有天赋？',
    options: [
      { label: 'A', text: '视觉审美——能判断什么好看、什么不协调', scoring: { dimension: 'creation_drive', value: 3, direction: 'visual' } },
      { label: 'B', text: '逻辑梳理——能把复杂的事情讲清楚', scoring: { dimension: 'creation_drive', value: 3, direction: 'logical' } },
      { label: 'C', text: '情感洞察——能感知到别人的情绪和需求', scoring: { dimension: 'creation_drive', value: 1, direction: 'visual' } },
      { label: 'D', text: '系统思维——能设计一套规则让事情自动运行', scoring: { dimension: 'creation_drive', value: 2, direction: 'logical' } }
    ]
  },
  {
    id: 14,
    type: 'choice',
    dimension: 'creation_drive',
    questionText: '如果让你做一个内容账号，你更可能做：',
    options: [
      { label: 'A', text: '视觉类——摄影、设计、插画、视频', scoring: { dimension: 'creation_drive', value: 3, direction: 'visual' } },
      { label: 'B', text: '知识类——深度分析、行业观察、方法总结', scoring: { dimension: 'creation_drive', value: 3, direction: 'logical' } },
      { label: 'C', text: '故事类——个人经历、人物访谈、叙事内容', scoring: { dimension: 'creation_drive', value: 1, direction: 'visual' } },
      { label: 'D', text: '工具类——教程、资源推荐、效率技巧', scoring: { dimension: 'creation_drive', value: 2, direction: 'logical' } }
    ]
  },

  // ===== 工具学习 (6题, Q15-Q20) =====
  {
    id: 15,
    type: 'choice',
    dimension: 'tool_learning',
    questionText: '拿到一个从没用过的AI工具，你通常：',
    options: [
      { label: 'A', text: '直接开始试用，边点边学', scoring: { dimension: 'tool_learning', value: 3, direction: 'exploratory' } },
      { label: 'B', text: '先看别人用它的视频，再自己试', scoring: { dimension: 'tool_learning', value: 1, direction: 'exploratory' } },
      { label: 'C', text: '先想清楚自己想用它做什么，再去找对应功能', scoring: { dimension: 'tool_learning', value: 1, direction: 'manual' } },
      { label: 'D', text: '先看官方文档或教程，系统了解功能', scoring: { dimension: 'tool_learning', value: 3, direction: 'manual' } }
    ]
  },
  {
    id: 16,
    type: 'choice',
    dimension: 'tool_learning',
    questionText: '遇到一个功能不知道怎么用时，你通常：',
    options: [
      { label: 'A', text: '自己到处点点，总能试出来', scoring: { dimension: 'tool_learning', value: 3, direction: 'exploratory' } },
      { label: 'B', text: '搜索一下，看有没有人分享过方法', scoring: { dimension: 'tool_learning', value: 1, direction: 'exploratory' } },
      { label: 'C', text: '问身边用过的人或AI助手', scoring: { dimension: 'tool_learning', value: 1, direction: 'manual' } },
      { label: 'D', text: '去看官方帮助文档', scoring: { dimension: 'tool_learning', value: 3, direction: 'manual' } }
    ]
  },
  {
    id: 17,
    type: 'choice',
    dimension: 'tool_learning',
    questionText: '学习新工具时，你更看重：',
    options: [
      { label: 'A', text: '能不能快速上手做出第一个东西', scoring: { dimension: 'tool_learning', value: 2, direction: 'exploratory' } },
      { label: 'B', text: '能不能找到足够多的教程和案例', scoring: { dimension: 'tool_learning', value: 1, direction: 'manual' } },
      { label: 'C', text: '能不能理解它的底层逻辑和限制', scoring: { dimension: 'tool_learning', value: 3, direction: 'manual' } },
      { label: 'D', text: '能不能把它整合到自己的工作流里', scoring: { dimension: 'tool_learning', value: 1, direction: 'exploratory' } }
    ]
  },
  {
    id: 18,
    type: 'choice',
    dimension: 'tool_learning',
    questionText: '你对工具的态度更接近：',
    options: [
      { label: 'A', text: '工具够用就行，不追求最新最全', scoring: { dimension: 'tool_learning', value: 1, direction: 'manual' } },
      { label: 'B', text: '喜欢尝试新工具，但只深入用几款核心的', scoring: { dimension: 'tool_learning', value: 2, direction: 'exploratory' } },
      { label: 'C', text: '会花时间精通一款工具，把它用到极致', scoring: { dimension: 'tool_learning', value: 3, direction: 'manual' } },
      { label: 'D', text: '持续关注新工具，保持工具链更新', scoring: { dimension: 'tool_learning', value: 1, direction: 'exploratory' } }
    ]
  },
  {
    id: 19,
    type: 'choice',
    dimension: 'tool_learning',
    questionText: '教别人用一款工具时，你通常：',
    options: [
      { label: 'A', text: '直接演示一遍，让他跟着做', scoring: { dimension: 'tool_learning', value: 2, direction: 'exploratory' } },
      { label: 'B', text: '告诉他核心逻辑，剩下的他自己摸索', scoring: { dimension: 'tool_learning', value: 1, direction: 'manual' } },
      { label: 'C', text: '先问他想达成什么效果，告诉他对应的功能在哪', scoring: { dimension: 'tool_learning', value: 2, direction: 'manual' } },
      { label: 'D', text: '从界面布局开始，系统讲一遍', scoring: { dimension: 'tool_learning', value: 3, direction: 'manual' } }
    ]
  },
  {
    id: 20,
    type: 'choice',
    dimension: 'tool_learning',
    questionText: '你觉得一个好的工具应该：',
    options: [
      { label: 'A', text: '上手简单，不需要看说明书就能用', scoring: { dimension: 'tool_learning', value: 3, direction: 'exploratory' } },
      { label: 'B', text: '功能强大，能满足各种复杂需求', scoring: { dimension: 'tool_learning', value: 1, direction: 'manual' } },
      { label: 'C', text: '有丰富的社区和教程资源', scoring: { dimension: 'tool_learning', value: 2, direction: 'manual' } },
      { label: 'D', text: '能和其他工具灵活组合使用', scoring: { dimension: 'tool_learning', value: 1, direction: 'exploratory' } }
    ]
  },

  // ===== 任务执行 (6题, Q21-Q26) =====
  {
    id: 21,
    type: 'choice',
    dimension: 'task_execution',
    questionText: '开始一项新任务时，你通常：',
    options: [
      { label: 'A', text: '先做一个详细计划，按步骤执行', scoring: { dimension: 'task_execution', value: 3, direction: 'planning' } },
      { label: 'B', text: '先快速出一个粗糙版本，看看方向对不对', scoring: { dimension: 'task_execution', value: 3, direction: 'iterative' } },
      { label: 'C', text: '先收集足够的信息和参考，再动手', scoring: { dimension: 'task_execution', value: 1, direction: 'planning' } },
      { label: 'D', text: '先和需求方反复确认，确保理解一致', scoring: { dimension: 'task_execution', value: 2, direction: 'planning' } }
    ]
  },
  {
    id: 22,
    type: 'choice',
    dimension: 'task_execution',
    questionText: '任务进行到一半发现方向可能有问题，你通常：',
    options: [
      { label: 'A', text: '停下来重新评估，调整计划后继续', scoring: { dimension: 'task_execution', value: 2, direction: 'planning' } },
      { label: 'B', text: '先继续做，在过程中逐步修正', scoring: { dimension: 'task_execution', value: 3, direction: 'iterative' } },
      { label: 'C', text: '先把当前版本做完，下一版再改', scoring: { dimension: 'task_execution', value: 1, direction: 'iterative' } },
      { label: 'D', text: '立即和需求方沟通，确认是否需要调整', scoring: { dimension: 'task_execution', value: 1, direction: 'planning' } }
    ]
  },
  {
    id: 23,
    type: 'choice',
    dimension: 'task_execution',
    questionText: '面对多个任务并行时，你通常：',
    options: [
      { label: 'A', text: '排好优先级，做完一个再做下一个', scoring: { dimension: 'task_execution', value: 3, direction: 'planning' } },
      { label: 'B', text: '几个任务轮着做，保持新鲜感', scoring: { dimension: 'task_execution', value: 1, direction: 'iterative' } },
      { label: 'C', text: '看哪个任务最有灵感就先做哪个', scoring: { dimension: 'task_execution', value: 3, direction: 'iterative' } },
      { label: 'D', text: '把相似的任务批量处理', scoring: { dimension: 'task_execution', value: 2, direction: 'planning' } }
    ]
  },
  {
    id: 24,
    type: 'choice',
    dimension: 'task_execution',
    questionText: '交付前的时间压力下，你通常：',
    options: [
      { label: 'A', text: '按既定计划推进，确保质量不降', scoring: { dimension: 'task_execution', value: 3, direction: 'planning' } },
      { label: 'B', text: '聚焦最核心的部分，砍掉非必需内容', scoring: { dimension: 'task_execution', value: 2, direction: 'iterative' } },
      { label: 'C', text: '加快速度，能用捷径就用捷径', scoring: { dimension: 'task_execution', value: 3, direction: 'iterative' } },
      { label: 'D', text: '沟通是否可以延期或分批交付', scoring: { dimension: 'task_execution', value: 1, direction: 'planning' } }
    ]
  },
  {
    id: 25,
    type: 'choice',
    dimension: 'task_execution',
    questionText: '你更适应哪种工作节奏？',
    options: [
      { label: 'A', text: '稳定的日常节奏，每天推进固定进度', scoring: { dimension: 'task_execution', value: 3, direction: 'planning' } },
      { label: 'B', text: '冲刺式，集中一段时间高强度完成', scoring: { dimension: 'task_execution', value: 1, direction: 'iterative' } },
      { label: 'C', text: '随性的，有灵感就多做，没灵感就少做', scoring: { dimension: 'task_execution', value: 3, direction: 'iterative' } },
      { label: 'D', text: '看任务类型而定，不同任务不同节奏', scoring: { dimension: 'task_execution', value: 1, direction: 'planning' } }
    ]
  },
  {
    id: 26,
    type: 'choice',
    dimension: 'task_execution',
    questionText: '一个项目完成后，你通常会：',
    options: [
      { label: 'A', text: '复盘总结，记录可以优化的地方', scoring: { dimension: 'task_execution', value: 2, direction: 'planning' } },
      { label: 'B', text: '看最终效果是否达到预期，不太纠结过程', scoring: { dimension: 'task_execution', value: 1, direction: 'iterative' } },
      { label: 'C', text: '收集反馈，看看哪里还可以更好', scoring: { dimension: 'task_execution', value: 3, direction: 'iterative' } },
      { label: 'D', text: '直接进入下一个项目，不喜欢回头看', scoring: { dimension: 'task_execution', value: 2, direction: 'iterative' } }
    ]
  },

  // ===== 协作倾向 (6题, Q27-Q32) =====
  {
    id: 27,
    type: 'choice',
    dimension: 'collaboration',
    questionText: '在一个项目中，你更享受：',
    options: [
      { label: 'A', text: '自己从头到尾负责一个完整模块', scoring: { dimension: 'collaboration', value: 3, direction: 'independent' } },
      { label: 'B', text: '和他人分工配合，各做自己擅长的部分', scoring: { dimension: 'collaboration', value: 3, direction: 'collaborative' } },
      { label: 'C', text: '负责整体统筹协调，把大家组织起来', scoring: { dimension: 'collaboration', value: 2, direction: 'collaborative' } },
      { label: 'D', text: '做那个提供关键解决方案的人', scoring: { dimension: 'collaboration', value: 1, direction: 'independent' } }
    ]
  },
  {
    id: 28,
    type: 'choice',
    dimension: 'collaboration',
    questionText: '和他人合作时，你更在意：',
    options: [
      { label: 'A', text: '分工是否清晰，边界是否明确', scoring: { dimension: 'collaboration', value: 2, direction: 'independent' } },
      { label: 'B', text: '沟通是否顺畅，信息是否同步', scoring: { dimension: 'collaboration', value: 3, direction: 'collaborative' } },
      { label: 'C', text: '对方的专业能力是否可靠', scoring: { dimension: 'collaboration', value: 1, direction: 'independent' } },
      { label: 'D', text: '大家的审美和标准是否一致', scoring: { dimension: 'collaboration', value: 1, direction: 'collaborative' } }
    ]
  },
  {
    id: 29,
    type: 'choice',
    dimension: 'collaboration',
    questionText: '当你对队友的交付物不满意时，你通常：',
    options: [
      { label: 'A', text: '自己动手改，比沟通快', scoring: { dimension: 'collaboration', value: 3, direction: 'independent' } },
      { label: 'B', text: '直接指出问题，给出具体修改意见', scoring: { dimension: 'collaboration', value: 1, direction: 'independent' } },
      { label: 'C', text: '先肯定做得好的部分，再提建议', scoring: { dimension: 'collaboration', value: 3, direction: 'collaborative' } },
      { label: 'D', text: '问清楚对方的思路，理解为什么这样做', scoring: { dimension: 'collaboration', value: 2, direction: 'collaborative' } }
    ]
  },
  {
    id: 30,
    type: 'choice',
    dimension: 'collaboration',
    questionText: '你更倾向于哪种沟通方式？',
    options: [
      { label: 'A', text: '文字沟通——异步、有记录、可回溯', scoring: { dimension: 'collaboration', value: 2, direction: 'independent' } },
      { label: 'B', text: '语音或面对面——同步、高效、有情感', scoring: { dimension: 'collaboration', value: 3, direction: 'collaborative' } },
      { label: 'C', text: '看情况——简单的事文字，复杂的事语音', scoring: { dimension: 'collaboration', value: 1, direction: 'collaborative' } },
      { label: 'D', text: '用具体案例或参考图代替语言描述', scoring: { dimension: 'collaboration', value: 1, direction: 'independent' } }
    ]
  },
  {
    id: 31,
    type: 'choice',
    dimension: 'collaboration',
    questionText: '你觉得一个理想的工作伙伴应该是：',
    options: [
      { label: 'A', text: '专业可靠，不需要我操心他的部分', scoring: { dimension: 'collaboration', value: 3, direction: 'independent' } },
      { label: 'B', text: '沟通顺畅，有问题能及时同步', scoring: { dimension: 'collaboration', value: 2, direction: 'collaborative' } },
      { label: 'C', text: '审美和标准一致，不用太多解释', scoring: { dimension: 'collaboration', value: 1, direction: 'independent' } },
      { label: 'D', text: '能互相启发，一起碰撞出更好的方案', scoring: { dimension: 'collaboration', value: 3, direction: 'collaborative' } }
    ]
  },
  {
    id: 32,
    type: 'choice',
    dimension: 'collaboration',
    questionText: '接到一个需要和别人合作完成的任务，你首先：',
    options: [
      { label: 'A', text: '明确自己的分工范围，确保自己能独立完成', scoring: { dimension: 'collaboration', value: 3, direction: 'independent' } },
      { label: 'B', text: '和对方对齐整体目标，确保方向一致', scoring: { dimension: 'collaboration', value: 2, direction: 'collaborative' } },
      { label: 'C', text: '了解对方擅长什么，思考怎么配合', scoring: { dimension: 'collaboration', value: 3, direction: 'collaborative' } },
      { label: 'D', text: '先自己理一遍整体思路，再和对方碰', scoring: { dimension: 'collaboration', value: 1, direction: 'independent' } }
    ]
  },

  // ===== 风险态度 (6题, Q33-Q38) =====
  {
    id: 33,
    type: 'choice',
    dimension: 'risk_attitude',
    questionText: '面对一个从未做过的项目类型，你通常：',
    options: [
      { label: 'A', text: '先评估自己能不能做，不确定就拒绝', scoring: { dimension: 'risk_attitude', value: 3, direction: 'conservative' } },
      { label: 'B', text: '愿意尝试，但会提前说明可能的风险', scoring: { dimension: 'risk_attitude', value: 1, direction: 'conservative' } },
      { label: 'C', text: '兴奋，觉得是个学习机会，直接接', scoring: { dimension: 'risk_attitude', value: 3, direction: 'adventurous' } },
      { label: 'D', text: '先找有经验的人咨询，再决定是否接', scoring: { dimension: 'risk_attitude', value: 2, direction: 'conservative' } }
    ]
  },
  {
    id: 34,
    type: 'choice',
    dimension: 'risk_attitude',
    questionText: '当你在项目中遇到一个完全不会的技术点时，你通常：',
    options: [
      { label: 'A', text: '先自己研究，花时间学会它', scoring: { dimension: 'risk_attitude', value: 2, direction: 'adventurous' } },
      { label: 'B', text: '找替代方案，绕过这个技术点', scoring: { dimension: 'risk_attitude', value: 1, direction: 'conservative' } },
      { label: 'C', text: '找人请教或外包这个部分', scoring: { dimension: 'risk_attitude', value: 2, direction: 'conservative' } },
      { label: 'D', text: '评估这个点是否必须，不是必须就砍掉', scoring: { dimension: 'risk_attitude', value: 1, direction: 'adventurous' } }
    ]
  },
  {
    id: 35,
    type: 'choice',
    dimension: 'risk_attitude',
    questionText: '你更喜欢接什么样的项目？',
    options: [
      { label: 'A', text: '自己熟悉领域的，能稳定高质量交付', scoring: { dimension: 'risk_attitude', value: 3, direction: 'conservative' } },
      { label: 'B', text: '有一点挑战的，能学到新东西但不至于失控', scoring: { dimension: 'risk_attitude', value: 1, direction: 'conservative' } },
      { label: 'C', text: '完全没做过的，边学边做才有意思', scoring: { dimension: 'risk_attitude', value: 3, direction: 'adventurous' } },
      { label: 'D', text: '看收入，收入高就愿意挑战难的', scoring: { dimension: 'risk_attitude', value: 1, direction: 'adventurous' } }
    ]
  },
  {
    id: 36,
    type: 'choice',
    dimension: 'risk_attitude',
    questionText: '你觉得"冒险"对你来说意味着：',
    options: [
      { label: 'A', text: '谨慎评估后的有限尝试', scoring: { dimension: 'risk_attitude', value: 2, direction: 'conservative' } },
      { label: 'B', text: '为了成长必须付出的代价', scoring: { dimension: 'risk_attitude', value: 1, direction: 'adventurous' } },
      { label: 'C', text: '工作中最让人兴奋的部分', scoring: { dimension: 'risk_attitude', value: 3, direction: 'adventurous' } },
      { label: 'D', text: '能避免就尽量避免', scoring: { dimension: 'risk_attitude', value: 3, direction: 'conservative' } }
    ]
  },
  {
    id: 37,
    type: 'choice',
    dimension: 'risk_attitude',
    questionText: '一个项目如果失败，你更可能归因于：',
    options: [
      { label: 'A', text: '前期评估不足，接了自己做不了的任务', scoring: { dimension: 'risk_attitude', value: 1, direction: 'conservative' } },
      { label: 'B', text: '过程中某个环节出了问题', scoring: { dimension: 'risk_attitude', value: 1, direction: 'adventurous' } },
      { label: 'C', text: '需求不清晰或频繁变动', scoring: { dimension: 'risk_attitude', value: 2, direction: 'conservative' } },
      { label: 'D', text: '运气不好，遇到不可控因素', scoring: { dimension: 'risk_attitude', value: 2, direction: 'adventurous' } }
    ]
  },
  {
    id: 38,
    type: 'choice',
    dimension: 'risk_attitude',
    questionText: '你对"稳定"和"成长"的看法更接近：',
    options: [
      { label: 'A', text: '先有稳定交付能力，再追求成长', scoring: { dimension: 'risk_attitude', value: 3, direction: 'conservative' } },
      { label: 'B', text: '在成长中建立稳定，两者同步', scoring: { dimension: 'risk_attitude', value: 1, direction: 'adventurous' } },
      { label: 'C', text: '成长优先，稳定是成长的副产品', scoring: { dimension: 'risk_attitude', value: 3, direction: 'adventurous' } },
      { label: 'D', text: '看阶段，初期追求成长，后期追求稳定', scoring: { dimension: 'risk_attitude', value: 1, direction: 'conservative' } }
    ]
  }
]
