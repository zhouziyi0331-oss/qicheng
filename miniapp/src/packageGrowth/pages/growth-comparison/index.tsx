import { View, Text, Canvas, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { abilityAPI } from '../../../services/api'
import Loading from '../../../components/Loading'
import GrowthNavigation from '../../../components/GrowthNavigation'
import './index.scss'

interface AbilitySnapshot {
  d1: number // 学习力
  d2: number // 执行力
  d3: number // 沟通力
  d4: number // 创新力
  d5: number // 协作力
  d6: number // 抗压力
  level: number
  totalScore: number
  createdAt: string
  versionName: string
}

interface ComparisonData {
  initial: AbilitySnapshot
  current: AbilitySnapshot
  growth: {
    d1: number
    d2: number
    d3: number
    d4: number
    d5: number
    d6: number
    totalScore: number
    levelUp: number
  }
  daysPassed: number
}

const DIMENSIONS = [
  { key: 'd1', name: '学习力', icon: '●', color: '#3B82F6' },
  { key: 'd2', name: '执行力', icon: '▲', color: '#10B981' },
  { key: 'd3', name: '沟通力', icon: '评论', color: '#8B5CF6' },
  { key: 'd4', name: '创新力', icon: '想法', color: '#F59E0B' },
  { key: 'd5', name: '协作力', icon: '协作', color: '#EC4899' },
  { key: 'd6', name: '抗压力', icon: '能力', color: '#EF4444' }
]

export default function GrowthComparison() {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'detail'>('overview')

  useEffect(() => {
    loadComparisonData()
  }, [])

  const loadComparisonData = async () => {
    try {
      setLoading(true)
      const response = await abilityAPI.getGrowthComparison()

      if (response.success && response.data) {
        setComparisonData(response.data)
        setTimeout(() => {
          drawComparisonChart(response.data)
        }, 300)
      } else {
        throw new Error(response.message || '加载失败')
      }
    } catch (error: any) {
      console.error('加载成长对比失败:', error)
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const drawComparisonChart = (data: ComparisonData) => {
    const query = Taro.createSelectorQuery()
    query.select('#comparisonCanvas')
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
        const radius = Math.min(canvasWidth, canvasHeight) * 0.35

        // 绘制背景网格
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.lineWidth = 1
        for (let i = 1; i <= 5; i++) {
          ctx.beginPath()
          const r = (radius / 5) * i
          for (let j = 0; j <= 6; j++) {
            const angle = (Math.PI / 3) * j - Math.PI / 2
            const x = centerX + r * Math.cos(angle)
            const y = centerY + r * Math.sin(angle)
            if (j === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.closePath()
          ctx.stroke()
        }

        // 绘制轴线
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
          )
          ctx.stroke()
        }

        // 绘制初始数据（虚线，灰色）
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.8)'
        ctx.fillStyle = 'rgba(156, 163, 175, 0.2)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        const initialValues = [data.initial.d1, data.initial.d2, data.initial.d3, data.initial.d4, data.initial.d5, data.initial.d6]
        initialValues.forEach((value, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2
          const r = (radius / 100) * value
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // 绘制当前数据（实线，蓝色）
        ctx.strokeStyle = '#3B82F6'
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
        ctx.lineWidth = 3
        ctx.setLineDash([])
        ctx.beginPath()
        const currentValues = [data.current.d1, data.current.d2, data.current.d3, data.current.d4, data.current.d5, data.current.d6]
        currentValues.forEach((value, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2
          const r = (radius / 100) * value
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // 绘制顶点圆点
        currentValues.forEach((value, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2
          const r = (radius / 100) * value
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#3B82F6'
          ctx.fill()
        })

        // 绘制维度标签
        ctx.fillStyle = '#1F2937'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        DIMENSIONS.forEach((dim, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2
          const labelRadius = radius + 20
          const x = centerX + labelRadius * Math.cos(angle)
          const y = centerY + labelRadius * Math.sin(angle)
          ctx.fillText(dim.name, x, y)
        })
      })
  }

  const getGrowthText = (value: number) => {
    if (value > 0) return `+${value}`
    if (value < 0) return `${value}`
    return '0'
  }

  const getGrowthColor = (value: number) => {
    if (value > 0) return '#10B981'
    if (value < 0) return '#EF4444'
    return '#6B7280'
  }

  const getGrowthIcon = (value: number) => {
    if (value > 0) return '趋势'
    if (value < 0) return '↓'
    return '➡️'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  if (loading) {
    return <Loading text="加载中..." />
  }

  if (!comparisonData) {
    return (
      <View className="growth-comparison-page">
        <View className="empty-state">
          <Text className="empty-icon">数据</Text>
          <Text className="empty-text">暂无对比数据</Text>
          <Text className="empty-hint">完成更多任务后再来查看成长对比</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="growth-comparison-page">
      <ScrollView className="page-scroll" scrollY>
        {/* 头部总览 */}
        <View className="header-section">
          <Text className="page-title">成长对比</Text>
          <Text className="time-range">
            入驻至今 {comparisonData.daysPassed} 天
          </Text>
        </View>

        {/* Tab切换 */}
        <View className="tabs">
          <View
            className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Text className="tab-text">总览对比</Text>
          </View>
          <View
            className={`tab-item ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => setActiveTab('detail')}
          >
            <Text className="tab-text">详细数据</Text>
          </View>
        </View>

        {activeTab === 'overview' ? (
          <>
            {/* 雷达图对比 */}
            <View className="chart-section">
              <View className="chart-header">
                <View className="legend">
                  <View className="legend-item">
                    <View className="legend-dot initial" />
                    <Text className="legend-text">入驻时</Text>
                  </View>
                  <View className="legend-item">
                    <View className="legend-dot current" />
                    <Text className="legend-text">当前</Text>
                  </View>
                </View>
              </View>
              <Canvas
                id="comparisonCanvas"
                type="2d"
                className="comparison-canvas"
              />
            </View>

            {/* 总体成长卡片 */}
            <View className="summary-cards">
              <View className="summary-card">
                <Text className="card-icon">趋势</Text>
                <Text className="card-label">总分提升</Text>
                <Text
                  className="card-value"
                  style={{ color: getGrowthColor(comparisonData.growth.totalScore) }}
                >
                  {getGrowthText(comparisonData.growth.totalScore)}
                </Text>
              </View>

              <View className="summary-card">
                <Text className="card-icon">★</Text>
                <Text className="card-label">等级提升</Text>
                <Text
                  className="card-value"
                  style={{ color: getGrowthColor(comparisonData.growth.levelUp) }}
                >
                  {comparisonData.growth.levelUp > 0
                    ? `+${comparisonData.growth.levelUp}级`
                    : comparisonData.growth.levelUp === 0
                    ? '持平'
                    : `${comparisonData.growth.levelUp}级`
                  }
                </Text>
              </View>

              <View className="summary-card">
                <Text className="card-icon">●️</Text>
                <Text className="card-label">成长天数</Text>
                <Text className="card-value" style={{ color: '#3B82F6' }}>
                  {comparisonData.daysPassed}天
                </Text>
              </View>
            </View>

            {/* 六维能力变化 */}
            <View className="dimensions-section">
              <Text className="section-title">六维能力变化</Text>
              {DIMENSIONS.map((dim) => {
                const key = dim.key as keyof typeof comparisonData.growth
                const growth = comparisonData.growth[key] as number
                const initial = comparisonData.initial[key] as number
                const current = comparisonData.current[key] as number

                return (
                  <View key={dim.key} className="dimension-item">
                    <View className="dimension-header">
                      <View className="dimension-info">
                        <Text className="dimension-icon">{dim.icon}</Text>
                        <Text className="dimension-name">{dim.name}</Text>
                      </View>
                      <View className="dimension-change">
                        <Text className="change-icon">{getGrowthIcon(growth)}</Text>
                        <Text
                          className="change-value"
                          style={{ color: getGrowthColor(growth) }}
                        >
                          {getGrowthText(growth)}
                        </Text>
                      </View>
                    </View>

                    <View className="dimension-bars">
                      <View className="bar-row">
                        <Text className="bar-label">入驻</Text>
                        <View className="bar-container">
                          <View
                            className="bar-fill initial"
                            style={{ width: `${initial}%` }}
                          />
                        </View>
                        <Text className="bar-value">{initial}</Text>
                      </View>

                      <View className="bar-row">
                        <Text className="bar-label">当前</Text>
                        <View className="bar-container">
                          <View
                            className="bar-fill current"
                            style={{ width: `${current}%`, backgroundColor: dim.color }}
                          />
                        </View>
                        <Text className="bar-value">{current}</Text>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        ) : (
          <>
            {/* 详细数据对比 */}
            <View className="detail-section">
              <View className="detail-card">
                <Text className="detail-title">入驻时数据</Text>
                <Text className="detail-date">{formatDate(comparisonData.initial.createdAt)}</Text>

                <View className="detail-stats">
                  <View className="stat-item">
                    <Text className="stat-label">总分</Text>
                    <Text className="stat-value">{comparisonData.initial.totalScore}</Text>
                  </View>
                  <View className="stat-item">
                    <Text className="stat-label">等级</Text>
                    <Text className="stat-value">Lv.{comparisonData.initial.level}</Text>
                  </View>
                </View>

                <View className="detail-dimensions">
                  {DIMENSIONS.map((dim) => {
                    const key = dim.key as keyof AbilitySnapshot
                    const value = comparisonData.initial[key] as number
                    return (
                      <View key={dim.key} className="detail-dim-item">
                        <Text className="dim-icon">{dim.icon}</Text>
                        <Text className="dim-name">{dim.name}</Text>
                        <Text className="dim-value">{value}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>

              <View className="detail-arrow">
                <Text className="arrow-icon">↓</Text>
                <Text className="arrow-text">{comparisonData.daysPassed}天成长</Text>
              </View>

              <View className="detail-card current">
                <Text className="detail-title">当前数据</Text>
                <Text className="detail-date">{formatDate(comparisonData.current.createdAt)}</Text>

                <View className="detail-stats">
                  <View className="stat-item">
                    <Text className="stat-label">总分</Text>
                    <Text className="stat-value" style={{ color: '#3B82F6' }}>
                      {comparisonData.current.totalScore}
                    </Text>
                  </View>
                  <View className="stat-item">
                    <Text className="stat-label">等级</Text>
                    <Text className="stat-value" style={{ color: '#3B82F6' }}>
                      Lv.{comparisonData.current.level}
                    </Text>
                  </View>
                </View>

                <View className="detail-dimensions">
                  {DIMENSIONS.map((dim) => {
                    const key = dim.key as keyof AbilitySnapshot
                    const value = comparisonData.current[key] as number
                    return (
                      <View key={dim.key} className="detail-dim-item">
                        <Text className="dim-icon">{dim.icon}</Text>
                        <Text className="dim-name">{dim.name}</Text>
                        <Text className="dim-value" style={{ color: dim.color }}>
                          {value}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          </>
        )}

        {/* 成长建议 */}
        <View className="advice-section">
          <Text className="advice-title">想法 成长建议</Text>
          <View className="advice-list">
            {comparisonData.growth.totalScore > 10 ? (
              <>
                <Text className="advice-item">✦ 你的总体能力提升显著，继续保持！</Text>
                <Text className="advice-item">★ 可以尝试更有挑战性的任务</Text>
              </>
            ) : comparisonData.growth.totalScore > 0 ? (
              <>
                <Text className="advice-item">趋势 能力在稳步提升，保持节奏</Text>
                <Text className="advice-item">能力 关注薄弱维度，均衡发展</Text>
              </>
            ) : (
              <>
                <Text className="advice-item">○ 多完成任务积累经验</Text>
                <Text className="advice-item">协作 与导师小猫多交流，获取成长建议</Text>
              </>
            )}
          </View>
        </View>

        {/* 成长导航 */}
        <GrowthNavigation current="comparison" />
      </ScrollView>
    </View>
  )
}
