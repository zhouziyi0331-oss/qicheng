import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { practiceAPI } from '../../../services/api'
import './index.scss'

interface ReportData {
  id: string
  title: string
  company: string
  track: 'content' | 'dev'
  tags: string[]
  status: 'completed' | 'ongoing'
  dateRange: string
  duration: string
  budget: number
  scores: {
    execution: number
    problemSolving: number
    replicability: number
  }
  whatDid: {
    description: string
    items: string[]
  }
  problemSolved: {
    coreIssue: string
    rootCause: string
    improvement: {
      label: string
      before: number
      after: number
    }
  }
  replicability: {
    description: string
    industries: Array<{
      name: string
      icon: string
      level: 'high' | 'medium'
    }>
  }
  learned: {
    highlight: string
    items: string[]
  }
  rewards: {
    exp: number
    income: number
    cases: number
  }
}

export default function PracticeReport() {
  const router = useRouter()
  const { id } = router.params
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    try {
      setLoading(true)
      const response = await practiceAPI.getReport(id || '1')
      setReport(response)
    } catch (err) {
      console.error('加载报告失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !report) {
    return (
      <View className="practice-report-page">
        <View className="loading-state">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="practice-report-page">
      {/* Hero区域 */}
      <View className="report-hero">
        <View className="hero-top">
          <View className="hero-back" onClick={() => Taro.navigateBack()}>
            <Text className="back-icon">←</Text>
          </View>
          <Text className="hero-title">实践拆解</Text>
          <View style={{ width: '34px' }} />
        </View>
        <View className="hero-chips">
          {report.tags.map((tag, idx) => (
            <View key={idx} className={`hero-chip ${report.track === 'content' ? 'chip-rust' : 'chip-teal'}`}>
              <Text>{tag}</Text>
            </View>
          ))}
          <View className="hero-chip chip-status">
            <Text>{report.status === 'completed' ? '✓ 已完成' : '进行中'}</Text>
          </View>
        </View>
        <Text className="hero-main-title">{report.title}</Text>
        <Text className="hero-sub-title">{report.company}</Text>
        <Text className="hero-meta">{report.dateRange} · {report.duration} · ¥{report.budget}</Text>
      </View>

      <ScrollView className="report-scroll" scrollY>
        {/* 评分区域 */}
        <View className="score-row">
          <View className="score-card">
            <View className="score-circle amber">
              <Text>{report.scores.execution}</Text>
            </View>
            <Text className="score-label">执行质量</Text>
          </View>
          <View className="score-card">
            <View className="score-circle rust">
              <Text>{report.scores.problemSolving}</Text>
            </View>
            <Text className="score-label">问题解决</Text>
          </View>
          <View className="score-card">
            <View className="score-circle teal">
              <Text>{report.scores.replicability}</Text>
            </View>
            <Text className="score-label">可复制性</Text>
          </View>
        </View>

        {/* 报告内容 */}
        <View className="report-body">
          {/* 你做了什么 */}
          <View className="report-section">
            <View className="rs-head">
              <View className="rs-icon amber">
                <Text>◆</Text>
              </View>
              <View className="rs-info">
                <Text className="rs-title">你做了什么</Text>
                <Text className="rs-subtitle">项目核心工作拆解</Text>
              </View>
            </View>
            <Text className="rs-body">{report.whatDid.description}</Text>
            <View className="rs-list">
              {report.whatDid.items.map((item, idx) => (
                <View key={idx} className="rs-list-item">
                  <View className="rs-dot rust" />
                  <Text className="rs-list-text">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 解决了什么卡点 */}
          <View className="report-section">
            <View className="rs-head">
              <View className="rs-icon rust">
                <Text>▲</Text>
              </View>
              <View className="rs-info">
                <Text className="rs-title">解决了什么卡点</Text>
                <Text className="rs-subtitle">企业核心痛点分析</Text>
              </View>
            </View>
            <View className="rs-highlight">
              <Text>{report.problemSolved.coreIssue}</Text>
            </View>
            <Text className="rs-body">{report.problemSolved.rootCause}</Text>
            <View className="improvement-chart">
              <View className="chart-label">
                <Text>{report.problemSolved.improvement.label}</Text>
                <Text className="chart-change">{report.problemSolved.improvement.before}% → {report.problemSolved.improvement.after}%</Text>
              </View>
              <View className="progress-bar">
                <View
                  className="progress-fill rust"
                  style={{ width: `${report.problemSolved.improvement.after}%` }}
                />
              </View>
            </View>
          </View>

          {/* 可复制性分析 */}
          <View className="report-section">
            <View className="rs-head">
              <View className="rs-icon teal">
                <Text>⇄</Text>
              </View>
              <View className="rs-info">
                <Text className="rs-title">可复制性分析</Text>
                <Text className="rs-subtitle">这个方法在哪些行业同样适用</Text>
              </View>
            </View>
            <Text className="rs-body">{report.replicability.description}</Text>
            <View className="rs-highlight teal">
              <Text>可复制行业</Text>
            </View>
            <View className="industry-list">
              {report.replicability.industries.map((industry, idx) => (
                <View key={idx} className="industry-item">
                  <Text className="industry-icon">{industry.icon}</Text>
                  <Text className="industry-name">{industry.name}</Text>
                  <Text className={`industry-tag ${industry.level}`}>
                    {industry.level === 'high' ? '高度适用' : '中度适用'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 你学到了什么 */}
          <View className="report-section">
            <View className="rs-head">
              <View className="rs-icon blue">
                <Text>◈</Text>
              </View>
              <View className="rs-info">
                <Text className="rs-title">你学到了什么</Text>
                <Text className="rs-subtitle">能力成长记录</Text>
              </View>
            </View>
            <View className="rs-highlight teal">
              <Text>{report.learned.highlight}</Text>
            </View>
            <View className="rs-list">
              {report.learned.items.map((item, idx) => (
                <View key={idx} className="rs-list-item">
                  <View className="rs-dot teal" />
                  <Text className="rs-list-text">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 项目完成奖励 */}
          <View className="reward-card">
            <Text className="reward-title">✦ 项目完成奖励</Text>
            <View className="reward-row">
              <View className="reward-item">
                <Text className="reward-num">+{report.rewards.exp}</Text>
                <Text className="reward-label">经验值</Text>
              </View>
              <View className="reward-item">
                <Text className="reward-num">¥{report.rewards.income}</Text>
                <Text className="reward-label">已到账</Text>
              </View>
              <View className="reward-item">
                <Text className="reward-num">+{report.rewards.cases}</Text>
                <Text className="reward-label">案例库</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
