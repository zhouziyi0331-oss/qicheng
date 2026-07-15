import { View, Text, Button } from '@tarojs/components'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Loading from '../../../components/Loading'
import './skip-test.scss'

interface AvailableTest {
  targetLevel: number
  canApply: boolean
  reason?: string
}

export default function SkipTest() {
  const [loading, setLoading] = useState(true)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [currentSubLevel, setCurrentSubLevel] = useState(0)
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([])

  useEffect(() => {
    loadAvailableTests()
  }, [])

  const loadAvailableTests = async () => {
    try {
      setLoading(true)
      const token = tokenManager.getAccessToken()
      const res = await Taro.request({
        url: getApiUrl('/api/v1/student/available-skip-tests'),
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })
      if (res.data.success) {
        setCurrentLevel(res.data.data.currentLevel)
        setCurrentSubLevel(res.data.data.currentSubLevel)
        setAvailableTests(res.data.data.availableTests)
      }
    } catch (err) {
      console.error('加载跳级测试失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTest = async (targetLevel: number) => {
    try {
      Taro.showLoading({ title: '申请中...' })
      const token = tokenManager.getAccessToken()
      const res = await Taro.request({
        url: getApiUrl('/api/v1/student/apply-skip-test'),
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: { targetLevel }
      })
      Taro.hideLoading()
      if (res.data.success) {
        const { testId, questions } = res.data.data
        Taro.navigateTo({
          url: `/packageAdvanced/pages/level-up/test-questions?testId=${testId}&targetLevel=${targetLevel}&questions=${encodeURIComponent(JSON.stringify(questions))}`
        })
      } else {
        Taro.showToast({ title: res.data.message || '申请失败', icon: 'none' })
      }
    } catch (err) {
      Taro.hideLoading()
      console.error('申请测试失败:', err)
      Taro.showToast({ title: '网络错误', icon: 'none' })
    }
  }

  const getLevelName = (level: number) => {
    const names: any = {
      1: '入门者',
      2: '实践者',
      3: '熟练者',
      4: '专家',
      5: '大师'
    }
    return names[level] || '未知'
  }

  if (loading) {
    return <Loading text="正在加载..." />
  }

  return (
    <View className="skip-test-page">
      <View className="page-header">
        <Text className="page-title">跳级测试</Text>
        <View className="current-level-card">
          <Text className="current-label">你当前是</Text>
          <Text className="current-level">Lv.{currentLevel} {getLevelName(currentLevel)}</Text>
        </View>
      </View>

      <View className="tests-section">
        <Text className="section-title">你可以申请测试：</Text>
        {availableTests.map((test, index) => (
          <View key={index} className={`test-card ${test.canApply ? '' : 'disabled'}`}>
            <View className="test-header">
              <Text className="test-level">Lv.{test.targetLevel} {getLevelName(test.targetLevel)}</Text>
              {test.canApply && (
                <Text className="test-badge">可申请</Text>
              )}
            </View>
            <Text className="test-desc">通过即跳级到 Lv.{test.targetLevel}</Text>
            {test.reason && (
              <Text className="test-reason">{test.reason}</Text>
            )}
            <Button
              className={`apply-btn ${test.canApply ? '' : 'disabled'}`}
              onClick={() => test.canApply && handleApplyTest(test.targetLevel)}
              disabled={!test.canApply}
            >
              <Text className="btn-text">
                {test.canApply ? `申请 Lv.${test.targetLevel} 测试` : '暂不可申请'}
              </Text>
            </Button>
          </View>
        ))}
      </View>

      <View className="info-section">
        <Text className="info-title">说明</Text>
        <View className="info-item">
          <Text className="info-icon">✓</Text>
          <Text className="info-text">测试完全免费</Text>
        </View>
        <View className="info-item">
          <Text className="info-icon">✓</Text>
          <Text className="info-text">通过即跳级，失败无惩罚</Text>
        </View>
        <View className="info-item">
          <Text className="info-icon">✓</Text>
          <Text className="info-text">失败后完成2次常规任务即可再次申请</Text>
        </View>
        <View className="info-item">
          <Text className="info-icon">✓</Text>
          <Text className="info-text">每个级别5道题，答对80%即通过</Text>
        </View>
      </View>
    </View>
  )
}
