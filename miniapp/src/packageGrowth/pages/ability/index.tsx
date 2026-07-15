import { View, Text, Canvas, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { abilityAPI } from '../../../services/api'
import GrowthNavigation from '../../../components/GrowthNavigation'
import './index.scss'

interface AbilityData {
  information_processing: number // 信息处理
  creation_drive: number // 创作驱动
  tool_learning: number // 工具学习
  task_execution: number // 任务执行
  collaboration: number // 协作倾向
  risk_attitude: number // 风险态度
  personality_tag: string // 人格标签（7种之一）
  personality_description: string // 人格描述
  opc_completed: boolean // 是否完成OPC测试
  opc_completed_at?: string // 测试完成时间
}

export default function Ability() {
  const [abilityData, setAbilityData] = useState<AbilityData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAbilityData()
  }, [])

  const loadAbilityData = async () => {
    try {
      setLoading(true)

      // 先检查是否完成OPC测试
      const opcResult = Taro.getStorageSync('opc_test_result')

      if (!opcResult || !opcResult.scores) {
        // 未完成OPC测试，显示引导页面
        setAbilityData({
          information_processing: 0,
          creation_drive: 0,
          tool_learning: 0,
          task_execution: 0,
          collaboration: 0,
          risk_attitude: 0,
          personality_tag: '',
          personality_description: '',
          opc_completed: false
        })
        setLoading(false)
        return
      }

      // 已完成OPC测试，加载数据
      const data: AbilityData = {
        information_processing: opcResult.scores.information_processing || 0,
        creation_drive: opcResult.scores.creation_drive || 0,
        tool_learning: opcResult.scores.tool_learning || 0,
        task_execution: opcResult.scores.task_execution || 0,
        collaboration: opcResult.scores.collaboration || 0,
        risk_attitude: opcResult.scores.risk_attitude || 0,
        personality_tag: opcResult.personalityTag || '',
        personality_description: opcResult.personalityDescription || '',
        opc_completed: true,
        opc_completed_at: opcResult.completedAt
      }

      setAbilityData(data)
      setTimeout(() => {
        drawRadarChart(data)
      }, 300)
    } catch (err: any) {
      console.error('加载OPC数据失败:', err)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const drawRadarChart = (data: AbilityData) => {
    const query = Taro.createSelectorQuery()
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio

        // 设置Canvas尺寸
        const canvasWidth = res[0].width
        const canvasHeight = res[0].height
        canvas.width = canvasWidth * dpr
        canvas.height = canvasHeight * dpr
        ctx.scale(dpr, dpr)

        // 绘制参数
        const centerX = canvasWidth / 2
        const centerY = canvasHeight / 2
        const radius = Math.min(canvasWidth, canvasHeight) / 2 - 60
        const sides = 6
        const maxValue = 100

        // OPC六维数据
        const abilities = [
          { name: '信息处理', value: data.information_processing, color: '#D4F291' },
          { name: '创作驱动', value: data.creation_drive, color: '#F9C6D9' },
          { name: '工具学习', value: data.tool_learning, color: '#A8D8EA' },
          { name: '任务执行', value: data.task_execution, color: '#FFE082' },
          { name: '协作倾向', value: data.collaboration, color: '#D4F291' },
          { name: '风险态度', value: data.risk_attitude, color: '#F9C6D9' }
        ]

        // 清空画布
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)

        // 绘制背景网格（5层）
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
          ctx.strokeStyle = i === 5 ? '#E0E0E0' : '#F0F0F0'
          ctx.lineWidth = i === 5 ? 2 : 1
          ctx.stroke()
        }

        // 绘制轴线
        ctx.strokeStyle = '#E0E0E0'
        ctx.lineWidth = 1
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
          )
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

        // 填充渐变
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)')
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)')
        ctx.fillStyle = gradient
        ctx.fill()

        // 描边
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
        ctx.fillStyle = '#1a1a1a'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 / sides) * i - Math.PI / 2
          const labelRadius = radius + 30
          const x = centerX + labelRadius * Math.cos(angle)
          const y = centerY + labelRadius * Math.sin(angle)

          ctx.fillText(abilities[i].name, x, y)
        }
      })
  }

  const getDimensionInterpretation = (dimension: string, value: number): string => {
    // 根据维度和分数返回解读
    if (value <= 40) {
      const lowInterpretations = {
        '信息处理': '拆解型思维，擅长把复杂问题分解成小块',
        '创作驱动': '逻辑型驱动，注重结构和逻辑',
        '工具学习': '手册型学习，喜欢先看文档再实践',
        '任务执行': '迭代型执行，快速试错快速调整',
        '协作倾向': '独立型工作，喜欢独立完成任务',
        '风险态度': '稳健型决策，追求稳定和确定性'
      }
      return lowInterpretations[dimension] || ''
    } else if (value >= 60) {
      const highInterpretations = {
        '信息处理': '整合型思维，擅长看全局找关联',
        '创作驱动': '视觉型驱动，善于用画面表达想法',
        '工具学习': '探索型学习，喜欢边做边学',
        '任务执行': '规划型执行，喜欢想清楚再动手',
        '协作倾向': '协作型工作，享受团队合作',
        '风险态度': '冒险型决策，愿意尝试新方法'
      }
      return highInterpretations[dimension] || ''
    }
    return '中等水平，具有一定灵活性'
  }

  if (loading) {
    return (
      <View className="ability-page">
        <View className="loading-state">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!abilityData) {
    return (
      <View className="ability-page">
        <View className="empty-state">
          <Text className="empty-text">暂无数据</Text>
        </View>
      </View>
    )
  }

  // 未完成OPC测试，显示引导页面
  if (!abilityData.opc_completed) {
    return (
      <View className="ability-page">
        <ScrollView className="ability-scroll" scrollY>
          <View className="guide-container">
            <Text className="guide-icon">●</Text>
            <Text className="guide-title">还未完成OPC能力画像测试</Text>
            <Text className="guide-desc">
              完成36题OPC测试，生成你的六维能力雷达图和专属人格标签
            </Text>
            <View
              className="guide-button"
              onClick={() => {
                Taro.navigateTo({
                  url: '/packageOnboarding/pages/opc-test/index'
                })
              }}
            >
              <Text className="button-text">开始测试</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="ability-page">
      <ScrollView className="ability-scroll" scrollY>
        {/* 头部卡片 */}
        <View className="ability-header">
          <Text className="header-title">OPC六维能力画像</Text>
          <Text className="header-subtitle">这不是考试，是一面镜子</Text>

          {/* 人格标签 */}
          {abilityData.personality_tag && (
            <View className="personality-card">
              <Text className="personality-tag">{abilityData.personality_tag}</Text>
              <Text className="personality-desc">{abilityData.personality_description}</Text>
            </View>
          )}

          {abilityData.opc_completed_at && (
            <Text className="test-date">测试时间：{new Date(abilityData.opc_completed_at).toLocaleDateString()}</Text>
          )}
        </View>

        {/* 雷达图 */}
        <View className="radar-card">
          <Canvas
            id="radarCanvas"
            type="2d"
            className="radar-canvas"
          />
        </View>

        {/* 能力详情 */}
        <View className="ability-details">
          <Text className="details-title">六维解读</Text>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">信息处理</Text>
              <Text className="ability-value">{abilityData.information_processing}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.information_processing}%`,
                  background: '#A855F7'
                }}
              />
            </View>
            <Text className="ability-interpretation">
              {getDimensionInterpretation('信息处理', abilityData.information_processing)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">创作驱动</Text>
              <Text className="ability-value">{abilityData.creation_drive}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.creation_drive}%`,
                  background: '#EC4899'
                }}
              />
            </View>
            <Text className="ability-interpretation">
              {getDimensionInterpretation('创作驱动', abilityData.creation_drive)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">工具学习</Text>
              <Text className="ability-value">{abilityData.tool_learning}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.tool_learning}%`,
                  background: '#3B82F6'
                }}
              />
            </View>
            <Text className="ability-interpretation">
              {getDimensionInterpretation('工具学习', abilityData.tool_learning)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">任务执行</Text>
              <Text className="ability-value">{abilityData.task_execution}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.task_execution}%`,
                  background: '#10B981'
                }}
              />
            </View>
            <Text className="ability-interpretation">
              {getDimensionInterpretation('任务执行', abilityData.task_execution)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">协作倾向</Text>
              <Text className="ability-value">{abilityData.collaboration}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.collaboration}%`,
                  background: '#F59E0B'
                }}
              />
            </View>
            <Text className="ability-interpretation">
              {getDimensionInterpretation('协作倾向', abilityData.collaboration)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">风险态度</Text>
              <Text className="ability-value">{abilityData.risk_attitude}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.risk_attitude}%`,
                  background: '#EF4444'
                }}
              />
            </View>
            <Text className="ability-interpretation">
              {getDimensionInterpretation('风险态度', abilityData.risk_attitude)}
            </Text>
          </View>
        </View>

        {/* 重要说明 */}
        <View className="important-note">
          <Text className="note-title">重要说明</Text>
          <Text className="note-content">
            这是你的工作风格画像，不是能力高低的评判。低分不代表"差"，高分不代表"好"——它们只是描述你独特的做事方式。
          </Text>
        </View>

        {/* 成长导航 */}
        <GrowthNavigation current="ability" />
      </ScrollView>
    </View>
  )
}
