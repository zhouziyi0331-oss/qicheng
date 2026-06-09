import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { mentorStageAPI } from '../../services/api'
import './index.scss'

interface TimelineEvent {
  id: string
  studentId: string
  eventType: 'task_completed' | 'challenge_accepted' | 'challenge_completed' |
              'pattern_identified' | 'pattern_overcome' | 'belief_shift' |
              'milestone_reached' | 'mentor_interaction'
  title: string
  description: string
  details?: string
  metadata?: {
    taskName?: string
    challengeName?: string
    patternType?: string
    oldBelief?: string
    newBelief?: string
    score?: number
    [key: string]: any
  }
  occurredAt: string
  importance: 'low' | 'medium' | 'high'
}

interface TimelineGroup {
  date: string
  events: TimelineEvent[]
}

const EVENT_TYPE_CONFIG = {
  task_completed: { name: '完成任务', icon: '✅', color: '#10B981' },
  challenge_accepted: { name: '接受挑战', icon: '🎯', color: '#3B82F6' },
  challenge_completed: { name: '完成挑战', icon: '🏆', color: '#F59E0B' },
  pattern_identified: { name: '识别模式', icon: '🔍', color: '#8B5CF6' },
  pattern_overcome: { name: '克服模式', icon: '💪', color: '#EC4899' },
  belief_shift: { name: '信念转变', icon: '🧠', color: '#6366F1' },
  milestone_reached: { name: '达成里程碑', icon: '🎉', color: '#EF4444' },
  mentor_interaction: { name: '导师互动', icon: '💬', color: '#14B8A6' }
}

const IMPORTANCE_CONFIG = {
  low: { label: '普通', color: '#9CA3AF' },
  medium: { label: '重要', color: '#F59E0B' },
  high: { label: '关键', color: '#EF4444' }
}

export default function GrowthTimeline() {
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadTimeline()
  }, [filterType])

  const loadTimeline = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.id) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const response = await mentorStageAPI.getGrowthTimeline(userInfo.id, filterType)
      if (response.success) {
        const grouped = groupEventsByDate(response.data || [])
        setTimelineGroups(grouped)
      }
    } catch (error: any) {
      console.error('加载时间线失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const groupEventsByDate = (events: TimelineEvent[]): TimelineGroup[] => {
    const groups: { [key: string]: TimelineEvent[] } = {}

    events.forEach(event => {
      const date = new Date(event.occurredAt)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })

    return Object.entries(groups)
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    if (dateKey === todayKey) return '今天'
    if (dateKey === yesterdayKey) return '昨天'

    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event)
    setShowDetail(true)
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setSelectedEvent(null)
  }

  if (loading) {
    return (
      <View className='growth-timeline-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='growth-timeline-page'>
      {/* 筛选器 */}
      <View className='filter-section'>
        <ScrollView className='filter-scroll' scrollX>
          <View className='filter-list'>
            <View
              className={`filter-item ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              <Text className='filter-text'>全部</Text>
            </View>
            {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
              <View
                key={type}
                className={`filter-item ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                <Text className='filter-icon'>{config.icon}</Text>
                <Text className='filter-text'>{config.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 时间线 */}
      <ScrollView className='timeline-scroll' scrollY>
        {timelineGroups.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>📅</Text>
            <Text className='empty-text'>暂无记录</Text>
            <Text className='empty-hint'>开始你的成长之旅，记录每一个精彩瞬间</Text>
          </View>
        ) : (
          <View className='timeline-container'>
            {timelineGroups.map((group, groupIndex) => (
              <View key={group.date} className='timeline-group'>
                <View className='date-header'>
                  <Text className='date-text'>{formatDate(group.date)}</Text>
                  <View className='date-line' />
                </View>

                <View className='events-list'>
                  {group.events.map((event, eventIndex) => {
                    const typeConfig = EVENT_TYPE_CONFIG[event.eventType]
                    const importanceConfig = IMPORTANCE_CONFIG[event.importance]
                    const isLast = groupIndex === timelineGroups.length - 1 &&
                                   eventIndex === group.events.length - 1

                    return (
                      <View
                        key={event.id}
                        className='timeline-item'
                        onClick={() => handleEventClick(event)}
                      >
                        <View className='timeline-line-wrapper'>
                          <View
                            className='timeline-dot'
                            style={{ backgroundColor: typeConfig.color }}
                          >
                            <Text className='dot-icon'>{typeConfig.icon}</Text>
                          </View>
                          {!isLast && <View className='timeline-line' />}
                        </View>

                        <View className='event-card'>
                          <View className='event-header'>
                            <View className='event-title-wrapper'>
                              <Text className='event-type'>{typeConfig.name}</Text>
                              {event.importance !== 'low' && (
                                <View
                                  className='importance-badge'
                                  style={{ backgroundColor: importanceConfig.color }}
                                >
                                  <Text className='importance-text'>{importanceConfig.label}</Text>
                                </View>
                              )}
                            </View>
                            <Text className='event-time'>{formatTime(event.occurredAt)}</Text>
                          </View>

                          <Text className='event-title'>{event.title}</Text>
                          <Text className='event-desc'>{event.description}</Text>

                          {event.metadata && (
                            <View className='event-metadata'>
                              {event.metadata.score !== undefined && (
                                <View className='metadata-item'>
                                  <Text className='metadata-label'>评分：</Text>
                                  <Text className='metadata-value'>{event.metadata.score}分</Text>
                                </View>
                              )}
                              {event.metadata.taskName && (
                                <View className='metadata-item'>
                                  <Text className='metadata-label'>任务：</Text>
                                  <Text className='metadata-value'>{event.metadata.taskName}</Text>
                                </View>
                              )}
                              {event.metadata.challengeName && (
                                <View className='metadata-item'>
                                  <Text className='metadata-label'>挑战：</Text>
                                  <Text className='metadata-value'>{event.metadata.challengeName}</Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 事件详情弹窗 */}
      {showDetail && selectedEvent && (
        <View className='detail-modal' onClick={handleCloseDetail}>
          <View className='detail-content' onClick={(e) => e.stopPropagation()}>
            <View className='detail-header'>
              <View
                className='detail-icon'
                style={{ backgroundColor: EVENT_TYPE_CONFIG[selectedEvent.eventType].color + '20' }}
              >
                <Text className='icon-text'>
                  {EVENT_TYPE_CONFIG[selectedEvent.eventType].icon}
                </Text>
              </View>
              <View className='detail-header-info'>
                <Text className='detail-type'>
                  {EVENT_TYPE_CONFIG[selectedEvent.eventType].name}
                </Text>
                <Text className='detail-time'>
                  {formatDate(selectedEvent.occurredAt)} {formatTime(selectedEvent.occurredAt)}
                </Text>
              </View>
            </View>

            <ScrollView className='detail-scroll' scrollY>
              <View className='detail-section'>
                <Text className='detail-title'>{selectedEvent.title}</Text>
                <Text className='detail-description'>{selectedEvent.description}</Text>
              </View>

              {selectedEvent.details && (
                <View className='detail-section'>
                  <Text className='section-label'>详细信息</Text>
                  <Text className='section-text'>{selectedEvent.details}</Text>
                </View>
              )}

              {selectedEvent.metadata && (
                <View className='detail-section'>
                  <Text className='section-label'>相关数据</Text>
                  <View className='metadata-grid'>
                    {Object.entries(selectedEvent.metadata).map(([key, value]) => {
                      if (value === undefined || value === null) return null

                      const labels = {
                        taskName: '任务名称',
                        challengeName: '挑战名称',
                        patternType: '模式类型',
                        oldBelief: '旧信念',
                        newBelief: '新信念',
                        score: '评分'
                      }

                      return (
                        <View key={key} className='metadata-row'>
                          <Text className='metadata-key'>{labels[key] || key}：</Text>
                          <Text className='metadata-val'>{String(value)}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}
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
