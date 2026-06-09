import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { escrowAPI } from '../../services/api'
import './index.scss'

interface Account {
  id: string
  balance: number
  frozen_amount: number
  available_balance: number
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  created_at: string
}

interface Withdrawal {
  id: string
  amount: number
  fee: number
  actual_amount: number
  account_type: string
  status: string
  created_at: string
}

export default function MyWalletPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>('transactions')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAccount, setWithdrawAccount] = useState('')

  useEffect(() => {
    fetchAccountData()
  }, [])

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    } else {
      fetchWithdrawals()
    }
  }, [activeTab])

  const fetchAccountData = async () => {
    try {
      const res = await escrowAPI.getAccount()
      setAccount(res.data)
    } catch (err) {
      console.error('获取账户信息失败:', err)
      Taro.showToast({ title: '获取账户信息失败', icon: 'none' })
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await escrowAPI.getTransactions()
      setTransactions(res.data || [])
    } catch (err) {
      console.error('获取交易记录失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const res = await escrowAPI.getWithdrawals()
      setWithdrawals(res.data || [])
    } catch (err) {
      console.error('获取提现记录失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }

    if (!account || amount > account.available_balance) {
      Taro.showToast({ title: '余额不足', icon: 'none' })
      return
    }

    if (!withdrawAccount) {
      Taro.showToast({ title: '请输入提现账户', icon: 'none' })
      return
    }

    try {
      await escrowAPI.requestWithdrawal({
        amount,
        account_type: 'wechat',
        account_info: { account: withdrawAccount }
      })

      Taro.showToast({ title: '提现申请已提交', icon: 'success' })
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setWithdrawAccount('')
      fetchAccountData()
      fetchWithdrawals()
    } catch (err) {
      console.error('提现失败:', err)
      Taro.showToast({ title: '提现申请失败', icon: 'none' })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      deposit: '💰',
      freeze: '🔒',
      unfreeze: '🔓',
      transfer: '💸',
      refund: '↩️'
    }
    return icons[type] || '📝'
  }

  const getTransactionName = (type: string) => {
    const names: Record<string, string> = {
      deposit: '充值',
      freeze: '冻结',
      unfreeze: '解冻',
      transfer: '转账',
      refund: '退款'
    }
    return names[type] || type
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '处理中',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消'
    }
    return texts[status] || status
  }

  const calculateFee = (amount: number) => {
    return (amount * 0.01).toFixed(2)
  }

  const calculateActualAmount = (amount: number) => {
    return (amount * 0.99).toFixed(2)
  }

  return (
    <View className='my-wallet-page'>
      <Text className='page-title'>我的钱包</Text>

      {/* 账户余额卡片 */}
      {account && (
        <View className='balance-card'>
          <View className='balance-info'>
            <Text className='balance-label'>可用余额</Text>
            <Text className='balance-amount'>
              <Text className='currency'>¥</Text>
              {account.available_balance.toFixed(2)}
            </Text>

            <View className='balance-details'>
              <View className='detail-item'>
                <Text className='detail-label'>总余额</Text>
                <Text className='detail-value'>¥{account.balance.toFixed(2)}</Text>
              </View>
              <View className='detail-item'>
                <Text className='detail-label'>冻结金额</Text>
                <Text className='detail-value'>¥{account.frozen_amount.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View className='withdraw-btn' onClick={() => setShowWithdrawModal(true)}>
            申请提现
          </View>
        </View>
      )}

      {/* 标签页 */}
      <View className='tabs'>
        <View className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
          交易记录
        </View>
        <View className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => setActiveTab('withdrawals')}>
          提现记录
        </View>
      </View>

      {/* 记录列表 */}
      <ScrollView scrollY className='records-list' style={{ height: 'calc(100vh - 600rpx)' }}>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : activeTab === 'transactions' ? (
          transactions.length === 0 ? (
            <View className='empty'>
              <Text className='empty-icon'>💰</Text>
              <Text className='empty-text'>暂无交易记录</Text>
            </View>
          ) : (
            transactions.map(tx => (
              <View key={tx.id} className='record-card'>
                <View className='record-header'>
                  <View className='record-type'>
                    <Text className='type-icon'>{getTransactionIcon(tx.type)}</Text>
                    <View className='type-info'>
                      <Text className='type-name'>{getTransactionName(tx.type)}</Text>
                      <Text className='type-desc'>{tx.description}</Text>
                    </View>
                  </View>
                  <Text className={`record-amount ${tx.type === 'deposit' || tx.type === 'refund' ? 'income' : 'expense'}`}>
                    {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                  </Text>
                </View>
                <View className='record-footer'>
                  <Text className='record-time'>{formatDate(tx.created_at)}</Text>
                  <View className={`record-status ${tx.status}`}>
                    {getStatusText(tx.status)}
                  </View>
                </View>
              </View>
            ))
          )
        ) : (
          withdrawals.length === 0 ? (
            <View className='empty'>
              <Text className='empty-icon'>💸</Text>
              <Text className='empty-text'>暂无提现记录</Text>
            </View>
          ) : (
            withdrawals.map(wd => (
              <View key={wd.id} className='record-card'>
                <View className='record-header'>
                  <View className='record-type'>
                    <Text className='type-icon'>💸</Text>
                    <View className='type-info'>
                      <Text className='type-name'>提现到{wd.account_type === 'wechat' ? '微信' : '支付宝'}</Text>
                      <Text className='type-desc'>手续费 ¥{wd.fee.toFixed(2)}</Text>
                    </View>
                  </View>
                  <Text className='record-amount expense'>¥{wd.actual_amount.toFixed(2)}</Text>
                </View>
                <View className='record-footer'>
                  <Text className='record-time'>{formatDate(wd.created_at)}</Text>
                  <View className={`record-status ${wd.status}`}>
                    {getStatusText(wd.status)}
                  </View>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* 提现弹窗 */}
      {showWithdrawModal && (
        <View className='withdraw-modal' onClick={() => setShowWithdrawModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>申请提现</Text>

            <View className='form-group'>
              <Text className='form-label'>提现金额</Text>
              <Input
                className='form-input amount-input'
                type='digit'
                placeholder='0.00'
                value={withdrawAmount}
                onInput={(e) => setWithdrawAmount(e.detail.value)}
              />
              {withdrawAmount && (
                <Text className='fee-info'>
                  手续费 ¥{calculateFee(parseFloat(withdrawAmount))} · 实际到账 ¥{calculateActualAmount(parseFloat(withdrawAmount))}
                </Text>
              )}
            </View>

            <View className='form-group'>
              <Text className='form-label'>微信账号</Text>
              <Input
                className='form-input'
                placeholder='请输入微信账号'
                value={withdrawAccount}
                onInput={(e) => setWithdrawAccount(e.detail.value)}
              />
            </View>

            <View className='modal-actions'>
              <View className='btn cancel' onClick={() => setShowWithdrawModal(false)}>
                取消
              </View>
              <View className='btn confirm' onClick={handleWithdraw}>
                确认提现
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
