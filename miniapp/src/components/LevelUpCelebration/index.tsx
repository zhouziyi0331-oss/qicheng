import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import './index.scss'

interface UnlockedPermission {
  icon: string
  name: string
  description: string
  type: 'permission' | 'benefit'
}

interface LevelUpCelebrationProps {
  visible: boolean
  oldLevel: number
  newLevel: number
  newLevelName: string
  unlockedPermissions: UnlockedPermission[]
  onClose: () => void
}

export default function LevelUpCelebration({
  visible,
  oldLevel,
  newLevel,
  newLevelName,
  unlockedPermissions,
  onClose
}: LevelUpCelebrationProps) {
  const [animationStage, setAnimationStage] = useState<'badge' | 'permissions' | 'complete'>('badge')
  const [visiblePermissions, setVisiblePermissions] = useState<number>(0)

  useEffect(() => {
    if (!visible) {
      setAnimationStage('badge')
      setVisiblePermissions(0)
      return
    }

    // 阶段1: 徽章动画 (2.5秒)
    const badgeTimer = setTimeout(() => {
      setAnimationStage('permissions')
    }, 2500)

    return () => clearTimeout(badgeTimer)
  }, [visible])

  useEffect(() => {
    if (animationStage === 'permissions' && unlockedPermissions.length > 0) {
      // 阶段2: 权限逐条展示 (每条0.5秒延迟)
      const permissionTimers: NodeJS.Timeout[] = []

      unlockedPermissions.forEach((_, index) => {
        const timer = setTimeout(() => {
          setVisiblePermissions(index + 1)

          // 最后一条展示完毕后，进入完成阶段
          if (index === unlockedPermissions.length - 1) {
            setTimeout(() => {
              setAnimationStage('complete')
            }, 500)
          }
        }, index * 500)

        permissionTimers.push(timer)
      })

      return () => {
        permissionTimers.forEach(timer => clearTimeout(timer))
      }
    }
  }, [animationStage, unlockedPermissions])

  if (!visible) return null

  return (
    <View className="levelup-overlay">
      <View className="levelup-container">
        {/* 阶段1: 徽章动画 */}
        {animationStage === 'badge' && (
          <View className="badge-animation">
            <View className="badge-wrapper">
              <View className="old-badge">
                <Text className="badge-level">Lv.{oldLevel}</Text>
              </View>
              <View className="new-badge">
                <Text className="badge-level">Lv.{newLevel}</Text>
              </View>
              <View className="particles">
                {[...Array(12)].map((_, i) => (
                  <View key={i} className={`particle particle-${i}`} />
                ))}
              </View>
            </View>
            <Text className="level-name">{newLevelName}</Text>
            <Text className="congrats-text">恭喜升级！</Text>
          </View>
        )}

        {/* 阶段2 & 3: 权限展示 */}
        {(animationStage === 'permissions' || animationStage === 'complete') && (
          <View className="permissions-section">
            <View className="section-header">
              <Text className="header-icon">🎉</Text>
              <Text className="header-title">升至 {newLevelName}</Text>
              <Text className="header-subtitle">解锁新权限与福利</Text>
            </View>

            <View className="permissions-list">
              {unlockedPermissions.map((permission, index) => (
                <View
                  key={index}
                  className={`permission-item ${index < visiblePermissions ? 'visible' : ''} ${permission.type}`}
                >
                  <View className="permission-icon-wrapper">
                    <Text className="permission-icon">{permission.icon}</Text>
                  </View>
                  <View className="permission-content">
                    <Text className="permission-name">{permission.name}</Text>
                    <Text className="permission-description">{permission.description}</Text>
                  </View>
                  {permission.type === 'benefit' && (
                    <View className="benefit-badge">
                      <Text className="benefit-text">福利</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {animationStage === 'complete' && (
              <View className="action-button" onClick={onClose}>
                <Text className="button-text">知道了，开始新任务</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
