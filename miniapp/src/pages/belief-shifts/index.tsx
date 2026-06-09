import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { mentorStageAPI } from '../../services/api'
import './index.scss'

interface BeliefShift {
  id: string
  studentId: string
  oldBelief: string
  newBelief: string
  triggerEvent: string
  shiftProgress: number
  evidenceOfChange: string[]
  reinforcementNeeded: string[]
  recordedAt: string
  lastUpdatedAt: string
}

interface ShiftStats {
  total: number
  completed: number
  inProgress: number
  recent: number
}

export default function BeliefShifts() {
  const [shifts, setShifts] = useState<BeliefShift[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShift, setSelectedShift] = useState<BeliefShift | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    loadBeliefShifts()
  }, [])

  const loadBeliefShifts = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.id) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const response = await mentorStageAPI.getBeliefShifts(userInfo.id)
      if (response.success) {
        setShifts(response.data || [])
      }
    } catch (error: any) {
      console.error('加载信念转变失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleShiftClick = (shift: BeliefShift) => {
    setSelectedShift(shift)
    setShowDetail(true)
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setSelectedShift(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return `${Math.floor(days / 30)}个月前`
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#10B981'
    if (progress >= 50) return '#F59E0B'
    return '#EF4444'
  }

  const getProgressLabel = (progress: number) => {
    if (progress >= 80) return '已巩固'
    if (progress >= 50) return '转变中'
    return '刚开始'
  }

  const getStats = (): ShiftStats => {
    const total = shifts.length
    const completed = shifts.filter(s => s.shiftProgress >= 80).length
    const inProgress = shifts.filter(s => s.shiftProgress >= 50 && s.shiftProgress < 80).length
    const recent = shifts.filter(s => {
      const days = Math.floor((new Date().getTime() - new Date(s.recordedAt).getTime()) / (1000 * 60 * 60 * 24))
      return days <= 7
    }).length

    return { total, completed, inProgress, recent }
  }

  const stats = getStats()

  if (loading) {
    return (
      <View className='belief-shifts-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='belief-shifts-page'>
      {/* 顶部统计 */}
      <View className='stats-header'>
        <View className='stat-item'>
          <Text className='stat-value'>{stats.total}</Text>
          <Text className='stat-label'>信念转变</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#10B981' }}>{stats.completed}</Text>
          <Text className='stat-label'>已巩固</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#F59E0B' }}>{stats.inProgress}</Text>
          <Text className='stat-label'>转变中</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#667eea' }}>{stats.recent}</Text>
          <Text className='stat-label'>本周新增</Text>
        </View>
      </View>

      {/* 信念转变列表 */}
      <ScrollView className='shifts-scroll' scrollY>
        {shifts.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>💭</Text>
            <Text className='empty-text'>暂无信念转变记录</Text>
            <Text className='empty-hint'>继续和导师对话，我会帮你识别并转变限制性信念</Text>
          </View>
        ) : (
          <View className='shifts-list'>
            {shifts.map(shift => (
              <View
                key={shift.id}
                className='shift-card'
                onClick={() => handleShiftClick(shift)}
              >
                {/* 进度条 */}
                <View className='progress-header'>
                  <View className='progress-info'>
                    <Text className='progress-label'>{getProgressLabel(shift.shiftProgress)}</Text>
                    <Text className='progress-value'>{shift.shiftProgress}%</Text>
                  </View>
                  <View className='progress-bar'>
                    <View
                      className='progress-fill'
                      style={{
                        width: `${shift.shiftProgress}%`,
                        backgroundColor: getProgressColor(shift.shiftProgress)
                      }}
                    />
                  </View>
                </View>

                {/* 旧信念 */}
                <View className='belief-section old-belief'>
                  <View className='belief-header'>
                    <Text className='belief-icon'>❌</Text>
                    <Text className='belief-title'>限制性信念</Text>
                  </View>
                  <Text className='belief-text'>{shift.oldBelief}</Text>
                </View>

                {/* 箭头 */}
                <View className='arrow-section'>
                  <Text className='arrow-icon'>⬇️</Text>
                </View>

                {/* 新信念 */}
                <View className='belief-section new-belief'>
                  <View className='belief-header'>
                    <Text className='belief-icon'>✅</Text>
                    <Text className='belief-title'>成长型信念</Text>
                  </View>
                  <Text className='belief-text'>{shift.newBelief}</Text>
                </View>

                {/* 触发事件 */}
                <View className='trigger-section'>
                  <Text className='trigger-label'>💡 转变契机：</Text>
                  <Text className='trigger-text'>{shift.triggerEvent}</Text>
                </View>

                {/* 底部信息 */}
                <View className='shift-footer'>
                  <Text className='recorded-time'>开始转变：{formatDate(shift.recordedAt)}</Text>
                  <Text className='updated-time'>最近更新：{formatDate(shift.lastUpdatedAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 详情弹窗 */}
      {showDetail && selectedShift && (
        <View className='detail-modal' onClick={handleCloseDetail}>
          <View className='detail-content' onClick={(e) => e.stopPropagation()}>
            <View className='detail-header'>
              <Text className='detail-title'>信念转变详情</Text>
              <View
                className='detail-progress'
                style={{ color: getProgressColor(selectedShift.shiftProgress) }}
              >
                <Text className='progress-text'>{selectedShift.shiftProgress}%</Text>
              </View>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>❌ 限制性信念</Text>
              <Text className='section-text'>{selectedShift.oldBelief}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>✅ 成长型信念</Text>
              <Text className='section-text'>{selectedShift.newBelief}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>💡 转变契机</Text>
              <Text className='section-text'>{selectedShift.triggerEvent}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>🎯 转变证据</Text>
              {selectedShift.evidenceOfChange.length > 0 ? (
                selectedShift.evidenceOfChange.map((item, index) => (
                  <View key={index} className='evidence-item'>
                    <Text className='evidence-bullet'>•</Text>
                    <Text className='evidence-text'>{item}</Text>
                  </View>
                ))
              ) : (
                <Text className='section-text empty'>暂无转变证据</Text>
              )}
            </View>

            <View className='detail-section'>
              <Text className='section-title'>💪 巩固建议</Text>
              {selectedShift.reinforcementNeeded.length > 0 ? (
                selectedShift.reinforcementNeeded.map((item, index) => (
                  <View key={index} className='evidence-item'>
                    <Text className='evidence-bullet'>•</Text>
                    <Text className='evidence-text'>{item}</Text>
                  </View>
                ))
              ) : (
                <Text className='section-text empty'>暂无巩固建议</Text>
              )}
            </View>

            <View className='detail-footer'>
              <View
                className='close-button'
                onClick={handleCloseDetail}
              >
                <Text className='button-text'>知道了</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
