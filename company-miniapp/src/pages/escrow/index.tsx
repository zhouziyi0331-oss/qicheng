import { View, Text, ScrollView, Input, Picker } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { escrowAPI } from '../../services/api'
import './index.scss'

interface EscrowAccount {
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
  reject_reason?: string
}

export default function EscrowPage() {
  const [account, setAccount] = useState<EscrowAccount | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals'>('overview')
  const [showModal, setShowModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [accountType, setAccountType] = useState(0)
  const [accountInfo, setAccountInfo] = useState('')

  const accountTypes = ['支付宝', '微信', '银行卡']
  const accountTypeValues = ['alipay', 'wechat', 'bank']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [accountRes, transactionsRes, withdrawalsRes] = await Promise.all([
        escrowAPI.getAccount(),
        escrowAPI.getTransactions({ limit: 20 }),
        escrowAPI.getWithdrawals({ limit: 20 })
      ])

      setAccount(accountRes.data)
      setTransactions(transactionsRes.data || [])
      setWithdrawals(withdrawalsRes.data || [])
    } catch (err) {
      console.error('获取数据失败:', err)
      Taro.showToast({ title: '获取数据失败', icon: 'none' })
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

    if (!accountInfo) {
      Taro.showToast({ title: '请输入收款账号', icon: 'none' })
      return
    }

    try {
      await escrowAPI.requestWithdrawal({
        amount,
        account_type: accountTypeValues[accountType],
        account_info: { account: accountInfo }
      })

      Taro.showToast({ title: '提现申请已提交', icon: 'success' })
      setShowModal(false)
      setWithdrawAmount('')
      setAccountInfo('')
      fetchData()
    } catch (err: any) {
      Taro.showToast({ title: err.message || '提现申请失败', icon: 'none' })
    }
  }

  const handleCancelWithdrawal = async (id: string) => {
    const res = await Taro.showModal({
      title: '确认取消',
      content: '确定要取消这笔提现申请吗？'
    })

    if (res.confirm) {
      try {
        await escrowAPI.cancelWithdrawal(id)
        Taro.showToast({ title: '已取消', icon: 'success' })
        fetchData()
      } catch (err) {
        Taro.showToast({ title: '取消失败', icon: 'none' })
      }
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: '充值',
      freeze: '冻结',
      unfreeze: '解冻',
      transfer: '转账',
      refund: '退款',
      withdrawal: '提现'
    }
    return labels[type] || type
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      rejected: '已拒绝',
      cancelled: '已取消'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <View className='escrow-page'>
        <View className='loading'>加载中...</View>
      </View>
    )
  }

  return (
    <View className='escrow-page'>
      <Text className='title'>资金托管</Text>

      {/* 账户卡片 */}
      {account && (
        <View className='account-cards'>
          <View className='account-card'>
            <Text className='card-label'>账户余额</Text>
            <Text className='card-amount'>¥{account.balance.toFixed(2)}</Text>
          </View>

          <View className='account-card'>
            <Text className='card-label'>冻结金额</Text>
            <Text className='card-amount frozen'>¥{account.frozen_amount.toFixed(2)}</Text>
          </View>

          <View className='account-card'>
            <Text className='card-label'>可用余额</Text>
            <Text className='card-amount available'>¥{account.available_balance.toFixed(2)}</Text>
            <View className='btn-withdraw' onClick={() => setShowModal(true)}>提现</View>
          </View>
        </View>
      )}

      {/* 标签页 */}
      <View className='tabs'>
        <View className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          概览
        </View>
        <View className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
          交易记录
        </View>
        <View className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => setActiveTab('withdrawals')}>
          提现记录
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView scrollY className='list-container'>
        {activeTab === 'overview' && (
          <View className='empty'>
            <Text className='empty-icon'>💰</Text>
            <Text className='empty-text'>托管说明</Text>
          </View>
        )}

        {activeTab === 'transactions' && (
          transactions.length === 0 ? (
            <View className='empty'>
              <Text className='empty-icon'>📝</Text>
              <Text className='empty-text'>暂无交易记录</Text>
            </View>
          ) : (
            transactions.map(tx => (
              <View key={tx.id} className='transaction-item'>
                <View className='item-header'>
                  <Text className='item-type'>{getTypeLabel(tx.type)}</Text>
                  <Text className={`item-amount ${tx.type === 'deposit' ? 'positive' : 'negative'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                  </Text>
                </View>
                <Text className='item-desc'>{tx.description}</Text>
                <Text className='item-time'>{formatDate(tx.created_at)}</Text>
              </View>
            ))
          )
        )}

        {activeTab === 'withdrawals' && (
          withdrawals.length === 0 ? (
            <View className='empty'>
              <Text className='empty-icon'>💳</Text>
              <Text className='empty-text'>暂无提现记录</Text>
            </View>
          ) : (
            withdrawals.map(wd => (
              <View key={wd.id} className='withdrawal-item'>
                <View className='item-header'>
                  <Text className='item-title'>提现申请</Text>
                  <View className={`status-tag ${wd.status}`}>
                    {getStatusLabel(wd.status)}
                  </View>
                </View>

                <View className='amount-grid'>
                  <View className='amount-item'>
                    <Text className='amount-label'>申请金额</Text>
                    <Text className='amount-value'>¥{wd.amount.toFixed(2)}</Text>
                  </View>
                  <View className='amount-item'>
                    <Text className='amount-label'>手续费</Text>
                    <Text className='amount-value'>¥{wd.fee.toFixed(2)}</Text>
                  </View>
                  <View className='amount-item'>
                    <Text className='amount-label'>实际到账</Text>
                    <Text className='amount-value actual'>¥{wd.actual_amount.toFixed(2)}</Text>
                  </View>
                </View>

                <Text className='item-time'>申请时间：{formatDate(wd.created_at)}</Text>

                {wd.reject_reason && (
                  <View className='reject-reason'>拒绝原因：{wd.reject_reason}</View>
                )}

                {wd.status === 'pending' && (
                  <View className='btn-cancel' onClick={() => handleCancelWithdrawal(wd.id)}>
                    取消申请
                  </View>
                )}
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* 提现弹窗 */}
      {showModal && (
        <View className='withdraw-modal' onClick={() => setShowModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>申请提现</Text>

            <View className='form-item'>
              <Text className='form-label'>提现金额</Text>
              <Input
                className='form-input'
                type='digit'
                placeholder='请输入提现金额'
                value={withdrawAmount}
                onInput={(e) => setWithdrawAmount(e.detail.value)}
              />
              {account && (
                <Text className='form-hint'>可用余额：¥{account.available_balance.toFixed(2)}</Text>
              )}
            </View>

            <View className='form-item'>
              <Text className='form-label'>收款方式</Text>
              <Picker mode='selector' range={accountTypes} value={accountType} onChange={(e) => setAccountType(e.detail.value)}>
                <View className='form-picker'>{accountTypes[accountType]}</View>
              </Picker>
            </View>

            <View className='form-item'>
              <Text className='form-label'>收款账号</Text>
              <Input
                className='form-input'
                placeholder='请输入收款账号'
                value={accountInfo}
                onInput={(e) => setAccountInfo(e.detail.value)}
              />
            </View>

            <View className='fee-info'>
              <Text className='fee-item'>• 提现手续费：1%</Text>
              <Text className='fee-item'>• 预计到账：¥{withdrawAmount ? (parseFloat(withdrawAmount) * 0.99).toFixed(2) : '0.00'}</Text>
              <Text className='fee-item'>• 审核时间：1-3个工作日</Text>
            </View>

            <View className='modal-actions'>
              <View className='btn-cancel' onClick={() => setShowModal(false)}>取消</View>
              <View className='btn-confirm' onClick={handleWithdraw}>确认提现</View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
