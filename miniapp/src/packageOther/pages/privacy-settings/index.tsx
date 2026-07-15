import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

export default function PrivacySettings() {
  const [radarVisibility, setRadarVisibility] = useState<'enterprise' | 'none'>('enterprise')

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '隐私设置' })
    loadSettings()
  }, [])

  const loadSettings = () => {
    const saved = Taro.getStorageSync('privacySettings')
    if (saved && saved.radarVisibility) {
      setRadarVisibility(saved.radarVisibility)
    }
  }

  const saveSettings = (visibility: 'enterprise' | 'none') => {
    setRadarVisibility(visibility)
    Taro.setStorageSync('privacySettings', { radarVisibility: visibility })
  }

  const selectRadarVis = (value: 'enterprise' | 'none') => {
    saveSettings(value)
    Taro.showToast({ title: '设置已保存', icon: 'success' })
  }

  const openAgreement = (type: string) => {
    Taro.showModal({
      title: type,
      content: '协议内容开发中',
      showCancel: false
    })
  }

  return (
    <View className="privacy-page">
      <View className="privacy-content">
        {/* 资料可见性 */}
        <View className="setting-group">
          <View className="group-label">资料可见性</View>
          <View className="setting-card">
            <View className="radar-visibility-section">
              <View className="section-header">
                <View className="setting-icon" style="background: rgba(190,215,209,0.15)">
                  <Text className="icon-text">◆</Text>
                </View>
                <View className="section-header-body">
                  <View className="section-title">能力雷达图可见范围</View>
                  <View className="section-desc">控制合作企业是否能查看你的能力雷达</View>
                </View>
              </View>

              {/* 两选一选项 */}
              <View className="visibility-options">
                <View
                  className={`vis-option ${radarVisibility === 'enterprise' ? 'selected' : ''}`}
                  onClick={() => selectRadarVis('enterprise')}
                >
                  <View className="vis-dot">
                    <View className="vis-dot-inner"></View>
                  </View>
                  <View className="vis-option-body">
                    <View className="vis-option-title">合作企业可见</View>
                    <View className="vis-option-desc">接单合作企业可查看</View>
                  </View>
                </View>

                <View
                  className={`vis-option ${radarVisibility === 'none' ? 'selected' : ''}`}
                  onClick={() => selectRadarVis('none')}
                >
                  <View className="vis-dot">
                    <View className="vis-dot-inner"></View>
                  </View>
                  <View className="vis-option-body">
                    <View className="vis-option-title">不提供</View>
                    <View className="vis-option-desc">对所有人隐藏</View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 协议与政策 */}
        <View className="setting-group">
          <View className="group-label">协议与政策</View>
          <View className="setting-card">
            <View className="setting-row" onClick={() => openAgreement('用户服务协议')}>
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

            <View className="setting-row" onClick={() => openAgreement('隐私政策')}>
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

            <View className="setting-row" onClick={() => openAgreement('OPC 接单协议')}>
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

            <View className="setting-row" onClick={() => openAgreement('第三方 SDK 说明')}>
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
      </View>
    </View>
  )
}
