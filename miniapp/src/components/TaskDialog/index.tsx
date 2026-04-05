import { View, Text, Button } from '@tarojs/components'
import './index.scss'

interface TaskDialogProps {
  visible: boolean
  task: {
    title: string
    description: string
    budget: number
    level: number
  }
  onAccept: () => void
  onCancel: () => void
}

export default function TaskDialog({ visible, task, onAccept, onCancel }: TaskDialogProps) {
  if (!visible) return null

  return (
    <View className="task-dialog-overlay">
      <View className="task-dialog">
        {/* 猫导师头像 */}
        <View className="dialog-avatar">
          <View className="avatar-circle">🐱</View>
          <View className="avatar-bubble">
            <Text className="bubble-text">有个任务很适合你！</Text>
          </View>
        </View>

        {/* 任务卡片 */}
        <View className="dialog-card">
          <View className="card-header">
            <Text className="card-title">{task.title}</Text>
            <View className="card-level">Lv.{task.level}</View>
          </View>

          <Text className="card-desc">{task.description}</Text>

          <View className="card-reward">
            <View className="reward-icon">💰</View>
            <View className="reward-info">
              <Text className="reward-label">任务奖励</Text>
              <Text className="reward-value">¥{task.budget}</Text>
            </View>
          </View>
        </View>

        {/* 按钮组 */}
        <View className="dialog-actions">
          <Button className="action-button cancel" onClick={onCancel}>
            <Text className="button-text">再看看</Text>
          </Button>
          <Button className="action-button accept" onClick={onAccept}>
            <Text className="button-text">接受任务</Text>
          </Button>
        </View>

        {/* 装饰元素 */}
        <View className="dialog-decoration decoration-1">✨</View>
        <View className="dialog-decoration decoration-2">⭐</View>
        <View className="dialog-decoration decoration-3">💫</View>
      </View>
    </View>
  )
}
