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
  { name: '内容质量', score: 90, color: 'linear-gradient(90deg, #D88760, #BC6446)' },
  { name: '平台覆盖', score: 85, color: 'linear-gradient(90deg, #F2CD78, #D88760)' },
  { name: '数据分析', score: 82, color: 'linear-gradient(90deg, #BF9E71, #F2CD78)' },
  { name: '完成时效', score: 88, color: 'linear-gradient(90deg, #9ABFB8, #BED7D1)' }
]

export default function SkipLevelScore() {
  const router = useRouter()
  const { level } = router.params
  const targetLevel = parseInt(level || '4')

  const [totalScore] = useState(86)
  const [passed] = useState(true)
  const [passLine] = useState(80)
  const [mentorName] = useState('陈导师')
  const [mentorRole] = useState('内容创作赛道 · 高级导师')
  const [mentorComment] = useState(
    '内容质量整体不错，小红书那篇的选题角度很有新意。数据分析报告还可以更深入一些，但已经展现出了 Lv.4 的基本能力。继续保持这个势头，期待你在 Lv.4 的表现！'
  )

  const handleViewResult = () => {
    if (passed) {
      Taro.navigateTo({
        url: `/packageGrowth/pages/skip-level-success/index?level=${targetLevel}`
      })
    } else {
      Taro.navigateTo({
        url: `/packageGrowth/pages/skip-level-fail/index?level=${targetLevel}`
      })
    }
  }

  return (
    <View className="skip-score-page">
      {/* 顶部评分展示 */}
      <View className="score-hero">
        <View className="hero-glow-1" />
        <View className="hero-glow-2" />

        <View className="score-center">
          <View className="score-ring">
            <View className="score-inner">
              <Text className="score-num">{totalScore}</Text>
              <Text className="score-unit">分</Text>
            </View>
          </View>

          <View className={`score-status ${passed ? 'pass' : 'fail'}`}>
            <Text className="status-icon">{passed ? '✓' : '✗'}</Text>
            <Text className="status-text">{passed ? '通过跳级！' : '未通过'}</Text>
          </View>

          <Text className="score-desc">
            {passed
              ? `恭喜你，评分达到 ${totalScore} 分，超过通过线 ${passLine} 分\n你已成功跳级至 Lv.${targetLevel} 实践者`
              : `评分 ${totalScore} 分，未达到 ${passLine} 分通过线\n继续努力，下次一定可以！`}
          </Text>
        </View>
      </View>

      <ScrollView className="score-scroll" scrollY>
        <View className="score-body">
          {/* 分项评分 */}
          <View className="breakdown-card">
            <View className="card-header">
              <Text className="header-icon">◇</Text>
              <Text className="header-title">分项评分详情</Text>
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

          {/* 导师点评 */}
          <View className="mentor-card">
            <View className="card-header">
              <Text className="header-icon">●</Text>
              <Text className="header-title">导师点评</Text>
            </View>
            <View className="mentor-info">
              <View className="mentor-avatar">
                <Text className="avatar-text">{mentorName[0]}</Text>
              </View>
              <View className="mentor-details">
                <Text className="mentor-name">{mentorName}</Text>
                <Text className="mentor-role">{mentorRole}</Text>
              </View>
            </View>
            <View className="mentor-comment">
              <Text className="comment-text">{mentorComment}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="score-footer">
        <View className="btn-primary" onClick={handleViewResult}>
          <Text className="btn-text">
            {passed ? '查看跳级奖励' : '查看改进建议'}
          </Text>
        </View>
      </View>
    </View>
  )
}
