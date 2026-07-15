import { View, Text, ScrollView, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { opcGrowthAPI } from '../../../services/api'
import '../index.scss'

interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  type: 'opc' | 'project' | 'income' | 'levelup'
  reward?: string
}

interface GrowthStats {
  growthDays: number
  milestones: number
  totalIncome: number
}

interface RadarData {
  creativity: number
  execution: number
  social: number
  learning: number
  business: number
  stress: number
}

export default function Story() {
  const [stats, setStats] = useState<GrowthStats>({ growthDays: 0, milestones: 0, totalIncome: 0 })
  const [radarData, setRadarData] = useState<RadarData>({
    creativity: 70,
    execution: 55,
    social: 65,
    learning: 80,
    business: 45,
    stress: 60
  })
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    const pageInstance = Taro.getCurrentInstance().page
    if (pageInstance && typeof pageInstance.getTabBar === 'function') {
      const tabBar = pageInstance.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 3 })
      }
    }

    loadGrowthData()
  }, [])

  useEffect(() => {
    if (!loading) {
      drawRadarChart()
    }
  }, [loading, radarData])

  const loadGrowthData = async () => {
    console.log('开始加载成长数据')
    try {
      // 模拟数据 - 实际应该从API加载
      const mockStats: GrowthStats = {
        growthDays: 14,
        milestones: 3,
        totalIncome: 480
      }

      const mockTimeline: TimelineEvent[] = [
        {
          id: '1',
          date: '2025年6月12日',
          title: '完成 OPC 测评',
          description: '发现了「创意执行者」标签，AI 分析你在创造力和学习力方面有突出潜力。',
          type: 'opc',
          reward: '★ 获得 +50 经验值'
        },
        {
          id: '2',
          date: '2025年6月15日',
          title: '接受第一个项目',
          description: '匹配到「校园新媒体运营」项目，开始了你的第一次真实商业实践。',
          type: 'project',
          reward: '★ 获得 +80 经验值'
        },
        {
          id: '3',
          date: '2025年6月20日',
          title: '首次获得收入',
          description: '完成第一篇推文，获得 ¥120 项目报酬。你的努力开始有了回报。',
          type: 'income',
          reward: '★ 收入 ¥120 · +100 经验值'
        },
        {
          id: '4',
          date: '2025年6月25日',
          title: '升级至 Lv.2',
          description: '累计经验值突破 200，成功晋升为「成长探索者」，解锁更多项目权限。',
          type: 'levelup',
          reward: '★ 解锁新功能 · 等级提升'
        }
      ]

      setStats(mockStats)
      setTimeline(mockTimeline)
      console.log('数据加载完成', mockStats, mockTimeline)
    } catch (error) {
      console.error('加载成长数据失败:', error)
    } finally {
      setLoading(false)
      console.log('loading设置为false')
    }
  }

  const getEventIconClass = (type: string): string => {
    switch (type) {
      case 'opc': return 'coral'
      case 'project': return 'teal'
      case 'income': return 'amber'
      case 'levelup': return 'blue'
      default: return 'coral'
    }
  }

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'opc': return '★'
      case 'project': return '◆'
      case 'income': return '♥'
      case 'levelup': return '✓'
      default: return '★'
    }
  }

  const drawRadarChart = () => {
    const query = Taro.createSelectorQuery()
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio

        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        const centerX = res[0].width / 2
        const centerY = res[0].height / 2
        const maxRadius = Math.min(centerX, centerY) - 40

        // 清空画布
        ctx.clearRect(0, 0, res[0].width, res[0].height)

        // 绘制网格线（4层）
        ctx.strokeStyle = '#EDE8E2'
        ctx.lineWidth = 1.5
        for (let i = 1; i <= 4; i++) {
          const radius = (maxRadius / 4) * i
          drawHexagon(ctx, centerX, centerY, radius)
        }

        // 绘制轴线
        const angles = [-90, -30, 30, 90, 150, 210]
        ctx.strokeStyle = '#EDE8E2'
        ctx.lineWidth = 1
        angles.forEach(angle => {
          const rad = (angle * Math.PI) / 180
          const x = centerX + maxRadius * Math.cos(rad)
          const y = centerY + maxRadius * Math.sin(rad)
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(x, y)
          ctx.stroke()
        })

        // 绘制数据多边形
        const values = [
          radarData.creativity,
          radarData.execution,
          radarData.social,
          radarData.learning,
          radarData.business,
          radarData.stress
        ]

        ctx.beginPath()
        values.forEach((value, index) => {
          const angle = angles[index]
          const rad = (angle * Math.PI) / 180
          const radius = (value / 100) * maxRadius
          const x = centerX + radius * Math.cos(rad)
          const y = centerY + radius * Math.sin(rad)

          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.closePath()
        ctx.fillStyle = 'rgba(188,100,70,0.15)'
        ctx.fill()
        ctx.strokeStyle = '#BC6446'
        ctx.lineWidth = 2
        ctx.stroke()

        // 绘制数据点
        ctx.fillStyle = '#BC6446'
        values.forEach((value, index) => {
          const angle = angles[index]
          const rad = (angle * Math.PI) / 180
          const radius = (value / 100) * maxRadius
          const x = centerX + radius * Math.cos(rad)
          const y = centerY + radius * Math.sin(rad)

          ctx.beginPath()
          ctx.arc(x, y, 4, 0, 2 * Math.PI)
          ctx.fill()
        })

        // 绘制标签
        const labels = ['创造力', '执行力', '社交力', '学习力', '商业感知', '抗压力']
        ctx.fillStyle = '#6B5E57'
        ctx.font = '11px PingFang SC, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        labels.forEach((label, index) => {
          const angle = angles[index]
          const rad = (angle * Math.PI) / 180
          const labelRadius = maxRadius + 20
          const x = centerX + labelRadius * Math.cos(rad)
          const y = centerY + labelRadius * Math.sin(rad)
          ctx.fillText(label, x, y)
        })
      })
  }

  const drawHexagon = (ctx: any, centerX: number, centerY: number, radius: number) => {
    const angles = [-90, -30, 30, 90, 150, 210]
    ctx.beginPath()
    angles.forEach((angle, index) => {
      const rad = (angle * Math.PI) / 180
      const x = centerX + radius * Math.cos(rad)
      const y = centerY + radius * Math.sin(rad)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()
    ctx.stroke()
  }

  return (
    <View className="story-page">
      <ScrollView scrollY className="story-scroll">
        {/* Hero: 数据卡片 */}
        <View className="timeline-hero">
          <View className="timeline-stats">
            <View className="tl-stat">
              <Text className="num coral">{stats.growthDays}</Text>
              <Text className="lbl">成长天数</Text>
            </View>
            <View className="tl-stat">
              <Text className="num teal">{stats.milestones}</Text>
              <Text className="lbl">完成里程碑</Text>
            </View>
            <View className="tl-stat">
              <Text className="num amber">¥{stats.totalIncome}</Text>
              <Text className="lbl">累计收入</Text>
            </View>
          </View>
        </View>

        {/* 雷达图卡片 - 暂时隐藏 */}
        {/* <View className="radar-card">
          <View className="card-title">
            <Text>能力雷达图</Text>
          </View>
          <View className="radar-canvas-wrap">
            <Canvas
              type="2d"
              id="radarCanvas"
              className="radar-canvas"
            />
          </View>
        </View> */}

        {/* 时间线标题 */}
        <View className="section">
          <View className="section-header">
            <Text className="section-title">我的成长时间线</Text>
          </View>
        </View>

        {/* 时间线列表 */}
        <View className="timeline-list">
          {loading ? (
            <View className="loading-state">
              <Text className="loading-text">加载中...</Text>
            </View>
          ) : timeline.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-text">还没有成长记录</Text>
            </View>
          ) : (
            <>
              {timeline.map((event, index) => (
                <View key={event.id} className="tl-entry">
                  <View className={`tl-dot ${getEventIconClass(event.type)}`}>
                    <Text className="dot-icon">{getEventIcon(event.type)}</Text>
                  </View>
                  <View className="tl-content">
                    <Text className="tl-date">{event.date}</Text>
                    <Text className="tl-title">{event.title}</Text>
                    <Text className="tl-desc">{event.description}</Text>
                    {event.reward && (
                      <View className="tl-reward">
                        <Text className="reward-text">{event.reward}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        <View className="spacer"></View>
      </ScrollView>
    </View>
  )
}
