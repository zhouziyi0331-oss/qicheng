import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { authAPI } from '../../../services/api'
import './index.scss'

export default function RoleSelect() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'company' | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 检查是否已选择过角色
    const userInfo = Taro.getStorageSync('userInfo')
    if (userInfo?.role) {
      setSelectedRole(userInfo.role)
    }
  }, [])

  const handleRoleSelect = (role: 'student' | 'company') => {
    setSelectedRole(role)
  }

  const handleConfirm = async () => {
    if (!selectedRole) {
      Taro.showToast({
        title: '请选择角色',
        icon: 'none'
      })
      return
    }

    setLoading(true)

    try {
      // 保存角色到服务器
      const res = await authAPI.updateProfile({ role: selectedRole })

      if (res.success) {
        // 更新本地用户信息
        const userInfo = Taro.getStorageSync('userInfo') || {}
        const updatedUserInfo = {
          ...userInfo,
          role: selectedRole,
          hasSelectedRole: true
        }
        Taro.setStorageSync('userInfo', updatedUserInfo)

        Taro.showToast({ title: '角色设置成功', icon: 'success' })

        // 检查是否完成OPC测评
        setTimeout(() => {
          if (userInfo.opcTags && userInfo.opcTags.length > 0) {
            // 已完成测评，跳转到首页
            Taro.switchTab({ url: '/pages/index/index' })
          } else {
            // 未完成测评，跳转到测评页面
            Taro.redirectTo({ url: '/pages/opc-test/index' })
          }
        }, 1500)
      } else {
        Taro.showToast({ title: res.message || '设置失败', icon: 'none' })
      }
    } catch (error: any) {
      console.error('保存角色失败:', error)
      Taro.showToast({ title: error.message || '设置失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="role-select-page">
      <View className="header">
        <Text className="title">选择你的角色</Text>
        <Text className="subtitle">开启你的OPC之旅</Text>
      </View>

      <View className="role-cards">
        {/* 学生卡片 */}
        <View
          className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}
          onClick={() => handleRoleSelect('student')}
        >
          <View className="role-icon role-icon-green">
            <Text className="icon-text">⊞</Text>
          </View>
          <Text className="role-title">学生/供给方</Text>
          <Text className="role-desc">接取任务，在实践中成长</Text>
          <View className="role-features">
            <Text className="feature-item">✓ 浏览任务大厅，发现适合的任务</Text>
            <Text className="feature-item">✓ 接取任务，积累项目经验</Text>
            <Text className="feature-item">✓ 获得能力标签，看见成长轨迹</Text>
            <Text className="feature-item">✓ AI导师全程陪伴，答疑解惑</Text>
          </View>
          {selectedRole === 'student' && (
            <View className="selected-badge">
              <Text className="badge-text">已选择</Text>
            </View>
          )}
        </View>

        {/* 企业卡片 */}
        <View
          className={`role-card ${selectedRole === 'company' ? 'selected' : ''}`}
          onClick={() => handleRoleSelect('company')}
        >
          <View className="role-icon role-icon-pink">
            <Text className="icon-text">◉</Text>
          </View>
          <Text className="role-title">企业/需求方</Text>
          <Text className="role-desc">发布任务，寻找优质人才</Text>
          <View className="role-features">
            <Text className="feature-item">✓ 发布任务需求，精准描述要求</Text>
            <Text className="feature-item">✓ AI智能匹配，推荐合适的学生</Text>
            <Text className="feature-item">✓ 管理项目进度，跟踪任务状态</Text>
            <Text className="feature-item">✓ 托管交易保障，安全可靠</Text>
          </View>
          {selectedRole === 'company' && (
            <View className="selected-badge">
              <Text className="badge-text">已选择</Text>
            </View>
          )}
        </View>
      </View>

      <View className="bottom-action">
        <View
          className={`confirm-btn ${selectedRole ? 'active' : ''} ${loading ? 'loading' : ''}`}
          onClick={handleConfirm}
        >
          <Text className="btn-text">{loading ? '保存中...' : '确认并继续'}</Text>
        </View>
        <Text className="tip-text">后续可在个人中心切换角色</Text>
      </View>
    </View>
  )
}
