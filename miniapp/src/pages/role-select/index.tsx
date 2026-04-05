import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { getUserInfo, saveUserInfo } from '../../utils'
import './index.scss'

export default function RoleSelect() {
  const [selectedRole, setSelectedRole] = useState<'demander' | 'supplier' | null>(null)

  const handleRoleSelect = (role: 'demander' | 'supplier') => {
    setSelectedRole(role)
  }

  const handleConfirm = () => {
    if (!selectedRole) {
      Taro.showToast({
        title: '请选择角色',
        icon: 'none'
      })
      return
    }

    // 保存角色信息
    const userInfo = getUserInfo()
    saveUserInfo({
      ...userInfo,
      role: selectedRole,
      hasSelectedRole: true
    })

    // 跳转到OPC测评
    Taro.redirectTo({
      url: '/pages/opc-test/index'
    })
  }

  return (
    <View className="role-select-page">
      <View className="header">
        <Text className="title">选择你的角色</Text>
        <Text className="subtitle">开启你的OPC之旅</Text>
      </View>

      <View className="role-cards">
        {/* 需求方卡片 */}
        <View
          className={`role-card ${selectedRole === 'demander' ? 'selected' : ''}`}
          onClick={() => handleRoleSelect('demander')}
        >
          <View className="role-icon role-icon-pink">
            <Text className="icon-text">◉</Text>
          </View>
          <Text className="role-title">需求方</Text>
          <Text className="role-desc">发布任务，寻找合适的人才</Text>
          <View className="role-features">
            <Text className="feature-item">✓ 发布任务需求</Text>
            <Text className="feature-item">✓ 筛选优质供给方</Text>
            <Text className="feature-item">✓ 管理项目进度</Text>
          </View>
          {selectedRole === 'demander' && (
            <View className="selected-badge">
              <Text className="badge-text">已选择</Text>
            </View>
          )}
        </View>

        {/* 供给方卡片 */}
        <View
          className={`role-card ${selectedRole === 'supplier' ? 'selected' : ''}`}
          onClick={() => handleRoleSelect('supplier')}
        >
          <View className="role-icon role-icon-green">
            <Text className="icon-text">⊞</Text>
          </View>
          <Text className="role-title">供给方</Text>
          <Text className="role-desc">接取任务，展示你的能力</Text>
          <View className="role-features">
            <Text className="feature-item">✓ 浏览任务大厅</Text>
            <Text className="feature-item">✓ 接取感兴趣的任务</Text>
            <Text className="feature-item">✓ 积累能力标签</Text>
          </View>
          {selectedRole === 'supplier' && (
            <View className="selected-badge">
              <Text className="badge-text">已选择</Text>
            </View>
          )}
        </View>
      </View>

      <View className="bottom-action">
        <View
          className={`confirm-btn ${selectedRole ? 'active' : ''}`}
          onClick={handleConfirm}
        >
          <Text className="btn-text">确认并继续</Text>
        </View>
        <Text className="tip-text">后续可在个人中心切换角色</Text>
      </View>
    </View>
  )
}
