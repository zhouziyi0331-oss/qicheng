import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import './index.scss'
import catLogo from '../../assets/images/cat-logo.png'

export default function Index() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    const page = Taro.getCurrentInstance().page
    if (page && typeof page.getTabBar === 'function') {
      const tabBar = page.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 0 })
      }
    }

    // 检查本地用户信息
    const localUser = Taro.getStorageSync('user')
    if (localUser) {
      setUser(localUser)
    }
  }, [])

  const handleWechatLogin = async () => {
    try {
      const res = await Taro.login()
      console.log('微信登录code:', res.code)

      // 模拟登录成功
      const mockUser = {
        id: 1,
        nickname: '启程用户',
        avatar: 'https://via.placeholder.com/100',
        role: 'provider',
        opc_tags: ['C', 'E']
      }

      Taro.setStorageSync('token', 'mock_token_' + Date.now())
      Taro.setStorageSync('user', mockUser)
      setUser(mockUser)

      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (error) {
      console.error('登录失败:', error)
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  }

  const handleNavigate = (url: string) => {
    if (!user) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    Taro.navigateTo({ url })
  }

  const handleStartTest = () => {
    if (!user) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: '/pages/opc-test/index' })
  }

  return (
    <View className="index-page">
      {/* 顶部用户栏 */}
      {user && (
        <View className="top-bar">
          <View className="user-avatar-small">
            <Text className="avatar-letter">{user.nickname[0]}</Text>
          </View>
          <View className="notification-icon">
            <Text className="icon-bell">🔔</Text>
          </View>
        </View>
      )}

      {/* Hero插画区域 */}
      <View className="hero-illustration">
        <View className="illustration-container">
          {/* 装饰元素 */}
          <View className="deco-circle deco-1" />
          <View className="deco-circle deco-2" />
          <View className="deco-circle deco-3" />

          {/* 中心Logo */}
          <View className="character">
            <Image src={catLogo} className="center-logo" mode="aspectFit" />
          </View>
        </View>

        <Text className="hero-title">乘着问题，飞跃山峰</Text>
        <Text className="hero-subtitle">不是证明你多有用，而是对自己认真</Text>
      </View>

      {/* 登录按钮或推荐卡片 */}
      {!user ? (
        <View className="login-section">
          <Button className="primary-btn" onClick={handleWechatLogin}>
            开始你的河
          </Button>
          <Text className="login-hint">把兴趣转化为技能，让成长看得见</Text>
          <Text className="login-hint-sub">个性是AI时代的第一财产，创造力是最值钱的资产</Text>
        </View>
      ) : (
        <View className="content-section">
          {/* OPC测评卡片 */}
          {!user.hasCompletedTest && (
            <View className="opc-test-card" onClick={handleStartTest}>
              <View className="test-card-header">
                <Text className="test-card-title">发现你的能力方向</Text>
                <Text className="test-card-badge">第一步</Text>
              </View>
              <Text className="test-card-desc">这不是考试，是一面镜子——不是蒸馏常规技能，是找到你的不同</Text>
              <View className="test-card-features">
                <View className="feature-item">
                  <Text className="feature-icon">✓</Text>
                  <Text className="feature-text">让成长看得见</Text>
                </View>
                <View className="feature-item">
                  <Text className="feature-icon">✓</Text>
                  <Text className="feature-text">找到属于你的能力方向</Text>
                </View>
                <View className="feature-item">
                  <Text className="feature-icon">✓</Text>
                  <Text className="feature-text">看见自己的可能性</Text>
                </View>
              </View>
              <View className="test-card-btn">
                <Text className="btn-text">开始你的河 →</Text>
              </View>
            </View>
          )}

          {/* 推荐区域 */}
          <View className="section-header">
            <Text className="section-title">你的成长路径</Text>
            <Text className="section-link" onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}>查看全部</Text>
          </View>

          <View className="recommended-grid">
            <View className="recommend-card card-green" onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}>
              <View className="card-icon-small">
                <Text className="icon-symbol">✓</Text>
              </View>
              <Text className="card-title-small">遇见项目</Text>
              <Text className="card-desc-small">不是抢单，是被选中</Text>
            </View>

            <View className="recommend-card card-yellow" onClick={() => handleNavigate('/pages/ability/index')}>
              <View className="card-icon-small">
                <Text className="icon-symbol">◈</Text>
              </View>
              <Text className="card-title-small">看见成长</Text>
              <Text className="card-desc-small">这条河又往前流了一段</Text>
            </View>
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
