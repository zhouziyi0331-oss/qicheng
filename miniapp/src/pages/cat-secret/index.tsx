import { View, Text, ScrollView, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import catLogo from '../../assets/images/cat-logo.png'
import './index.scss'

interface Achievement {
  id: string
  name: string
  desc: string
  unlocked: boolean
  progress?: string
}

export default function CatSecret() {
  const [stats, setStats] = useState({
    consecutiveDays: 14,
    aiDialogs: 87,
    weeklyTasks: 3
  })

  const [quote, setQuote] = useState({
    text: '你的独特，就是你的价值',
    sub: '做自己，已经很了不起',
    remaining: 3
  })

  const [luckyBuff, setLuckyBuff] = useState({
    name: '创造力',
    boost: 18,
    desc: '灵感会源源不断～',
    expire: '今天 24:00 前'
  })

  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: '1', name: '初次相遇', desc: '发现小猫的秘密空间', unlocked: true },
    { id: '2', name: '连续登录7天', desc: '坚持的力量', unlocked: true },
    { id: '3', name: '对话达人', desc: '与AI导师对话超过50轮', unlocked: true },
    { id: '4', name: '任务新手', desc: '完成10个任务', unlocked: false, progress: '6 / 10' },
    { id: '5', name: '深度思考者', desc: '累计对话超过30次', unlocked: false, progress: '18 / 30' }
  ])

  const quotes = [
    { text: '你的独特，就是你的价值', sub: '做自己，已经很了不起' },
    { text: '每一次尝试，都是在为未来的自己铺路', sub: '失败不是终点，是转折点' },
    { text: '不是因为有希望才行动，而是行动了才有希望', sub: '行动是最好的答案' },
    { text: '一人公司，不是孤独，是自由', sub: '你就是你自己的 CEO' },
    { text: '接单的第一步，是相信自己值得被付费', sub: '定价是一种自我认知' }
  ]

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)

  const handleNextQuote = () => {
    if (quote.remaining <= 0) return

    const nextIndex = (currentQuoteIndex + 1) % quotes.length
    setCurrentQuoteIndex(nextIndex)

    setQuote({
      ...quotes[nextIndex],
      remaining: quote.remaining - 1
    })
  }

  const handleSaveQuote = () => {
    try {
      // 获取现有收藏
      const savedQuotes = Taro.getStorageSync('savedQuotes') || []
      const currentQuote = quotes[currentQuoteIndex]

      // 检查是否已收藏
      const exists = savedQuotes.some(q => q.text === currentQuote.text)
      if (exists) {
        Taro.showToast({
          title: '已收藏过了',
          icon: 'none'
        })
        return
      }

      // 添加时间戳
      const newQuote = {
        ...currentQuote,
        savedAt: Date.now()
      }

      savedQuotes.unshift(newQuote)
      Taro.setStorageSync('savedQuotes', savedQuotes)

      Taro.showToast({
        title: '已收藏',
        icon: 'success'
      })
    } catch (error) {
      console.error('收藏失败:', error)
      Taro.showToast({
        title: '收藏失败',
        icon: 'none'
      })
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleViewAllAchievements = () => {
    Taro.navigateTo({
      url: '/pages/cat-achievements/index'
    })
  }

  const handleViewQuotes = () => {
    Taro.navigateTo({
      url: '/pages/cat-quotes/index?tab=saved'
    })
  }

  return (
    <View className="cat-secret-page">
      {/* 顶部栏 */}
      <View className="top-bar">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="top-title">小猫的秘密空间</Text>
        <View className="top-actions">
          <View className="icon-btn" onClick={handleViewQuotes}>
            <Text className="icon">◆</Text>
          </View>
        </View>
      </View>

      <ScrollView className="scroll-area" scrollY>
        {/* Hero: 小猫今天的心情 */}
        <View className="secret-hero">
          <View className="hero-inner">
            <View className="cat-avatar">
              <View className="cat-logo-wrapper">
                <Image src={catLogo} className="cat-logo-img" mode="aspectFit" />
              </View>
            </View>
            <View className="hero-text">
              <View className="hero-label">
                <Text className="label-icon">◆</Text>
                <Text>小猫今天的心情</Text>
              </View>
              <Text className="hero-mood">
                今天遇到了 3 个努力的同学，看到大家成长得很开心喵～
              </Text>
              <Text className="hero-date">2026年7月12日</Text>
            </View>
          </View>
        </View>

        {/* Stats strip */}
        <View className="stats-strip">
          <View className="strip-item">
            <Text className="strip-val rust">{stats.consecutiveDays}</Text>
            <Text className="strip-label">连续登录天</Text>
          </View>
          <View className="strip-item">
            <Text className="strip-val teal">{stats.aiDialogs}</Text>
            <Text className="strip-label">AI对话次数</Text>
          </View>
          <View className="strip-item">
            <Text className="strip-val golden">{stats.weeklyTasks}</Text>
            <Text className="strip-label">本周任务</Text>
          </View>
        </View>

        {/* 今日一句 */}
        <View className="quote-card">
          <View className="quote-label">
            <Text className="label-bar" />
            <Text className="label-icon">▪</Text>
            <Text>今日一句</Text>
          </View>
          <Text className="quote-text">{quote.text}</Text>
          <Text className="quote-sub">{quote.sub}</Text>
          <View className="quote-actions">
            <Button className="quote-btn-save" onClick={handleSaveQuote}>
              <Text className="btn-icon">◆</Text>
              <Text>收藏</Text>
            </Button>
            <Button
              className="quote-btn-next"
              onClick={handleNextQuote}
              disabled={quote.remaining <= 0}
            >
              <Text className="btn-icon">○</Text>
              <Text>换一句 ({quote.remaining})</Text>
            </Button>
          </View>
        </View>

        {/* 今日幸运加成 */}
        <View className="lucky-card">
          <View className="lucky-label">
            <Text className="label-bar" />
            <Text className="label-icon">◇</Text>
            <Text>今日幸运加成</Text>
          </View>
          <View className="lucky-row">
            <View className="lucky-icon">
              <Text className="icon">◆</Text>
            </View>
            <View className="lucky-info">
              <View className="lucky-name-row">
                <Text className="lucky-name">{luckyBuff.name}</Text>
                <Text className="lucky-boost">+{luckyBuff.boost}%</Text>
              </View>
              <Text className="lucky-desc">{luckyBuff.desc}</Text>
            </View>
          </View>
          <Text className="lucky-expire">有效期：{luckyBuff.expire}</Text>
        </View>

        {/* 我的发现（成就） */}
        <View className="achieve-section">
          <View className="sec-header">
            <View className="sec-title">
              <Text className="title-icon">▲</Text>
              <Text>我的发现</Text>
            </View>
            <Text className="sec-more" onClick={handleViewAllAchievements}>全部 →</Text>
          </View>
          <View className="achieve-list">
            {achievements.map((ach) => (
              <View
                key={ach.id}
                className={`achieve-item ${ach.unlocked ? 'unlocked' : 'locked'}`}
              >
                <View className={`achieve-icon ${ach.unlocked ? 'unlocked-icon' : 'locked-icon'}`}>
                  <Text className="icon">{ach.unlocked ? '✓' : '○'}</Text>
                </View>
                <View className="achieve-info">
                  <Text className="achieve-name">{ach.name}</Text>
                  <Text className="achieve-desc">{ach.desc}</Text>
                  {ach.progress && (
                    <Text className="achieve-progress">{ach.progress}</Text>
                  )}
                </View>
                <View className="achieve-status">
                  {ach.unlocked ? (
                    <View className="achieve-check">
                      <Text className="check-icon">✓</Text>
                    </View>
                  ) : (
                    <View className="achieve-lock">
                      <Text className="lock-icon">○</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          <Button className="view-all-btn" onClick={handleViewAllAchievements}>
            查看全部成就 →
          </Button>
        </View>

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}
