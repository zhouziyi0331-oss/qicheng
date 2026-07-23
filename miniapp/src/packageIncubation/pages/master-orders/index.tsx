import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { authAPI } from '../../../services/api'
import './index.scss'

interface MasterOrder {
  id: string
  title: string
  description: string
  budget: number
  difficulty: number
  deadline: string
  track: 'content' | 'dev'
  tags: string[]
  requester: {
    name: string
    avatar: string
    level: number
    completedCount: number
  }
  status: 'hot' | 'normal' | 'vip'
  isHighDifficulty?: boolean
}

export default function MasterOrders() {
  const [userTrack, setUserTrack] = useState<'content' | 'dev'>('content')
  const [orders, setOrders] = useState<MasterOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    loadUserTrack()
    loadMasterOrders()
  }, [])

  const loadUserTrack = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo?.selected_track) {
        setUserTrack(userInfo.selected_track === 'dev' ? 'dev' : 'content')
      }
    } catch (err) {
      console.error('加载用户赛道失败:', err)
    }
  }

  const loadMasterOrders = async () => {
    try {
      setLoading(true)
      // 模拟数据 - 实际应该调用API
      const mockOrders: MasterOrder[] = [
        {
          id: '1',
          title: '小红书账号从0到1冷启动，3个月涨粉5万',
          description: '美妆博主新账号，完全空白，需要从定位、内容策略到爆款笔记全套方案，前任运营做了2个月没起色。',
          budget: 3200,
          difficulty: 4,
          deadline: '2026-08-20',
          track: 'content',
          tags: ['内容赛道', '内容策略', '账号运营'],
          requester: {
            name: '张小美',
            avatar: '◆',
            level: 3,
            completedCount: 2
          },
          status: 'hot',
          isHighDifficulty: false
        },
        {
          id: '2',
          title: '抖音矩阵账号体系搭建 + 直播带货全链路',
          description: '连锁餐饮品牌，需要搭建5个垂直账号矩阵，同时开启直播带货，从选品、脚本到直播运营全套，别人都说做不了。',
          budget: 8500,
          difficulty: 5,
          deadline: '2026-09-15',
          track: 'content',
          tags: ['内容赛道', '抖音矩阵', '直播带货'],
          requester: {
            name: '陈总',
            avatar: '▲',
            level: 4,
            completedCount: 4
          },
          status: 'vip',
          isHighDifficulty: true
        },
        {
          id: '3',
          title: '企业微信自动化工作流搭建',
          description: '教育机构，有500+微信好友待转化的存量，需要搭建私域体系，制定社群运营标准流程，提高复购率。',
          budget: 2800,
          difficulty: 3,
          deadline: '2026-08-30',
          track: 'dev',
          tags: ['A站开发赛道', 'AI开发', '系统搭建'],
          requester: {
            name: '王老师',
            avatar: '○',
            level: 2,
            completedCount: 1
          },
          status: 'normal',
          isHighDifficulty: false
        }
      ]

      const filteredOrders = mockOrders.filter(order => order.track === userTrack)
      setOrders(filteredOrders)
    } catch (err) {
      console.error('加载大师订单失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOrder = (orderId: string) => {
    Taro.showModal({
      title: '接取订单',
      content: '确认接取这个高难度订单吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '接取成功', icon: 'success' })
          // 实际应该调用API
        }
      }
    })
  }

  const renderStars = (difficulty: number) => {
    return (
      <View className="stars">
        {[1, 2, 3, 4, 5].map(i => (
          <Text key={i} className={i <= difficulty ? 'star-on' : 'star-off'}>★</Text>
        ))}
      </View>
    )
  }

  const isContentTrack = userTrack === 'content'

  return (
    <View className={`master-orders-page ${isContentTrack ? 'theme-rust' : 'theme-teal'}`}>
      {/* Hero区域 */}
      <View className={isContentTrack ? 'track-hero-rust' : 'track-hero-teal'}>
        <View className="hero-top">
          <View
            className="hero-back"
            onClick={() => Taro.navigateBack()}
          >
            <Text className="back-icon">←</Text>
          </View>
          <Text className="hero-title">OPC 孵化大师</Text>
          <View className="hero-badge">
            <Text className="badge-icon">🎓</Text>
            <Text className="badge-text">满级解锁</Text>
          </View>
        </View>

        <View className="hero-profile">
          <View className={isContentTrack ? 'hero-avatar-rust' : 'hero-avatar-teal'}>
            <Text className="avatar-text">我</Text>
          </View>
          <View className="hero-info">
            <Text className="hero-name">
              {isContentTrack ? '内容赛道' : 'A站开发赛道'} · 满级大师 · Lv.MAX
            </Text>
            <Text className="hero-sub">别人做不了的，我来接</Text>
          </View>
        </View>

        <View className="hero-stats">
          <View className="stat-item">
            <Text className="stat-value">23</Text>
            <Text className="stat-label">已接单</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">¥18,400</Text>
            <Text className="stat-label">累计收入</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">4.9 ★</Text>
            <Text className="stat-label">综合评分</Text>
          </View>
        </View>
      </View>

      {/* 筛选栏 */}
      <View className="filter-chips">
        <View
          className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <Text>全部订单</Text>
        </View>
        <View
          className={`filter-chip ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          <Text>待接单</Text>
        </View>
        <View
          className={`filter-chip ${activeFilter === 'ongoing' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ongoing')}
        >
          <Text>进行中</Text>
        </View>
        <View
          className={`filter-chip ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('completed')}
        >
          <Text>已完成</Text>
        </View>
        <View
          className={`filter-chip ${activeFilter === 'high' ? 'active' : ''}`}
          onClick={() => setActiveFilter('high')}
        >
          <Text>高难度</Text>
        </View>
      </View>

      {/* 订单列表 */}
      <ScrollView className="orders-scroll" scrollY>
        <View className="orders-list">
          {loading ? (
            <View className="loading-state">
              <Text>加载中...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">○</Text>
              <Text className="empty-text">暂无大师订单</Text>
            </View>
          ) : (
            orders.map(order => (
              <View key={order.id} className={`order-card ${isContentTrack ? 'card-rust' : 'card-teal'}`}>
                {order.isHighDifficulty && (
                  <View className="order-banner">
                    <Text className="banner-icon">◆</Text>
                    <Text className="banner-text">高难度专属 · 别人做不了的单</Text>
                  </View>
                )}

                <View className="order-inner">
                  <View className="order-top">
                    <Text className="order-title">{order.title}</Text>
                    <View className={`order-status status-${order.status}`}>
                      {order.status === 'hot' && <Text>紧急</Text>}
                      {order.status === 'vip' && <Text>高难</Text>}
                      {order.status === 'normal' && <Text>普通</Text>}
                    </View>
                  </View>

                  <Text className="order-desc">{order.description}</Text>

                  <View className="order-tags">
                    {order.tags.map((tag, idx) => (
                      <View key={idx} className="order-tag">
                        <Text>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="order-meta">
                    <View className="meta-item">
                      {renderStars(order.difficulty)}
                    </View>
                    <View className="meta-item">
                      <Text className="meta-icon">⏰</Text>
                      <Text className="meta-text">{order.deadline}</Text>
                    </View>
                  </View>
                </View>

                <View className="order-footer">
                  <View className="requester">
                    <View className="req-avatar">
                      <Text>{order.requester.avatar}</Text>
                    </View>
                    <View className="req-info">
                      <Text className="req-name">{order.requester.name}</Text>
                      <Text className="req-level">Lv.{order.requester.level} · 已完成{order.requester.completedCount}单</Text>
                    </View>
                  </View>
                  <View className="order-price-area">
                    <Text className="order-price">¥{order.budget}</Text>
                    <Text className="price-label">项目预算</Text>
                  </View>
                </View>

                <View className="order-actions">
                  <View
                    className="accept-btn"
                    onClick={() => handleAcceptOrder(order.id)}
                  >
                    <Text>接单 →</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}
