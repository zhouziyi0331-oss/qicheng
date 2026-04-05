import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { withdrawAPI } from '../../services/api'
import './index.scss'

interface WithdrawRecord {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  statusText: string
  createdAt: string
  completedAt?: string
  failReason?: string
}

export default function Withdraw() {
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState('')
  const [records, setRecords] = useState<WithdrawRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [balanceData, historyData] = await Promise.all([
        withdrawAPI.getBalance(),
        withdrawAPI.getHistory()
      ])
      setBalance(balanceData.balance || 0)
      setRecords(historyData || [])
    } catch (err: any) {
      Taro.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
  }

  const handleWithdrawAll = () => {
    setAmount(balance.toString())
  }

  const handleSubmit = async () => {
    const withdrawAmount = parseFloat(amount)

    if (!amount || isNaN(withdrawAmount)) {
      Taro.showToast({ title: '请输入提现金额', icon: 'none' })
      return
    }

    if (withdrawAmount < 1) {
      Taro.showToast({ title: '提现金额不能低于1元', icon: 'none' })
      return
    }

    if (withdrawAmount > balance) {
      Taro.showToast({ title: '余额不足', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      await withdrawAPI.apply(withdrawAmount)
      Taro.showToast({ title: '提现申请已提交', icon: 'success' })
      setAmount('')
      // 重新加载数据
      setTimeout(() => {
        loadData()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({
        title: err.message || '提现失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="withdraw-page">
      {/* 余额卡片 */}
      <View className="balance-card">
        <Text className="balance-label">可提现余额</Text>
        <Text className="balance-amount">¥{balance.toFixed(2)}</Text>
        <Text className="balance-tip">完成任务后自动到账</Text>
      </View>

      {/* 提现表单 */}
      <View className="withdraw-form">
        <View className="form-header">
          <Text className="form-title">提现金额</Text>
        </View>

        <View className="amount-input-wrapper">
          <Text className="currency-symbol">¥</Text>
          <Input
            className="amount-input"
            type="digit"
            placeholder="请输入提现金额"
            value={amount}
            onInput={(e) => setAmount(e.detail.value)}
          />
        </View>

        <View className="quick-amounts">
          <View className="quick-item" onClick={() => handleQuickAmount(50)}>
            <Text className="quick-text">50元</Text>
          </View>
          <View className="quick-item" onClick={() => handleQuickAmount(100)}>
            <Text className="quick-text">100元</Text>
          </View>
          <View className="quick-item" onClick={() => handleQuickAmount(200)}>
            <Text className="quick-text">200元</Text>
          </View>
          <View className="quick-item all" onClick={handleWithdrawAll}>
            <Text className="quick-text">全部</Text>
          </View>
        </View>

        <View className="withdraw-tips">
          <Text className="tip-item">• 最低提现金额：1元</Text>
          <Text className="tip-item">• 提现将在1-3个工作日内到账</Text>
          <Text className="tip-item">• 提现到微信零钱，无手续费</Text>
        </View>

        <Button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting || !amount}
        >
          {submitting ? '提交中...' : '立即提现'}
        </Button>
      </View>

      {/* 提现记录 */}
      <View className="records-section">
        <View className="section-header">
          <Text className="section-title">提现记录</Text>
        </View>

        <ScrollView className="records-list" scrollY>
          {loading ? (
            <View className="loading-state">
              <Text className="loading-text">加载中...</Text>
            </View>
          ) : records.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">💰</Text>
              <Text className="empty-text">暂无提现记录</Text>
            </View>
          ) : (
            <View className="records-container">
              {records.map(record => (
                <View key={record.id} className="record-card">
                  <View className="record-header">
                    <View className="record-info">
                      <Text className="record-amount">¥{record.amount.toFixed(2)}</Text>
                      <Text className="record-time">{record.createdAt}</Text>
                    </View>
                    <View className={`record-status status-${record.status}`}>
                      <Text className="status-text">{record.statusText}</Text>
                    </View>
                  </View>

                  {record.status === 'completed' && record.completedAt && (
                    <Text className="record-note">到账时间：{record.completedAt}</Text>
                  )}

                  {record.status === 'failed' && record.failReason && (
                    <Text className="record-note error">失败原因：{record.failReason}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
