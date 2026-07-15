import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

interface Reward {
  icon: string
  value: string
  label: string
}

const REWARDS: Reward[] = [
  { icon: '◇', value: '+500 XP', label: '经验值' },
  { icon: '●', value: '+¥200', label: '奖励金' },
  { icon: '◆', value: '跳级徽章', label: '专属徽章' }
]

export default function SkipLevelSuccess() {
  const router = useRouter()
  const { level } = router.params
  const targetLevel = parseInt(level || '4')

  const handleBackHome = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  return (
    <View className="skip-success-page">
      <View className="success-bg">
        {/* 粒子装饰 */}
        <View className="particles">
          <View className="particle" style={{ top: '15%', left: '20%', animationDelay: '0s' }} />
          <View className="particle" style={{ top: '25%', right: '25%', animationDelay: '0.5s' }} />
          <View className="particle" style={{ top: '60%', left: '15%', animationDelay: '1s' }} />
          <View className="particle" style={{ top: '70%', right: '20%', animationDelay: '1.5s' }} />
          <View className="particle" style={{ top: '40%', left: '10%', animationDelay: '0.8s' }} />
          <View className="particle" style={{ top: '35%', right: '12%', animationDelay: '0.3s' }} />
        </View>
        <View className="glow" />

        {/* 徽章 */}
        <View className="badge-wrap">
          <View className="badge">
            <Text className="badge-num">{targetLevel}</Text>
          </View>
        </View>

        <Text className="label">LEVEL UP · 跳级成功</Text>
        <Text className="title">恭喜晋升{'\n'}Lv.{targetLevel} 实践者</Text>
        <Text className="subtitle">
          你用实力证明了自己，跨越了一个级别{'\n'}继续保持，更高的挑战在等着你
        </Text>

        {/* 奖励 */}
        <View className="rewards">
          {REWARDS.map((reward, index) => (
            <View key={index} className="reward-item">
              <View className="reward-icon">
                <Text className="icon-text">{reward.icon}</Text>
              </View>
              <Text className="reward-value">{reward.value}</Text>
              <Text className="reward-label">{reward.label}</Text>
            </View>
          ))}
        </View>

        <View className="btn-back" onClick={handleBackHome}>
          <Text className="btn-text">返回主页，继续成长</Text>
        </View>
      </View>
    </View>
  )
}
