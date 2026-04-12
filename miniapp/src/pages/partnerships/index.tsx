import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import api from '../../services/api'
import Loading from '../../components/Loading'
import './index.scss'

/**
 * 合作伙伴关系页面
 *
 * 核心理念：从雇佣关系到合作伙伴关系的自然演进
 * - 第1次合作：雇佣关系（hired）
 * - 第2次合作：建立信任（trusted）
 * - 第3次合作后：可以邀请成为合作伙伴（partner）
 */

interface Partnership {
  id: string
  company_id: string
  company_name: string
  avatar: string
  relationship_level: 'hired' | 'trusted' | 'partner'
  collaboration_count: number
  partnership_terms?: any
  invited_at?: string
  created_at: string
}

export default function Partnerships() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [stats, setStats] = useState({ total: 0, partners: 0, trusted: 0, hired: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPartnerships()
  }, [])

  const loadPartnerships = async () => {
    try {
      const studentId = Taro.getStorageSync('userId')
      const response = await api.partnership.getStudentPartnerships(studentId)
      setPartnerships(response.partnerships)
      setStats(response.stats)
    } catch (error) {
      console.error('加载合伙关系失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (companyId: string) => {
    try {
      const studentId = Taro.getStorageSync('userId')
      await api.partnership.respondToInvitation(companyId, studentId, true)
      Taro.showToast({ title: '恭喜！你们现在是合作伙伴了', icon: 'success' })
      loadPartnerships()
    } catch (error) {
      console.error('接受邀请失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleRejectInvitation = async (companyId: string) => {
    try {
      const studentId = Taro.getStorageSync('userId')
      await api.partnership.respondToInvitation(companyId, studentId, false)
      Taro.showToast({ title: '已拒绝邀请', icon: 'none' })
      loadPartnerships()
    } catch (error) {
      console.error('拒绝邀请失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const getRelationshipText = (level: string) => {
    switch (level) {
      case 'partner': return '合作伙伴'
      case 'trusted': return '信任伙伴'
      case 'hired': return '合作过'
      default: return '未知'
    }
  }

  const getRelationshipColor = (level: string) => {
    switch (level) {
      case 'partner': return '#8B5CF6'
      case 'trusted': return '#06B6D4'
      case 'hired': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getRelationshipDesc = (level: string, count: number) => {
    switch (level) {
      case 'partner':
        return '你们是合作伙伴关系，可以一起设计项目、分享想法'
      case 'trusted':
        return `已合作${count}次，正在建立信任关系`
      case 'hired':
        return count === 1 ? '第一次合作，开始了解彼此' : `已合作${count}次`
      default:
        return ''
    }
  }

  if (loading) {
    return <Loading text="正在加载合作关系..." />
  }

  return (
    <View className='partnerships-page'>
      {/* 统计卡片 */}
      <View className='stats-card'>
        <View className='stats-title'>我的合作关系</View>
        <View className='stats-grid'>
          <View className='stat-item'>
            <View className='stat-value' style={{ color: '#8B5CF6' }}>{stats.partners}</View>
            <View className='stat-label'>合作伙伴</View>
          </View>
          <View className='stat-item'>
            <View className='stat-value' style={{ color: '#06B6D4' }}>{stats.trusted}</View>
            <View className='stat-label'>信任伙伴</View>
          </View>
          <View className='stat-item'>
            <View className='stat-value' style={{ color: '#10B981' }}>{stats.hired}</View>
            <View className='stat-label'>合作过</View>
          </View>
        </View>
      </View>

      {/* 理念说明 */}
      <View className='concept-card'>
        <View className='concept-icon'>🌱</View>
        <View className='concept-text'>
          <View className='concept-title'>关系是慢慢长出来的</View>
          <View className='concept-desc'>
            第1次合作，你们互相了解<br/>
            第2次合作，开始建立信任<br/>
            第3次合作后，可能成为合作伙伴
          </View>
        </View>
      </View>

      {/* 合伙关系列表 */}
      <View className='partnerships-list'>
        {partnerships.length === 0 ? (
          <View className='empty-state'>
            <View className='empty-icon'>🤝</View>
            <View className='empty-text'>还没有合作关系</View>
            <View className='empty-hint'>完成第一个项目，开始建立关系</View>
          </View>
        ) : (
          partnerships.map(partnership => (
            <View key={partnership.id} className='partnership-card'>
              <View className='partnership-header'>
                <Image
                  className='company-avatar'
                  src={partnership.avatar || 'https://via.placeholder.com/80'}
                />
                <View className='company-info'>
                  <View className='company-name'>{partnership.company_name}</View>
                  <View className='collaboration-count'>已合作 {partnership.collaboration_count} 次</View>
                </View>
                <View
                  className='relationship-badge'
                  style={{ background: getRelationshipColor(partnership.relationship_level) }}
                >
                  {getRelationshipText(partnership.relationship_level)}
                </View>
              </View>

              <View className='partnership-desc'>
                {getRelationshipDesc(partnership.relationship_level, partnership.collaboration_count)}
              </View>

              {/* 合作伙伴邀请 */}
              {partnership.invited_at && partnership.relationship_level !== 'partner' && (
                <View className='invitation-card'>
                  <View className='invitation-icon'>🎉</View>
                  <View className='invitation-content'>
                    <View className='invitation-title'>合作伙伴邀请</View>
                    <View className='invitation-text'>
                      {partnership.company_name} 想和你建立长期合作关系，成为合作伙伴
                    </View>
                    {partnership.partnership_terms && (
                      <View className='invitation-terms'>
                        <View className='terms-title'>合伙权益：</View>
                        <View className='terms-list'>
                          {partnership.partnership_terms.benefits?.map((benefit: string, index: number) => (
                            <View key={index} className='terms-item'>• {benefit}</View>
                          ))}
                        </View>
                      </View>
                    )}
                    <View className='invitation-actions'>
                      <View
                        className='btn-accept'
                        onClick={() => handleAcceptInvitation(partnership.company_id)}
                      >
                        接受邀请
                      </View>
                      <View
                        className='btn-reject'
                        onClick={() => handleRejectInvitation(partnership.company_id)}
                      >
                        暂不考虑
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* 合作伙伴权益 */}
              {partnership.relationship_level === 'partner' && (
                <View className='partner-benefits'>
                  <View className='benefits-title'>合作伙伴权益</View>
                  <View className='benefits-grid'>
                    <View className='benefit-item'>
                      <View className='benefit-icon'>💡</View>
                      <View className='benefit-text'>参与项目设计</View>
                    </View>
                    <View className='benefit-item'>
                      <View className='benefit-icon'>💰</View>
                      <View className='benefit-text'>更高收益分成</View>
                    </View>
                    <View className='benefit-item'>
                      <View className='benefit-icon'>📚</View>
                      <View className='benefit-text'>成长资源支持</View>
                    </View>
                    <View className='benefit-item'>
                      <View className='benefit-icon'>🎯</View>
                      <View className='benefit-text'>优先项目机会</View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  )
}
