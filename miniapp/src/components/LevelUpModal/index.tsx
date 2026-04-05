import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import './index.scss'

interface LevelUpModalProps {
  visible: boolean
  level: number
  onClose: () => void
}

export default function LevelUpModal({ visible, level, onClose }: LevelUpModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      // 3秒后自动关闭
      setTimeout(() => {
        handleClose()
      }, 3000)
    }
  }, [visible])

  const handleClose = () => {
    setShow(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!visible) return null

  return (
    <View className={`level-up-modal ${show ? 'show' : ''}`} onClick={handleClose}>
      <View className="modal-content" onClick={(e) => e.stopPropagation()}>
        <View className="fireworks">
          <View className="firework" />
          <View className="firework" />
          <View className="firework" />
        </View>

        <View className="level-badge">
          <Text className="level-text">Lv.{level}</Text>
        </View>

        <Text className="congrats-text">恭喜升级！</Text>
        <Text className="desc-text">解锁更多高级任务和功能</Text>

        <View className="rewards">
          <View className="reward-item">
            <Text className="reward-icon">★</Text>
            <Text className="reward-text">经验 +100</Text>
          </View>
          <View className="reward-item">
            <Text className="reward-icon">◎</Text>
            <Text className="reward-text">成就徽章</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
