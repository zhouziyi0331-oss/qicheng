import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function SelfExploration() {
  const handleBack = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  return (
    <View className="self-exploration">
      {/* 顶部栏 */}
      <View className="exploration-header">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="header-title">自我探索</Text>
        <View style={{ width: '68rpx' }} />
      </View>

      {/* Hero区 */}
      <View className="hero-section">
        <Text className="hero-badge">能力雷达</Text>
        <Text className="hero-title">发现你真正的能力样貌</Text>
        <Text className="hero-subtitle">通过 OPC 测评，洞见你独特的六维优势模式</Text>
      </View>

      {/* 功能卡片 */}
      <View className="feature-cards">
        {/* 我的能力人格 */}
        <View
          className="feature-card primary"
          onClick={() => Taro.navigateTo({ url: '/packageOnboarding/pages/identity-intro/index' })}
        >
          <View className="card-icon-wrapper primary-icon">
            <Text className="card-icon">◆</Text>
          </View>
          <View className="card-content">
            <Text className="card-title">我的能力人格</Text>
            <Text className="card-desc">了解你的独特身份类型</Text>
          </View>
          <Text className="card-arrow">›</Text>
        </View>

        {/* 我的六维雷达 */}
        <View
          className="feature-card"
          onClick={() => Taro.navigateTo({ url: '/packageOnboarding/pages/my-radar/index' })}
        >
          <View className="card-icon-wrapper">
            <Text className="card-icon">▲</Text>
          </View>
          <View className="card-content">
            <Text className="card-title">我的六维能力雷达</Text>
            <Text className="card-desc">查看详细能力分析</Text>
          </View>
          <Text className="card-arrow">›</Text>
        </View>

        {/* 成长仪表盘 */}
        <View
          className="feature-card"
          onClick={() => Taro.navigateTo({ url: '/packageOnboarding/pages/growth-dashboard/index' })}
        >
          <View className="card-icon-wrapper">
            <Text className="card-icon">○</Text>
          </View>
          <View className="card-content">
            <Text className="card-title">成长仪表盘</Text>
            <Text className="card-desc">打卡 · 成就 · 趋势</Text>
          </View>
          <Text className="card-arrow">›</Text>
        </View>

        {/* 深度模式 */}
        <View
          className="feature-card"
          onClick={() => Taro.navigateTo({ url: '/packageOnboarding/pages/deep-mode/index' })}
        >
          <View className="card-icon-wrapper">
            <Text className="card-icon">◇</Text>
          </View>
          <View className="card-content">
            <Text className="card-title">深度模式</Text>
            <Text className="card-desc">对比过去与现在的六维变化</Text>
          </View>
          <Text className="card-arrow">›</Text>
        </View>

        {/* 能力地图 */}
        <View
          className="feature-card"
          onClick={() => Taro.navigateTo({ url: '/packageGrowth/pages/ability-map/index' })}
        >
          <View className="card-icon-wrapper">
            <Text className="card-icon">▼</Text>
          </View>
          <View className="card-content">
            <Text className="card-title">能力地图</Text>
            <Text className="card-desc">150个标签 · 32已解锁</Text>
          </View>
          <Text className="card-arrow">›</Text>
        </View>
      </View>

      {/* 说明区 */}
      <View className="info-section">
        <Text className="info-title">什么是 OPC 测评？</Text>
        <Text className="info-text">
          OPC 测评通过 38 道题目，从信息处理、创作驱动、工具学习、任务执行、协作倾向、风险态度 6 个维度深度分析你的能力特点。
        </Text>
        <View className="info-tags">
          <View className="info-tag">信息处理</View>
          <View className="info-tag">创作驱动</View>
          <View className="info-tag">工具学习</View>
          <View className="info-tag">任务执行</View>
          <View className="info-tag">协作倾向</View>
          <View className="info-tag">风险态度</View>
        </View>
      </View>

      {/* 底部间距 */}
      <View className="bottom-space" />
    </View>
  )
}
