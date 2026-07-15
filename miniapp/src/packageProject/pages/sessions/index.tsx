import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import './index.scss'

interface Session {
  id: string;
  course: {
    name: string;
  };
  career: {
    name: string;
  };
  statusText: string;
  progress: number;
  currentStage: string;
  lastActivityTime: string;
  iterationCount: number;
  completedAt?: string;
}

type FilterType = 'all' | 'inProgress' | 'completed'

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const token = tokenManager.getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      const res = await Taro.request({
        url: getApiUrl('/api/v1/sessions'),
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setSessions(res.data.data.sessions || [])
      }
    } catch (error) {
      console.error('加载会话失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filterType: FilterType) => {
    setFilter(filterType)
  }

  const openSession = (sessionId: string) => {
    Taro.navigateTo({
      url: `/pages/pbl-project-detail/index?projectId=${sessionId}`
    })
  }

  const deleteSession = (sessionId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个项目吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const token = tokenManager.getAccessToken()
            await Taro.request({
              url: `/api/v1/sessions/${sessionId}`,
              method: 'DELETE',
              header: {
                'Authorization': `Bearer ${token}`
              }
            })
            Taro.showToast({ title: '删除成功', icon: 'success' })
            loadSessions()
          } catch (error) {
            console.error('删除失败:', error)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    if (filter === 'inProgress') return !session.completedAt
    if (filter === 'completed') return !!session.completedAt
    return true
  })

  if (loading) {
    return (
      <View className="sessions-page">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  return (
    <View className="sessions-page">
      {/* 顶部筛选 */}
      <View className="filter-bar">
        <View
          className={`filter-item ${filter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          <Text>全部</Text>
        </View>
        <View
          className={`filter-item ${filter === 'inProgress' ? 'active' : ''}`}
          onClick={() => handleFilterChange('inProgress')}
        >
          <Text>进行中</Text>
        </View>
        <View
          className={`filter-item ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => handleFilterChange('completed')}
        >
          <Text>已完成</Text>
        </View>
      </View>

      {/* 会话列表 */}
      {filteredSessions.length > 0 ? (
        <View className="sessions-list">
          {filteredSessions.map(session => (
            <View key={session.id} className="session-card">
              <View className="session-main" onClick={() => openSession(session.id)}>
                <View className="session-header">
                  <Text className="session-title">{session.course.name}</Text>
                  <View className={`session-badge ${session.completedAt ? 'completed' : 'in-progress'}`}>
                    {session.statusText}
                  </View>
                </View>
                <Text className="session-career">{session.career.name}</Text>
                <View className="session-progress">
                  <View className="progress-bar">
                    <View className="progress-fill" style={{ width: `${session.progress}%` }} />
                  </View>
                  <Text className="progress-text">{session.currentStage}</Text>
                </View>
                <View className="session-footer">
                  <Text className="session-time">{session.lastActivityTime}</Text>
                  <Text className="session-iterations">○ {session.iterationCount} 次迭代</Text>
                </View>
              </View>
              <View className="session-actions">
                <Button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                >
                  删除
                </Button>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="empty">
          <Text className="empty-icon">●</Text>
          <Text className="empty-text">还没有项目</Text>
        </View>
      )}
    </View>
  )
}
