import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { getUserInfo, saveUserInfo } from '../../utils'
import './index.scss'

// 测评题目数据 - 25题覆盖六维能力
const testQuestions = [
  // 学习力 (4题)
  {
    id: 1,
    category: 'learning',
    categoryName: '学习力',
    question: '面对新知识时，你的第一反应是？',
    options: [
      { text: '立即动手尝试，边做边学', score: 5 },
      { text: '先系统学习理论，再实践', score: 3 },
      { text: '观望他人经验，再决定学不学', score: 1 }
    ]
  },
  {
    id: 2,
    category: 'learning',
    categoryName: '学习力',
    question: '你更喜欢哪种学习方式？',
    options: [
      { text: '通过项目实战快速掌握', score: 5 },
      { text: '系统学习课程和文档', score: 3 },
      { text: '跟着教程一步步操作', score: 1 }
    ]
  },
  {
    id: 3,
    category: 'learning',
    categoryName: '学习力',
    question: '遇到技术难题时，你会？',
    options: [
      { text: '深入研究原理，彻底搞懂', score: 5 },
      { text: '搜索解决方案，快速解决', score: 3 },
      { text: '寻求他人帮助', score: 1 }
    ]
  },
  {
    id: 4,
    category: 'learning',
    categoryName: '学习力',
    question: '你如何保持技术更新？',
    options: [
      { text: '主动关注前沿技术，定期学习', score: 5 },
      { text: '工作需要时再学习', score: 3 },
      { text: '很少主动学习新技术', score: 1 }
    ]
  },

  // 执行力 (4题)
  {
    id: 5,
    category: 'execution',
    categoryName: '执行力',
    question: '接到任务后，你会？',
    options: [
      { text: '立即开始，快速推进', score: 5 },
      { text: '先规划再执行', score: 3 },
      { text: '等待更多信息再开始', score: 1 }
    ]
  },
  {
    id: 6,
    category: 'execution',
    categoryName: '执行力',
    question: '你的工作节奏是？',
    options: [
      { text: '高效专注，快速完成', score: 5 },
      { text: '稳步推进，按时交付', score: 3 },
      { text: '容易拖延，临近deadline才冲刺', score: 1 }
    ]
  },
  {
    id: 7,
    category: 'execution',
    categoryName: '执行力',
    question: '面对复杂任务，你会？',
    options: [
      { text: '拆解成小目标，逐个击破', score: 5 },
      { text: '整体推进，遇到问题再调整', score: 3 },
      { text: '感到压力，不知从何下手', score: 1 }
    ]
  },
  {
    id: 8,
    category: 'execution',
    categoryName: '执行力',
    question: '你如何管理时间？',
    options: [
      { text: '制定清晰计划，严格执行', score: 5 },
      { text: '有大致安排，灵活调整', score: 3 },
      { text: '随性而为，较少规划', score: 1 }
    ]
  },

  // 沟通力 (4题)
  {
    id: 9,
    category: 'communication',
    categoryName: '沟通力',
    question: '在团队中，你更倾向于？',
    options: [
      { text: '主动分享想法，推动讨论', score: 5 },
      { text: '参与讨论，表达观点', score: 3 },
      { text: '倾听为主，较少发言', score: 1 }
    ]
  },
  {
    id: 10,
    category: 'communication',
    categoryName: '沟通力',
    question: '遇到分歧时，你会？',
    options: [
      { text: '积极沟通，寻求共识', score: 5 },
      { text: '表达观点，尊重差异', score: 3 },
      { text: '避免冲突，保持沉默', score: 1 }
    ]
  },
  {
    id: 11,
    category: 'communication',
    categoryName: '沟通力',
    question: '你如何表达复杂想法？',
    options: [
      { text: '清晰有条理，易于理解', score: 5 },
      { text: '能表达清楚，偶尔需要补充', score: 3 },
      { text: '表达困难，容易被误解', score: 1 }
    ]
  },
  {
    id: 12,
    category: 'communication',
    categoryName: '沟通力',
    question: '收到反馈时，你的反应是？',
    options: [
      { text: '虚心接受，积极改进', score: 5 },
      { text: '理性分析，选择性采纳', score: 3 },
      { text: '容易防御，难以接受', score: 1 }
    ]
  },

  // 创新力 (4题)
  {
    id: 13,
    category: 'innovation',
    categoryName: '创新力',
    question: '面对问题时，你倾向于？',
    options: [
      { text: '寻找创新解决方案', score: 5 },
      { text: '优化现有方法', score: 3 },
      { text: '使用成熟方案', score: 1 }
    ]
  },
  {
    id: 14,
    category: 'innovation',
    categoryName: '创新力',
    question: '你对新想法的态度是？',
    options: [
      { text: '充满好奇，勇于尝试', score: 5 },
      { text: '谨慎评估，选择性尝试', score: 3 },
      { text: '保守稳健，较少尝试', score: 1 }
    ]
  },
  {
    id: 15,
    category: 'innovation',
    categoryName: '创新力',
    question: '在项目中，你更喜欢？',
    options: [
      { text: '探索新技术，创造新价值', score: 5 },
      { text: '在稳定基础上优化改进', score: 3 },
      { text: '遵循既定方案，稳步实施', score: 1 }
    ]
  },
  {
    id: 16,
    category: 'innovation',
    categoryName: '创新力',
    question: '你如何看待失败？',
    options: [
      { text: '宝贵经验，快速迭代', score: 5 },
      { text: '总结教训，避免重复', score: 3 },
      { text: '尽量避免，害怕失败', score: 1 }
    ]
  },

  // 协作力 (5题)
  {
    id: 17,
    category: 'collaboration',
    categoryName: '协作力',
    question: '你更擅长？',
    options: [
      { text: '团队协作，共同完成', score: 5 },
      { text: '独立工作，偶尔协作', score: 3 },
      { text: '独立工作，不喜欢协作', score: 1 }
    ]
  },
  {
    id: 18,
    category: 'collaboration',
    categoryName: '协作力',
    question: '在团队项目中，你通常？',
    options: [
      { text: '主动承担责任，推动进度', score: 5 },
      { text: '完成分配任务，配合团队', score: 3 },
      { text: '被动等待安排', score: 1 }
    ]
  },
  {
    id: 19,
    category: 'collaboration',
    categoryName: '协作力',
    question: '你如何帮助队友？',
    options: [
      { text: '主动分享经验，帮助成长', score: 5 },
      { text: '有求必应，提供帮助', score: 3 },
      { text: '专注自己任务，较少帮助他人', score: 1 }
    ]
  },
  {
    id: 20,
    category: 'collaboration',
    categoryName: '协作力',
    question: '团队遇到困难时，你会？',
    options: [
      { text: '主动提出解决方案，带领团队', score: 5 },
      { text: '参与讨论，贡献想法', score: 3 },
      { text: '等待他人决策', score: 1 }
    ]
  },
  {
    id: 21,
    category: 'collaboration',
    categoryName: '协作力',
    question: '你如何看待团队成功？',
    options: [
      { text: '团队成功比个人成就更重要', score: 5 },
      { text: '平衡个人与团队目标', score: 3 },
      { text: '更关注个人表现', score: 1 }
    ]
  },

  // 抗压力 (4题)
  {
    id: 22,
    category: 'resilience',
    categoryName: '抗压力',
    question: '面对高压任务，你会？',
    options: [
      { text: '保持冷静，高效应对', score: 5 },
      { text: '有些紧张，但能完成', score: 3 },
      { text: '压力很大，影响发挥', score: 1 }
    ]
  },
  {
    id: 23,
    category: 'resilience',
    categoryName: '抗压力',
    question: '遇到挫折时，你会？',
    options: [
      { text: '快速调整，继续前进', score: 5 },
      { text: '需要时间恢复，但能坚持', score: 3 },
      { text: '容易沮丧，难以恢复', score: 1 }
    ]
  },
  {
    id: 24,
    category: 'resilience',
    categoryName: '抗压力',
    question: '你如何处理负面情绪？',
    options: [
      { text: '积极调节，快速恢复', score: 5 },
      { text: '需要倾诉或休息', score: 3 },
      { text: '容易陷入负面情绪', score: 1 }
    ]
  },
  {
    id: 25,
    category: 'resilience',
    categoryName: '抗压力',
    question: '面对不确定性，你的态度是？',
    options: [
      { text: '拥抱变化，灵活应对', score: 5 },
      { text: '有些不安，但能适应', score: 3 },
      { text: '焦虑不安，希望确定性', score: 1 }
    ]
  }
]

export default function OPCTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [opcResult, setOpcResult] = useState<any>(null)

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score]
    setAnswers(newAnswers)

    if (currentQuestion < testQuestions.length - 1) {
      // 下一题
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    } else {
      // 测评完成，计算结果
      calculateResult(newAnswers)
    }
  }

  const calculateResult = (allAnswers: number[]) => {
    // 计算六维能力得分
    const categoryScores: any = {
      learning: [],
      execution: [],
      communication: [],
      innovation: [],
      collaboration: [],
      resilience: []
    }

    // 按类别收集分数
    allAnswers.forEach((score, index) => {
      const category = testQuestions[index].category
      categoryScores[category].push(score)
    })

    // 计算每个维度的平均分并归一化到0-100
    const normalizedScores = {
      learning: Math.round((categoryScores.learning.reduce((a: number, b: number) => a + b, 0) / categoryScores.learning.length / 5) * 100),
      execution: Math.round((categoryScores.execution.reduce((a: number, b: number) => a + b, 0) / categoryScores.execution.length / 5) * 100),
      communication: Math.round((categoryScores.communication.reduce((a: number, b: number) => a + b, 0) / categoryScores.communication.length / 5) * 100),
      innovation: Math.round((categoryScores.innovation.reduce((a: number, b: number) => a + b, 0) / categoryScores.innovation.length / 5) * 100),
      collaboration: Math.round((categoryScores.collaboration.reduce((a: number, b: number) => a + b, 0) / categoryScores.collaboration.length / 5) * 100),
      resilience: Math.round((categoryScores.resilience.reduce((a: number, b: number) => a + b, 0) / categoryScores.resilience.length / 5) * 100)
    }

    // 生成OPC标签
    const opcTag = generateOPCTag(normalizedScores)

    const result = {
      scores: normalizedScores,
      tag: opcTag,
      description: getTagDescription(normalizedScores)
    }

    setOpcResult(result)
    setIsCompleted(true)

    // 保存到用户信息
    const userInfo = getUserInfo()
    saveUserInfo({
      ...userInfo,
      opcTag: opcTag,
      opcScores: normalizedScores,
      hasCompletedTest: true
    })

    // 跳转到结果页面
    setTimeout(() => {
      Taro.redirectTo({
        url: '/pages/opc-test/result'
      })
    }, 500)
  }

  const generateOPCTag = (scores: any) => {
    const { learning, execution, communication, innovation, collaboration, resilience } = scores

    // 找出最高的两个维度
    const sortedDimensions = Object.entries(scores)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 2)

    const dimensionNames: any = {
      learning: '探索者',
      execution: '行动派',
      communication: '连接者',
      innovation: '创造者',
      collaboration: '共建者',
      resilience: '韧性者'
    }

    return sortedDimensions.map(([key]) => dimensionNames[key]).join('·')
  }

  const getTagDescription = (scores: any) => {
    const { learning, execution, communication, innovation, collaboration, resilience } = scores

    const strengths = []
    if (learning >= 70) strengths.push('热爱探索新知')
    if (execution >= 70) strengths.push('说干就干')
    if (communication >= 70) strengths.push('善于连接')
    if (innovation >= 70) strengths.push('富有创造力')
    if (collaboration >= 70) strengths.push('喜欢共建')
    if (resilience >= 70) strengths.push('韧性十足')

    if (strengths.length === 0) {
      return '你是一个全面发展的人，各项能力均衡'
    }

    return `你身上有这些火花：${strengths.join('、')}`
  }

  const handleComplete = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  const progress = ((currentQuestion + 1) / testQuestions.length) * 100

  if (isCompleted && opcResult) {
    return (
      <View className="opc-test-page">
        <View className="result-container">
          <View className="result-header">
            <Text className="result-title">你被看见了</Text>
            <Text className="result-subtitle">你的OPC标签是</Text>
          </View>

          <View className="opc-tag-display">
            <Text className="tag-text">{opcResult.tag}</Text>
          </View>

          <Text className="tag-description">{opcResult.description}</Text>

          <View className="scores-display">
            <View className="score-item">
              <Text className="score-label">探索力</Text>
              <View className="score-bar">
                <View className="score-fill" style={{ width: `${opcResult.scores.learning}%`, background: '#F9C6D9' }} />
              </View>
              <Text className="score-value">{opcResult.scores.learning}</Text>
            </View>

            <View className="score-item">
              <Text className="score-label">行动力</Text>
              <View className="score-bar">
                <View className="score-fill" style={{ width: `${opcResult.scores.execution}%`, background: '#A8D8EA' }} />
              </View>
              <Text className="score-value">{opcResult.scores.execution}</Text>
            </View>

            <View className="score-item">
              <Text className="score-label">连接力</Text>
              <View className="score-bar">
                <View className="score-fill" style={{ width: `${opcResult.scores.communication}%`, background: '#D4F291' }} />
              </View>
              <Text className="score-value">{opcResult.scores.communication}</Text>
            </View>

            <View className="score-item">
              <Text className="score-label">创造力</Text>
              <View className="score-bar">
                <View className="score-fill" style={{ width: `${opcResult.scores.innovation}%`, background: '#FFE082' }} />
              </View>
              <Text className="score-value">{opcResult.scores.innovation}</Text>
            </View>

            <View className="score-item">
              <Text className="score-label">共建力</Text>
              <View className="score-bar">
                <View className="score-fill" style={{ width: `${opcResult.scores.collaboration}%`, background: '#B39DDB' }} />
              </View>
              <Text className="score-value">{opcResult.scores.collaboration}</Text>
            </View>

            <View className="score-item">
              <Text className="score-label">韧性</Text>
              <View className="score-bar">
                <View className="score-fill" style={{ width: `${opcResult.scores.resilience}%`, background: '#80CBC4' }} />
              </View>
              <Text className="score-value">{opcResult.scores.resilience}</Text>
            </View>
          </View>

          <View className="complete-btn" onClick={handleComplete}>
            <Text className="btn-text">开始你的河</Text>
          </View>
        </View>
      </View>
    )
  }

  const question = testQuestions[currentQuestion]

  return (
    <View className="opc-test-page">
      <View className="progress-bar">
        <View className="progress-fill" style={{ width: `${progress}%` }} />
      </View>

      <View className="test-container">
        <View className="question-header">
          <Text className="category-badge">{question.categoryName}</Text>
          <Text className="question-number">{currentQuestion + 1}/{testQuestions.length}</Text>
        </View>

        <Text className="question-text">{question.question}</Text>

        <View className="options-container">
          {question.options.map((option, index) => (
            <View
              key={index}
              className="option-card"
              onClick={() => handleAnswer(option.score)}
            >
              <Text className="option-text">{option.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
