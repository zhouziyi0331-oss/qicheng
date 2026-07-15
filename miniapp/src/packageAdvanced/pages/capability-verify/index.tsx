import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import Loading from '../../../components/Loading'
import './index.scss'

interface SkillMatch {
  skill: string
  studentLevel: number
  requiredLevel: number
  cases: number
  status: 'strong' | 'acceptable' | 'weak'
}

interface VerifyResult {
  passed: boolean
  confidence: number
  matchedSkills: SkillMatch[]
  weakSkills: SkillMatch[]
  studentHistory: {
    totalCompleted: number
    avgRating: number
    avgCompletionDays: number
  }
  suggestions: string[]
  recommendation: string
}

export default function CapabilityVerify() {
  const router = useRouter()
  const { taskId } = router.params

  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)

  useEffect(() => {
    if (taskId) {
      verifyCapability()
    }
  }, [taskId])

  const verifyCapability = async () => {
    try {
      setLoading(true)
      const token = tokenManager.getAccessToken()
      const res = await Taro.request({
        url: getApiUrl('/api/v1/student/verify-capability'),
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: { taskId }
      })

      if (res.data.success) {
        setResult(res.data.data)
      }
    } catch (err) {
      console.error('能力核验失败:', err)
      Taro.showToast({ title: '核验失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleStartProject = () => {
    Taro.navigateTo({ url: `/packageTask/pages/tasks/detail?id=${taskId}` })
  }

  const handlePrepareMore = () => {
    Taro.navigateBack()
  }

  if (loading) {
    return <Loading text="AI正在评估你的能力..." />
  }

  if (!result) {
    return (
      <View className="verify-error">
        <Text className="error-text">核验失败</Text>
        <Button onClick={() => Taro.navigateBack()}>返回</Button>
      </View>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'strong': return '✓'
      case 'acceptable': return '▲'
      case 'weak': return '❌'
      default: return '•'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'strong': return '能力充足'
      case 'acceptable': return '基本满足'
      case 'weak': return '建议补充'
      default: return ''
    }
  }

  return (
    <View className="capability-verify-page">
      <View className="page-header">
        <Text className="page-title">能力核验</Text>
      </View>

      <View className="confidence-section">
        <View className="confidence-circle">
          <Text className="confidence-number">{result.confidence}%</Text>
          <Text className="confidence-label">匹配度</Text>
        </View>
        <Text className="recommendation">{result.recommendation}</Text>
      </View>

      <View className="skills-section">
        <Text className="section-title">项目所需能力</Text>

        {result.matchedSkills.map((skill, index) => (
          <View key={index} className="skill-item">
            <View className="skill-header">
              <Text className="skill-icon">{getStatusIcon(skill.status)}</Text>
              <Text className="skill-name">{skill.skill}</Text>
              <Text className="skill-status">{getStatusText(skill.status)}</Text>
            </View>
            <View className="skill-details">
              <Text className="skill-level">
                你的等级：Lv.{skill.studentLevel} / 需要：Lv.{skill.requiredLevel}
              </Text>
              {skill.cases > 0 && (
                <Text className="skill-cases">你的案例：{skill.cases}个</Text>
              )}
            </View>
          </View>
        ))}

        {result.weakSkills.map((skill, index) => (
          <View key={`weak-${index}`} className="skill-item weak">
            <View className="skill-header">
              <Text className="skill-icon">{getStatusIcon(skill.status)}</Text>
              <Text className="skill-name">{skill.skill}</Text>
              <Text className="skill-status">{getStatusText(skill.status)}</Text>
            </View>
            <View className="skill-details">
              <Text className="skill-level">
                你的等级：Lv.{skill.studentLevel} / 需要：Lv.{skill.requiredLevel}
              </Text>
              {skill.cases > 0 && (
                <Text className="skill-cases">你的案例：{skill.cases}个</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View className="history-section">
        <Text className="section-title">你的历史表现</Text>
        <View className="history-stats">
          <View className="stat-item">
            <Text className="stat-value">{result.studentHistory.totalCompleted}</Text>
            <Text className="stat-label">完成项目</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{result.studentHistory.avgRating.toFixed(1)}</Text>
            <Text className="stat-label">平均评分</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{result.studentHistory.avgCompletionDays.toFixed(1)}</Text>
            <Text className="stat-label">平均天数</Text>
          </View>
        </View>
      </View>

      {result.suggestions.length > 0 && (
        <View className="suggestions-section">
          <Text className="section-title">改进建议</Text>
          {result.suggestions.map((suggestion, index) => (
            <View key={index} className="suggestion-item">
              <Text className="suggestion-icon">◇</Text>
              <Text className="suggestion-text">{suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="actions">
        {result.passed ? (
          <>
            <Button className="primary-btn" onClick={handleStartProject}>
              我准备好了，开始项目
            </Button>
            <Button className="secondary-btn" onClick={handlePrepareMore}>
              我再想想
            </Button>
          </>
        ) : (
          <>
            <Button className="secondary-btn" onClick={handlePrepareMore}>
              我需要再准备准备
            </Button>
            <Button className="text-btn" onClick={handleStartProject}>
              我想尝试挑战
            </Button>
          </>
        )}
      </View>
    </View>
  )
}
