import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { mentorStageAPI } from '../../../services/api'
import './index.scss'

interface GrowthChallenge {
  id: string
  studentId: string
  challengeType: 'skill_building' | 'mindset_shift' | 'habit_formation' | 'fear_facing' | 'exploration'
  title: string
  description: string
  reasoning: string
  suggestedSteps: string[]
  expectedOutcome: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedDays: number
  status: 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'declined'
  progress: number
  proposedAt: string
  acceptedAt?: string
  completedAt?: string
}

interface ChallengeStats {
  total: number
  completed: number
  inProgress: number
  proposed: number
}

const CHALLENGE_TYPES = {
  skill_building: { name: '技能提升', icon: '目标', color: '#3B82F6' },
  mindset_shift: { name: '思维转变', icon: '●', color: '#8B5CF6' },
  habit_formation: { name: '习惯养成', icon: '▲', color: '#10B981' },
  fear_facing: { name: '面对恐惧', icon: '能力', color: '#EF4444' },
  exploration: { name: '探索尝试', icon: '启动', color: '#F59E0B' }
}

const STATUS_CONFIG = {
  proposed: { label: '待接受', color: '#6B7280' },
  accepted: { label: '已接受', color: '#3B82F6' },
  in_progress: { label: '进行中', color: '#F59E0B' },
  completed: { label: '已完成', color: '#10B981' },
  declined: { label: '已拒绝', color: '#EF4444' }
}

const DIFFICULTY_CONFIG = {
  easy: { label: '简单', color: '#10B981' },
  medium: { label: '中等', color: '#F59E0B' },
  hard: { label: '困难', color: '#EF4444' }
}

type TabType = 'all' | 'proposed' | 'in_progress' | 'completed'

export default function GrowthChallenges() {
  const [challenges, setChallenges] = useState<GrowthChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedChallenge, setSelectedChallenge] = useState<GrowthChallenge | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.id) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const response = await mentorStageAPI.getGrowthChallenges(userInfo.id)
      if (response.success) {
        setChallenges(response.data || [])
      }
    } catch (error: any) {
      console.error('加载成长挑战失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleChallengeClick = (challenge: GrowthChallenge) => {
    setSelectedChallenge(challenge)
    setShowDetail(true)

    // 如果是已完成的挑战，提示查看报告
    if (challenge.status === 'completed') {
      Taro.showModal({
        title: '✦ 挑战已完成',
        content: '恭喜完成挑战！想查看成长报告吗？',
        confirmText: '查看报告',
        cancelText: '稍后查看',
        success: (res) => {
          if (res.confirm) {
            // 跳转到导师报告页面
            Taro.navigateTo({
              url: '/pages/mentor-reports/index'
            })
          }
        }
      })
    }
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setSelectedChallenge(null)
  }

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      Taro.showLoading({ title: '接受中...' })
      const response = await mentorStageAPI.acceptChallenge(challengeId)
      if (response.success) {
        Taro.showToast({ title: '挑战已接受！开始你的成长之旅吧 启动', icon: 'success', duration: 2000 })
        handleCloseDetail()
        loadChallenges()
      } else {
        throw new Error(response.message || '接受失败')
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
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

  const getFilteredChallenges = () => {
    switch (activeTab) {
      case 'proposed':
        return challenges.filter(c => c.status === 'proposed')
      case 'in_progress':
        return challenges.filter(c => c.status === 'in_progress' || c.status === 'accepted')
      case 'completed':
        return challenges.filter(c => c.status === 'completed')
      default:
        return challenges.filter(c => c.status !== 'declined')
    }
  }

  const getStats = (): ChallengeStats => {
    const total = challenges.filter(c => c.status !== 'declined').length
    const completed = challenges.filter(c => c.status === 'completed').length
    const inProgress = challenges.filter(c => c.status === 'in_progress' || c.status === 'accepted').length
    const proposed = challenges.filter(c => c.status === 'proposed').length

    return { total, completed, inProgress, proposed }
  }

  const stats = getStats()
  const filteredChallenges = getFilteredChallenges()

  if (loading) {
    return (
      <View className='growth-challenges-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='growth-challenges-page'>
      {/* 顶部统计 */}
      <View className='stats-header'>
        <View className='stat-item'>
          <Text className='stat-value'>{stats.total}</Text>
          <Text className='stat-label'>总挑战</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#10B981' }}>{stats.completed}</Text>
          <Text className='stat-label'>已完成</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#F59E0B' }}>{stats.inProgress}</Text>
          <Text className='stat-label'>进行中</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#667eea' }}>{stats.proposed}</Text>
          <Text className='stat-label'>待接受</Text>
        </View>
      </View>

      {/* Tab切换 */}
      <View className='tabs'>
        <View
          className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Text className='tab-text'>全部</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'proposed' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposed')}
        >
          <Text className='tab-text'>待接受</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
        >
          <Text className='tab-text'>进行中</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <Text className='tab-text'>已完成</Text>
        </View>
      </View>

      {/* 挑战列表 */}
      <ScrollView className='challenges-scroll' scrollY>
        {filteredChallenges.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>目标</Text>
            <Text className='empty-text'>暂无挑战</Text>
            <Text className='empty-hint'>继续和导师对话，我会为你推荐合适的成长挑战</Text>
          </View>
        ) : (
          <View className='challenges-list'>
            {filteredChallenges.map(challenge => {
              const typeInfo = CHALLENGE_TYPES[challenge.challengeType]
              const statusInfo = STATUS_CONFIG[challenge.status]

              return (
                <View
                  key={challenge.id}
                  className='challenge-card'
                  onClick={() => handleChallengeClick(challenge)}
                >
                  <View className='challenge-header'>
                    <View className='challenge-icon' style={{ backgroundColor: typeInfo.color + '20' }}>
                      <Text className='icon-text'>{typeInfo.icon}</Text>
                    </View>
                    <View className='challenge-info'>
                      <Text className='challenge-title'>{challenge.title}</Text>
                      <Text
                        className='challenge-type'
                        style={{ backgroundColor: typeInfo.color }}
                      >
                        {typeInfo.name}
                      </Text>
                    </View>
                    <View
                      className='status-badge'
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      <Text className='status-text'>{statusInfo.label}</Text>
                    </View>
                  </View>

                  <Text className='challenge-desc'>{challenge.description}</Text>

                  <View className='challenge-reason'>
                    <Text className='reason-label'>想法 推荐理由：</Text>
                    <Text className='reason-text'>{challenge.reasoning}</Text>
                  </View>

                  {(challenge.status === 'in_progress' || challenge.status === 'accepted') && (
                    <View className='challenge-progress'>
                      <View className='progress-info'>
                        <Text className='progress-label'>完成进度</Text>
                        <Text className='progress-value'>{challenge.progress}%</Text>
                      </View>
                      <View className='progress-bar'>
                        <View
                          className='progress-fill'
                          style={{ width: `${challenge.progress}%` }}
                        />
                      </View>
                    </View>
                  )}

                  <View className='challenge-footer'>
                    <Text className='proposed-time'>
                      {challenge.status === 'proposed' ? '推荐于' : '开始于'} {formatDate(challenge.proposedAt)}
                    </Text>
                    {challenge.status === 'proposed' && (
                      <View
                        className='action-button'
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAcceptChallenge(challenge.id)
                        }}
                      >
                        <Text className='button-text'>接受挑战</Text>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 详情弹窗 */}
      {showDetail && selectedChallenge && (
        <View className='detail-modal' onClick={handleCloseDetail}>
          <View className='detail-content' onClick={(e) => e.stopPropagation()}>
            <View className='detail-header'>
              <Text className='detail-icon'>
                {CHALLENGE_TYPES[selectedChallenge.challengeType].icon}
              </Text>
              <Text className='detail-title'>{selectedChallenge.title}</Text>
              <View
                className='detail-status'
                style={{ backgroundColor: STATUS_CONFIG[selectedChallenge.status].color }}
              >
                <Text className='status-text'>
                  {STATUS_CONFIG[selectedChallenge.status].label}
                </Text>
              </View>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>列表 挑战描述</Text>
              <Text className='section-text'>{selectedChallenge.description}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>想法 推荐理由</Text>
              <Text className='section-text'>{selectedChallenge.reasoning}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>目标 建议步骤</Text>
              {selectedChallenge.suggestedSteps.map((step, index) => (
                <View key={index} className='step-item'>
                  <View className='step-number'>
                    <Text className='number-text'>{index + 1}</Text>
                  </View>
                  <Text className='step-text'>{step}</Text>
                </View>
              ))}
            </View>

            <View className='detail-section'>
              <Text className='section-title'>✦ 预期成果</Text>
              <Text className='section-text'>{selectedChallenge.expectedOutcome}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>●️ 预计时长</Text>
              <Text className='section-text'>{selectedChallenge.estimatedDays} 天</Text>
            </View>

            <View className='detail-footer'>
              <View
                className='footer-button secondary'
                onClick={handleCloseDetail}
              >
                <Text className='button-text'>关闭</Text>
              </View>
              {selectedChallenge.status === 'proposed' && (
                <View
                  className='footer-button primary'
                  onClick={() => handleAcceptChallenge(selectedChallenge.id)}
                >
                  <Text className='button-text'>接受挑战</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
