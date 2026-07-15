import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import './index.scss'

export default function About() {
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '关于启程' })
  }, [])

  const handleUpdateLog = () => {
    Taro.showModal({
      title: '更新日志',
      content: '2026.07.10\n· 新增任务消息通知流\n· 优化能力雷达图展示\n· 修复已知问题',
      showCancel: false
    })
  }

  const handleAgreement = (title: string) => {
    Taro.showModal({
      title,
      content: '协议内容开发中',
      showCancel: false
    })
  }

  const handleContact = () => {
    Taro.showModal({
      title: '联系客服',
      content: '工作日 9:00—18:00 在线',
      showCancel: false
    })
  }

  const handleFeedback = () => {
    Taro.showToast({ title: '意见反馈功能开发中', icon: 'none' })
  }

  return (
    <View className="about-page">
      <View className="about-content">
        {/* Logo 区域 */}
        <View className="logo-section">
          <View className="logo-icon">
            <Text className="logo-emoji">◆</Text>
          </View>
          <View className="app-info">
            <View className="app-name">启程 OPC</View>
            <View className="app-tagline">发现你的能力，开启你的职业旅程</View>
          </View>
          <View className="version-badge">
            <Text className="badge-icon">✓</Text>
            <Text className="badge-text">当前版本 v2.4.1 · 已是最新</Text>
          </View>
        </View>

        {/* 版本信息 */}
        <View className="setting-group">
          <View className="group-label">版本信息</View>
          <View className="setting-card">
            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(188,100,70,0.1)">
                <Text className="icon-text">i</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">当前版本</View>
              </View>
              <View className="setting-right">
                <Text className="setting-value">v2.4.1</Text>
              </View>
            </View>

            <View className="setting-row" onClick={handleUpdateLog}>
              <View className="setting-icon" style="background: rgba(190,215,209,0.15)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">更新日志</View>
                <View className="setting-desc">2026.07.10 · 新增任务消息通知流</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 协议与政策 */}
        <View className="setting-group">
          <View className="group-label">协议与政策</View>
          <View className="setting-card">
            <View className="setting-row" onClick={() => handleAgreement('用户服务协议')}>
              <View className="setting-icon" style="background: rgba(188,100,70,0.08)">
                <Text className="icon-text">■</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">用户服务协议</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>

            <View className="setting-row" onClick={() => handleAgreement('隐私政策')}>
              <View className="setting-icon" style="background: rgba(147,174,193,0.12)">
                <Text className="icon-text">◆</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">隐私政策</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>

            <View className="setting-row" onClick={() => handleAgreement('OPC 接单协议')}>
              <View className="setting-icon" style="background: rgba(242,205,120,0.12)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">OPC 接单协议</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>

            <View className="setting-row" onClick={() => handleAgreement('第三方 SDK 说明')}>
              <View className="setting-icon" style="background: rgba(190,215,209,0.15)">
                <Text className="icon-text">■</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">第三方 SDK 说明</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 联系我们 */}
        <View className="setting-group">
          <View className="group-label">联系我们</View>
          <View className="setting-card">
            <View className="setting-row" onClick={handleContact}>
              <View className="setting-icon" style="background: rgba(188,100,70,0.1)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">官方客服</View>
                <View className="setting-desc">工作日 9:00—18:00</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>

            <View className="setting-row" onClick={handleFeedback}>
              <View className="setting-icon" style="background: rgba(147,174,193,0.12)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">意见反馈</View>
                <View className="setting-desc">帮助我们做得更好</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 版权 */}
        <View className="copyright">
          <Text className="copyright-text">© 2026 启程 OPC · All Rights Reserved</Text>
          <Text className="copyright-text">成都启程科技有限公司</Text>
        </View>
      </View>
    </View>
  )
}
