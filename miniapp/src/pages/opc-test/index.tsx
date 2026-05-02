import { View, Text, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { opcV2API } from '../../services/api'
import './index.scss'

// 2道前置定义题
const definitionQuestions = [
  {
    id: 'def_1',
    question: '用一句话定义你自己',
    placeholder: '例如：我是一个喜欢用视觉讲故事的人...'
  },
  {
    id: 'def_2',
    question: '你觉得自己什么地方厉害？',
    placeholder: '例如：我能把复杂的东西用简单的方式表达出来...'
  }
]

// 36道测试题数据 - 6维度 × 6题
const testQuestions = [
  // 维度一：信息处理风格 (6题)
  {
    id: 1,
    dimension: 'information_processing',
    dimensionName: '信息处理',
    question: '接到一个模糊的需求时，你通常第一步做什么？',
    options: [
      { text: '先把需求拆成几个小块，逐个确认具体要什么', score: 0 },
      { text: '先问对方最终想要什么效果，倒推需要哪些东西', score: 3 },
      { text: '先找类似案例看看别人怎么做的', score: 1 },
      { text: '先自己画一个整体框架图，再和对方对齐', score: 3 }
    ]
  },
  {
    id: 2,
    dimension: 'information_processing',
    dimensionName: '信息处理',
    question: '学习一个新领域时，你更习惯：',
    options: [
      { text: '先学最核心的几个概念，再向外扩展', score: 1 },
      { text: '先画出整个领域的知识地图，再决定从哪里切入', score: 3 },
      { text: '直接从具体案例入手，边做边理解', score: 0 },
      { text: '先找一本系统教材，按章节顺序学习', score: 2 }
    ]
  },
  {
    id: 3,
    dimension: 'information_processing',
    dimensionName: '信息处理',
    question: '面对一个复杂问题时，你通常：',
    options: [
      { text: '先把它分解成几个小问题，一个一个解决', score: 0 },
      { text: '先找出问题的核心症结，只解决最关键的', score: 3 },
      { text: '先想几种可能的方案，快速测试哪个方向对', score: 1 },
      { text: '先收集足够的信息，确保理解全局后再动手', score: 3 }
    ]
  },
  {
    id: 4,
    dimension: 'information_processing',
    dimensionName: '信息处理',
    question: '整理一份资料时，你更倾向于：',
    options: [
      { text: '按逻辑层级分类，层层递进', score: 1 },
      { text: '按应用场景分类，方便查找使用', score: 2 },
      { text: '按时间线或流程顺序整理', score: 0 },
      { text: '用思维导图把各部分关系画出来', score: 3 }
    ]
  },
  {
    id: 5,
    dimension: 'information_processing',
    dimensionName: '信息处理',
    question: '别人问你一个你懂的问题，你通常：',
    options: [
      { text: '从最基础的概念开始讲，确保对方理解透彻', score: 0 },
      { text: '直接给出结论，然后解释为什么', score: 2 },
      { text: '用类比的方式讲，让对方快速建立直观理解', score: 1 },
      { text: '问清楚对方已经知道什么，只补充缺失的部分', score: 3 }
    ]
  },
  {
    id: 6,
    dimension: 'information_processing',
    dimensionName: '信息处理',
    question: '做一个项目时，你更关注：',
    options: [
      { text: '每个环节是否按计划推进', score: 0 },
      { text: '最终成果是否达到预期效果', score: 2 },
      { text: '过程中是否发现了新的可能性', score: 1 },
      { text: '各个部分之间是否协调一致', score: 3 }
    ]
  },

  // 维度二：创作驱动偏好 (6题)
  {
    id: 7,
    dimension: 'creation_drive',
    dimensionName: '创作驱动',
    question: '看到一个好的作品，你更容易被什么打动？',
    options: [
      { text: '视觉冲击力——构图、色彩、光影', score: 0 },
      { text: '结构设计——信息组织、逻辑层次、叙事节奏', score: 2 },
      { text: '情感共鸣——传递的情绪和故事感', score: 1 },
      { text: '技术实现——背后的技术方案和实现难度', score: 3 }
    ]
  },
  {
    id: 8,
    dimension: 'creation_drive',
    dimensionName: '创作驱动',
    question: '你更享受哪种创作过程？',
    options: [
      { text: '在空白画布上从无到有地构建画面', score: 0 },
      { text: '把混乱的信息整理成清晰的结构', score: 2 },
      { text: '用已有素材拼贴组合出新的东西', score: 1 },
      { text: '设定一套规则，让系统自动生成内容', score: 3 }
    ]
  },
  {
    id: 9,
    dimension: 'creation_drive',
    dimensionName: '创作驱动',
    question: '描述一件事物时，你更习惯：',
    options: [
      { text: '用画面感的语言，让人"看到"', score: 0 },
      { text: '用结构化的语言，分点说明', score: 3 },
      { text: '用故事的方式讲，有起承转合', score: 1 },
      { text: '用类比和比喻，让人快速理解', score: 2 }
    ]
  },
  {
    id: 10,
    dimension: 'creation_drive',
    dimensionName: '创作驱动',
    question: '给你一个"设计一个AI助手"的任务，你最先想到的是：',
    options: [
      { text: '它的界面长什么样，交互方式是否自然', score: 0 },
      { text: '它能解决什么问题，功能逻辑怎么设计', score: 2 },
      { text: '它的"性格"是什么样的，说话语气如何', score: 1 },
      { text: '它的技术架构怎么搭，用哪些模型和工具', score: 3 }
    ]
  },
  {
    id: 11,
    dimension: 'creation_drive',
    dimensionName: '创作驱动',
    question: '你觉得自己在哪方面更有天赋？',
    options: [
      { text: '视觉审美——能判断什么好看、什么不协调', score: 0 },
      { text: '逻辑梳理——能把复杂的事情讲清楚', score: 2 },
      { text: '情感洞察——能感知到别人的情绪和需求', score: 1 },
      { text: '系统思维——能设计一套规则让事情自动运行', score: 3 }
    ]
  },
  {
    id: 12,
    dimension: 'creation_drive',
    dimensionName: '创作驱动',
    question: '如果让你做一个内容账号，你更可能做：',
    options: [
      { text: '视觉类——摄影、设计、插画、视频', score: 0 },
      { text: '知识类——深度分析、行业观察、方法总结', score: 2 },
      { text: '故事类——个人经历、人物访谈、叙事内容', score: 1 },
      { text: '工具类——教程、资源推荐、效率技巧', score: 3 }
    ]
  },

  // 维度三：工具学习方式 (6题)
  {
    id: 13,
    dimension: 'tool_learning',
    dimensionName: '工具学习',
    question: '拿到一个从没用过的AI工具，你通常：',
    options: [
      { text: '直接开始试用，边点边学', score: 0 },
      { text: '先看别人用它的视频，再自己试', score: 1 },
      { text: '先想清楚自己想用它做什么，再去找对应功能', score: 2 },
      { text: '先看官方文档或教程，系统了解功能', score: 3 }
    ]
  },
  {
    id: 14,
    dimension: 'tool_learning',
    dimensionName: '工具学习',
    question: '遇到一个功能不知道怎么用时，你通常：',
    options: [
      { text: '自己到处点点，总能试出来', score: 0 },
      { text: '搜索一下，看有没有人分享过方法', score: 1 },
      { text: '问身边用过的人或AI助手', score: 2 },
      { text: '去看官方帮助文档', score: 3 }
    ]
  },
  {
    id: 15,
    dimension: 'tool_learning',
    dimensionName: '工具学习',
    question: '学习新工具时，你更看重：',
    options: [
      { text: '能不能快速上手做出第一个东西', score: 0 },
      { text: '能不能找到足够多的教程和案例', score: 1 },
      { text: '能不能理解它的底层逻辑和限制', score: 3 },
      { text: '能不能把它整合到自己的工作流里', score: 2 }
    ]
  },
  {
    id: 16,
    dimension: 'tool_learning',
    dimensionName: '工具学习',
    question: '你对工具的态度更接近：',
    options: [
      { text: '工具够用就行，不追求最新最全', score: 2 },
      { text: '喜欢尝试新工具，但只深入用几款核心的', score: 1 },
      { text: '会花时间精通一款工具，把它用到极致', score: 3 },
      { text: '持续关注新工具，保持工具链更新', score: 0 }
    ]
  },
  {
    id: 17,
    dimension: 'tool_learning',
    dimensionName: '工具学习',
    question: '教别人用一款工具时，你通常：',
    options: [
      { text: '直接演示一遍，让他跟着做', score: 0 },
      { text: '告诉他核心逻辑，剩下的他自己摸索', score: 2 },
      { text: '先问他想达成什么效果，告诉他对应的功能在哪', score: 1 },
      { text: '从界面布局开始，系统讲一遍', score: 3 }
    ]
  },
  {
    id: 18,
    dimension: 'tool_learning',
    dimensionName: '工具学习',
    question: '你觉得一个好的工具应该：',
    options: [
      { text: '上手简单，不需要看说明书就能用', score: 0 },
      { text: '功能强大，能满足各种复杂需求', score: 2 },
      { text: '有丰富的社区和教程资源', score: 1 },
      { text: '能和其他工具灵活组合使用', score: 3 }
    ]
  },

  // 维度四：任务执行节奏 (6题)
  {
    id: 19,
    dimension: 'task_execution',
    dimensionName: '任务执行',
    question: '开始一项新任务时，你通常：',
    options: [
      { text: '先做一个详细计划，按步骤执行', score: 0 },
      { text: '先快速出一个粗糙版本，看看方向对不对', score: 3 },
      { text: '先收集足够的信息和参考，再动手', score: 1 },
      { text: '先和需求方反复确认，确保理解一致', score: 2 }
    ]
  },
  {
    id: 20,
    dimension: 'task_execution',
    dimensionName: '任务执行',
    question: '任务进行到一半发现方向可能有问题，你通常：',
    options: [
      { text: '停下来重新评估，调整计划后继续', score: 1 },
      { text: '先继续做，在过程中逐步修正', score: 3 },
      { text: '先把当前版本做完，下一版再改', score: 2 },
      { text: '立即和需求方沟通，确认是否需要调整', score: 0 }
    ]
  },
  {
    id: 21,
    dimension: 'task_execution',
    dimensionName: '任务执行',
    question: '面对多个任务并行时，你通常：',
    options: [
      { text: '排好优先级，做完一个再做下一个', score: 0 },
      { text: '几个任务轮着做，保持新鲜感', score: 2 },
      { text: '看哪个任务最有灵感就先做哪个', score: 3 },
      { text: '把相似的任务批量处理', score: 1 }
    ]
  },
  {
    id: 22,
    dimension: 'task_execution',
    dimensionName: '任务执行',
    question: '交付前的时间压力下，你通常：',
    options: [
      { text: '按既定计划推进，确保质量不降', score: 0 },
      { text: '聚焦最核心的部分，砍掉非必需内容', score: 2 },
      { text: '加快速度，能用捷径就用捷径', score: 3 },
      { text: '沟通是否可以延期或分批交付', score: 1 }
    ]
  },
  {
    id: 23,
    dimension: 'task_execution',
    dimensionName: '任务执行',
    question: '你更适应哪种工作节奏？',
    options: [
      { text: '稳定的日常节奏，每天推进固定进度', score: 0 },
      { text: '冲刺式，集中一段时间高强度完成', score: 2 },
      { text: '随性的，有灵感就多做，没灵感就少做', score: 3 },
      { text: '看任务类型而定，不同任务不同节奏', score: 1 }
    ]
  },
  {
    id: 24,
    dimension: 'task_execution',
    dimensionName: '任务执行',
    question: '一个项目完成后，你通常会：',
    options: [
      { text: '复盘总结，记录可以优化的地方', score: 1 },
      { text: '看最终效果是否达到预期，不太纠结过程', score: 2 },
      { text: '收集反馈，看看哪里还可以更好', score: 0 },
      { text: '直接进入下一个项目，不喜欢回头看', score: 3 }
    ]
  },

  // 维度五：协作与沟通倾向 (6题)
  {
    id: 25,
    dimension: 'collaboration',
    dimensionName: '协作倾向',
    question: '在一个项目中，你更享受：',
    options: [
      { text: '自己从头到尾负责一个完整模块', score: 0 },
      { text: '和他人分工配合，各做自己擅长的部分', score: 3 },
      { text: '负责整体统筹协调，把大家组织起来', score: 2 },
      { text: '做那个提供关键解决方案的人', score: 1 }
    ]
  },
  {
    id: 26,
    dimension: 'collaboration',
    dimensionName: '协作倾向',
    question: '和他人合作时，你更在意：',
    options: [
      { text: '分工是否清晰，边界是否明确', score: 1 },
      { text: '沟通是否顺畅，信息是否同步', score: 3 },
      { text: '对方的专业能力是否可靠', score: 0 },
      { text: '大家的审美和标准是否一致', score: 2 }
    ]
  },
  {
    id: 27,
    dimension: 'collaboration',
    dimensionName: '协作倾向',
    question: '当你对队友的交付物不满意时，你通常：',
    options: [
      { text: '自己动手改，比沟通快', score: 0 },
      { text: '直接指出问题，给出具体修改意见', score: 2 },
      { text: '先肯定做得好的部分，再提建议', score: 3 },
      { text: '问清楚对方的思路，理解为什么这样做', score: 1 }
    ]
  },
  {
    id: 28,
    dimension: 'collaboration',
    dimensionName: '协作倾向',
    question: '你更倾向于哪种沟通方式？',
    options: [
      { text: '文字沟通——异步、有记录、可回溯', score: 1 },
      { text: '语音或面对面——同步、高效、有情感', score: 3 },
      { text: '看情况——简单的事文字，复杂的事语音', score: 2 },
      { text: '用具体案例或参考图代替语言描述', score: 0 }
    ]
  },
  {
    id: 29,
    dimension: 'collaboration',
    dimensionName: '协作倾向',
    question: '你觉得一个理想的工作伙伴应该是：',
    options: [
      { text: '专业可靠，不需要我操心他的部分', score: 1 },
      { text: '沟通顺畅，有问题能及时同步', score: 3 },
      { text: '审美和标准一致，不用太多解释', score: 0 },
      { text: '能互相启发，一起碰撞出更好的方案', score: 2 }
    ]
  },
  {
    id: 30,
    dimension: 'collaboration',
    dimensionName: '协作倾向',
    question: '接到一个需要和别人合作完成的任务，你首先：',
    options: [
      { text: '明确自己的分工范围，确保自己能独立完成', score: 0 },
      { text: '和对方对齐整体目标，确保方向一致', score: 3 },
      { text: '了解对方擅长什么，思考怎么配合', score: 2 },
      { text: '先自己理一遍整体思路，再和对方碰', score: 1 }
    ]
  },

  // 维度六：风险与挑战态度 (6题)
  {
    id: 31,
    dimension: 'risk_attitude',
    dimensionName: '风险态度',
    question: '面对一个从未做过的项目类型，你通常：',
    options: [
      { text: '先评估自己能不能做，不确定就拒绝', score: 0 },
      { text: '愿意尝试，但会提前说明可能的风险', score: 2 },
      { text: '兴奋，觉得是个学习机会，直接接', score: 3 },
      { text: '先找有经验的人咨询，再决定是否接', score: 1 }
    ]
  },
  {
    id: 32,
    dimension: 'risk_attitude',
    dimensionName: '风险态度',
    question: '当你在项目中遇到一个完全不会的技术点时，你通常：',
    options: [
      { text: '先自己研究，花时间学会它', score: 2 },
      { text: '找替代方案，绕过这个技术点', score: 1 },
      { text: '找人请教或外包这个部分', score: 0 },
      { text: '评估这个点是否必须，不是必须就砍掉', score: 3 }
    ]
  },
  {
    id: 33,
    dimension: 'risk_attitude',
    dimensionName: '风险态度',
    question: '你更喜欢接什么样的项目？',
    options: [
      { text: '自己熟悉领域的，能稳定高质量交付', score: 0 },
      { text: '有一点挑战的，能学到新东西但不至于失控', score: 2 },
      { text: '完全没做过的，边学边做才有意思', score: 3 },
      { text: '看收入，收入高就愿意挑战难的', score: 1 }
    ]
  },
  {
    id: 34,
    dimension: 'risk_attitude',
    dimensionName: '风险态度',
    question: '你觉得"冒险"对你来说意味着：',
    options: [
      { text: '谨慎评估后的有限尝试', score: 1 },
      { text: '为了成长必须付出的代价', score: 2 },
      { text: '工作中最让人兴奋的部分', score: 3 },
      { text: '能避免就尽量避免', score: 0 }
    ]
  },
  {
    id: 35,
    dimension: 'risk_attitude',
    dimensionName: '风险态度',
    question: '一个项目如果失败，你更可能归因于：',
    options: [
      { text: '前期评估不足，接了自己做不了的任务', score: 0 },
      { text: '过程中某个环节出了问题', score: 1 },
      { text: '需求不清晰或频繁变动', score: 2 },
      { text: '运气不好，遇到不可控因素', score: 3 }
    ]
  },
  {
    id: 36,
    dimension: 'risk_attitude',
    dimensionName: '风险态度',
    question: '你对"稳定"和"成长"的看法更接近：',
    options: [
      { text: '先有稳定交付能力，再追求成长', score: 0 },
      { text: '在成长中建立稳定，两者同步', score: 2 },
      { text: '成长优先，稳定是成长的副产品', score: 3 },
      { text: '看阶段，初期追求成长，后期追求稳定', score: 1 }
    ]
  }
]

export default function OPCTest() {
  const [stage, setStage] = useState<'definition' | 'choice'>('definition')
  const [currentDefinitionIndex, setCurrentDefinitionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [definitionAnswers, setDefinitionAnswers] = useState<string[]>(['', ''])
  const [assessmentId, setAssessmentId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    startAssessment()
  }, [])

  const startAssessment = async () => {
    try {
      const result = await opcV2API.startAssessment()
      if (result.success && result.assessmentId) {
        setAssessmentId(result.assessmentId)
      }
    } catch (error) {
      console.error('开始测试失败:', error)
      Taro.showToast({ title: '初始化失败，请重试', icon: 'none' })
    }
  }

  const handleDefinitionInput = (value: string) => {
    const newAnswers = [...definitionAnswers]
    newAnswers[currentDefinitionIndex] = value
    setDefinitionAnswers(newAnswers)
  }

  const handleDefinitionNext = async () => {
    const currentAnswer = definitionAnswers[currentDefinitionIndex]

    if (!currentAnswer.trim()) {
      Taro.showToast({ title: '请输入你的答案', icon: 'none' })
      return
    }

    if (currentAnswer.trim().length < 5) {
      Taro.showToast({ title: '请至少输入5个字', icon: 'none' })
      return
    }

    setSubmitting(true)

    try {
      // 提交当前定义题答案
      const question = definitionQuestions[currentDefinitionIndex]
      await opcV2API.submitAnswer(assessmentId, {
        questionId: question.id,
        answerType: 'definition',
        answerText: currentAnswer
      })

      if (currentDefinitionIndex < definitionQuestions.length - 1) {
        // 下一道定义题
        setTimeout(() => {
          setCurrentDefinitionIndex(currentDefinitionIndex + 1)
          setSubmitting(false)
        }, 300)
      } else {
        // 进入选择题阶段
        setTimeout(() => {
          setStage('choice')
          setSubmitting(false)
        }, 300)
      }
    } catch (error) {
      console.error('提交答案失败:', error)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
      setSubmitting(false)
    }
  }

  const handleChoiceAnswer = async (optionIndex: number) => {
    const question = testQuestions[currentQuestion]
    const selectedOption = question.options[optionIndex]

    setSubmitting(true)

    try {
      // 提交选择题答案
      await opcV2API.submitAnswer(assessmentId, {
        questionId: `choice_${question.id}`,
        answerType: 'choice',
        selectedOption: String.fromCharCode(65 + optionIndex) // A, B, C, D
      })

      if (currentQuestion < testQuestions.length - 1) {
        // 下一题
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1)
          setSubmitting(false)
        }, 300)
      } else {
        // 测评完成，计算结果
        try {
          await opcV2API.completeAssessment(assessmentId)

          // 跳转到结果页
          setTimeout(() => {
            Taro.navigateTo({
              url: `/pages/opc-test/result?assessmentId=${assessmentId}`
            })
          }, 300)
        } catch (error) {
          console.error('完成测试失败:', error)
          Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
          setSubmitting(false)
        }
      }
    } catch (error) {
      console.error('提交答案失败:', error)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
      setSubmitting(false)
    }
  }

  // 定义题阶段
  if (stage === 'definition') {
    const question = definitionQuestions[currentDefinitionIndex]
    const progress = ((currentDefinitionIndex + 1) / (definitionQuestions.length + testQuestions.length)) * 100

    return (
      <View className="opc-test-page">
        <View className="progress-bar">
          <View className="progress-fill" style={{ width: `${progress}%` }} />
        </View>

        <View className="test-container">
          <View className="question-header">
            <Text className="category-badge">前置问题</Text>
            <Text className="question-number">{currentDefinitionIndex + 1}/{definitionQuestions.length}</Text>
          </View>

          <Text className="question-text">{question.question}</Text>

          <View className="definition-input-container">
            <Textarea
              className="definition-textarea"
              placeholder={question.placeholder}
              value={definitionAnswers[currentDefinitionIndex]}
              onInput={(e) => handleDefinitionInput(e.detail.value)}
              maxlength={200}
              autoHeight
              disabled={submitting}
            />
            <Text className="char-count">{definitionAnswers[currentDefinitionIndex].length}/200</Text>
          </View>

          <View
            className={`next-btn ${submitting || !definitionAnswers[currentDefinitionIndex].trim() ? 'disabled' : ''}`}
            onClick={handleDefinitionNext}
          >
            <Text className="btn-text">
              {currentDefinitionIndex < definitionQuestions.length - 1 ? '下一题' : '开始选择题'}
            </Text>
          </View>

          {submitting && (
            <View className="submitting-overlay">
              <Text className="submitting-text">提交中...</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  // 选择题阶段
  const progress = ((definitionQuestions.length + currentQuestion + 1) / (definitionQuestions.length + testQuestions.length)) * 100
  const question = testQuestions[currentQuestion]

  return (
    <View className="opc-test-page">
      <View className="progress-bar">
        <View className="progress-fill" style={{ width: `${progress}%` }} />
      </View>

      <View className="test-container">
        <View className="question-header">
          <Text className="category-badge">{question.dimensionName}</Text>
          <Text className="question-number">{currentQuestion + 1}/{testQuestions.length}</Text>
        </View>

        <Text className="question-text">{question.question}</Text>

        <View className="options-container">
          {question.options.map((option, index) => (
            <View
              key={index}
              className={`option-card ${submitting ? 'disabled' : ''}`}
              onClick={() => !submitting && handleChoiceAnswer(index)}
            >
              <Text className="option-text">{option.text}</Text>
            </View>
          ))}
        </View>

        {submitting && (
          <View className="submitting-overlay">
            <Text className="submitting-text">
              {currentQuestion === testQuestions.length - 1 ? '正在生成你的OPC画像...' : '提交中...'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
