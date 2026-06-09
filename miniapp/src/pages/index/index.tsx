import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import './index.scss'
import catLogo from '../../assets/images/cat-logo.png'

interface UserInfo {
  id: string;
  nickname: string;
  avatar?: string;
  current_level: number;
  selected_track?: 'content' | 'dev';
  hasCompletedTest?: boolean;
}

interface FeatureCard {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  requiredLevel: number;
  route: string;
}

export default function Index() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // 功能板块配置
  const features: FeatureCard[] = [
    {
      id: 'tasks',
      title: '遇见项目',
      desc: '不是抢单，是被选中',
      icon: '✓',
      color: 'green',
      requiredLevel: 0,
      route: '/pages/tasks/index'
    },
    {
      id: 'community',
      title: '社区广场',
      desc: '找队友、学技能、展示作品',
      icon: '👥',
      color: 'purple',
      requiredLevel: 4,
      route: '/pages/community/index'
    },
    {
      id: 'ability',
      title: '看见成长',
      desc: '这条河又往前流了一段',
      icon: '◈',
      color: 'yellow',
      requiredLevel: 0,
      route: '/pages/ability/index'
    },
    {
      id: 'mentor',
      title: 'AI导师',
      desc: '启程小猫陪你成长',
      icon: '🐱',
      color: 'pink',
      requiredLevel: 0,
      route: '/pages/mentor/index'
    }
  ]

  useEffect(() => {
    loadUserInfo()
    updateTabBar()
  }, [])

  const updateTabBar = () => {
    try {
      const page = Taro.getCurrentInstance().page
      if (page && typeof page.getTabBar === 'function') {
        const tabBar = page.getTabBar()
        if (tabBar && typeof tabBar.setData === 'function') {
          tabBar.setData({ selected: 0 })
        }
      }
    } catch (error) {
      console.log('TabBar更新失败:', error)
    }
  }

  const loadUserInfo = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        setLoading(false)
        return
      }

      const res = await Taro.request({
        url: '/api/v1/user/profile',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setUser(res.data.data)
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    try {
      const res = await Taro.login()
      console.log('微信登录code:', res.code)

      // TODO: 调用后端登录接口
      Taro.showToast({ title: '登录功能开发中', icon: 'none' })
    } catch (error) {
      console.error('登录失败:', error)
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  }

  const handleFeatureClick = (feature: FeatureCard) => {
    if (!user) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    // 检查等级要求
    if (user.current_level < feature.requiredLevel) {
      Taro.showModal({
        title: '功能未解锁',
        content: `需要达到Lv.${feature.requiredLevel}才能使用此功能`,
        showCancel: false
      })
      return
    }

    // 跳转页面
    if (feature.route.startsWith('/pages/tasks') || feature.route.startsWith('/pages/story') || feature.route.startsWith('/pages/profile')) {
      Taro.switchTab({ url: feature.route })
    } else {
      Taro.navigateTo({ url: feature.route })
    }
  }

  const handleStartTest = () => {
    if (!user) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: '/pages/opc-test/index' })
  }

  const handleViewLevelRewards = () => {
    Taro.navigateTo({ url: '/pages/level-rewards/index' })
  }

  // 获取等级名称
  const getLevelName = (level: number): string => {
    const levelNames = ['涉水者', '试流者', '行舟者', '知向者', '自流者', '河成者', '联合体']
    return levelNames[level] || '涉水者'
  }

  // 判断功能是否解锁
  const isFeatureUnlocked = (requiredLevel: number): boolean => {
    return user ? user.current_level >= requiredLevel : false
  }

  return (
    <View className="index-page">
      {/* 顶部用户栏 */}
      {user && (
        <View className="top-bar">
          <View className="user-info-bar">
            <View className="user-avatar-small">
              {user.avatar ? (
                <Image src={user.avatar} className="avatar-img" />
              ) : (
                <Text className="avatar-letter">{user.nickname[0]}</Text>
              )}
            </View>
            <View className="user-level-badge">
              <Text className="level-text">Lv.{user.current_level}</Text>
              <Text className="level-name">{getLevelName(user.current_level)}</Text>
            </View>
          </View>
          <View className="notification-icon" onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })}>
            <Text className="icon-bell">🔔</Text>
          </View>
        </View>
      )}

      {/* Hero插画区域 */}
      <View className="hero-illustration">
        <View className="illustration-container">
          <View className="deco-circle deco-1" />
          <View className="deco-circle deco-2" />
          <View className="deco-circle deco-3" />
          <View className="character">
            <Image src={catLogo} className="center-logo" mode="aspectFit" />
          </View>
        </View>
        <Text className="hero-title">乘着问题，飞跃山峰</Text>
      </View>

      {/* 登录按钮或内容区域 */}
      {!user ? (
        <View className="login-section">
          <Button className="primary-btn" onClick={handleWechatLogin}>
            开始探索
          </Button>
        </View>
      ) : (
        <View className="content-section">
          {/* 等级进度卡片 */}
          <View className="level-progress-card" onClick={handleViewLevelRewards}>
            <View className="level-header">
              <View className="level-info">
                <Text className="current-level">Lv.{user.current_level} {getLevelName(user.current_level)}</Text>
                <Text className="next-level">→ Lv.{user.current_level + 1} {getLevelName(user.current_level + 1)}</Text>
              </View>
              <Text className="view-rewards">查看奖励 →</Text>
            </View>
            <View className="progress-bar">
              <View className="progress-fill" style={{ width: '60%' }} />
            </View>
            <Text className="progress-text">再完成2个任务即可升级</Text>
          </View>

          {/* OPC测评卡片 */}
          {!user.hasCompletedTest && (
            <View className="opc-test-card" onClick={handleStartTest}>
              <View className="test-card-header">
                <Text className="test-card-title">发现你的能力方向</Text>
                <Text className="test-card-badge">第一步</Text>
              </View>
              <Text className="test-card-desc">不是标准答案的考试，而是发现你独特能力的测试</Text>
              <View className="test-card-features">
                <View className="feature-item">
                  <Text className="feature-icon">✓</Text>
                  <Text className="feature-text">了解你擅长什么</Text>
                </View>
                <View className="feature-item">
                  <Text className="feature-icon">✓</Text>
                  <Text className="feature-text">发现你的优势在哪</Text>
                </View>
                <View className="feature-item">
                  <Text className="feature-icon">✓</Text>
                  <Text className="feature-text">找到适合你的方向</Text>
                </View>
              </View>
              <View className="test-card-btn">
                <Text className="btn-text">开始测试 →</Text>
              </View>
            </View>
          )}

          {/* 功能板块 */}
          <View className="section-header">
            <Text className="section-title">功能板块</Text>
          </View>

          <View className="features-grid">
            {features.map(feature => {
              const unlocked = isFeatureUnlocked(feature.requiredLevel)
              return (
                <View
                  key={feature.id}
                  className={`feature-card card-${feature.color} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => handleFeatureClick(feature)}
                >
                  {!unlocked && (
                    <View className="lock-overlay">
                      <Text className="lock-icon">🔒</Text>
                      <Text className="lock-text">Lv.{feature.requiredLevel}解锁</Text>
                    </View>
                  )}
                  <View className="card-icon-small">
                    <Text className="icon-symbol">{feature.icon}</Text>
                  </View>
                  <Text className="card-title-small">{feature.title}</Text>
                  <Text className="card-desc-small">{feature.desc}</Text>
                </View>
              )
            })}
          </View>

          {/* 热门区域 */}
          <View className="section-header">
            <Text className="section-title">他们的成长故事</Text>
          </View>

          <View className="popular-card card-pink" onClick={() => Taro.switchTab({ url: '/pages/story/index' })}>
            <Text className="popular-title">故事墙</Text>
            <Text className="popular-desc">每个人都在用自己的方式成长，来看看他们找到了什么</Text>
            <View className="popular-tags">
              <View className="tag tag-pink">兴趣发现</View>
              <View className="tag tag-pink">成长轨迹</View>
              <View className="tag tag-dark">持续更新</View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
