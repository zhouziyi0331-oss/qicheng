import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { contactExchangeAPI } from '../../../services/api'
import './index.scss'

interface Partner {
  id: string
  name: string
  avatar: string
  company: string
  track: 'content' | 'dev'
  level: number
  collaborationCount: number
  rating: number
  totalAmount: number
  projects: Array<{
    title: string
    status: 'completed' | 'ongoing'
  }>
  exchangeStatus: 'available' | 'pending' | 'confirmed'
  myConfirmed: boolean
  partnerConfirmed: boolean
}

export default function ContactExchange() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    try {
      setLoading(true)
      const response = await contactExchangeAPI.getPartners()
      setPartners(response.partners || [])
    } catch (err) {
      console.error('加载合作伙伴失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPartner = (partner: Partner) => {
    if (partner.collaborationCount >= 2) {
      setSelectedPartner(partner)
    }
  }

  const handleConfirmExchange = async () => {
    if (!selectedPartner) return

    try {
      await contactExchangeAPI.requestExchange(selectedPartner.id)
      Taro.showToast({ title: '已发送交换请求', icon: 'success' })

      // 重新加载合作伙伴列表
      await loadPartners()
      setSelectedPartner(null)
    } catch (err) {
      console.error('确认交换失败:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleCancelExchange = () => {
    setSelectedPartner(null)
  }

  return (
    <View className="contact-exchange-page">
      {/* Hero区域 */}
      <View className="exchange-hero">
        <View className="hero-top">
          <View className="hero-back" onClick={() => Taro.navigateBack()}>
            <Text className="back-icon">←</Text>
          </View>
          <Text className="hero-title">联系方式交换</Text>
          <View style={{ width: '68rpx' }} />
        </View>
        <Text className="hero-main-title">合作伙伴</Text>
        <Text className="hero-subtitle">完成 2 单合作后，双方可申请交换联系方式</Text>
      </View>

      <ScrollView className="partners-scroll" scrollY>
        {/* 已满足条件的合作伙伴列表 */}
        {partners.filter(p => p.collaborationCount >= 2).length > 0 && (
          <View className="section-block">
            <Text className="section-block-title">已满足交换条件</Text>
            {partners.filter(p => p.collaborationCount >= 2).map(partner => (
              <View key={partner.id} className="partner-card" onClick={() => handleSelectPartner(partner)}>
                <View className="pc-header">
                  <View className="pc-avatar">{partner.avatar}</View>
                  <View className="pc-info">
                    <Text className="pc-name">{partner.name}</Text>
                    <Text className="pc-company">{partner.company} · {partner.track === 'content' ? '内容赛道' : 'A站开发赛道'} Lv.{partner.level}</Text>
                  </View>
                  <View className={`pc-status-badge ${partner.myConfirmed ? 'confirmed' : 'pending'}`}>
                    <Text>{partner.myConfirmed ? '已确认' : '待确认'}</Text>
                  </View>
                </View>

                <View className="pc-stats">
                  <View className="pc-stat">
                    <Text className="stat-num">{partner.collaborationCount}</Text>
                    <Text className="stat-label">合作单数</Text>
                  </View>
                  <View className="pc-stat">
                    <Text className="stat-num">{partner.rating}★</Text>
                    <Text className="stat-label">互评分数</Text>
                  </View>
                  <View className="pc-stat">
                    <Text className="stat-num">¥{partner.totalAmount}</Text>
                    <Text className="stat-label">合作金额</Text>
                  </View>
                </View>

                <View className="projects-preview">
                  <Text className="preview-title">合作项目</Text>
                  {partner.projects.slice(0, 2).map((project, idx) => (
                    <View key={idx} className="project-item-mini">
                      <Text className="project-icon-mini">{project.status === 'completed' ? '◆' : '○'}</Text>
                      <Text className="project-title-mini">{project.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 未满足条件的合作伙伴 */}
        {partners.filter(p => p.collaborationCount < 2).length > 0 && (
          <View className="section-block">
            <Text className="section-block-title">其他合作伙伴</Text>
            {partners.filter(p => p.collaborationCount < 2).map(partner => (
              <View key={partner.id} className="pending-partner-card">
                <View className="pp-header">
                  <View className="pp-avatar">{partner.avatar}</View>
                  <View className="pp-info">
                    <Text className="pp-name">{partner.name}</Text>
                    <Text className="pp-company">{partner.company} · {partner.track === 'content' ? '内容赛道' : 'A站开发赛道'} Lv.{partner.level}</Text>
                  </View>
                  <View className="pp-badge">
                    <Text>{partner.collaborationCount}/2 单</Text>
                  </View>
                </View>
                <View className="pp-progress-label">
                  <Text>再完成 {2 - partner.collaborationCount} 单即可申请交换</Text>
                  <Text>{Math.round((partner.collaborationCount / 2) * 100)}%</Text>
                </View>
                <View className="progress-bar">
                  <View className="progress-fill" style={{ width: `${(partner.collaborationCount / 2) * 100}%` }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 警告提示 */}
        <View className="warning-card">
          <Text className="warning-icon">!</Text>
          <View className="warning-content">
            <Text className="warning-text">
              <Text className="warning-highlight">重要提示：</Text>
              交换联系方式后，双方可在平台外自行联系。但
              <Text className="warning-highlight">平台将不再对你们之后的任何私下交易提供支持、担保或纠纷处理</Text>
              ，请谨慎决定。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 确认交换弹窗 */}
      {selectedPartner && (
        <View className="confirm-modal-overlay" onClick={handleCancelExchange}>
          <View className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">确认交换联系方式</Text>
            <View className="modal-partner-info">
              <View className="modal-avatar">{selectedPartner.avatar}</View>
              <View className="modal-info">
                <Text className="modal-name">{selectedPartner.name}</Text>
                <Text className="modal-company">{selectedPartner.company}</Text>
              </View>
            </View>
            <Text className="modal-desc">
              双方确认后，将互相看到对方的联系方式。
              <Text className="modal-highlight">此操作不可撤回，且平台不再对你们之后的任何交易提供支持或帮助纠纷处理。</Text>
            </Text>
            <View className="modal-actions">
              <View className="modal-btn modal-btn-cancel" onClick={handleCancelExchange}>
                <Text>取消</Text>
              </View>
              <View className="modal-btn modal-btn-confirm" onClick={handleConfirmExchange}>
                <Text>确认交换</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
