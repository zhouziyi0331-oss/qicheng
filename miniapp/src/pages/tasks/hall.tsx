import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './hall.scss'

interface Task {
  id: string
  title: string
  description: string
  requiredLevel: number
  currentUserLevel: number
  price: number
  deadline: string
  company: {
    name: string
    avatar: string
  }
  skills: string[]
  matchScore?: number
  matchReason?: string
  isChallenge?: boolean
}

export default function TaskHall() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [userLevel, setUserLevel] = useState(0)
  const [userTrack, setUserTrack] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUserInfo()
    loadTasks()
  }, [])

  const loadUserInfo = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/user/profile',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setUserLevel(res.data.data.current_level || 0)
        setUserTrack(res.data.data.track || '')
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
      setUserLevel(3)
      setUserTrack('AI内容创作')
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/tasks/matched',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setTasks(res.data.data)
      } else {
        throw new Error('加载失败')
      }
    } catch (error) {
      console.error('加载任务失败:', error)

      // 使用模拟数据
      const mockTasks: Task[] = [
        {
          id: 't1',
          title: '电商小程序UI设计',
          description: '需要设计一个潮流电商小程序的完整UI界面，包括首页、商品详情、购物车等页面',
          requiredLevel: 3,
          currentUserLevel: 3,
          price: 1200,
          deadline: '2026-06-15',
          company: {
            name: '潮流科技',
            avatar: 'https://via.placeholder.com/100'
          },
          skills: ['Figma', 'UI设计', '交互设计'],
          matchScore: 92,
          matchReason: '你的UI设计能力和视觉表达能力非常匹配这个项目',
          isChallenge: false
        },
        {
          id: 't2',
          title: '企业官网前端开发',
          description: '开发一个企业官网，需要响应式设计，支持PC和移动端',
          requiredLevel: 3,
          currentUserLevel: 3,
          price: 2000,
          deadline: '2026-06-20',
          company: {
            name: '创新企业',
            avatar: 'https://via.placeholder.com/100'
          },
          skills: ['React', 'TypeScript', '响应式设计'],
          matchScore: 85,
          matchReason: '你的前端开发经验和技术栈很适合',
          isChallenge: false
        },
        {
          id: 't3',
          title: 'AI写作助手产品设计',
          description: '设计一个AI写作助手的产品原型，包括功能规划和交互设计',
          requiredLevel: 4,
          currentUserLevel: 3,
          price: 3000,
          deadline: '2026-06-25',
          company: {
            name: 'AI创新',
            avatar: 'https://via.placeholder.com/100'
          },
          skills: ['产品设计', 'AI应用', '用户体验'],
          matchScore: 78,
          matchReason: '这是一个挑战项目，可以提升你的产品设计能力',
          isChallenge: true
        }
      ]

      setTasks(mockTasks)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTasks()
    setRefreshing(false)
    
    Taro.showToast({
      title: 'AI重新匹配完成',
      icon: 'success'
    })
  }

  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({
      url: `/pages/tasks/detail?id=${taskId}`
    })
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) return '已截止'
    if (days === 0) return '今天截止'
    if (days === 1) return '明天截止'
    return `${days}天后截止`
  }

  return (
    <View className="task-hall-page">
      <View className="page-header">
        <View className="header-info">
          <Text className="header-title">项目大厅</Text>
          <Text className="header-subtitle">
            {userTrack} · Lv.{userLevel}
          </Text>
        </View>
        <View className="refresh-btn" onClick={handleRefresh}>
          <Text className={`refresh-icon ${refreshing ? 'rotating' : ''}`}>🔄</Text>
        </View>
      </View>

      <ScrollView className="tasks-scroll" scrollY>
        {loading ? (
          <View className="loading-state">
            <Text className="loading-text">AI正在为你匹配项目...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📭</Text>
            <Text className="empty-text">暂无匹配项目</Text>
            <Text className="empty-hint">完成更多任务提升等级后会有更多项目</Text>
          </View>
        ) : (
          <View className="tasks-list">
            {/* 常规匹配项目 */}
            {tasks.filter(t => !t.isChallenge).map(task => (
              <View
                key={task.id}
                className="task-card"
                onClick={() => handleTaskClick(task.id)}
              >
                <View className="task-header">
                  <Image className="company-avatar" src={task.company.avatar} />
                  <View className="company-info">
                    <Text className="company-name">{task.company.name}</Text>
                    <Text className="task-deadline">{formatDeadline(task.deadline)}</Text>
                  </View>
                  <View className="level-badge">
                    <Text className="level-text">Lv.{task.requiredLevel}</Text>
                  </View>
                </View>

                <Text className="task-title">{task.title}</Text>
                <Text className="task-description">{task.description}</Text>

                <View className="task-skills">
                  {task.skills.map((skill, index) => (
                    <Text key={index} className="skill-tag">{skill}</Text>
                  ))}
                </View>

                {task.matchScore && (
                  <View className="match-section">
                    <View className="match-score-bar">
                      <View className="score-fill" style={{ width: `${task.matchScore}%` }} />
                      <Text className="score-text">{task.matchScore}% 匹配</Text>
                    </View>
                    <Text className="match-reason">💡 {task.matchReason}</Text>
                  </View>
                )}

                <View className="task-footer">
                  <View className="price-info">
                    <Text className="price-label">报酬</Text>
                    <Text className="price-value">¥{task.price}</Text>
                  </View>
                  <View className="apply-btn">
                    <Text className="apply-text">查看详情</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* 挑战项目 */}
            {tasks.filter(t => t.isChallenge).length > 0 && (
              <View className="challenge-section">
                <View className="section-header">
                  <Text className="section-icon">🔥</Text>
                  <Text className="section-title">挑战项目</Text>
                  <Text className="section-subtitle">完成可快速提升等级</Text>
                </View>

                {tasks.filter(t => t.isChallenge).map(task => (
                  <View
                    key={task.id}
                    className="task-card challenge"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <View className="challenge-badge">
                      <Text className="badge-text">挑战</Text>
                    </View>

                    <View className="task-header">
                      <Image className="company-avatar" src={task.company.avatar} />
                      <View className="company-info">
                        <Text className="company-name">{task.company.name}</Text>
                        <Text className="task-deadline">{formatDeadline(task.deadline)}</Text>
                      </View>
                      <View className="level-badge challenge">
                        <Text className="level-text">Lv.{task.requiredLevel}</Text>
                      </View>
                    </View>

                    <Text className="task-title">{task.title}</Text>
                    <Text className="task-description">{task.description}</Text>

                    <View className="task-skills">
                      {task.skills.map((skill, index) => (
                        <Text key={index} className="skill-tag">{skill}</Text>
                      ))}
                    </View>

                    {task.matchScore && (
                      <View className="match-section">
                        <View className="match-score-bar">
                          <View className="score-fill" style={{ width: `${task.matchScore}%` }} />
                          <Text className="score-text">{task.matchScore}% 匹配</Text>
                        </View>
                        <Text className="match-reason">💡 {task.matchReason}</Text>
                      </View>
                    )}

                    <View className="task-footer">
                      <View className="price-info">
                        <Text className="price-label">报酬</Text>
                        <Text className="price-value">¥{task.price}</Text>
                      </View>
                      <View className="apply-btn challenge">
                        <Text className="apply-text">接受挑战</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
