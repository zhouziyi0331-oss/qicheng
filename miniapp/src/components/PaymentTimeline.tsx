import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './PaymentTimeline.scss'

interface Milestone {
  stage: string
  stageName: string
  amount: number
  status: 'unlocked' | 'processing' | 'pending'
  unlockedAt: string | null
  expectedAt: string | null
}

interface PaymentData {
  orderId: string
  taskTitle: string
  totalAmount: number
  unlocked: number
  pending: number
  milestones: Milestone[]
}

interface PaymentTimelineProps {
  orderId: string
}

export default function PaymentTimeline({ orderId }: PaymentTimelineProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPaymentStatus()
  }, [orderId])

  const loadPaymentStatus = async () => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API_URL}/api/v1/student/orders/${orderId}/payment-status`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setPaymentData(res.data.data)
      }
    } catch (err) {
      console.error('加载支付状态失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !paymentData) {
    return null
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <View className="payment-timeline">
      <View className="payment-header">
        <Text className="section-title">资金到账进度</Text>
        <View className="amount-summary">
          <View className="amount-item unlocked">
            <Text className="amount-label">已解锁</Text>
            <Text className="amount-value">¥{paymentData.unlocked}</Text>
          </View>
          <View className="amount-divider">/</View>
          <View className="amount-item total">
            <Text className="amount-label">总计</Text>
            <Text className="amount-value">¥{paymentData.totalAmount}</Text>
          </View>
        </View>
      </View>

      <View className="milestones-list">
        {paymentData.milestones.map((milestone, index) => (
          <View key={index} className={`milestone-item ${milestone.status}`}>
            <View className="milestone-line">
              {index < paymentData.milestones.length - 1 && (
                <View className={`line-connector ${milestone.status === 'unlocked' ? 'active' : ''}`} />
              )}
            </View>

            <View className="milestone-icon">
              <Text className="icon-text">{getStatusIcon(milestone.status)}</Text>
            </View>

            <View className="milestone-content">
              <View className="milestone-header">
                <Text className="milestone-name">{milestone.stageName}</Text>
                <Text className={`milestone-status ${milestone.status}`}>
                  {getStatusText(milestone.status)}
                </Text>
              </View>

              <View className="milestone-details">
                <Text className="milestone-amount">¥{milestone.amount}</Text>
                {milestone.unlockedAt && (
                  <Text className="milestone-date">
                    已到账 {formatDate(milestone.unlockedAt)}
                  </Text>
                )}
                {milestone.status === 'pending' && (
                  <Text className="milestone-hint">完成后解锁</Text>
                )}
                {milestone.status === 'processing' && (
                  <Text className="milestone-hint">预计24小时内到账</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {paymentData.pending > 0 && (
        <View className="payment-footer">
          <Text className="footer-text">
            ◇ 还有 <Text className="highlight">¥{paymentData.pending}</Text> 待解锁
          </Text>
        </View>
      )}
    </View>
  )
}
