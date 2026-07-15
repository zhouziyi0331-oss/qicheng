import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { mentorStageAPI } from '../../../services/api'
import { tokenManager } from '../../../utils/token'
import './detail.scss'

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
  weekly: { name: '周报', icon: '●', color: '#3B82F6' },
  monthly: { name: '月报', icon: '●', color: '#8B5CF6' },
  task_completion: { name: '任务总结', icon: '✓', color: '#10B981' },
  milestone: { name: '里程碑', icon: '◆', color: '#F59E0B' }
}

export default function MentorReportDetail() {
  const router = useRouter()
  const { reportId } = router.params

  const [report, setReport] = useState<MentorReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (reportId) {
      loadReportDetail()
    }
  }, [reportId])

  const loadReportDetail = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo')

      // 获取所有报告，然后找到对应的报告
      const response = await mentorStageAPI.getMentorReports(userInfo.id)
      if (response.success && response.data) {
        const targetReport = response.data.find((r: MentorReport) => r.id === reportId)
        if (targetReport) {
          setReport(targetReport)
        } else {
          Taro.showToast({ title: '报告不存在', icon: 'none' })
          setTimeout(() => Taro.navigateBack(), 1500)
        }
      }
    } catch (error: any) {
      console.error('加载报告详情失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    if (!reportId) return

    try {
      Taro.showLoading({ title: '导出中...' })

      const response = await mentorStageAPI.exportReport(reportId, 'pdf')

      if (response.success && response.data?.url) {
        const downloadRes = await Taro.downloadFile({
          url: response.data.url,
          header: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`
          }
        })

        if (downloadRes.statusCode === 200) {
          const saveRes = await Taro.saveFile({
            tempFilePath: downloadRes.tempFilePath
          })

          Taro.showToast({
            title: '导出成功！已保存到文件管理器',
            icon: 'success',
            duration: 2000
          })

          Taro.openDocument({
            filePath: saveRes.savedFilePath,
            fileType: 'pdf',
            showMenu: true
          }).catch(() => {})
        }
      } else {
        const downloadRes = await mentorStageAPI.downloadReport(reportId, 'pdf')

        if (downloadRes.statusCode === 200) {
          const saveRes = await Taro.saveFile({
            tempFilePath: downloadRes.tempFilePath
          })

          Taro.showToast({
            title: '导出成功！已保存到文件管理器',
            icon: 'success',
            duration: 2000
          })

          Taro.openDocument({
            filePath: saveRes.savedFilePath,
            fileType: 'pdf',
            showMenu: true
          }).catch(() => {})
        }
      }
    } catch (error: any) {
      console.error('导出报告失败:', error)
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
      <View className='mentor-report-detail-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!report) {
    return (
      <View className='mentor-report-detail-page'>
        <View className='empty-state'>
          <Text className='empty-icon'>▪</Text>
          <Text className='empty-text'>报告不存在</Text>
        </View>
      </View>
    )
  }

  const typeInfo = REPORT_TYPE_CONFIG[report.reportType]

  return (
    <View className='mentor-report-detail-page'>
      {/* 顶部头部 */}
      <View className='detail-header'>
        <View className='header-main'>
          <View
            className='report-icon'
            style={{ backgroundColor: typeInfo.color + '20' }}
          >
            <Text className='icon-text'>{typeInfo.icon}</Text>
          </View>
          <View className='header-info'>
            <Text className='report-title'>{report.title}</Text>
            <Text className='report-type'>{typeInfo.name}</Text>
            <Text className='report-period'>{report.period}</Text>
          </View>
        </View>
        <View className='export-button' onClick={handleExportReport}>
          <Text className='export-icon'>●</Text>
          <Text className='export-text'>导出PDF</Text>
        </View>
      </View>

      {/* 核心指标 */}
      <View className='metrics-section'>
        <View className='metric-card'>
          <Text className='metric-icon'>✓</Text>
          <Text className='metric-value'>{report.metrics.tasksCompleted}</Text>
          <Text className='metric-label'>完成任务</Text>
        </View>
        <View className='metric-card'>
          <Text className='metric-icon'>◆</Text>
          <Text className='metric-value'>{report.metrics.challengesAccepted}</Text>
          <Text className='metric-label'>接受挑战</Text>
        </View>
        <View className='metric-card'>
          <Text className='metric-icon'>◇</Text>
          <Text className='metric-value'>{report.metrics.averageScore}</Text>
          <Text className='metric-label'>平均分</Text>
        </View>
        <View className='metric-card highlight'>
          <Text className='metric-icon'>●</Text>
          <Text className='metric-value growth'>+{report.metrics.growthRate}%</Text>
          <Text className='metric-label'>成长率</Text>
        </View>
      </View>

      <ScrollView className='content-scroll' scrollY>
        {/* 整体进展 */}
        <View className='content-section'>
          <Text className='section-title'>● 整体进展</Text>
          <View className='section-card'>
            <Text className='section-text'>{report.summary.overallProgress}</Text>
          </View>
        </View>

        {/* 关键成就 */}
        <View className='content-section'>
          <Text className='section-title'>◇ 关键成就</Text>
          <View className='section-card'>
            {report.summary.keyAchievements.map((achievement, index) => (
              <View key={index} className='list-item'>
                <View className='list-bullet'>
                  <Text className='bullet-text'>•</Text>
                </View>
                <Text className='list-text'>{achievement}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 改进空间 */}
        <View className='content-section'>
          <Text className='section-title'>◇ 改进空间</Text>
          <View className='section-card'>
            {report.summary.areasForImprovement.map((area, index) => (
              <View key={index} className='list-item'>
                <View className='list-bullet'>
                  <Text className='bullet-text'>•</Text>
                </View>
                <Text className='list-text'>{area}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 深度洞察 */}
        <View className='content-section'>
          <Text className='section-title'>○ 深度洞察</Text>
          <View className='section-card'>
            {report.deepInsights.patternsIdentified.length > 0 && (
              <View className='insight-group'>
                <Text className='insight-subtitle'>识别的模式：</Text>
                {report.deepInsights.patternsIdentified.map((pattern, index) => (
                  <View key={index} className='list-item'>
                    <View className='list-bullet'>
                      <Text className='bullet-text'>▸</Text>
                    </View>
                    <Text className='list-text'>{pattern}</Text>
                  </View>
                ))}
              </View>
            )}

            {report.deepInsights.beliefShiftsObserved.length > 0 && (
              <View className='insight-group'>
                <Text className='insight-subtitle'>信念转变：</Text>
                {report.deepInsights.beliefShiftsObserved.map((shift, index) => (
                  <View key={index} className='list-item'>
                    <View className='list-bullet'>
                      <Text className='bullet-text'>▸</Text>
                    </View>
                    <Text className='list-text'>{shift}</Text>
                  </View>
                ))}
              </View>
            )}

            {report.deepInsights.behavioralChanges.length > 0 && (
              <View className='insight-group'>
                <Text className='insight-subtitle'>行为变化：</Text>
                {report.deepInsights.behavioralChanges.map((change, index) => (
                  <View key={index} className='list-item'>
                    <View className='list-bullet'>
                      <Text className='bullet-text'>▸</Text>
                    </View>
                    <Text className='list-text'>{change}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 导师建议 */}
        <View className='content-section'>
          <Text className='section-title'>◆ 导师建议</Text>
          <View className='section-card'>
            <View className='recommendation-group'>
              <Text className='recommendation-subtitle'>下一步行动：</Text>
              {report.recommendations.nextSteps.map((step, index) => (
                <View key={index} className='step-item'>
                  <View className='step-number'>
                    <Text className='number-text'>{index + 1}</Text>
                  </View>
                  <Text className='step-text'>{step}</Text>
                </View>
              ))}
            </View>

            {report.recommendations.suggestedChallenges.length > 0 && (
              <View className='recommendation-group'>
                <Text className='recommendation-subtitle'>推荐挑战：</Text>
                {report.recommendations.suggestedChallenges.map((challenge, index) => (
                  <View key={index} className='list-item'>
                    <View className='list-bullet'>
                      <Text className='bullet-text'>◆</Text>
                    </View>
                    <Text className='list-text'>{challenge}</Text>
                  </View>
                ))}
              </View>
            )}

            {report.recommendations.focusAreas.length > 0 && (
              <View className='recommendation-group'>
                <Text className='recommendation-subtitle'>重点关注：</Text>
                {report.recommendations.focusAreas.map((area, index) => (
                  <View key={index} className='list-item'>
                    <View className='list-bullet'>
                      <Text className='bullet-text'>◇</Text>
                    </View>
                    <Text className='list-text'>{area}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 精彩瞬间 */}
        {report.highlights.length > 0 && (
          <View className='content-section'>
            <Text className='section-title'>◇ 精彩瞬间</Text>
            <View className='highlights-container'>
              {report.highlights.map((highlight, index) => (
                <View key={index} className='highlight-card'>
                  <View className='highlight-header'>
                    <Text className='highlight-type'>
                      {highlight.type === 'achievement' ? '◆ 成就' :
                       highlight.type === 'breakthrough' ? '◇ 突破' : '● 进步'}
                    </Text>
                    <Text className='highlight-date'>{formatDate(highlight.date)}</Text>
                  </View>
                  <Text className='highlight-title'>{highlight.title}</Text>
                  <Text className='highlight-desc'>{highlight.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 导师寄语 */}
        <View className='content-section mentor-message'>
          <Text className='section-title'>● 导师寄语</Text>
          <View className='message-card'>
            <Text className='message-text'>{report.summary.mentorObservations}</Text>
            <View className='message-footer'>
              <Text className='message-signature'>— 启程小猫 ○</Text>
              <Text className='message-date'>{formatDate(report.generatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* 底部空白 */}
        <View className='bottom-padding' />
      </ScrollView>
    </View>
  )
}
