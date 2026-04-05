import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { getGrowthTimeline } from '../../services/api'
import './index.scss'

interface TimelineItem {
  id: number
  type: 'task' | 'level' | 'ability' | 'achievement'
  title: string
  description: string
  date: string
  icon: string
  color: string
}

export default function Timeline() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
  }, [])

  const loadTimeline = async () => {
    try {
      const res = await getGrowthTimeline()
      if (res.success) {
        setTimeline(res.data)
      } else {
        setTimeline(getMockTimeline())
      }
    } catch (error) {
      setTimeline(getMockTimeline())
    } finally {
      setLoading(false)
    }
  }

  const getMockTimeline = (): TimelineItem[] => {
    return [
      {
        id: 1,
        type: 'level',
        title: '等级提升',
        description: '恭喜你升级到 Lv.3！解锁更多高级任务',
        date: '2024-01-15 14:30',
        icon: '★',
        color: '#FFE082'
      },
      {
        id: 2,
        type: 'task',
        title: '完成任务',
        description: '成功完成「品牌Logo设计」，获得 ¥800 收入',
        date: '2024-01-14 16:20',
        icon: '✓',
        color: '#D4F291'
      },
      {
        id: 3,
        type: 'ability',
        title: '能力提升',
        description: '创意能力 +5，当前 85 分',
        date: '2024-01-14 16:25',
        icon: '◐',
        color: '#F9C6D9'
      },
      {
        id: 4,
        type: 'achievement',
        title: '解锁成就',
        description: '获得「初出茅庐」成就徽章',
        date: '2024-01-13 10:15',
        icon: '◎',
        color: '#A8D8EA'
      },
      {
        id: 5,
        type: 'task',
        title: '接受任务',
        description: '开始执行「小程序开发」任务',
        date: '2024-01-12 09:00',
        icon: '⊞',
        color: '#D4F291'
      },
      {
        id: 6,
        type: 'task',
        title: '完成任务',
        description: '成功完成「文案撰写」，获得 ¥500 收入',
        date: '2024-01-10 18:45',
        icon: '✓',
        color: '#D4F291'
      },
      {
        id: 7,
        type: 'ability',
        title: '能力提升',
        description: '沟通能力 +3，当前 90 分',
        date: '2024-01-10 18:50',
        icon: '◐',
        color: '#F9C6D9'
      },
      {
        id: 8,
        type: 'level',
        title: '等级提升',
        description: '恭喜你升级到 Lv.2！',
        date: '2024-01-08 20:00',
        icon: '★',
        color: '#FFE082'
      },
      {
        id: 9,
        type: 'task',
        title: '完成任务',
        description: '成功完成「数据分析报告」，获得 ¥600 收入',
        date: '2024-01-07 15:30',
        icon: '✓',
        color: '#D4F291'
      },
      {
        id: 10,
        type: 'achievement',
        title: '解锁成就',
        description: '获得「新手上路」成就徽章',
        date: '2024-01-05 12:00',
        icon: '◎',
        color: '#A8D8EA'
      }
    ]
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      task: '任务',
      level: '等级',
      ability: '能力',
      achievement: '成就'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <View className="timeline-page">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  return (
    <View className="timeline-page">
      <View className="header">
        <Text className="title">成长时间线</Text>
        <Text className="subtitle">记录你的每一步成长</Text>
      </View>

      <ScrollView className="timeline-container" scrollY>
        <View className="timeline-list">
          {timeline.map((item, index) => (
            <View key={item.id} className="timeline-item">
              <View className="timeline-dot" style={{ backgroundColor: item.color }}>
                <Text className="dot-icon">{item.icon}</Text>
              </View>
              {index < timeline.length - 1 && <View className="timeline-line" />}

              <View className="timeline-content">
                <View className="content-header">
                  <Text className="type-tag" style={{ backgroundColor: item.color }}>
                    {getTypeLabel(item.type)}
                  </Text>
                  <Text className="date">{item.date}</Text>
                </View>
                <Text className="content-title">{item.title}</Text>
                <Text className="content-desc">{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {timeline.length === 0 && (
          <View className="empty">
            <Text className="empty-text">还没有成长记录</Text>
            <Text className="empty-hint">完成任务后会自动记录你的成长轨迹</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
