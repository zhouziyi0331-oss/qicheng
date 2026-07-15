import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import RadarChart from '../../../components/RadarChart'
import { abilityAPI } from '../../../services/api'
import './index.scss'

export default function DeepMode() {
  const [loading, setLoading] = useState(true)

  // 过去的分数（入驻时）
  const [pastScores, setPastScores] = useState({
    信息处理: 0,
    创作驱动: 0,
    工具学习: 0,
    任务执行: 0,
    协作倾向: 0,
    风险态度: 0
  })

  // 现在的分数
  const [currentScores, setCurrentScores] = useState({
    信息处理: 0,
    创作驱动: 0,
    工具学习: 0,
    任务执行: 0,
    协作倾向: 0,
    风险态度: 0
  })

  const [pastDate, setPastDate] = useState('')
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    loadGrowthComparison()
  }, [])

  const loadGrowthComparison = async () => {
    try {
      setLoading(true)
      const res = await abilityAPI.getGrowthComparison()
      if (res && res.success && res.data) {
        const { past, current } = res.data

        if (past && past.dimensions) {
          setPastScores(past.dimensions)
          setPastDate(past.date)
        }

        if (current && current.dimensions) {
          setCurrentScores(current.dimensions)
          setCurrentDate(current.date)
        }
      }
    } catch (error) {
      console.error('加载成长对比数据失败:', error)
      Taro.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const dimensionNames = {
    信息处理: '信息处理',
    创作驱动: '创作驱动',
    工具学习: '工具学习',
    任务执行: '任务执行',
    协作倾向: '协作倾向',
    风险态度: '风险态度'
  }

  const dimColors = {
    信息处理: '#BC6446',
    创作驱动: '#D88760',
    工具学习: '#3A8A84',
    任务执行: '#5B8FAB',
    协作倾向: '#BF9E71',
    风险态度: '#9B8EC4'
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  // 计算平均分
  const calcAverage = (scores) => {
    const values = Object.values(scores)
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  const pastAvg = calcAverage(pastScores)
  const currentAvg = calcAverage(currentScores)
  const avgDiff = currentAvg - pastAvg

  // 找到最大提升和最小提升
  const diffs = Object.keys(currentScores).map(key => ({
    key,
    name: dimensionNames[key],
    diff: currentScores[key] - pastScores[key]
  }))
  const maxImprovement = diffs.reduce((max, item) => item.diff > max.diff ? item : max, diffs[0])
  const minImprovement = diffs.reduce((min, item) => item.diff < min.diff ? item : min, diffs[0])

  // 计算时间差（天数）
  const calcDaysDiff = () => {
    if (!pastDate || !currentDate) return 0
    const past = new Date(pastDate)
    const current = new Date(currentDate)
    const diffTime = Math.abs(current.getTime() - past.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysDiff = calcDaysDiff()
  const timeLabel = daysDiff > 0 ? `${daysDiff}天前` : '入驻时'

  return (
    <View className="deep-mode">
      {/* 顶部栏 */}
      <View className="deep-header">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="header-title">深度模式</Text>
        <View className="header-badge">
          <Text className="badge-text">过去 vs 现在</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text>加载中...</Text>
        </View>
      ) : (
        <>
          {/* 雷达图对比 */}
          <View className="radar-comparison">
            <View className="radar-item">
              <Text className="radar-label">{timeLabel}</Text>
              <View className="radar-wrapper">
                <RadarChart
                  data={pastScores}
                  size={280}
                  showLabels={false}
                  animate={false}
                  strokeColor="#93AEC1"
                  fillOpacity={0.2}
                />
              </View>
              <Text className="radar-avg">平均分 {pastAvg}</Text>
            </View>
            <View className="radar-item highlight">
              <Text className="radar-label current">现在</Text>
              <View className="radar-wrapper">
                <RadarChart
                  data={currentScores}
                  size={280}
                  showLabels={false}
                  animate={true}
                  strokeColor="#BC6446"
                  fillOpacity={0.25}
                />
              </View>
              <Text className="radar-avg current">平均分 {currentAvg}</Text>
            </View>
          </View>

          {/* 六维变化详情 */}
          <View className="dimension-changes">
            <Text className="section-title">六维变化详情</Text>
            <View className="changes-list">
              {Object.keys(currentScores).map(key => {
                const diff = currentScores[key] - pastScores[key]
                const diffColor = diff >= 0 ? '#4ADE80' : '#F87171'
                return (
                  <View key={key} className="change-item">
                    <Text className="change-name">{dimensionNames[key]}</Text>
                    <View className="change-bars">
                      <View className="bar-container">
                        <View
                          className="bar-fill past"
                          style={{ width: `${pastScores[key]}%` }}
                        />
                      </View>
                      <View className="bar-container">
                        <View
                          className="bar-fill current"
                          style={{
                            width: `${currentScores[key]}%`,
                            background: dimColors[key]
                          }}
                        />
                      </View>
                    </View>
                    <Text className="change-diff" style={{ color: diffColor }}>
                      {diff >= 0 ? '+' : ''}{diff}
                    </Text>
                  </View>
                )
              })}
            </View>
            <View className="legend">
              <View className="legend-item">
                <View className="legend-color past" />
                <Text className="legend-text">{timeLabel}</Text>
              </View>
              <View className="legend-item">
                <View className="legend-color current" />
                <Text className="legend-text">现在</Text>
              </View>
            </View>
          </View>

          {/* AI成长洞察 */}
          <View className="growth-insight">
            <View className="insight-header">
              <Text className="insight-icon">▲</Text>
              <Text className="insight-title">成长洞察</Text>
            </View>
            <Text className="insight-text">
              过去{daysDiff > 0 ? daysDiff + '天' : '一段时间'}，你的整体能力平均提升了 <Text className="highlight">+{avgDiff}分</Text>。
              {'\n\n'}
              最显著的成长在<Text className="highlight">{maxImprovement.name}</Text>，这与你近期的任务完成情况高度相关。
              {'\n\n'}
              建议下一阶段重点突破<Text className="highlight">{minImprovement.name}</Text>，尝试接受更多相关挑战。
            </Text>
          </View>

          {/* 底部间距 */}
          <View className="bottom-space" />
        </>
      )}
    </View>
  )
}
