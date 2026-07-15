import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

interface ScoreItem {
  name: string
  score: number
  color: string
}

const SCORE_BREAKDOWN: ScoreItem[] = [
  { name: '内容质量', score: 78, color: 'linear-gradient(90deg, #D88760, #BC6446)' },
  { name: '平台覆盖', score: 75, color: 'linear-gradient(90deg, #BF9E71, #D88760)' },
  { name: '数据分析', score: 62, color: 'linear-gradient(90deg, #EDE5DC, #BF9E71)' },
  { name: '完成时效', score: 80, color: 'linear-gradient(90deg, #9ABFB8, #BED7D1)' }
]

export default function SkipLevelFail() {
  const router = useRouter()
  const { level } = router.params
  const targetLevel = parseInt(level || '4')

  const [totalScore] = useState(72)
  const [passLine] = useState(80)
  const [gap] = useState(8)

  const handleViewImprovement = () => {
    Taro.navigateTo({
      url: `/packageGrowth/pages/skip-level-improve/index?level=${targetLevel}`
    })
  }

  const handleContinue = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  return (
    <View className="skip-fail-page">
      {/* 顶部失败状态 */}
      <View className="fail-hero">
        <View className="hero-glow-1" />
        <View className="hero-glow-2" />

        <View className="fail-icon-wrap">
          <View className="fail-icon">
            <Text className="icon-text">▲</Text>
          </View>
        </View>

        <Text className="fail-title">本次跳级未通过</Text>
        <Text className="fail-subtitle">
          评分 {totalScore} 分，未达到 {passLine} 分通过线{'\n'}不要气馁，继续努力一定可以！
        </Text>
      </View>

      <ScrollView className="fail-scroll" scrollY>
        <View className="fail-body">
          {/* 评分详情 */}
          <View className="score-card">
            <View className="score-row">
              <View className="score-wrap">
                <Text className="score-num">{totalScore}</Text>
                <Text className="score-unit">分</Text>
              </View>
              <View className="score-info">
                <Text className="info-title">本次评分：{totalScore} 分</Text>
                <Text className="info-desc">
                  距离通过线 {passLine} 分还差 {gap} 分，主要扣分项在数据分析深度和内容互动率上
                </Text>
                <View className="gap-tag">
                  <Text className="gap-icon">↓</Text>
                  <Text className="gap-text">差 {gap} 分</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 分项评分 */}
          <View className="breakdown-card">
            <View className="card-header">
              <Text className="header-title">分项评分</Text>
            </View>
            <View className="breakdown-list">
              {SCORE_BREAKDOWN.map((item, index) => (
                <View key={index} className="breakdown-item">
                  <View className="item-header">
                    <Text className="item-name">{item.name}</Text>
                    <Text className="item-score">{item.score}分</Text>
                  </View>
                  <View className="item-bar">
                    <View
                      className="item-fill"
                      style={{
                        width: `${item.score}%`,
                        background: item.color
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 惩罚说明 */}
          <View className="penalty-card">
            <View className="penalty-header">
              <Text className="header-icon">●</Text>
              <Text className="header-title">接下来怎么办</Text>
            </View>
            <View className="penalty-steps">
              <View className="penalty-step">
                <View className="step-num">
                  <Text className="num-text">1</Text>
                </View>
                <View className="step-content">
                  <Text className="step-text">
                    继续正常完成任务，<Text className="step-highlight">升满 2 个级别</Text>（Lv.3 → Lv.4 → Lv.5）
                  </Text>
                </View>
              </View>
              <View className="penalty-step">
                <View className="step-num">
                  <Text className="num-text">2</Text>
                </View>
                <View className="step-content">
                  <Text className="step-text">
                    在此期间，<Text className="step-highlight">重点提升数据分析能力</Text>，这是本次主要扣分项
                  </Text>
                </View>
              </View>
              <View className="penalty-step">
                <View className="step-num">
                  <Text className="num-text">3</Text>
                </View>
                <View className="step-content">
                  <Text className="step-text">
                    升满 2 级后，<Text className="step-highlight">跳级资格自动解锁</Text>，可再次发起挑战
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 鼓励卡片 */}
          <View className="encourage-card">
            <View className="card-header">
              <Text className="header-icon">◇</Text>
              <Text className="header-title">导师寄语</Text>
            </View>
            <Text className="encourage-text">
              这次虽然没有通过，但你的<Text className="text-highlight">内容质量和时效掌控</Text>都表现不错。数据分析是内容创作者的核心竞争力，建议你在接下来的学习中重点关注这一块。
              {'\n\n'}
              <Text className="text-highlight">失败是成功的垫脚石</Text>，期待你下次的挑战！
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="fail-footer">
        <View className="btn-primary" onClick={handleContinue}>
          <Text className="btn-text">继续正常升级之路</Text>
        </View>
        <View className="btn-secondary" onClick={handleViewImprovement}>
          <Text className="btn-text">查看改进建议</Text>
        </View>
      </View>
    </View>
  )
}
