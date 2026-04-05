import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import './index.scss'

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

          {/* 中心插画人物 */}
          <View className="character">
            <View className="character-head" />
            <View className="character-body" />
            <View className="character-arm-left" />
            <View className="character-arm-right" />
          </View>

          {/* 周围图标 */}
          <View className="float-icon icon-1">📚</View>
          <View className="float-icon icon-2">💡</View>
          <View className="float-icon icon-3">✏️</View>
          <View className="float-icon icon-4">⚙️</View>
        </View>

        <Text className="hero-title">发现你的无限可能</Text>
        <Text className="hero-subtitle">通过OPC标签，开启个性化成长之旅</Text>
      </View>

      {/* 登录按钮或推荐卡片 */}
      {!user ? (
        <Button className="primary-btn" onClick={handleWechatLogin}>
          开始探索
        </Button>
      ) : (
        <View className="content-section">
          {/* 推荐区域 */}
          <View className="section-header">
            <Text className="section-title">为你推荐</Text>
            <Text className="section-link">查看全部</Text>
          </View>

          <View className="recommended-grid">
            <View className="recommend-card card-green" onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}>
              <View className="card-icon-small">
                <Text className="icon-symbol">✓</Text>
              </View>
              <Text className="card-title-small">任务大厅</Text>
              <Text className="card-desc-small">发现适合你的成长任务</Text>
            </View>

            <View className="recommend-card card-yellow" onClick={() => handleNavigate('/pages/ability/index')}>
              <View className="card-icon-small">
                <Text className="icon-symbol">◈</Text>
              </View>
              <Text className="card-title-small">能力图谱</Text>
              <Text className="card-desc-small">可视化你的六维能力</Text>
            </View>
          </View>

          {/* 热门区域 */}
          <View className="section-header">
            <Text className="section-title">热门</Text>
          </View>

          <View className="popular-card card-pink" onClick={() => Taro.switchTab({ url: '/pages/story/index' })}>
            <Text className="popular-title">故事墙</Text>
            <Text className="popular-desc">分享你的成长故事，与他人产生共鸣</Text>
            <View className="popular-tags">
              <View className="tag tag-pink">24个模块</View>
              <View className="tag tag-pink">40小时</View>
              <View className="tag tag-dark">免费</View>
            </View>
          </View>

          <View className="popular-card card-dark" onClick={() => handleNavigate('/pages/mentor/index')}>
            <View className="popular-icon">
              <Text className="icon-emoji">🐱</Text>
            </View>
            <View className="popular-content">
              <Text className="popular-title-inline">启程小猫</Text>
              <Text className="popular-subtitle">AI成长伙伴陪你前行</Text>
            </View>
            <Text className="popular-arrow">→</Text>
          </View>
        </View>
      )}
    </View>
  )
}
