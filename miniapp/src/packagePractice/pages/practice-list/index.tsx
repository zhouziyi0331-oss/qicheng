import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { practiceAPI } from '../../../services/api'
import './index.scss'

interface Practice {
  id: string
  title: string
  company: string
  track: 'content' | 'dev'
  status: 'ongoing' | 'completed'
  tags: string[]
  insight: string
  progress?: number
  startDate: string
  endDate?: string
  expectedEndDate?: string
  budget: number
  icon: string
}

export default function PracticeList() {
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [stats, setStats] = useState({
    completed: 0,
    ongoing: 0,
    totalIncome: 0,
    avgRating: 0
  })

  useEffect(() => {
    loadPractices()
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await practiceAPI.getStats()
      setStats({
        completed: response.completed || 0,
        ongoing: response.ongoing || 0,
        totalIncome: response.totalIncome || 0,
        avgRating: response.avgRating || 0
      })
    } catch (err) {
      console.error('加载统计数据失败:', err)
      // 使用默认值
      setStats({
        completed: 0,
        ongoing: 0,
        totalIncome: 0,
        avgRating: 0
      })
    }
  }

  const loadPractices = async () => {
    try {
      setLoading(true)
      const response = await practiceAPI.getList()
      setPractices(response.projects || [])
    } catch (err) {
      console.error('加载实践列表失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (practiceId: string) => {
    Taro.navigateTo({
      url: `/packagePractice/pages/practice-report/index?id=${practiceId}`
    })
  }

  const filterPractices = () => {
    if (activeFilter === 'all') return practices
    if (activeFilter === 'ongoing') return practices.filter(p => p.status === 'ongoing')
    if (activeFilter === 'completed') return practices.filter(p => p.status === 'completed')
    if (activeFilter === 'content') return practices.filter(p => p.track === 'content')
    if (activeFilter === 'dev') return practices.filter(p => p.track === 'dev')
    return practices
  }

  const filteredPractices = filterPractices()

  return (
    <View className="practice-list-page">
      {/* Hero区域 */}
      <View className="practice-hero">
        <View className="hero-top">
          <View className="hero-back" onClick={() => Taro.navigateBack()}>
            <Text className="back-icon">←</Text>
          </View>
          <Text className="hero-title">真实实践</Text>
          <View className="hero-more">
            <Text>⋯</Text>
          </View>
        </View>
        <Text className="hero-main-title">完成的真实项目</Text>
        <Text className="hero-subtitle">积累收入，沉淀可复制的商业能力</Text>
        <View className="hero-stats">
          <View className="hero-stat">
            <Text className="stat-num rust">{stats.completed}</Text>
            <Text className="stat-label">已完成</Text>
          </View>
          <View className="hero-stat">
            <Text className="stat-num teal">{stats.ongoing}</Text>
            <Text className="stat-label">进行中</Text>
          </View>
          <View className="hero-stat">
            <Text className="stat-num amber">¥{stats.totalIncome}</Text>
            <Text className="stat-label">累计收入</Text>
          </View>
          <View className="hero-stat">
            <Text className="stat-num">{stats.avgRating}★</Text>
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
          <Text>全部</Text>
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
          className={`filter-chip ${activeFilter === 'content' ? 'active' : ''}`}
          onClick={() => setActiveFilter('content')}
        >
          <Text>内容赛道</Text>
        </View>
        <View
          className={`filter-chip ${activeFilter === 'dev' ? 'active' : ''}`}
          onClick={() => setActiveFilter('dev')}
        >
          <Text>开发赛道</Text>
        </View>
      </View>

      {/* 实践列表 */}
      <ScrollView className="practices-scroll" scrollY>
        <View className="practices-list">
          {loading ? (
            <View className="loading-state">
              <Text>加载中...</Text>
            </View>
          ) : filteredPractices.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">○</Text>
              <Text className="empty-text">暂无实践记录</Text>
            </View>
          ) : (
            filteredPractices.map(practice => (
              <View
                key={practice.id}
                className={`practice-card ${practice.track === 'content' ? 'card-rust' : 'card-teal'}`}
                onClick={() => handleViewDetail(practice.id)}
              >
                <View className="practice-inner">
                  <View className="practice-top">
                    <View className={`practice-icon ${practice.track === 'content' ? 'icon-rust' : 'icon-teal'}`}>
                      <Text>{practice.icon}</Text>
                    </View>
                    <View className="practice-content">
                      <Text className="practice-title">{practice.title}</Text>
                      <View className="practice-tags">
                        {practice.tags.map((tag, idx) => (
                          <View
                            key={idx}
                            className={`practice-tag ${practice.track === 'content' ? 'tag-rust' : 'tag-teal'}`}
                          >
                            <Text>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* 核心洞察 */}
                  <View className={`insight-box ${practice.track === 'content' ? 'insight-rust' : 'insight-teal'}`}>
                    <Text className="insight-label">◆ 核心洞察</Text>
                    <Text className="insight-text">{practice.insight}</Text>
                  </View>

                  {/* 进度条（进行中的项目） */}
                  {practice.status === 'ongoing' && practice.progress !== undefined && (
                    <View className="practice-progress">
                      <View className="progress-bar">
                        <View
                          className={`progress-fill ${practice.track === 'content' ? 'fill-rust' : 'fill-teal'}`}
                          style={{ width: `${practice.progress}%` }}
                        />
                      </View>
                      <View className="progress-info">
                        <Text className="progress-label">进度 {practice.progress}%</Text>
                        <Text className="progress-date">预计 {practice.expectedEndDate} 完成</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View className="practice-footer">
                  <Text className="practice-date">
                    {practice.status === 'completed'
                      ? `完成 ${practice.endDate} · ¥${practice.budget}`
                      : `开始 ${practice.startDate} · ¥${practice.budget}`}
                  </Text>
                  <View className="detail-btn">
                    <Text>查看拆解 →</Text>
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
