import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { jumpLevelAPI } from '../../services/api'
import Loading from '../../components/Loading'
import './index.scss'

export default function JumpLevel() {
  const [loading, setLoading] = useState(true)
  const [eligibility, setEligibility] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 获取跳级资格
      const eligibilityRes = await jumpLevelAPI.checkEligibility()
      if (eligibilityRes.success) {
        setEligibility(eligibilityRes.data)
      }

      // 获取跳级记录
      const recordsRes = await jumpLevelAPI.getJumpTestRecords()
      if (recordsRes.success) {
        setRecords(recordsRes.data || [])
      }
    } catch (error) {
      console.error('加载跳级数据失败:', error)
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!eligibility?.eligible) {
      Taro.showToast({
        title: '暂不满足跳级条件',
        icon: 'none'
      })
      return
    }

    try {
      setApplying(true)

      const res = await jumpLevelAPI.applyJumpTest()
      if (res.success) {
        Taro.showToast({
          title: '申请成功！',
          icon: 'success'
        })

        // 刷新数据
        setTimeout(() => {
          loadData()
        }, 1000)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '申请失败',
        icon: 'none'
      })
    } finally {
      setApplying(false)
    }
  }

  const getLevelName = (level: number, track: string) => {
    const levelNames = {
      content: ['Lv.0 启程者', 'Lv.1 探索者', 'Lv.2 实践者', 'Lv.3 创作者', 'Lv.4 引领者', 'Lv.5 创造者'],
      dev: ['Lv.0 启程者', 'Lv.1 探索者', 'Lv.2 构建者', 'Lv.3 工程师', 'Lv.4 架构师', 'Lv.5 创造者']
    }
    return levelNames[track]?.[level] || `Lv.${level}`
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: '待提交',
      submitted: '已提交',
      reviewing: 'AI评审中',
      passed: '通过 ✓',
      failed: '未通过'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status: string) => {
    const classMap = {
      pending: 'status-pending',
      submitted: 'status-submitted',
      reviewing: 'status-reviewing',
      passed: 'status-passed',
      failed: 'status-failed'
    }
    return classMap[status] || ''
  }

  if (loading) {
    return <Loading text="正在加载跳级信息..." />
  }

  return (
    <View className="jump-level-page">
      {/* 页面标题 */}
      <View className="page-header">
        <Text className="page-title">🚀 跳级申请</Text>
        <Text className="page-subtitle">挑战自我，跨越成长</Text>
      </View>

      {/* 当前等级卡片 */}
      {eligibility && (
        <View className="level-card">
          <View className="level-info">
            <View className="current-level">
              <Text className="level-label">当前等级</Text>
              <Text className="level-value">
                {getLevelName(eligibility.currentLevel, eligibility.track || 'content')}
              </Text>
            </View>
            <View className="arrow">→</View>
            <View className="target-level">
              <Text className="level-label">目标等级</Text>
              <Text className="level-value">
                {getLevelName(eligibility.targetLevel, eligibility.track || 'content')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 跳级条件卡片 */}
      {eligibility && (
        <View className="conditions-card">
          <Text className="card-title">跳级条件</Text>

          {eligibility.eligible ? (
            <View className="conditions-met">
              <View className="success-icon">✓</View>
              <Text className="success-text">恭喜！你已满足所有跳级条件</Text>
            </View>
          ) : (
            <View className="conditions-list">
              {eligibility.reasons?.map((reason: string, index: number) => (
                <View key={index} className="condition-item unmet">
                  <View className="condition-icon">✗</View>
                  <Text className="condition-text">{reason}</Text>
                </View>
              ))}

              {eligibility.missingConditions && (
                <View className="missing-details">
                  {eligibility.missingConditions.tasksCompleted !== undefined && (
                    <Text className="detail-text">
                      已完成任务: {eligibility.missingConditions.tasksCompleted} / {eligibility.missingConditions.tasksRequired}
                    </Text>
                  )}
                  {eligibility.missingConditions.avgQuality !== undefined && (
                    <Text className="detail-text">
                      平均质量: {eligibility.missingConditions.avgQuality} / {eligibility.missingConditions.qualityRequired}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* 申请按钮 */}
          <Button
            className={`apply-btn ${eligibility.eligible ? 'enabled' : 'disabled'}`}
            onClick={handleApply}
            disabled={!eligibility.eligible || applying}
          >
            {applying ? '申请中...' : eligibility.eligible ? '申请跳级测试' : '暂不满足条件'}
          </Button>
        </View>
      )}

      {/* 跳级说明 */}
      <View className="info-card">
        <Text className="info-title">💡 跳级说明</Text>
        <View className="info-list">
          <Text className="info-item">• 跳级测试需要AI评分达到85分以上</Text>
          <Text className="info-item">• 通过后可跳2个等级</Text>
          <Text className="info-item">• 失败后需完成2个新任务才能再次申请</Text>
          <Text className="info-item">• 跳级测试任务难度会高于当前等级</Text>
        </View>
      </View>

      {/* 历史记录 */}
      {records.length > 0 && (
        <View className="records-section">
          <Text className="section-title">历史记录</Text>

          {records.map((record) => (
            <View key={record.id} className="record-card">
              <View className="record-header">
                <Text className="record-level">
                  Lv.{record.fromLevel} → Lv.{record.targetLevel}
                </Text>
                <View className={`record-status ${getStatusClass(record.status)}`}>
                  <Text className="status-text">{getStatusText(record.status)}</Text>
                </View>
              </View>

              {record.score !== undefined && (
                <View className="record-score">
                  <Text className="score-label">AI评分:</Text>
                  <Text className={`score-value ${record.score >= 85 ? 'passed' : 'failed'}`}>
                    {record.score}分
                  </Text>
                </View>
              )}

              {record.aiReview && (
                <View className="record-review">
                  <Text className="review-label">AI评语:</Text>
                  <Text className="review-text">{record.aiReview}</Text>
                </View>
              )}

              <Text className="record-date">
                {new Date(record.createdAt).toLocaleDateString('zh-CN')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
