import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface TaskIncome {
  id: string
  title: string
  company: string
  amount: number
  date: string
  status: 'completed' | 'pending'
}

export default function MyWalletPage() {
  const [availableBalance, setAvailableBalance] = useState(2480.50)
  const [totalIncome, setTotalIncome] = useState(8640.00)
  const [withdrawn, setWithdrawn] = useState(6159.50)
  const [completedTasks, setCompletedTasks] = useState(12)
  const [monthIncome, setMonthIncome] = useState(720)
  const [pendingAmount, setPendingAmount] = useState(300)

  const [recentIncome, setRecentIncome] = useState<TaskIncome[]>([
    {
      id: '1',
      title: '品牌视觉设计',
      company: '晨曦科技',
      amount: 480,
      date: '07-10',
      status: 'completed'
    },
    {
      id: '2',
      title: '用户调研报告',
      company: '未来教育',
      amount: 300,
      date: '07-08',
      status: 'pending'
    },
    {
      id: '3',
      title: '短视频脚本创作',
      company: '晨曦传媒',
      amount: 240,
      date: '07-05',
      status: 'completed'
    },
    {
      id: '4',
      title: '产品原型设计',
      company: '启迪互联',
      amount: 360,
      date: '06-28',
      status: 'completed'
    }
  ])

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  return (
    <View className="my-wallet-page">
      {/* 顶部导航栏 */}
      <View className="wallet-topbar">
        <View className="topbar-btn" onClick={() => Taro.navigateBack()}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="topbar-title">我的钱包</Text>
        <View className="topbar-btn" onClick={() => handleNavigate('/packageOther/pages/wallet/withdraw-history/index')}>
          <Text className="history-icon">●</Text>
        </View>
      </View>

      <ScrollView scrollY className="wallet-scroll">
        <View className="wallet-content">

          {/* 余额主卡片 */}
          <View className="balance-hero-card">
            {/* 装饰光晕 */}
            <View className="hero-glow hero-glow-1" />
            <View className="hero-glow hero-glow-2" />

            <View className="hero-inner">
              <Text className="balance-label">可提现余额</Text>
              <View className="balance-amount-wrap">
                <Text className="currency-symbol">¥</Text>
                <Text className="balance-integer">{Math.floor(availableBalance).toLocaleString()}</Text>
                <Text className="balance-decimal">.{(availableBalance % 1).toFixed(2).split('.')[1]}</Text>
              </View>
              <Text className="balance-subtitle">
                累计收入 ¥{totalIncome.toFixed(2)} · 已提现 ¥{withdrawn.toFixed(2)}
              </Text>

              {/* 两个快捷按钮 */}
              <View className="hero-actions">
                <Button
                  className="hero-btn hero-btn-primary"
                  onClick={() => handleNavigate('/packageOther/pages/wallet/withdraw/index')}
                >
                  <View className="btn-icon-circle">
                    <Text className="btn-icon">↓</Text>
                  </View>
                  <Text>申请提现</Text>
                </Button>
                <Button
                  className="hero-btn hero-btn-secondary"
                  onClick={() => handleNavigate('/packageAdvanced/pages/asset-dashboard/index')}
                >
                  <View className="btn-icon-circle">
                    <Text className="btn-icon">●</Text>
                  </View>
                  <Text>资产仪表盘</Text>
                </Button>
              </View>
            </View>
          </View>

          {/* 数据概览 */}
          <View className="stats-grid">
            <View className="stat-item">
              <Text className="stat-value stat-value-green">{completedTasks}</Text>
              <Text className="stat-label">已完成任务</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value stat-value-rust">¥{monthIncome}</Text>
              <Text className="stat-label">本月收入</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value stat-value-sand">¥{pendingAmount}</Text>
              <Text className="stat-label">待结算</Text>
            </View>
          </View>

          {/* 待结算提示 */}
          <View className="pending-tip" onClick={() => handleNavigate('/packageAdvanced/pages/asset-dashboard/index')}>
            <View className="tip-icon-wrap">
              <View className="tip-icon-circle" />
            </View>
            <View className="tip-text-wrap">
              <Text className="tip-text-bold">¥{pendingAmount.toFixed(2)} 待结算</Text>
              <Text className="tip-text-light">审核通过后自动到账</Text>
            </View>
            <Text className="tip-arrow">›</Text>
          </View>

          {/* 近期收入 */}
          <View className="section">
            <View className="section-header">
              <View className="section-header-left">
                <View className="section-marker" />
                <Text className="section-title">近期收入</Text>
              </View>
            </View>

            <View className="income-card">
              {recentIncome.map((item, index) => (
                <View
                  key={item.id}
                  className={`income-row ${index < recentIncome.length - 1 ? 'has-border' : ''}`}
                >
                  <View className={`income-icon ${item.status === 'completed' ? 'icon-green' : 'icon-sand'}`}>
                    <View className={`icon-shape ${item.status === 'completed' ? 'shape-check' : 'shape-clock'}`} />
                  </View>
                  <View className="income-body">
                    <Text className="income-title">{item.title}</Text>
                    <Text className="income-desc">
                      {item.company} · {item.date} {item.status === 'completed' ? '审核通过' : '待审核'}
                    </Text>
                  </View>
                  <View className="income-right">
                    <Text className={`income-amount ${item.status === 'completed' ? 'amount-green' : 'amount-sand'}`}>
                      {item.status === 'completed' ? '+' : ''}¥{item.amount}
                    </Text>
                  </View>
                </View>
              ))}

              {/* 查看全部 */}
              <View
                className="income-row view-all-row"
                onClick={() => handleNavigate('/packageAdvanced/pages/asset-dashboard/index')}
              >
                <Text className="view-all-text">查看全部收入记录</Text>
                <Text className="view-all-arrow">›</Text>
              </View>
            </View>
          </View>

          {/* 提现记录入口 */}
          <View className="income-card">
            <View
              className="income-row has-border"
              onClick={() => handleNavigate('/packageOther/pages/wallet/withdraw-history/index')}
            >
              <View className="income-icon icon-blue">
                <View className="icon-shape shape-down-arrow" />
              </View>
              <View className="income-body">
                <Text className="income-title">提现记录</Text>
                <Text className="income-desc">查看历史提现流水</Text>
              </View>
              <View className="income-right">
                <Text className="income-arrow">›</Text>
              </View>
            </View>

            <View
              className="income-row has-border"
              onClick={() => handleNavigate('/packageAdvanced/pages/asset-dashboard/index')}
            >
              <View className="income-icon icon-sand">
                <View className="icon-shape shape-chart" />
              </View>
              <View className="income-body">
                <Text className="income-title">收入分析</Text>
                <Text className="income-desc">查看收入趋势和详细数据</Text>
              </View>
              <View className="income-right">
                <Text className="income-arrow">›</Text>
              </View>
            </View>

            <View className="income-row">
              <View className="income-icon icon-green">
                <View className="icon-shape shape-settings" />
              </View>
              <View className="income-body">
                <Text className="income-title">账户设置</Text>
                <Text className="income-desc">管理收款方式和账户信息</Text>
              </View>
              <View className="income-right">
                <Text className="income-arrow">›</Text>
              </View>
            </View>
          </View>

          <View style={{ height: '40px' }} />
        </View>
      </ScrollView>
    </View>
  )
}
