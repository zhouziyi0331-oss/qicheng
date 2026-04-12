import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface Payment {
  id: number;
  task_id: number;
  task_title: string;
  student_name: string;
  amount: number;
  payment_type: string;
  status: string;
  created_at: string;
  paid_at?: string;
}

interface PaymentStats {
  total_spent: number;
  pending_amount: number;
  completed_count: number;
  pending_count: number;
  monthly_spent: number;
  avg_task_price: number;
}

export default function Payments() {
  const [activeTab, setActiveTab] = useState('all')
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
    loadStats()
  }, [activeTab])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/payments/company',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: {
          status: activeTab === 'all' ? undefined : activeTab
        }
      })

      if (res.statusCode === 200) {
        setPayments(res.data.data || [])
      }
    } catch (error) {
      console.error('加载付款记录失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = Taro.getStorageSync('token')

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/payments/stats',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.statusCode === 200) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const handleViewDetail = (paymentId: number) => {
    Taro.navigateTo({
      url: `/pages/payment-detail/index?id=${paymentId}`
    })
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待支付',
      'paid': '已支付',
      'refunded': '已退款',
      'failed': '支付失败'
    }
    return statusMap[status] || status
  }

  const getPaymentTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'deposit': '定金',
      'final': '尾款',
      'full': '全款'
    }
    return typeMap[type] || type
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <View className='payments-page'>
      {/* 统计卡片 */}
      {stats && (
        <View className='stats-section'>
          <View className='stats-grid'>
            <View className='stat-card'>
              <Text className='stat-value'>¥{stats.total_spent.toFixed(2)}</Text>
              <Text className='stat-label'>总支出</Text>
            </View>
            <View className='stat-card'>
              <Text className='stat-value pending'>¥{stats.pending_amount.toFixed(2)}</Text>
              <Text className='stat-label'>待支付</Text>
            </View>
          </View>
          <View className='stats-grid'>
            <View className='stat-card'>
              <Text className='stat-value'>¥{stats.monthly_spent.toFixed(2)}</Text>
              <Text className='stat-label'>本月支出</Text>
            </View>
            <View className='stat-card'>
              <Text className='stat-value'>¥{stats.avg_task_price.toFixed(2)}</Text>
              <Text className='stat-label'>平均任务价格</Text>
            </View>
          </View>
        </View>
      )}

      {/* 标签页 */}
      <View className='tabs'>
        <View
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Text>全部</Text>
        </View>
        <View
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Text>待支付</Text>
        </View>
        <View
          className={`tab ${activeTab === 'paid' ? 'active' : ''}`}
          onClick={() => setActiveTab('paid')}
        >
          <Text>已支付</Text>
        </View>
      </View>

      {/* 付款列表 */}
      <ScrollView className='payment-list' scrollY>
        {loading ? (
          <View className='loading-state'>
            <Text>加载中...</Text>
          </View>
        ) : payments.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>💰</Text>
            <Text className='empty-text'>暂无付款记录</Text>
          </View>
        ) : (
          payments.map(payment => (
            <View key={payment.id} className='payment-card' onClick={() => handleViewDetail(payment.id)}>
              <View className='payment-header'>
                <Text className='task-title'>{payment.task_title}</Text>
                <View className={`payment-status status-${payment.status}`}>
                  <Text className='status-text'>{getStatusText(payment.status)}</Text>
                </View>
              </View>

              <View className='payment-info'>
                <View className='info-row'>
                  <Text className='info-label'>执行学生</Text>
                  <Text className='info-value'>{payment.student_name}</Text>
                </View>
                <View className='info-row'>
                  <Text className='info-label'>支付类型</Text>
                  <Text className='info-value'>{getPaymentTypeText(payment.payment_type)}</Text>
                </View>
                <View className='info-row'>
                  <Text className='info-label'>金额</Text>
                  <Text className='info-value amount'>¥{payment.amount.toFixed(2)}</Text>
                </View>
                <View className='info-row'>
                  <Text className='info-label'>创建时间</Text>
                  <Text className='info-value'>{formatDate(payment.created_at)}</Text>
                </View>
                {payment.paid_at && (
                  <View className='info-row'>
                    <Text className='info-label'>支付时间</Text>
                    <Text className='info-value'>{formatDate(payment.paid_at)}</Text>
                  </View>
                )}
              </View>

              <View className='payment-footer'>
                <Text className='view-detail'>查看详情 ›</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
