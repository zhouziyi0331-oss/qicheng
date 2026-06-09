import { View, Text, ScrollView, Image, Input, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './master.scss'

interface Master {
  id: string
  name: string
  avatar: string
  level: number
  levelName: string
  tags: string[]
  rating: number
  completedProjects: number
  minPrice: number
  avgDeliveryDays: number
  isOnline: boolean
  specialties: string[]
}

interface Invitation {
  masterId: string
  status: 'pending' | 'negotiating' | 'accepted' | 'rejected' | 'expired'
  offerPrice: number
  createdAt: string
}

export default function MasterPublish() {
  const [masters, setMasters] = useState<Master[]>([])
  const [filteredMasters, setFilteredMasters] = useState<Master[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTrack, setFilterTrack] = useState<string>('all')
  const [filterOnline, setFilterOnline] = useState<boolean>(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null)
  const [offerPrice, setOfferPrice] = useState('')

  useEffect(() => {
    loadMasters()
    loadInvitations()
  }, [])

  useEffect(() => {
    filterMastersList()
  }, [masters, filterTrack, filterOnline])

  const loadMasters = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/masters',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setMasters(res.data.data)
      } else {
        throw new Error('加载失败')
      }
    } catch (error) {
      console.error('加载大师列表失败:', error)

      // 使用模拟数据
      const mockMasters: Master[] = [
        {
          id: 'm1',
          name: '张大师',
          avatar: 'https://via.placeholder.com/100',
          level: 6,
          levelName: '河成者',
          tags: ['全栈开发', '架构设计'],
          rating: 4.9,
          completedProjects: 28,
          minPrice: 3000,
          avgDeliveryDays: 7,
          isOnline: true,
          specialties: ['React', 'Node.js', '系统架构']
        },
        {
          id: 'm2',
          name: '李大师',
          avatar: 'https://via.placeholder.com/100',
          level: 6,
          levelName: '河成者',
          tags: ['UI设计', '用户体验'],
          rating: 4.8,
          completedProjects: 35,
          minPrice: 2500,
          avgDeliveryDays: 5,
          isOnline: false,
          specialties: ['Figma', 'UI设计', '交互设计']
        },
        {
          id: 'm3',
          name: '王大师',
          avatar: 'https://via.placeholder.com/100',
          level: 6,
          levelName: '河成者',
          tags: ['AI开发', '算法优化'],
          rating: 5.0,
          completedProjects: 42,
          minPrice: 4000,
          avgDeliveryDays: 10,
          isOnline: true,
          specialties: ['Python', 'TensorFlow', 'AI算法']
        }
      ]

      setMasters(mockMasters)
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/invitations',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setInvitations(res.data.data)
      }
    } catch (error) {
      console.error('加载邀请记录失败:', error)
    }
  }

  const filterMastersList = () => {
    let filtered = [...masters]

    if (filterOnline) {
      filtered = filtered.filter(m => m.isOnline)
    }

    setFilteredMasters(filtered)
  }

  const handleInvite = (master: Master) => {
    setSelectedMaster(master)
    setOfferPrice(master.minPrice.toString())
    setShowInviteModal(true)
  }

  const submitInvitation = async () => {
    if (!selectedMaster) return

    const price = parseInt(offerPrice)
    if (isNaN(price) || price < selectedMaster.minPrice) {
      Taro.showToast({
        title: `出价不能低于¥${selectedMaster.minPrice}`,
        icon: 'none'
      })
      return
    }

    try {
      const token = Taro.getStorageSync('token')
      await Taro.request({
        url: '/api/v1/invitations',
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          masterId: selectedMaster.id,
          offerPrice: price
        }
      })

      Taro.showToast({
        title: '邀请已发送',
        icon: 'success'
      })

      setShowInviteModal(false)
      setSelectedMaster(null)
      setOfferPrice('')
      loadInvitations()
    } catch (error) {
      console.error('发送邀请失败:', error)
      Taro.showToast({
        title: '发送失败',
        icon: 'none'
      })
    }
  }

  const getInvitationStatus = (masterId: string) => {
    return invitations.find(inv => inv.masterId === masterId)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待确认'
      case 'negotiating':
        return '协商中'
      case 'accepted':
        return '已接受'
      case 'rejected':
        return '已拒绝'
      case 'expired':
        return '已过期'
      default:
        return ''
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'
      case 'negotiating':
        return '#3B82F6'
      case 'accepted':
        return '#10B981'
      case 'rejected':
        return '#EF4444'
      case 'expired':
        return '#6B7280'
      default:
        return '#6B7280'
    }
  }

  return (
    <View className="master-publish-page">
      {/* 筛选栏 */}
      <View className="filter-bar">
        <View className="filter-item">
          <Text 
            className={`filter-chip ${filterOnline ? 'active' : ''}`}
            onClick={() => setFilterOnline(!filterOnline)}
          >
            {filterOnline ? '✓ ' : ''}在线大师
          </Text>
        </View>
      </View>

      {/* 大师列表 */}
      <ScrollView className="masters-scroll" scrollY>
        {loading ? (
          <View className="loading-state">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : filteredMasters.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">👨‍🏫</Text>
            <Text className="empty-text">暂无符合条件的大师</Text>
          </View>
        ) : (
          <View className="masters-list">
            {filteredMasters.map(master => {
              const invitation = getInvitationStatus(master.id)

              return (
                <View key={master.id} className="master-card">
                  <View className="master-header">
                    <Image className="master-avatar" src={master.avatar} />
                    <View className="master-info">
                      <View className="name-row">
                        <Text className="master-name">{master.name}</Text>
                        <Text className="master-level">Lv.{master.level}</Text>
                        {master.isOnline && (
                          <View className="online-badge">
                            <Text className="online-text">在线</Text>
                          </View>
                        )}
                      </View>
                      <View className="master-tags">
                        {master.tags.map((tag, index) => (
                          <Text key={index} className="master-tag">{tag}</Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className="master-specialties">
                    {master.specialties.map((specialty, index) => (
                      <Text key={index} className="specialty-tag">{specialty}</Text>
                    ))}
                  </View>

                  <View className="master-stats">
                    <View className="stat-item">
                      <Text className="stat-icon">⭐</Text>
                      <Text className="stat-text">{master.rating}分</Text>
                    </View>
                    <View className="stat-item">
                      <Text className="stat-icon">📦</Text>
                      <Text className="stat-text">{master.completedProjects}个项目</Text>
                    </View>
                    <View className="stat-item">
                      <Text className="stat-icon">⚡</Text>
                      <Text className="stat-text">平均{master.avgDeliveryDays}天交付</Text>
                    </View>
                  </View>

                  <View className="master-footer">
                    <View className="price-info">
                      <Text className="price-label">起报价</Text>
                      <Text className="price-value">¥{master.minPrice}</Text>
                    </View>

                    {invitation ? (
                      <View 
                        className="status-badge"
                        style={{ background: getStatusColor(invitation.status) }}
                      >
                        <Text className="status-text">{getStatusText(invitation.status)}</Text>
                      </View>
                    ) : (
                      <Button className="invite-btn" onClick={() => handleInvite(master)}>
                        <Text className="btn-text">邀请TA</Text>
                      </Button>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 邀请弹窗 */}
      {showInviteModal && selectedMaster && (
        <View className="invite-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <View className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">邀请 {selectedMaster.name}</Text>

            <View className="modal-content">
              <View className="master-summary">
                <Image className="summary-avatar" src={selectedMaster.avatar} />
                <View className="summary-info">
                  <Text className="summary-name">{selectedMaster.name}</Text>
                  <Text className="summary-rating">⭐ {selectedMaster.rating} · {selectedMaster.completedProjects}个项目</Text>
                </View>
              </View>

              <View className="price-input-section">
                <Text className="input-label">您的出价 (不低于¥{selectedMaster.minPrice})</Text>
                <Input
                  className="price-input"
                  type="number"
                  placeholder={`最低¥${selectedMaster.minPrice}`}
                  value={offerPrice}
                  onInput={(e) => setOfferPrice(e.detail.value)}
                />
              </View>

              <View className="tips-box">
                <Text className="tips-text">
                  💡 大师将在24小时内回复，可能会协商价格
                </Text>
              </View>
            </View>

            <View className="modal-actions">
              <Button className="cancel-btn" onClick={() => setShowInviteModal(false)}>
                <Text className="btn-text">取消</Text>
              </Button>
              <Button className="confirm-btn" onClick={submitInvitation}>
                <Text className="btn-text">发送邀请</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
