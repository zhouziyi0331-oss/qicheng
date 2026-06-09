import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { mentorStageAPI } from '../../services/api'
import './index.scss'

interface MentorReport {
  id: string
  studentId: string
  reportType: 'weekly' | 'monthly' | 'task_completion' | 'milestone'
  title: string
  period: string
  generatedAt: string

  summary: {
    overallProgress: string
    keyAchievements: string[]
    areasForImprovement: string[]
    mentorObservations: string
  }

  metrics: {
    tasksCompleted: number
    challengesAccepted: number
    averageScore: number
    growthRate: number
  }

  deepInsights: {
    patternsIdentified: string[]
    beliefShiftsObserved: string[]
    behavioralChanges: string[]
  }

  recommendations: {
    nextSteps: string[]
    suggestedChallenges: string[]
    focusAreas: string[]
  }

  highlights: Array<{
    type: 'achievement' | 'breakthrough' | 'improvement'
    title: string
    description: string
    date: string
  }>
}

const REPORT_TYPE_CONFIG = {
  weekly: { name: '周报', icon: '📅', color: '#3B82F6' },
  monthly: { name: '月报', icon: '📊', color: '#8B5CF6' },
  task_completion: { name: '任务总结', icon: '✅', color: '#10B981' },
  milestone: { name: '里程碑', icon: '🎯', color: '#F59E0B' }
}

export default function MentorReports() {
  const [reports, setReports] = useState<MentorReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<MentorReport | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.id) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const response = await mentorStageAPI.getMentorReports(userInfo.id)
      if (response.success) {
        setReports(response.data || [])
      }
    } catch (error: any) {
      console.error('加载报告失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (type: 'weekly' | 'monthly') => {
    try {
      setGenerating(true)
      Taro.showLoading({ title: '生成中...' })

      const userInfo = Taro.getStorageSync('userInfo')
      const response = await mentorStageAPI.generateReport(userInfo.id, type)

      if (response.success) {
        Taro.showToast({ title: '报告生成成功', icon: 'success' })
        loadReports()
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '生成失败', icon: 'none' })
    } finally {
      setGenerating(false)
      Taro.hideLoading()
    }
  }

  const handleReportClick = (report: MentorReport) => {
    setSelectedReport(report)
    setShowDetail(true)
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setSelectedReport(null)
  }

  const handleExportReport = async (reportId: string) => {
    try {
      Taro.showLoading({ title: '导出中...' })
      const response = await mentorStageAPI.exportReport(reportId)

      if (response.success) {
        Taro.showToast({ title: '导出成功', icon: 'success' })
        // TODO: 处理导出的文件
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '导出失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  if (loading) {
    return (
      <View className='mentor-reports-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='mentor-reports-page'>
      {/* 生成报告按钮 */}
      <View className='generate-section'>
        <View
          className='generate-button'
          onClick={() => handleGenerateReport('weekly')}
        >
          <Text className='button-icon'>📅</Text>
          <Text className='button-text'>生成周报</Text>
        </View>
        <View
          className='generate-button'
          onClick={() => handleGenerateReport('monthly')}
        >
          <Text className='button-icon'>📊</Text>
          <Text className='button-text'>生成月报</Text>
        </View>
      </View>

      {/* 报告列表 */}
      <ScrollView className='reports-scroll' scrollY>
        {reports.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>📋</Text>
            <Text className='empty-text'>暂无报告</Text>
            <Text className='empty-hint'>点击上方按钮生成你的第一份成长报告</Text>
          </View>
        ) : (
          <View className='reports-list'>
            {reports.map(report => {
              const typeInfo = REPORT_TYPE_CONFIG[report.reportType]

              return (
                <View
                  key={report.id}
                  className='report-card'
                  onClick={() => handleReportClick(report)}
                >
                  <View className='report-header'>
                    <View
                      className='report-icon'
                      style={{ backgroundColor: typeInfo.color + '20' }}
                    >
                      <Text className='icon-text'>{typeInfo.icon}</Text>
                    </View>
                    <View className='report-info'>
                      <Text className='report-title'>{report.title}</Text>
                      <Text className='report-type'>{typeInfo.name}</Text>
                    </View>
                  </View>

                  <View className='report-period'>
                    <Text className='period-label'>报告周期：</Text>
                    <Text className='period-text'>{report.period}</Text>
                  </View>

                  <View className='report-metrics'>
                    <View className='metric-item'>
                      <Text className='metric-value'>{report.metrics.tasksCompleted}</Text>
                      <Text className='metric-label'>完成任务</Text>
                    </View>
                    <View className='metric-item'>
                      <Text className='metric-value'>{report.metrics.challengesAccepted}</Text>
                      <Text className='metric-label'>接受挑战</Text>
                    </View>
                    <View className='metric-item'>
                      <Text className='metric-value'>{report.metrics.averageScore}</Text>
                      <Text className='metric-label'>平均分</Text>
                    </View>
                    <View className='metric-item'>
                      <Text className='metric-value' style={{ color: '#10B981' }}>
                        +{report.metrics.growthRate}%
                      </Text>
                      <Text className='metric-label'>成长率</Text>
                    </View>
                  </View>

                  <View className='report-summary'>
                    <Text className='summary-text' numberOfLines={2}>
                      {report.summary.overallProgress}
                    </Text>
                  </View>

                  <View className='report-footer'>
                    <Text className='generated-time'>生成于 {formatDate(report.generatedAt)}</Text>
                    <Text className='view-detail'>查看详情 ›</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 报告详情弹窗 */}
      {showDetail && selectedReport && (
        <View className='detail-modal' onClick={handleCloseDetail}>
          <View className='detail-content' onClick={(e) => e.stopPropagation()}>
            <View className='detail-header'>
              <View className='header-left'>
                <Text className='detail-icon'>
                  {REPORT_TYPE_CONFIG[selectedReport.reportType].icon}
                </Text>
                <View className='header-info'>
                  <Text className='detail-title'>{selectedReport.title}</Text>
                  <Text className='detail-period'>{selectedReport.period}</Text>
                </View>
              </View>
              <View
                className='export-button'
                onClick={() => handleExportReport(selectedReport.id)}
              >
                <Text className='export-text'>导出</Text>
              </View>
            </View>

            <ScrollView className='detail-scroll' scrollY>
              {/* 整体进展 */}
              <View className='detail-section'>
                <Text className='section-title'>📈 整体进展</Text>
                <Text className='section-text'>{selectedReport.summary.overallProgress}</Text>
              </View>

              {/* 关键成就 */}
              <View className='detail-section'>
                <Text className='section-title'>🎉 关键成就</Text>
                {selectedReport.summary.keyAchievements.map((achievement, index) => (
                  <View key={index} className='list-item'>
                    <Text className='list-bullet'>•</Text>
                    <Text className='list-text'>{achievement}</Text>
                  </View>
                ))}
              </View>

              {/* 改进空间 */}
              <View className='detail-section'>
                <Text className='section-title'>💡 改进空间</Text>
                {selectedReport.summary.areasForImprovement.map((area, index) => (
                  <View key={index} className='list-item'>
                    <Text className='list-bullet'>•</Text>
                    <Text className='list-text'>{area}</Text>
                  </View>
                ))}
              </View>

              {/* 深度洞察 */}
              <View className='detail-section'>
                <Text className='section-title'>🔍 深度洞察</Text>

                {selectedReport.deepInsights.patternsIdentified.length > 0 && (
                  <View className='insight-group'>
                    <Text className='insight-subtitle'>识别的模式：</Text>
                    {selectedReport.deepInsights.patternsIdentified.map((pattern, index) => (
                      <View key={index} className='list-item'>
                        <Text className='list-bullet'>▸</Text>
                        <Text className='list-text'>{pattern}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedReport.deepInsights.beliefShiftsObserved.length > 0 && (
                  <View className='insight-group'>
                    <Text className='insight-subtitle'>信念转变：</Text>
                    {selectedReport.deepInsights.beliefShiftsObserved.map((shift, index) => (
                      <View key={index} className='list-item'>
                        <Text className='list-bullet'>▸</Text>
                        <Text className='list-text'>{shift}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedReport.deepInsights.behavioralChanges.length > 0 && (
                  <View className='insight-group'>
                    <Text className='insight-subtitle'>行为变化：</Text>
                    {selectedReport.deepInsights.behavioralChanges.map((change, index) => (
                      <View key={index} className='list-item'>
                        <Text className='list-bullet'>▸</Text>
                        <Text className='list-text'>{change}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 导师建议 */}
              <View className='detail-section'>
                <Text className='section-title'>🎯 导师建议</Text>

                <View className='recommendation-group'>
                  <Text className='recommendation-subtitle'>下一步行动：</Text>
                  {selectedReport.recommendations.nextSteps.map((step, index) => (
                    <View key={index} className='step-item'>
                      <View className='step-number'>
                        <Text className='number-text'>{index + 1}</Text>
                      </View>
                      <Text className='step-text'>{step}</Text>
                    </View>
                  ))}
                </View>

                {selectedReport.recommendations.suggestedChallenges.length > 0 && (
                  <View className='recommendation-group'>
                    <Text className='recommendation-subtitle'>推荐挑战：</Text>
                    {selectedReport.recommendations.suggestedChallenges.map((challenge, index) => (
                      <View key={index} className='list-item'>
                        <Text className='list-bullet'>🎯</Text>
                        <Text className='list-text'>{challenge}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedReport.recommendations.focusAreas.length > 0 && (
                  <View className='recommendation-group'>
                    <Text className='recommendation-subtitle'>重点关注：</Text>
                    {selectedReport.recommendations.focusAreas.map((area, index) => (
                      <View key={index} className='list-item'>
                        <Text className='list-bullet'>⭐</Text>
                        <Text className='list-text'>{area}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 精彩瞬间 */}
              {selectedReport.highlights.length > 0 && (
                <View className='detail-section'>
                  <Text className='section-title'>✨ 精彩瞬间</Text>
                  {selectedReport.highlights.map((highlight, index) => (
                    <View key={index} className='highlight-item'>
                      <View className='highlight-header'>
                        <Text className='highlight-type'>
                          {highlight.type === 'achievement' ? '🏆 成就' :
                           highlight.type === 'breakthrough' ? '💡 突破' : '📈 进步'}
                        </Text>
                        <Text className='highlight-date'>{formatDate(highlight.date)}</Text>
                      </View>
                      <Text className='highlight-title'>{highlight.title}</Text>
                      <Text className='highlight-desc'>{highlight.description}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 导师寄语 */}
              <View className='detail-section mentor-message'>
                <Text className='section-title'>💌 导师寄语</Text>
                <Text className='message-text'>{selectedReport.summary.mentorObservations}</Text>
              </View>
            </ScrollView>

            <View className='detail-footer'>
              <View className='footer-button' onClick={handleCloseDetail}>
                <Text className='button-text'>关闭</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
