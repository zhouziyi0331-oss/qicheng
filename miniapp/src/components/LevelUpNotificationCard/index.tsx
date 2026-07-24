// 晋级通知卡片组件
import { View, Text } from '@tarojs/components'
import './index.scss'

interface LevelUpNotificationProps {
  fromLevel: number
  toLevel: number
  completedCount: number
  onClick: () => void
}

export default function LevelUpNotificationCard({
  fromLevel,
  toLevel,
  completedCount,
  onClick
}: LevelUpNotificationProps) {
  return (
    <View className="level-up-notification-card" onClick={onClick}>
      <View className="notification-glow" />

      <View className="notification-icon">
        <Text className="icon-emoji">🎓</Text>
      </View>

      <View className="notification-content">
        <Text className="notification-title">导师想跟你说几句话</Text>
        <Text className="notification-subtitle">
          {completedCount}单了，有些事想跟你聊聊
        </Text>
      </View>

      <View className="notification-arrow">
        <Text className="arrow-icon">›</Text>
      </View>
    </View>
  )
}
