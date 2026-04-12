import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { authAPI, abilityAPI, withdrawAPI, levelAPI } from '../../services/api'
import LevelUpModal from '../../components/LevelUpModal'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [radarData, setRadarData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    const page = Taro.getCurrentInstance().page
    if (page && typeof page.getTabBar === 'function') {
      const tabBar = page.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 3 })
      }
    }

    loadUserData()
    checkLevelUp()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // 先从本地获取用户信息
      const localUser = Taro.getStorageSync('user')
      if (localUser) {
        setUser(localUser)
      }

      // 尝试从API获取最新数据
      try {
        const userRes = await authAPI.getCurrentUser()
        setUser(userRes.user)

        const balanceRes = await withdrawAPI.getBalance()
        setBalance(balanceRes.balance || 0)

        const radarRes = await abilityAPI.getRadar()
        setRadarData(radarRes)
      } catch (apiError) {
        console.error('API调用失败，使用本地数据:', apiError)
        // API失败时使用默认数据
        setBalance(0)
        setRadarData({
          level: 1,
          exp: 0,
          max_exp: 100,
          completed_tasks: 0,
          ongoing_tasks: 0,
          stories: 0,
          dimensions: {}
        })
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
      // 如果没有本地用户，使用默认用户
      setUser({
        nickname: '启程用户',
        opc_tags: []
      })
      setBalance(0)
      setRadarData({
        level: 1,
        exp: 0,
        max_exp: 100,
        completed_tasks: 0,
        ongoing_tasks: 0,
        stories: 0,
        dimensions: {}
      })
    } finally {
      setLoading(false)
    }
  }

  const checkLevelUp = async () => {
    try {
      const res = await levelAPI.checkLevelUp()
      if (res.success && res.levelUp) {
        setNewLevel(res.newLevel)
        setShowLevelUp(true)
      }
    } catch (error) {
      console.error('检查升级失败:', error)
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('user')
          Taro.reLaunch({ url: '/pages/index/index' })
        }
      }
    })
  }

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  if (loading || !user) {
    return (
      <View className="profile-page">
        <Text>加载中...</Text>
      </View>
    )
  }

  const expPercent = radarData ? (radarData.exp / radarData.max_exp) * 100 : 0

  return (
    <View className="profile-page">
      {/* 用户信息卡片 */}
      <View className="user-card">
        <View className="user-bg">
          <View className="bg-decoration bg-decoration-1" />
          <View className="bg-decoration bg-decoration-2" />
        </View>

        <View className="user-header">
          <View className="user-avatar">
            <View className="avatar-circle">
              <Text className="avatar-letter">{user.nickname ? user.nickname.charAt(0) : 'U'}</Text>
            </View>
          </View>
          <View className="user-info">
            <Text className="user-name">{user.nickname || '启程用户'}</Text>
            {user.opc_tags && user.opc_tags.length > 0 && (
              <View className="user-opc">
                <Text className="user-opc-text">{user.opc_tags.join(', ')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 等级进度 */}
        {radarData && (
          <View className="level-section">
            <View className="level-header">
              <Text className="level-text">Lv.{radarData.level || 1}</Text>
              <Text className="level-exp">{radarData.exp || 0}/{radarData.max_exp || 100} EXP</Text>
            </View>
            <View className="level-bar">
              <View className="level-progress" style={{ width: `${expPercent}%` }} />
            </View>
          </View>
        )}

        {/* 数据统计 */}
        <View className="user-stats">
          <View className="stat-item" onClick={() => handleNavigate('/pages/my-tasks/index')}>
            <Text className="stat-value">{radarData?.completed_tasks || 0}</Text>
            <Text className="stat-label">完成项目</Text>
          </View>
          <View className="stat-item" onClick={() => handleNavigate('/pages/journey/index')}>
            <Text className="stat-value">{radarData?.ongoing_tasks || 0}</Text>
            <Text className="stat-label">正在流动</Text>
          </View>
          <View className="stat-item" onClick={() => Taro.switchTab({ url: '/pages/story/index' })}>
            <Text className="stat-value">{radarData?.stories || 0}</Text>
            <Text className="stat-label">成长故事</Text>
          </View>
        </View>
      </View>

      {/* 生命资产卡片 */}
      <View className="balance-card" onClick={() => handleNavigate('/pages/withdraw/index')}>
        <View className="balance-icon-circle">
          <svg viewBox="0 0 24 24" className="balance-icon">
            <circle cx="12" cy="12" r="10" />
            <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">¥</text>
          </svg>
        </View>
        <View className="balance-content">
          <Text className="balance-label">你的生命资产</Text>
          <View className="balance-breakdown">
            <Text className="balance-value">¥{balance.toFixed(2)}</Text>
            <Text className="balance-hint">金钱只是一部分</Text>
          </View>
        </View>
        <Text className="balance-arrow">→</Text>
      </View>

      {/* 河道地图 */}
      {radarData && radarData.dimensions && (
        <View className="ability-card" onClick={() => handleNavigate('/pages/ability/index')}>
          <Text className="card-title">能力雷达图</Text>
          <Text className="card-subtitle">查看你的六维能力分布</Text>
          <View className="ability-list">
            {Object.entries(radarData.dimensions).map(([key, value]: [string, any]) => (
              <View key={key} className="ability-item">
                <Text className="ability-name">{value.name}</Text>
                <View className="ability-bar">
                  <View className="ability-progress" style={{ width: `${value.score}%` }} />
                </View>
                <Text className="ability-score">{value.score}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 功能菜单 */}
      <View className="menu-section">
        <Text className="section-title">成长工具</Text>

        <View className="menu-list">
          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/my-tasks/index')}>
            <View className="menu-icon-circle menu-icon-green">
              <Text className="icon-text">✓</Text>
            </View>
            <Text className="menu-label">我的任务</Text>
            <Text className="menu-arrow">→</Text>
          </View>

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/flow-moments/index')}>
            <View className="menu-icon-circle menu-icon-blue">
              <Text className="icon-text">⏱</Text>
            </View>
            <Text className="menu-label">专注时刻</Text>
            <Text className="menu-arrow">→</Text>
          </View>

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/life-question/index')}>
            <View className="menu-icon-circle menu-icon-purple">
              <Text className="icon-text">🎯</Text>
            </View>
            <Text className="menu-label">我的目标</Text>
            <Text className="menu-arrow">→</Text>
          </View>

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/partnerships/index')}>
            <View className="menu-icon-circle menu-icon-orange">
              <Text className="icon-text">🤝</Text>
            </View>
            <Text className="menu-label">合作伙伴</Text>
            <Text className="menu-arrow">→</Text>
          </View>

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/exploration-patterns/index')}>
            <View className="menu-icon-circle menu-icon-cyan">
              <Text className="icon-text">📚</Text>
            </View>
            <Text className="menu-label">我的方法库</Text>
            <Text className="menu-arrow">→</Text>
          </View>

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/journey/index')}>
            <View className="menu-icon-circle menu-icon-pink">
              <Text className="icon-text">📈</Text>
            </View>
            <Text className="menu-label">成长记录</Text>
            <Text className="menu-arrow">→</Text>
          </View>

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/reports/index')}>
            <View className="menu-icon-circle menu-icon-yellow">
              <Text className="icon-text">📊</Text>
            </View>
            <Text className="menu-label">能力报告</Text>
            <Text className="menu-arrow">→</Text>
          </View>

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/settings/index')}>
            <View className="menu-icon-circle menu-icon-yellow">
              <Text className="icon-text">⚙</Text>
            </View>
            <Text className="menu-label">设置</Text>
            <Text className="menu-arrow">→</Text>
          </View>
        </View>
      </View>

      {/* 退出登录按钮 */}
      <View className="logout-section">
        <Button className="logout-btn" onClick={handleLogout}>
          退出登录
        </Button>
      </View>

      {/* 升级弹窗 */}
      <LevelUpModal
        visible={showLevelUp}
        level={newLevel}
        onClose={() => setShowLevelUp(false)}
      />
    </View>
  )
}
