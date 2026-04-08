import { View, Text, Canvas, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { abilityAPI } from '../../services/api'
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

export default function Ability() {
  const [abilityData, setAbilityData] = useState<AbilityData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAbilityData()
  }, [])

  const loadAbilityData = async () => {
    try {
      setLoading(true)

      // 尝试从API加载
      try {
        const data = await abilityAPI.getRadar()
        setAbilityData(data)
        setTimeout(() => {
          drawRadarChart(data)
        }, 300)
      } catch (apiErr) {
        // API失败时使用模拟数据
        console.log('API加载失败，使用模拟数据')
        const mockData: AbilityData = {
          d1: 0, // 学习力
          d2: 0, // 执行力
          d3: 0, // 沟通力
          d4: 0, // 创新力
          d5: 0, // 协作力
          d6: 0, // 抗压力
          level: 1,
          totalScore: 0,
          rank: '未测评'
        }
        setAbilityData(mockData)
        setTimeout(() => {
          drawRadarChart(mockData)
        }, 300)
      }
    } catch (err: any) {
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
          <Text className="empty-text">暂无能力数据</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="ability-page">
      <ScrollView className="ability-scroll" scrollY>
        {/* 头部卡片 */}
        <View className="ability-header">
          <Text className="header-title">六维能力图谱</Text>
          <Text className="header-subtitle">完成任务自动更新能力值</Text>
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
        </View>

        {/* 提升建议 */}
        <View className="improvement-tips">
          <Text className="tips-title">提升建议</Text>
          <Text className="tips-content">
            持续完成任务可以提升对应的能力值。建议优先提升较弱的维度，保持能力均衡发展。
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
