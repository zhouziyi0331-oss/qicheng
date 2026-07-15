import { View, Text, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

interface LevelUpModalProps {
  visible: boolean
  level: number
  title?: string
  message?: string
  privileges?: string[]
  onClose: () => void
}

export default function LevelUpModal({
  visible,
  level,
  title,
  message,
  privileges = [],
  onClose
}: LevelUpModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setTimeout(() => setShow(true), 100)
    } else {
      setShow(false)
    }
  }, [visible])

  if (!visible) return null

  return (
    <View className={`level-up-modal ${show ? 'show' : ''}`}>
      <View className="modal-overlay" onClick={onClose} />
      <View className="modal-content">
        {/* 动画装饰 */}
        <View className="decorations">
          <View className="star star-1">★</View>
          <View className="star star-2">★</View>
          <View className="star star-3">★</View>
          <View className="star star-4">★</View>
          <View className="sparkle sparkle-1">✦</View>
          <View className="sparkle sparkle-2">✦</View>
        </View>

        {/* 主内容 */}
        <View className="modal-body">
          <View className="congrats-icon-wrapper">
            <Text className="congrats-icon">↑</Text>
          </View>
          <Text className="congrats-text">恭喜升级</Text>

          <View className="level-display">
            <Text className="level-text">Lv.{level}</Text>
          </View>

          {title && (
            <Text className="level-title">{title}</Text>
          )}

          {message && (
            <Text className="level-message">{message}</Text>
          )}

          {/* 权益列表 */}
          {privileges.length > 0 && (
            <View className="privileges-section">
              <Text className="privileges-title">新权益解锁</Text>
              <View className="privileges-list">
                {privileges.map((privilege, index) => (
                  <View key={index} className="privilege-item">
                    <Text className="privilege-check">✓</Text>
                    <Text className="privilege-text">{privilege}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 按钮 */}
          <Button className="close-btn" onClick={onClose}>
            查看详情
          </Button>
        </View>
      </View>
    </View>
  )
}
