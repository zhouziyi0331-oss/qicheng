import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { opcAPI } from '../../services/api'
import './result.scss'

// 人格标签定义
const PERSONALITY_TAGS = {
  visual_storyteller: {
    name: '视觉叙事者',
    description: '你擅长用画面讲故事，能看到各个元素之间的联系，把抽象概念转化成具体视觉。',
    track: 'AI内容创作',
    level: 'Lv.1 试流者',
    firstTask: 'AI图文内容制作（小红书/公众号配图、产品宣传图等）'
  },
  system_builder: {
    name: '系统构建者',
    description: '你习惯先理解底层逻辑再动手，擅长设计规则和系统。',
    track: 'AI工具开发',
    level: 'Lv.1 试流者',
    firstTask: '工作流搭建、Agent设计、自动化系统'
  },
  creative_executor: {
    name: '创意执行者',
    description: '你享受从0到1的创作过程，喜欢快速出稿再打磨。',
    track: 'AI内容创作',
    level: 'Lv.1 试流者',
    firstTask: '社交媒体内容、广告素材制作'
  },
  logic_analyzer: {
    name: '逻辑拆解者',
    description: '你擅长把复杂问题拆成可执行的步骤，逻辑清晰，独立工作能力强。',
    track: 'AI数据处理',
    level: 'Lv.1 试流者',
    firstTask: '数据处理、代码实现、精细执行项目'
  },
  stable_deliverer: {
    name: '稳健交付者',
    description: '你追求稳定高质量的交付，做事有规划，不轻易冒险。',
    track: '通用赛道',
    level: 'Lv.1 试流者',
    firstTask: '对质量要求高、周期明确的项目'
  },
  explorer_integrator: {
    name: '探索整合者',
    description: '你擅长快速掌握新工具，并把不同的东西组合在一起创造新价值。',
    track: 'AI工具应用',
    level: 'Lv.1 试流者',
    firstTask: '探索性项目、新工具应用、跨领域整合'
  },
  balanced: {
    name: '混合型',
    description: '你的工作风格比较灵活，能根据项目需要调整自己的方式。建议通过完成前3个任务，让系统更精准地识别你的方向。',
    track: '通用赛道',
    level: 'Lv.0 涉水者',
    firstTask: '尝试不同类型的项目，找到自己的方向'
  }
}

// 维度名称映射
const DIMENSION_NAMES = {
  information_processing: '信息处理',
  creation_drive: '创作驱动',
  tool_learning: '工具学习',
  task_execution: '任务执行',
  collaboration: '协作倾向',
  risk_attitude: '风险态度'
}

// 维度解读模板
const DIMENSION_INTERPRETATIONS = {
  information_processing: {
    low: '拆解型：你喜欢把大问题切成小块逐一解决。面对复杂任务，你习惯先分解再执行。这种风格让你在需要精细执行的项目中表现出色。',
    mid: '平衡型：你能根据情况选择拆解或整合的方式。既能关注细节，也能看到全局。',
    high: '整合型：你喜欢先看到全貌再动手。面对复杂任务，你习惯先理解各部分之间的关系。这种风格让你在做品牌视觉、系列内容时能保持整体一致性。'
  },
  creation_drive: {
    low: '视觉型：你的创作灵感来源于画面。你对色彩、构图、光影敏感，能用视觉语言传达情绪和故事。你适合AI生图、视频制作、视觉设计类项目。',
    mid: '混合型：你在视觉和逻辑之间找到了平衡，既能做视觉内容，也能做结构化工作。',
    high: '逻辑型：你的创作灵感来源于规则和结构。你擅长信息架构、系统设计、逻辑梳理。你适合AI工具开发、工作流设计类项目。'
  },
  tool_learning: {
    low: '探索型：你习惯边用边学，拿到新工具直接上手试。这种方式让你快速产出，但有时会漏掉一些高级功能。建议每完成3个项目，花一点时间系统了解工具的核心逻辑。',
    mid: '适应型：你能根据工具类型选择学习方式，既能快速上手，也能深入学习。',
    high: '手册型：你习惯先看文档教程，理解原理再动手。这种方式让你能充分发挥工具的能力，但上手速度可能稍慢。'
  },
  task_execution: {
    low: '规划型：你喜欢先做详细计划，按步骤执行。这种风格让你在长周期项目中保持稳定，但在快速迭代的项目中可能需要更灵活。',
    mid: '灵活型：你不太喜欢僵硬的计划，更倾向于在过程中调整。你适合需要快速响应和迭代的项目。',
    high: '迭代型：你喜欢先快速出一个粗糙版本，再一轮轮打磨。这种风格让你能快速验证方向，适合探索性项目。'
  },
  collaboration: {
    low: '独立型：你更喜欢自己掌控完整的工作流程。在团队项目中，你最适合负责一个相对独立的模块。',
    mid: '弹性型：你能根据项目需要选择独立或协作的方式，适应性强。',
    high: '协作型：你享受和他人分工配合的过程。你擅长沟通协调，能在团队中发挥连接作用。'
  },
  risk_attitude: {
    low: '稳健型：你选择有把握的任务，确保交付质量。这种风格让你能稳定输出，但可能错过一些成长机会。建议偶尔尝试"冒险项目"。',
    mid: '审慎型：你愿意尝试新东西，但会在心里先评估可行性。这种平衡让你既能接有挑战的项目，又不会让自己陷入失控。',
    high: '冒险型：你愿意挑战没做过的事，边做边学。这种风格让你成长快速，但要注意控制风险，避免接超出能力太多的项目。'
  }
}

export default function OPCTestResult() {
  const [scores, setScores] = useState<any>(null)
  const [personalityTag, setPersonalityTag] = useState<any>(null)
  const [interpretations, setInterpretations] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResult()
  }, [])

  const loadResult = async () => {
    try {
      setLoading(true)

      // 先尝试从本地缓存获取
      const cachedResult = Taro.getStorageSync('opc_result')
      if (cachedResult && cachedResult.result) {
        displayResult(cachedResult.result)
        setLoading(false)
        return
      }

      // 如果没有缓存，从后端获取
      const user = Taro.getStorageSync('user')
      if (user && user.id) {
        const result = await opcAPI.getResult(user.id)
        if (result.success && result.result) {
          displayResult(result.result)
          // 保存到本地缓存
          Taro.setStorageSync('opc_result', result)
        } else {
          Taro.showToast({ title: '暂无测试结果', icon: 'none' })
        }
      }
    } catch (error) {
      console.error('加载结果失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const displayResult = (result: any) => {
    // 显示后端返回的结果
    setScores(result.scores)

    // 设置人格标签
    const tagKey = result.personalityTag.key
    const tagInfo = PERSONALITY_TAGS[tagKey] || PERSONALITY_TAGS.balanced
    setPersonalityTag({ key: tagKey, ...tagInfo })

    // 设置维度解读
    setInterpretations(result.interpretations)
  }

  const calculateResult = (answers: Array<{questionId: number, answer: string, score: number}>) => {
    // 按维度分组计算得分
    const dimensionScores: any = {
      information_processing: [],
      creation_drive: [],
      tool_learning: [],
      task_execution: [],
      collaboration: [],
      risk_attitude: []
    }

    // 题目维度映射（每个维度6题）
    const questionDimensions = [
      'information_processing', 'information_processing', 'information_processing', 'information_processing', 'information_processing', 'information_processing',
      'creation_drive', 'creation_drive', 'creation_drive', 'creation_drive', 'creation_drive', 'creation_drive',
      'tool_learning', 'tool_learning', 'tool_learning', 'tool_learning', 'tool_learning', 'tool_learning',
      'task_execution', 'task_execution', 'task_execution', 'task_execution', 'task_execution', 'task_execution',
      'collaboration', 'collaboration', 'collaboration', 'collaboration', 'collaboration', 'collaboration',
      'risk_attitude', 'risk_attitude', 'risk_attitude', 'risk_attitude', 'risk_attitude', 'risk_attitude'
    ]

    answers.forEach((answer, index) => {
      const dimension = questionDimensions[index]
      dimensionScores[dimension].push(answer.score)
    })

    // 计算每个维度的原始分（0-18）和归一化分（0-100）
    const rawScores: any = {}
    const normalizedScores: any = {}

    Object.keys(dimensionScores).forEach(dimension => {
      const scores = dimensionScores[dimension]
      const rawScore = scores.reduce((a: number, b: number) => a + b, 0)
      rawScores[dimension] = rawScore
      normalizedScores[dimension] = Math.round((rawScore / 18) * 100)
    })

    setScores(normalizedScores)

    // 生成人格标签
    const tag = generatePersonalityTag(normalizedScores)
    setPersonalityTag(tag)

    // 生成维度解读
    const interps = generateInterpretations(normalizedScores)
    setInterpretations(interps)

    // 保存到本地存储
    Taro.setStorageSync('opcResult', {
      scores: normalizedScores,
      personalityTag: tag.key,
      completedAt: new Date().toISOString()
    })
  }

  const generatePersonalityTag = (scores: any) => {
    const { information_processing, creation_drive, tool_learning, task_execution, collaboration, risk_attitude } = scores

    // 判断人格标签
    // 视觉叙事者：创作驱动-视觉高分(低分) + 信息处理-整合高分
    if (creation_drive <= 40 && information_processing >= 60) {
      return { key: 'visual_storyteller', ...PERSONALITY_TAGS.visual_storyteller }
    }

    // 系统构建者：创作驱动-逻辑高分 + 信息处理-整合高分 + 工具学习-手册高分
    if (creation_drive >= 60 && information_processing >= 60 && tool_learning >= 60) {
      return { key: 'system_builder', ...PERSONALITY_TAGS.system_builder }
    }

    // 创意执行者：创作驱动-视觉高分 + 任务执行-迭代高分 + 风险态度-冒险高分
    if (creation_drive <= 40 && task_execution >= 60 && risk_attitude >= 60) {
      return { key: 'creative_executor', ...PERSONALITY_TAGS.creative_executor }
    }

    // 逻辑拆解者：信息处理-拆解高分(低分) + 创作驱动-逻辑高分 + 协作倾向-独立高分(低分)
    if (information_processing <= 40 && creation_drive >= 60 && collaboration <= 40) {
      return { key: 'logic_analyzer', ...PERSONALITY_TAGS.logic_analyzer }
    }

    // 稳健交付者：任务执行-规划高分(低分) + 风险态度-稳健高分(低分) + 协作倾向-独立高分(低分)
    if (task_execution <= 40 && risk_attitude <= 40 && collaboration <= 40) {
      return { key: 'stable_deliverer', ...PERSONALITY_TAGS.stable_deliverer }
    }

    // 探索整合者：工具学习-探索高分(低分) + 信息处理-整合高分 + 风险态度-冒险高分
    if (tool_learning <= 40 && information_processing >= 60 && risk_attitude >= 60) {
      return { key: 'explorer_integrator', ...PERSONALITY_TAGS.explorer_integrator }
    }

    // 默认：混合型
    return { key: 'balanced', ...PERSONALITY_TAGS.balanced }
  }

  const generateInterpretations = (scores: any) => {
    const interps: any = {}

    Object.keys(scores).forEach(dimension => {
      const score = scores[dimension]
      const templates = DIMENSION_INTERPRETATIONS[dimension]

      if (score <= 40) {
        interps[dimension] = templates.low
      } else if (score <= 60) {
        interps[dimension] = templates.mid
      } else {
        interps[dimension] = templates.high
      }
    })

    return interps
  }

  const handleComplete = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  if (loading || !scores || !personalityTag) {
    return (
      <View className="result-page">
        <View className="loading">
          <Text>正在分析你的测试结果...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="result-page">
      <View className="result-container">
        {/* 标题 */}
        <View className="result-header">
          <Text className="result-title">你被看见了</Text>
          <Text className="result-subtitle">这不是考试，是一面镜子</Text>
        </View>

        {/* 人格标签 */}
        <View className="personality-card">
          <Text className="personality-tag">{personalityTag.name}</Text>
          <Text className="personality-desc">{personalityTag.description}</Text>
        </View>

        {/* 六维雷达图（简化版 - 使用进度条） */}
        <View className="scores-section">
          <Text className="section-title">你的六维画像</Text>

          <View className="score-item">
            <View className="score-header">
              <Text className="score-label">{DIMENSION_NAMES.information_processing}</Text>
              <Text className="score-value">{scores.information_processing}</Text>
            </View>
            <View className="score-bar">
              <View className="score-fill" style={{ width: `${scores.information_processing}%`, background: 'linear-gradient(90deg, #F9C6D9 0%, #F9A8D4 100%)' }} />
            </View>
          </View>

          <View className="score-item">
            <View className="score-header">
              <Text className="score-label">{DIMENSION_NAMES.creation_drive}</Text>
              <Text className="score-value">{scores.creation_drive}</Text>
            </View>
            <View className="score-bar">
              <View className="score-fill" style={{ width: `${scores.creation_drive}%`, background: 'linear-gradient(90deg, #A8D8EA 0%, #7DD3FC 100%)' }} />
            </View>
          </View>

          <View className="score-item">
            <View className="score-header">
              <Text className="score-label">{DIMENSION_NAMES.tool_learning}</Text>
              <Text className="score-value">{scores.tool_learning}</Text>
            </View>
            <View className="score-bar">
              <View className="score-fill" style={{ width: `${scores.tool_learning}%`, background: 'linear-gradient(90deg, #D4F291 0%, #BEF264 100%)' }} />
            </View>
          </View>

          <View className="score-item">
            <View className="score-header">
              <Text className="score-label">{DIMENSION_NAMES.task_execution}</Text>
              <Text className="score-value">{scores.task_execution}</Text>
            </View>
            <View className="score-bar">
              <View className="score-fill" style={{ width: `${scores.task_execution}%`, background: 'linear-gradient(90deg, #FFE082 0%, #FCD34D 100%)' }} />
            </View>
          </View>

          <View className="score-item">
            <View className="score-header">
              <Text className="score-label">{DIMENSION_NAMES.collaboration}</Text>
              <Text className="score-value">{scores.collaboration}</Text>
            </View>
            <View className="score-bar">
              <View className="score-fill" style={{ width: `${scores.collaboration}%`, background: 'linear-gradient(90deg, #B39DDB 0%, #A78BFA 100%)' }} />
            </View>
          </View>

          <View className="score-item">
            <View className="score-header">
              <Text className="score-label">{DIMENSION_NAMES.risk_attitude}</Text>
              <Text className="score-value">{scores.risk_attitude}</Text>
            </View>
            <View className="score-bar">
              <View className="score-fill" style={{ width: `${scores.risk_attitude}%`, background: 'linear-gradient(90deg, #80CBC4 0%, #5EEAD4 100%)' }} />
            </View>
          </View>
        </View>

        {/* 维度解读 */}
        <View className="interpretations-section">
          <Text className="section-title">维度解读</Text>

          {Object.keys(interpretations).map(dimension => (
            <View key={dimension} className="interpretation-item">
              <Text className="interpretation-title">{DIMENSION_NAMES[dimension]}</Text>
              <Text className="interpretation-text">{interpretations[dimension]}</Text>
            </View>
          ))}
        </View>

        {/* 推荐信息 */}
        <View className="recommendation-section">
          <Text className="section-title">为你推荐</Text>

          <View className="recommendation-item">
            <Text className="recommendation-label">推荐赛道</Text>
            <Text className="recommendation-value">{personalityTag.track}</Text>
          </View>

          <View className="recommendation-item">
            <Text className="recommendation-label">推荐等级</Text>
            <Text className="recommendation-value">{personalityTag.level}</Text>
          </View>

          <View className="recommendation-item">
            <Text className="recommendation-label">推荐首单</Text>
            <Text className="recommendation-value">{personalityTag.firstTask}</Text>
          </View>
        </View>

        {/* 完成按钮 */}
        <View className="complete-btn" onClick={handleComplete}>
          <Text className="btn-text">开始你的河</Text>
        </View>
      </View>
    </View>
  )
}
