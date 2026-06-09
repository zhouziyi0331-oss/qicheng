import { View, Text, Canvas, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import Loading from '../../components/Loading'
import AbilityHistory from '../../components/AbilityHistory'
import './index.scss'

interface AbilityData {
  d1: number // 学习力
  d2: number // 执行力
  d3: number // 沟通力
  d4: number // 创新力
  d5: number // 协作力
  d6: number // 抗压力
  level: number
  totalScore: number
  rank: string
}

interface AbilitySnapshot {
  id: string
  timestamp: string
  level: number
  totalScore: number
  dimensions: {
    d1: number
    d2: number
    d3: number
    d4: number
    d5: number
    d6: number
  }
  trigger: string
  taskTitle?: string
}

export default function Ability() {
  const [abilityData, setAbilityData] = useState<AbilityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasCompletedFirstTask, setHasCompletedFirstTask] = useState(false)
  const [checkingFirstTask, setCheckingFirstTask] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [historySnapshots, setHistorySnapshots] = useState<AbilitySnapshot[]>([])

  useEffect(() => {
    checkFirstTaskStatus()
  }, [])

  const checkFirstTaskStatus = async () => {
    try {
      setCheckingFirstTask(true)
      const token = Taro.getStorageSync('token')
      if (!token) {
        setCheckingFirstTask(false)
        return
      }

      const res = await Taro.request({
        url: '/api/v1/user/profile',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        const completedTasks = res.data.data.completed_tasks || 0
        setHasCompletedFirstTask(completedTasks > 0)

        // 如果已完成首单，加载能力数据
        if (completedTasks > 0) {
          loadAbilityData()
        }
      }
    } catch (error) {
      console.error('检查首单状态失败:', error)
    } finally {
      setCheckingFirstTask(false)
    }
  }

  const loadAbilityData = async () => {
    setLoading(true)

    try {
      // 调用真实API获取能力雷达图数据
      const res = await abilityAPI.getRadar()

      if (res.success && res.data) {
        const data: AbilityData = {
          d1: res.data.d1 || 0,
          d2: res.data.d2 || 0,
          d3: res.data.d3 || 0,
          d4: res.data.d4 || 0,
          d5: res.data.d5 || 0,
          d6: res.data.d6 || 0,
          level: res.data.level || 0,
          totalScore: res.data.totalScore || 0,
          rank: res.data.rank || '新手'
        }

        setAbilityData(data)

        setTimeout(() => {
          drawRadarChart(data)
        }, 300)

        // 加载历史快照
        loadHistorySnapshots()
      } else {
        throw new Error('数据格式错误')
      }
    } catch (error) {
      console.error('加载能力数据失败:', error)

      // 失败时使用模拟数据作为fallback
      const mockData: AbilityData = {
        d1: 68,
        d2: 82,
        d3: 70,
        d4: 75,
        d5: 65,
        d6: 58,
        level: 3,
        totalScore: 418,
        rank: '成长中'
      }

      setAbilityData(mockData)

      setTimeout(() => {
        drawRadarChart(mockData)
      }, 300)

      // 加载模拟历史数据
      loadMockHistorySnapshots()

      Taro.showToast({
        title: '加载失败，显示模拟数据',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  const loadHistorySnapshots = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) return

      const res = await Taro.request({
        url: '/api/v1/ability/history',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success && res.data.data) {
        setHistorySnapshots(res.data.data)
      }
    } catch (error) {
      console.error('加载历史快照失败:', error)
      loadMockHistorySnapshots()
    }
  }

  const loadMockHistorySnapshots = () => {
    const mockSnapshots: AbilitySnapshot[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        level: 3,
        totalScore: 418,
        dimensions: { d1: 68, d2: 82, d3: 70, d4: 75, d5: 65, d6: 58 },
        trigger: 'task_completed',
        taskTitle: '企业官网开发'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        level: 2,
        totalScore: 380,
        dimensions: { d1: 62, d2: 75, d3: 65, d4: 70, d5: 58, d6: 50 },
        trigger: 'level_up'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        level: 2,
        totalScore: 350,
        dimensions: { d1: 55, d2: 68, d3: 60, d4: 65, d5: 52, d6: 50 },
        trigger: 'task_completed',
        taskTitle: '小程序UI设计'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        level: 1,
        totalScore: 300,
        dimensions: { d1: 50, d2: 50, d3: 50, d4: 50, d5: 50, d6: 50 },
        trigger: 'task_completed',
        taskTitle: '首次任务完成'
      }
    ]
    setHistorySnapshots(mockSnapshots)
  }

  const drawRadarChart = (data: AbilityData) => {
    const query = Taro.createSelectorQuery()
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        // 安全获取 pixelRatio
        let dpr = 2
        try {
          const systemInfo = Taro.getSystemInfoSync()
          dpr = systemInfo.pixelRatio || 2
        } catch (error) {
          console.error('获取系统信息失败，使用默认值:', error)
        }

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

        // 六维能力数据
        const abilities = [
          { name: '学习力', value: data.d1, color: '#D4F291' },
          { name: '执行力', value: data.d2, color: '#F9C6D9' },
          { name: '沟通力', value: data.d3, color: '#A8D8EA' },
          { name: '创新力', value: data.d4, color: '#FFE082' },
          { name: '协作力', value: data.d5, color: '#D4F291' },
          { name: '抗压力', value: data.d6, color: '#F9C6D9' }
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

  const getAbilityLevel = (value: number) => {
    if (value >= 80) return '优秀'
    if (value >= 60) return '良好'
    if (value >= 40) return '中等'
    return '待提升'
  }

  const getAbilityColor = (value: number) => {
    if (value >= 80) return '#10B981'
    if (value >= 60) return '#3B82F6'
    if (value >= 40) return '#F59E0B'
    return '#EF4444'
  }

  if (checkingFirstTask) {
    return <Loading text="正在加载..." />
  }

  // 首单前显示占位符
  if (!hasCompletedFirstTask) {
    return (
      <View className="ability-page">
        <View className="locked-state">
          <View className="lock-icon">🔒</View>
          <Text className="lock-title">能力画像未解锁</Text>
          <Text className="lock-subtitle">完成首单后解锁</Text>
          <View className="lock-description">
            <Text className="description-text">
              完成第一个任务后，系统会根据你的表现生成专属的六维能力画像
            </Text>
          </View>
          <View className="unlock-benefits">
            <Text className="benefits-title">解锁后你将获得：</Text>
            <View className="benefit-item">
              <Text className="benefit-icon">📊</Text>
              <Text className="benefit-text">六维能力雷达图</Text>
            </View>
            <View className="benefit-item">
              <Text className="benefit-icon">📈</Text>
              <Text className="benefit-text">能力成长趋势</Text>
            </View>
            <View className="benefit-item">
              <Text className="benefit-icon">🎯</Text>
              <Text className="benefit-text">个性化提升建议</Text>
            </View>
            <View className="benefit-item">
              <Text className="benefit-icon">🏆</Text>
              <Text className="benefit-text">全站能力排名</Text>
            </View>
          </View>
          <View className="action-hint">
            <Text className="hint-text">💡 去任务大厅接取你的第一个任务吧！</Text>
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return <Loading text="正在加载能力数据..." />
  }

  if (!abilityData) {
    return (
      <View className="ability-page">
        <View className="empty-state">
          <Text className="empty-text">暂无能力数据</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="ability-page">
      {/* 头部卡片 - 固定 */}
      <View className="ability-header">
        <View className="header-top">
          <View className="header-text">
            <Text className="header-title">六维能力图谱</Text>
            <Text className="header-subtitle">完成任务自动更新能力值</Text>
          </View>
          <View className="history-btn" onClick={() => setShowHistory(true)}>
            <Text className="history-icon">📜</Text>
            <Text className="history-text">历史</Text>
          </View>
        </View>
        <View className="header-stats">
          <View className="stat-item">
            <Text className="stat-value">Lv.{abilityData.level}</Text>
            <Text className="stat-label">当前等级</Text>
          </View>
          <View className="stat-divider" />
          <View className="stat-item">
            <Text className="stat-value">{abilityData.totalScore}</Text>
            <Text className="stat-label">综合得分</Text>
          </View>
          <View className="stat-divider" />
          <View className="stat-item">
            <Text className="stat-value">{abilityData.rank}</Text>
            <Text className="stat-label">全站排名</Text>
          </View>
        </View>
      </View>

      {/* 雷达图 - 固定 */}
      <View className="radar-card">
        <Canvas
          id="radarCanvas"
          type="2d"
          className="radar-canvas"
        />
      </View>

      {/* 能力详情 - 可滚动 */}
      <ScrollView className="ability-scroll" scrollY>
        <View className="ability-details">
          <Text className="details-title">能力详情</Text>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">学习力</Text>
              <Text className="ability-value">{abilityData.d1}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.d1}%`,
                  background: getAbilityColor(abilityData.d1)
                }}
              />
            </View>
            <Text className="ability-level" style={{ color: getAbilityColor(abilityData.d1) }}>
              {getAbilityLevel(abilityData.d1)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">执行力</Text>
              <Text className="ability-value">{abilityData.d2}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.d2}%`,
                  background: getAbilityColor(abilityData.d2)
                }}
              />
            </View>
            <Text className="ability-level" style={{ color: getAbilityColor(abilityData.d2) }}>
              {getAbilityLevel(abilityData.d2)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">沟通力</Text>
              <Text className="ability-value">{abilityData.d3}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.d3}%`,
                  background: getAbilityColor(abilityData.d3)
                }}
              />
            </View>
            <Text className="ability-level" style={{ color: getAbilityColor(abilityData.d3) }}>
              {getAbilityLevel(abilityData.d3)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">创新力</Text>
              <Text className="ability-value">{abilityData.d4}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.d4}%`,
                  background: getAbilityColor(abilityData.d4)
                }}
              />
            </View>
            <Text className="ability-level" style={{ color: getAbilityColor(abilityData.d4) }}>
              {getAbilityLevel(abilityData.d4)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">协作力</Text>
              <Text className="ability-value">{abilityData.d5}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.d5}%`,
                  background: getAbilityColor(abilityData.d5)
                }}
              />
            </View>
            <Text className="ability-level" style={{ color: getAbilityColor(abilityData.d5) }}>
              {getAbilityLevel(abilityData.d5)}
            </Text>
          </View>

          <View className="ability-item">
            <View className="ability-header-row">
              <Text className="ability-name">抗压力</Text>
              <Text className="ability-value">{abilityData.d6}</Text>
            </View>
            <View className="ability-bar">
              <View
                className="ability-fill"
                style={{
                  width: `${abilityData.d6}%`,
                  background: getAbilityColor(abilityData.d6)
                }}
              />
            </View>
            <Text className="ability-level" style={{ color: getAbilityColor(abilityData.d6) }}>
              {getAbilityLevel(abilityData.d6)}
            </Text>
          </View>

          {/* 提升建议 */}
          <View className="improvement-tips">
            <Text className="tips-title">提升建议</Text>
            <Text className="tips-content">
              持续完成任务可以提升对应的能力值。建议优先提升较弱的维度，保持能力均衡发展。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 历史记录弹窗 */}
      <AbilityHistory
        visible={showHistory}
        snapshots={historySnapshots}
        currentData={abilityData}
        onClose={() => setShowHistory(false)}
      />
    </View>
  )
}
