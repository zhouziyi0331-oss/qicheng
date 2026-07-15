import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface WithdrawRecord {
  id: string
  method: 'wechat' | 'bank' | 'alipay'
  methodDetail: string
  amount: number
  date: string
  status: 'processing' | 'completed' | 'failed'
  statusDetail?: string
}

export default function WithdrawHistoryPage() {
  const [totalWithdrawn] = useState(6159.50)
  const [withdrawCount] = useState(8)

  const [records] = useState<WithdrawRecord[]>([
    {
      id: '1',
      method: 'wechat',
      methodDetail: '微信零钱',
      amount: 500,
      date: '07-11',
      status: 'processing',
      statusDetail: '申请中'
    },
    {
      id: '2',
      method: 'wechat',
      methodDetail: '微信零钱',
      amount: 1200,
      date: '07-03',
      status: 'completed',
      statusDetail: '已到账'
    },
    {
      id: '3',
      method: 'bank',
      methodDetail: '工商银行 · 尾号6688',
      amount: 800,
      date: '06-20',
      status: 'completed',
      statusDetail: '已到账'
    },
    {
      id: '4',
      method: 'alipay',
      methodDetail: '支付宝',
      amount: 600,
      date: '06-08',
      status: 'completed',
      statusDetail: '已到账'
    },
    {
      id: '5',
      method: 'wechat',
      methodDetail: '微信零钱',
      amount: 300,
      date: '06-01',
      status: 'failed',
      statusDetail: '账户信息异常'
    },
    {
      id: '6',
      method: 'bank',
      methodDetail: '工商银行 · 尾号6688',
      amount: 1500,
      date: '05-25',
      status: 'completed',
      statusDetail: '已到账'
    },
    {
      id: '7',
      method: 'wechat',
      methodDetail: '微信零钱',
      amount: 759.50,
      date: '05-10',
      status: 'completed',
      statusDetail: '已到账'
    }
  ])

  const getMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      wechat: '✓',
      bank: '✓',
      alipay: '✓'
    }
    return icons[method] || '✓'
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      processing: { text: '处理中', className: 'badge-orange' },
      completed: { text: '已到账', className: 'badge-green' },
      failed: { text: '已撤销', className: 'badge-red' }
    }
    return badges[status] || badges.processing
  }

  const getMonthLabel = (date: string) => {
    const month = date.split('-')[0]
    if (month === '07') return '2026年7月'
    if (month === '06') return '2026年6月'
    if (month === '05') return '2026年5月'
    return '2026年7月'
  }

  // 按月份分组
  const groupByMonth = () => {
    const groups: Record<string, WithdrawRecord[]> = {}
    records.forEach(record => {
      const monthLabel = getMonthLabel(record.date)
      if (!groups[monthLabel]) {
        groups[monthLabel] = []
      }
      groups[monthLabel].push(record)
    })
    return groups
  }

  const groupedRecords = groupByMonth()

  return (
    <View className="withdraw-history-page">
      {/* 顶部导航栏 */}
      <View className="history-topbar">
        <View className="topbar-btn" onClick={() => Taro.navigateBack()}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="topbar-title">提现记录</Text>
        <View style={{ width: '32px' }} />
      </View>

      <ScrollView scrollY className="history-scroll">
        <View className="history-content">

          {/* 提现汇总 */}
          <View className="summary-grid">
            <View className="summary-item">
              <Text className="summary-label">累计提现</Text>
              <Text className="summary-value">¥{totalWithdrawn.toLocaleString()}</Text>
              <Text className="summary-decimal">.50</Text>
            </View>
            <View className="summary-item">
              <Text className="summary-label">提现次数</Text>
              <Text className="summary-value">{withdrawCount} <Text className="summary-unit">次</Text></Text>
              <Text className="summary-status">全部成功</Text>
            </View>
          </View>

          {/* 按月份显示记录 */}
          {Object.entries(groupedRecords).map(([month, monthRecords]) => (
            <View key={month} className="month-section">
              <Text className="month-label">{month}</Text>

              <View className="records-card">
                {monthRecords.map(record => {
                  const badge = getStatusBadge(record.status)
                  return (
                    <View key={record.id} className="record-row">
                      <View className={`record-icon ${record.status === 'completed' ? 'icon-green' : record.status === 'failed' ? 'icon-red' : 'icon-sand'}`}>
                        <Text className="icon-text">{getMethodIcon(record.method)}</Text>
                      </View>
                      <View className="record-body">
                        <Text className="record-title">{record.methodDetail}</Text>
                        <Text className="record-desc">{record.date} · {record.statusDetail}</Text>
                      </View>
                      <View className="record-right">
                        <Text className={`record-amount ${record.status === 'failed' ? 'amount-grey' : ''}`}>
                          ¥{record.amount.toFixed(2)}
                        </Text>
                        <View className={`status-badge ${badge.className}`}>
                          <Text>{badge.text}</Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          ))}

          {/* 底部提示 */}
          <View className="bottom-tip">
            <Text className="bottom-tip-text">已显示全部记录</Text>
          </View>

          <View style={{ height: '16px' }} />
        </View>
      </ScrollView>
    </View>
  )
}
