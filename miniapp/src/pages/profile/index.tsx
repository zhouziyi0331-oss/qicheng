import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import LevelUpModal from '../../components/LevelUpModal'
import Loading from '../../components/Loading'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [radarData, setRadarData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel] = useState(1)

  // 获取等级名称
  const getLevelName = (level: number, track: string) => {
    const levelNames = {
      content: ['Lv.0 启程者', 'Lv.1 探索者', 'Lv.2 实践者', 'Lv.3 创作者', 'Lv.4 引领者', 'Lv.5 创造者'],
      dev: ['Lv.0 启程者', 'Lv.1 探索者', 'Lv.2 构建者', 'Lv.3 工程师', 'Lv.4 架构师', 'Lv.5 创造者']
    }
    return levelNames[track]?.[level] || `Lv.${level}`
  }

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    try {
      const page = Taro.getCurrentInstance().page
      if (page && typeof page.getTabBar === 'function') {
        const tabBar = page.getTabBar()
        if (tabBar && typeof tabBar.setData === 'function') {
          tabBar.setData({ selected: 3 })
        }
      }
    } catch (error) {
      console.error('更新TabBar失败:', error)
    }

    loadUserData()
    checkLevelUp()
  }, [])

  const loadUserData = async () => {
    setLoading(true)

    try {
      // 获取用户信息
      const userResponse = await Taro.request({
        url: 'http://localhost:3000/api/v1/student/profile',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('accessToken')}`
        }
      })

      if (userResponse.statusCode === 200 && userResponse.data.success) {
        const userData = userResponse.data.data
        setUser({
          id: userData.id,
          nickname: userData.nickname,
          avatar: userData.avatar_url,
          phone: userData.phone,
          opc_tags: userData.opc_label ? [userData.opc_label] : [],
          bio: userData.bio || '正在探索自己的方向',
          track: userData.track,
          current_level: userData.current_level
        })
      }

      // 获取余额
      const balanceResponse = await Taro.request({
        url: 'http://localhost:3000/api/v1/student/balance',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('accessToken')}`
        }
      })

      if (balanceResponse.statusCode === 200 && balanceResponse.data.success) {
        setBalance(balanceResponse.data.data.balance || 0)
      }

      // 获取能力雷达图数据
      const radarResponse = await Taro.request({
        url: 'http://localhost:3000/api/v1/ability/radar',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('accessToken')}`
        }
      })

      if (radarResponse.statusCode === 200 && radarResponse.data.success) {
        const radarData = radarResponse.data.data
        setRadarData({
          level: radarData.level?.a || 0,
          current_level: radarData.level?.a || 0,
          track: radarData.track,
          completed_tasks: radarData.taskCount || 0,
          ongoing_tasks: 0, // 需要从其他接口获取
          stories: 0, // 需要从其他接口获取
          dimensions: radarData.scores || {}
        })
      }

    } catch (error) {
      console.error('加载用户数据失败:', error)
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkLevelUp = async () => {
    // 暂时禁用升级检查，避免API调用失败
    console.log('升级检查已禁用')
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
    return <Loading text="正在加载你的成长数据..." />
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

        {/* 等级和赛道信息 */}
        {radarData && (
          <View className="level-section">
            <View className="level-header">
              <View className="level-info">
                <Text className="level-text">Lv.{radarData.current_level || 0}</Text>
                {radarData.track && (
                  <Text className="track-badge">{radarData.track === 'content' ? '内容赛道' : '开发赛道'}</Text>
                )}
              </View>
              <Text className="level-name">{getLevelName(radarData.current_level, radarData.track)}</Text>
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

      {/* 能力雷达图卡片 */}
      <View className="radar-card" onClick={() => handleNavigate('/pages/ability/index')}>
        <View className="radar-header">
          <View>
            <Text className="card-title">能力雷达图</Text>
            <Text className="card-subtitle">查看你的六维能力分布</Text>
          </View>
          <Text className="card-arrow">→</Text>
        </View>
        {radarData && radarData.dimensions && (
          <View className="radar-preview">
            <Text className="radar-level">Lv.{radarData.level}</Text>
            <Text className="radar-hint">已完成 {radarData.completed_tasks} 个项目</Text>
          </View>
        )}
      </View>

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

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/jump-level/index')}>
            <View className="menu-icon-circle menu-icon-red">
              <Text className="icon-text">🚀</Text>
            </View>
            <Text className="menu-label">跳级申请</Text>
            <Text className="menu-arrow">→</Text>
          </View>

          <View className="menu-item-simple" onClick={() => handleNavigate('/pages/teams/index')}>
            <View className="menu-icon-circle menu-icon-purple">
              <Text className="icon-text">👥</Text>
            </View>
            <Text className="menu-label">我的队伍</Text>
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
