import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { escrowAPI } from '../../../services/api'
import Loading from '../../../components/Loading'
import './index.scss'

interface Milestone {
  stage: string
  stageName: string
  amount: number
  status: 'unlocked' | 'processing' | 'pending'
  unlockedAt: string | null
  expectedAt: string | null
  description?: string
}

interface PaymentData {
  orderId: string
  taskId: string
  taskTitle: string
  totalAmount: number
  unlocked: number
  processing: number
  pending: number
  milestones: Milestone[]
  createdAt: string
  updatedAt: string
}

export default function PaymentStatus() {
  const router = useRouter()
  const { orderId } = router.params
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadPaymentStatus()
    }
  }, [orderId])

  const loadPaymentStatus = async () => {
    try {
      setLoading(true)
      const response = await escrowAPI.getOrderStatus(orderId!)

      if (response.success && response.data) {
        setPaymentData(response.data)
      } else {
        throw new Error(response.message || '加载失败')
      }
    } catch (error: any) {
      console.error('加载支付状态失败:', error)
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewTask = () => {
    if (paymentData?.taskId) {
      Taro.navigateTo({
        url: `/packageTask/pages/tasks/detail?id=${paymentData.taskId}`
      })
    }
  }

  const handleWithdraw = () => {
    Taro.navigateTo({ url: '/pages/wallet/withdraw/index' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unlocked':
        return '✓'
      case 'processing':
        return '○'
      case 'pending':
        return '⏳'
      default:
        return '⏳'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'unlocked':
        return '已解锁'
      case 'processing':
        return '处理中'
      case 'pending':
        return '待解锁'
      default:
        return '待解锁'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unlocked':
        return '#10B981'
      case 'processing':
        return '#F59E0B'
      case 'pending':
        return '#6B7280'
      default:
        return '#6B7280'
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getProgressPercent = () => {
    if (!paymentData) return 0
    return Math.round((paymentData.unlocked / paymentData.totalAmount) * 100)
  }

  if (loading) {
    return <Loading text="加载中..." />
  }

  if (!paymentData) {
    return (
      <View className="payment-status-page">
        <View className="empty-state">
          <Text className="empty-icon">●</Text>
          <Text className="empty-text">未找到资金信息</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="payment-status-page">
      <ScrollView className="page-scroll" scrollY>
        {/* 任务信息卡片 */}
        <View className="task-card">
          <View className="task-header">
            <Text className="task-title">{paymentData.taskTitle}</Text>
            <View className="task-id">
              <Text className="id-label">订单号：</Text>
              <Text className="id-value">{paymentData.orderId}</Text>
            </View>
          </View>
          <View
            className="view-task-btn"
            onClick={handleViewTask}
          >
            <Text className="btn-text">查看任务详情</Text>
          </View>
        </View>

        {/* 资金概览 */}
        <View className="amount-overview">
          <View className="overview-header">
            <Text className="overview-title">资金总览</Text>
            <Text className="total-amount">¥{paymentData.totalAmount}</Text>
          </View>

          <View className="progress-bar-wrapper">
            <View className="progress-bar">
              <View
                className="progress-fill"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </View>
            <Text className="progress-text">{getProgressPercent()}%</Text>
          </View>

          <View className="amount-breakdown">
            <View className="amount-item unlocked">
              <Text className="item-icon">✓</Text>
              <View className="item-content">
                <Text className="item-label">已解锁</Text>
                <Text className="item-value">¥{paymentData.unlocked}</Text>
              </View>
            </View>

            {paymentData.processing > 0 && (
              <View className="amount-item processing">
                <Text className="item-icon">○</Text>
                <View className="item-content">
                  <Text className="item-label">处理中</Text>
                  <Text className="item-value">¥{paymentData.processing}</Text>
                </View>
              </View>
            )}

            <View className="amount-item pending">
              <Text className="item-icon">⏳</Text>
              <View className="item-content">
                <Text className="item-label">待解锁</Text>
                <Text className="item-value">¥{paymentData.pending}</Text>
              </View>
            </View>
          </View>

          {paymentData.unlocked > 0 && (
            <View className="withdraw-hint" onClick={handleWithdraw}>
              <Text className="hint-text">◇ 已解锁资金可提现到账</Text>
              <Text className="hint-action">去提现 →</Text>
            </View>
          )}
        </View>

        {/* 分阶段资金时间线 */}
        <View className="milestones-section">
          <Text className="section-title">分阶段资金到账</Text>
          <Text className="section-desc">完成任务节点后，对应资金自动解锁</Text>

          <View className="milestones-timeline">
            {paymentData.milestones.map((milestone, index) => (
              <View key={index} className="milestone-item">
                {/* 连接线 */}
                {index < paymentData.milestones.length - 1 && (
                  <View
                    className={`timeline-connector ${milestone.status === 'unlocked' ? 'active' : ''}`}
                  />
                )}

                {/* 节点图标 */}
                <View
                  className="milestone-dot"
                  style={{
                    backgroundColor: getStatusColor(milestone.status),
                    borderColor: getStatusColor(milestone.status)
                  }}
                >
                  <Text className="dot-icon">{getStatusIcon(milestone.status)}</Text>
                </View>

                {/* 节点内容 */}
                <View className="milestone-content">
                  <View className="milestone-header">
                    <Text className="milestone-stage">{milestone.stageName}</Text>
                    <Text
                      className="milestone-status"
                      style={{ color: getStatusColor(milestone.status) }}
                    >
                      {getStatusText(milestone.status)}
                    </Text>
                  </View>

                  <View className="milestone-body">
                    <Text className="milestone-amount">¥{milestone.amount}</Text>

                    {milestone.description && (
                      <Text className="milestone-desc">{milestone.description}</Text>
                    )}

                    {milestone.unlockedAt && (
                      <Text className="milestone-date">
                        ✓ 已到账：{formatDate(milestone.unlockedAt)}
                      </Text>
                    )}

                    {milestone.status === 'processing' && (
                      <Text className="milestone-hint">● 预计24小时内到账</Text>
                    )}

                    {milestone.status === 'pending' && milestone.expectedAt && (
                      <Text className="milestone-hint">
                        ● 预计：{formatDate(milestone.expectedAt)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 资金流转说明 */}
        <View className="info-section">
          <Text className="info-title">◇ 资金流转说明</Text>
          <View className="info-list">
            <View className="info-item">
              <Text className="info-bullet">•</Text>
              <Text className="info-text">任务资金由平台第三方托管，保障双方权益</Text>
            </View>
            <View className="info-item">
              <Text className="info-bullet">•</Text>
              <Text className="info-text">完成任务节点后，对应阶段资金自动解锁</Text>
            </View>
            <View className="info-item">
              <Text className="info-bullet">•</Text>
              <Text className="info-text">已解锁资金可随时提现，1-3个工作日到账</Text>
            </View>
            <View className="info-item">
              <Text className="info-bullet">•</Text>
              <Text className="info-text">如有疑问，可联系客服或导师小猫协助</Text>
            </View>
          </View>
        </View>

        {/* 底部时间信息 */}
        <View className="time-info">
          <Text className="time-text">创建时间：{formatDateTime(paymentData.createdAt)}</Text>
          <Text className="time-text">更新时间：{formatDateTime(paymentData.updatedAt)}</Text>
        </View>
      </ScrollView>
    </View>
  )
}
