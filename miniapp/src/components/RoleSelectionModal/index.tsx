import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Button from '../Button'
import './index.scss'

interface RoleSelectionModalProps {
  visible: boolean
  onConfirm: (role: 'student' | 'enterprise') => void
}

export default function RoleSelectionModal({ visible, onConfirm }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'enterprise' | null>(null)

  if (!visible) return null

  const handleConfirm = () => {
    if (selectedRole) {
      onConfirm(selectedRole)
    }
  }

  return (
    <View className="role-modal-mask">
      <View className="role-modal-container">
        <View className="role-modal-header">
          <Text className="modal-title">选择你的身份</Text>
          <Text className="modal-subtitle">这将决定你在平台的使用方式</Text>
        </View>

        <View className="role-options">
          <View
            className={`role-option ${selectedRole === 'student' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('student')}
          >
            <Text className="role-icon">◆</Text>
            <Text className="role-name">学生</Text>
            <Text className="role-desc">参与学习成长，完成测评并选择赛道</Text>
            {selectedRole === 'student' && (
              <View className="selected-check">✓</View>
            )}
          </View>

          <View
            className={`role-option ${selectedRole === 'enterprise' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('enterprise')}
          >
            <Text className="role-icon">◈</Text>
            <Text className="role-name">企业</Text>
            <Text className="role-desc">发布任务，招募合适的OPC</Text>
            {selectedRole === 'enterprise' && (
              <View className="selected-check">✓</View>
            )}
          </View>
        </View>

        <View className="warning-box">
          <Text className="warning-icon">⚠</Text>
          <Text className="warning-text">选择后不可更改，请慎重选择</Text>
        </View>

        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!selectedRole}
          className="confirm-button"
        >
          确认选择
        </Button>
      </View>
    </View>
  )
}
