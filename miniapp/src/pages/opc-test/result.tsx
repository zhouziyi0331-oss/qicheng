import { View, Text, Button, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getUserInfo } from '../../utils'
import './result.scss'

interface OPCResult {
  scores: {
    learning: number
    execution: number
    communication: number
    innovation: number
    collaboration: number
    resilience: number
  }
  tag: string
  aiAnalysis: string
  strengths: string[]
  improvements: string[]
  careerSuggestions: string[]
}

export default function OPCTestResult() {
  const [result, setResult] = useState<OPCResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResult()
  }, [])

  const loadResult = async () => {
    try {
      // 从本地存储获取测评结果
      const userInfo = getUserInfo()

      if (userInfo && userInfo.opcScores) {
        // 模拟AI分析（实际应该调用后端AI接口）
        const aiAnalysis = generateAIAnalysis(userInfo.opcScores)

        setResult({
          scores: userInfo.opcScores,
          tag: userInfo.opcTag || '探索者',
          aiAnalysis: aiAnalysis.analysis,
          strengths: aiAnalysis.strengths,
          improvements: aiAnalysis.improvements,
          careerSuggestions: aiAnalysis.careerSuggestions
        })

        // 绘制雷达图
        setTimeout(() => {
          drawRadarChart(userInfo.opcScores)
        }, 300)
      }
    } catch (err) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateAIAnalysis = (scores: any) => {
    const { learning, execution, communication, innovation, collaboration, resilience } = scores

    // 找出最强和最弱的维度
    const dimensions = [
      { name: '学习力', value: learning, key: 'learning' },
      { name: '执行力', value: execution, key: 'execution' },
      { name: '沟通力', value: communication, key: 'communication' },
      { name: '创新力', value: innovation, key: 'innovation' },
      { name: '协作力', value: collaboration, key: 'collaboration' },
      { name: '抗压力', value: resilience, key: 'resilience' }
    ]

    const sorted = [...dimensions].sort((a, b) => b.value - a.value)
    const strongest = sorted.slice(0, 2)
    const weakest = sorted.slice(-2)

    // 生成AI分析文本
    const analysis = `根据你的测评结果，你是一位${strongest[0].name}和${strongest[1].name}突出的学习者。你在${strongest[0].name}方面表现优异（${strongest[0].value}分），这意味着你具备快速成长的潜力。同时，你的${strongest[1].name}也很出色（${strongest[1].value}分），这将帮助你在实践中不断进步。`

    // 优势分析
    const strengths = strongest.map(d =>
      `${d.name}出色（${d.value}分）：${getStrengthDescription(d.key)}`
    )

    // 提升建议
    const improvements = weakest.map(d =>
      `${d.name}待提升（${d.value}分）：${getImprovementSuggestion(d.key)}`
    )

    // 职业建议
    const careerSuggestions = getCareerSuggestions(strongest.map(d => d.key))

    return { analysis, strengths, improvements, careerSuggestions }
  }

  const getStrengthDescription = (key: string) => {
    const descriptions: any = {
      learning: '你善于快速掌握新知识，能够主动学习并应用到实践中',
      execution: '你行动力强，能够高效完成任务，不拖延',
      communication: '你善于表达和倾听，能够清晰传达想法',
      innovation: '你思维活跃，善于提出新想法和创新方案',
      collaboration: '你是优秀的团队成员，善于协作和帮助他人',
      resilience: '你心理素质好，能够在压力下保持冷静'
    }
    return descriptions[key] || ''
  }

  const getImprovementSuggestion = (key: string) => {
    const suggestions: any = {
      learning: '建议多参与实践项目，在做中学，培养主动学习的习惯',
      execution: '建议制定清晰的计划，设定小目标，逐步提升执行效率',
      communication: '建议多参与团队讨论，练习表达和倾听技巧',
      innovation: '建议多接触新事物，培养发散思维和创新意识',
      collaboration: '建议主动参与团队项目，学习协作和沟通技巧',
      resilience: '建议通过运动、冥想等方式提升抗压能力'
    }
    return suggestions[key] || ''
  }

  const getCareerSuggestions = (strongKeys: string[]) => {
    const suggestions: any = {
      'learning-execution': ['产品经理', '项目经理', '技术专家'],
      'learning-communication': ['培训师', '咨询顾问', '技术布道师'],
      'learning-innovation': ['研发工程师', '产品设计师', '创业者'],
      'execution-communication': ['运营专员', '客户成功', '团队leader'],
      'execution-innovation': ['创业者', '产品经理', '增长黑客'],
      'communication-innovation': ['市场营销', '品牌策划', '内容创作者']
    }

    const key = strongKeys.sort().join('-')
    return suggestions[key] || ['继续探索，发现更多可能性']
  }

  const drawRadarChart = (scores: any) => {
    const query = Taro.createSelectorQuery()
    query.select('#resultRadarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio

        const canvasWidth = res[0].width
        const canvasHeight = res[0].height
        canvas.width = canvasWidth * dpr
        canvas.height = canvasHeight * dpr
        ctx.scale(dpr, dpr)

        const centerX = canvasWidth / 2
        const centerY = canvasHeight / 2
        const radius = Math.min(canvasWidth, canvasHeight) / 2 - 60
        const sides = 6
        const maxValue = 100

        const abilities = [
          { name: '学习力', value: scores.learning },
          { name: '执行力', value: scores.execution },
          { name: '沟通力', value: scores.communication },
          { name: '创新力', value: scores.innovation },
          { name: '协作力', value: scores.collaboration },
          { name: '抗压力', value: scores.resilience }
        ]

        ctx.clearRect(0, 0, canvasWidth, canvasHeight)

        // 绘制背景网格
        for (let i = 1; i <= 5; i++) {
          ctx.beginPath()
          const r = (radius / 5) * i
          for (let j = 0; j < sides; j++) {
            const angle = (Math.PI * 2 / sides) * j - Math.PI / 2
            const x = centerX + r * Math.cos(angle)
            const y = centerY + r * Math.sin(angle)
            if (j === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.closePath()
          ctx.strokeStyle = '#F0F0F0'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // 绘制轴线
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
          )
          ctx.strokeStyle = '#E0E0E0'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // 绘制数据区域
        ctx.beginPath()
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
          const value = abilities[i].value
          const r = (radius * value) / maxValue
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)')
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)')
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.strokeStyle = '#A855F7'
        ctx.lineWidth = 3
        ctx.stroke()

        // 绘制数据点
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
          const value = abilities[i].value
          const r = (radius * value) / maxValue
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)

          ctx.beginPath()
          ctx.arc(x, y, 6, 0, Math.PI * 2)
          ctx.fillStyle = '#A855F7'
          ctx.fill()
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // 绘制标签
        ctx.fillStyle = '#2D3436'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
          const labelRadius = radius + 30
          const x = centerX + labelRadius * Math.cos(angle)
          const y = centerY + labelRadius * Math.sin(angle)

          ctx.fillText(`${abilities[i].name} ${abilities[i].value}`, x, y)
        }
      })
  }

  const handleStartMatching = async () => {
    try {
      Taro.showLoading({
        title: 'AI正在为你匹配任务...',
        mask: true
      })

      // 调用后端API触发任务匹配
      const userInfo = getUserInfo()
      if (userInfo && userInfo.opcScores) {
        // 这里应该调用后端的任务匹配API
        // await taskAPI.triggerMatching({ opcScores: userInfo.opcScores })

        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      Taro.hideLoading()

      Taro.showToast({
        title: '已为你推荐匹配任务',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/tasks/index'
        })
      }, 1500)
    } catch (error) {
      Taro.hideLoading()
      console.error('任务匹配失败:', error)
      Taro.showToast({
        title: '匹配失败，请稍后重试',
        icon: 'none'
      })
    }
  }

  const handleUnlockReport = () => {
    Taro.navigateTo({
      url: '/pages/reports/index'
    })
  }

  if (loading) {
    return (
      <View className="result-page">
        <View className="loading-state">
          <Text className="loading-text">AI正在分析你的能力...</Text>
        </View>
      </View>
    )
  }

  if (!result) {
    return (
      <View className="result-page">
        <View className="empty-state">
          <Text className="empty-text">暂无测评结果</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="result-page">
      {/* 头部标签 */}
      <View className="result-header">
        <Text className="header-title">你的OPC画像</Text>
        <View className="opc-tag">
          <Text className="tag-text">{result.tag}</Text>
        </View>
      </View>

      {/* 雷达图 */}
      <View className="radar-section">
        <Canvas
          id="resultRadarCanvas"
          type="2d"
          className="radar-canvas"
        />
      </View>

      {/* AI分析 */}
      <View className="analysis-section">
        <View className="section-header">
          <Text className="section-title">AI分析</Text>
        </View>
        <Text className="analysis-text">{result.aiAnalysis}</Text>
      </View>

      {/* 优势 */}
      <View className="strengths-section">
        <View className="section-header">
          <Text className="section-title">你的优势</Text>
        </View>
        {result.strengths.map((strength, index) => (
          <View key={index} className="strength-item">
            <View className="strength-dot" />
            <Text className="strength-text">{strength}</Text>
          </View>
        ))}
      </View>

      {/* 提升建议 */}
      <View className="improvements-section">
        <View className="section-header">
          <Text className="section-title">提升建议</Text>
        </View>
        {result.improvements.map((improvement, index) => (
          <View key={index} className="improvement-item">
            <View className="improvement-dot" />
            <Text className="improvement-text">{improvement}</Text>
          </View>
        ))}
      </View>

      {/* 职业建议 */}
      <View className="career-section">
        <View className="section-header">
          <Text className="section-title">适合的职业方向</Text>
        </View>
        <View className="career-tags">
          {result.careerSuggestions.map((career, index) => (
            <View key={index} className="career-tag">
              <Text className="career-text">{career}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 付费报告入口 */}
      <View className="premium-section">
        <View className="premium-card">
          <Text className="premium-title">解锁完整OPC深度报告</Text>
          <Text className="premium-desc">
            获取AI生成的个性化成长路径、职业规划建议、能力提升方案
          </Text>
          <Button className="premium-btn" onClick={handleUnlockReport}>
            ¥29.9 解锁报告
          </Button>
        </View>
      </View>

      {/* 开始匹配按钮 */}
      <View className="action-section">
        <Button className="start-btn" onClick={handleStartMatching}>
          开始匹配任务
        </Button>
      </View>
    </View>
  )
}
