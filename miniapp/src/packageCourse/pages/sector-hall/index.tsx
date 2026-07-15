import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import './index.scss'

export default function SectorHall() {
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '赛道大厅' })
  }, [])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleSectorClick = (sectorId: string) => {
    if (sectorId === 'content') {
      Taro.navigateTo({ url: '/packageCourse/pages/track-content-path/index' })
    } else if (sectorId === 'dev') {
      Taro.navigateTo({ url: '/packageCourse/pages/track-dev-path/index' })
    }
  }

  return (
    <View className="sector-hall-page">
      {/* Hero */}
      <View className="hall-hero">
        <View className="top-bar">
          <View className="tb-back" onClick={handleBack}>
            <Text className="back-icon">‹</Text>
          </View>
          <Text className="tb-title">赛道大厅</Text>
          <View className="tb-spacer" />
        </View>

        <Text className="hall-title">选择你的成长赛道</Text>
        <Text className="hall-sub">每条赛道都有专属课程体系和任务资源</Text>

        <View className="hall-stats">
          <View className="hs-item">
            <Text className="hs-val">2</Text>
            <Text className="hs-label">可选赛道</Text>
          </View>
          <View className="hs-item">
            <Text className="hs-val">570+</Text>
            <Text className="hs-label">在读学员</Text>
          </View>
          <View className="hs-item">
            <Text className="hs-val">¥1.2k</Text>
            <Text className="hs-label">平均月收入</Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <ScrollView className="scroll-area" scrollY>
        <View className="hall-body">
          {/* 内容赛道 */}
          <View className="sector-card" onClick={() => handleSectorClick('content')}>
            <View className="sector-card-header sector-header-rust">
              <Text className="sector-icon">▪</Text>
              <Text className="sector-name">内容赛道</Text>
              <Text className="sector-desc">小红书运营 · 品牌设计 · 文案写作 · 用户研究</Text>
              <View className="sector-tags">
                <View className="sector-tag">
                  <Text className="tag-text">小红书</Text>
                </View>
                <View className="sector-tag">
                  <Text className="tag-text">品牌设计</Text>
                </View>
                <View className="sector-tag">
                  <Text className="tag-text">文案</Text>
                </View>
                <View className="sector-tag">
                  <Text className="tag-text">运营</Text>
                </View>
              </View>
            </View>
            <View className="sector-card-footer">
              <View className="footer-left">
                <Text className="sector-meta">312 人在读 · 平均月收入 ¥1,400</Text>
                <View className="selected-badge">
                  <Text className="selected-text">已选择</Text>
                </View>
              </View>
              <View className="sector-btn btn-rust">
                <Text className="btn-text">了解详情</Text>
              </View>
            </View>
          </View>

          {/* 开发赛道 */}
          <View className="sector-card" onClick={() => handleSectorClick('dev')}>
            <View className="sector-card-header sector-header-mist">
              <Text className="sector-icon">●</Text>
              <Text className="sector-name">开发赛道</Text>
              <Text className="sector-desc">前端开发 · 小程序 · 数据分析 · 产品设计</Text>
              <View className="sector-tags">
                <View className="sector-tag">
                  <Text className="tag-text">前端</Text>
                </View>
                <View className="sector-tag">
                  <Text className="tag-text">小程序</Text>
                </View>
                <View className="sector-tag">
                  <Text className="tag-text">数据</Text>
                </View>
                <View className="sector-tag">
                  <Text className="tag-text">产品</Text>
                </View>
              </View>
            </View>
            <View className="sector-card-footer">
              <View className="footer-left">
                <Text className="sector-meta">258 人在读 · 平均月收入 ¥1,800</Text>
              </View>
              <View className="sector-btn btn-mist">
                <Text className="btn-text">了解详情</Text>
              </View>
            </View>
          </View>

          {/* 更多赛道 */}
          <View className="coming-soon">
            <Text className="cs-title">◇ 更多赛道即将开放</Text>
            <Text className="cs-desc">电商赛道、视频赛道、咨询赛道正在筹备中...</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
