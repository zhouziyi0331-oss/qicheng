import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './hall.scss'

interface Task {
  id: string
  title: string
  description: string
  price: number
  deadline: string
  days: number
  urgency: 'urgent' | 'normal'
  category: string
  company: {
    name: string
    industry: string
    rating: number
    collaborations: number
  }
  slots: {
    total: number
    taken: number
  }
  countdown: number
}

export default function TaskHall() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [userStats] = useState({
    inProgress: 3,
    completed: 12,
    rating: 4.8
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      // 模拟数据
      const mockTasks: Task[] = [
        {
          id: 't1',
          title: '为青少年AI课程设计视觉化学习路径图',
          description: '需要将6个学习模块可视化，风格活泼、适合12-16岁学生，交付格式为可编辑的设计稿。',
          price: 800,
          deadline: '7天',
          days: 7,
          urgency: 'urgent',
          category: '视觉交互',
          company: {
            name: '晨曦教育科技',
            industry: '教育行业',
            rating: 4.9,
            collaborations: 8
          },
          slots: { total: 5, taken: 2 },
          countdown: 272
        },
        {
          id: 't2',
          title: '梳理社区运营的标准化流程文档',
          description: '将现有的社区运营经验整理成可复用的SOP文档，包含活动策划、成员管理、内容发布三个模块。',
          price: 500,
          deadline: '5天',
          days: 5,
          urgency: 'normal',
          category: '系统搭建',
          company: {
            name: '未来工坊创业社区',
            industry: '创业生态',
            rating: 0,
            collaborations: 0
          },
          slots: { total: 3, taken: 0 },
          countdown: 1394
        }
      ]
      setTasks(mockTasks)
    } catch (error) {
      console.error('加载任务失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setShowModal(true)
  }

  const handleConfirmAccept = () => {
    if (!selectedTask) return
    Taro.showToast({ title: '任务已接取', icon: 'success' })
    setShowModal(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedTask(null)
  }

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <View className="task-accept-page">
      {/* 顶部Banner */}
      <View className="page-banner">
        <View className="banner-glow banner-glow-1" />
        <View className="banner-glow banner-glow-2" />
        <View className="banner-content">
          <View className="banner-tag">
            <View className="tag-icon">□</View>
            <Text className="tag-text">任务广场</Text>
          </View>
          <Text className="banner-title">平台为你推荐了{'\n'}新任务</Text>
          <Text className="banner-subtitle">每次推送 1~2 个 · 限 3~5 人接 · 先到先得</Text>

          <View className="banner-stats">
            <View className="stat-item">
              <Text className="stat-value">{userStats.inProgress}</Text>
              <Text className="stat-label">进行中</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{userStats.completed}</Text>
              <Text className="stat-label">已完成</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{userStats.rating}</Text>
              <Text className="stat-label">评分</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="tasks-scroll">
        <View className="tasks-content">
          <View className="push-header">
            <View className="push-header-left">
              <View className="pulse-dot" />
              <Text className="push-title">刚刚推送 · {tasks.length} 个新任务</Text>
            </View>
            <Text className="push-subtitle">今日已推送 2 次</Text>
          </View>

          {loading ? (
            <View className="loading-state">
              <Text>加载中...</Text>
            </View>
          ) : (
            <View className="task-list">
              {tasks.map((task, index) => (
                <View
                  key={task.id}
                  className={`grab-card ${task.urgency}`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <View className={`urgency-bar ${task.urgency}`} />

                  <View className="grab-card-body">
                    <View className="task-badges">
                      <View className={`urgency-badge ${task.urgency}`}>
                        {task.urgency === 'urgent' && <View className="urgency-dot" />}
                        <Text>{task.urgency === 'urgent' ? '紧急' : '普通'}</Text>
                      </View>
                      <View className="category-badge">
                        <Text>{task.category}</Text>
                      </View>
                      <Text className="countdown-text">{formatCountdown(task.countdown)}</Text>
                    </View>

                    <View className="company-section">
                      <View className="company-avatar">
                        <Text className="avatar-letter">{task.company.name[0]}</Text>
                      </View>
                      <View className="company-info">
                        <Text className="company-name">{task.company.name}</Text>
                        <Text className="company-meta">
                          {task.company.industry}
                          {task.company.collaborations > 0 && ` · 已合作 ${task.company.collaborations} 次`}
                        </Text>
                      </View>
                      {task.company.rating > 0 && (
                        <View className="company-rating">
                          <Text className="rating-star">★</Text>
                          <Text className="rating-value">{task.company.rating}</Text>
                        </View>
                      )}
                    </View>

                    <Text className="task-title">{task.title}</Text>
                    <Text className="task-description">{task.description}</Text>

                    <View className="task-info-grid">
                      <View className="info-item">
                        <Text className="info-value">¥ {task.price}</Text>
                        <Text className="info-label">报酬</Text>
                      </View>
                      <View className="info-item">
                        <Text className="info-value">{task.days}天</Text>
                        <Text className="info-label">交付期</Text>
                      </View>
                      <View className="info-item">
                        <Text className="info-value taken">{task.slots.taken}/{task.slots.total}</Text>
                        <Text className="info-label">已接</Text>
                      </View>
                    </View>
                  </View>

                  <View className="grab-card-footer">
                    <View className="slot-indicators">
                      {Array.from({ length: task.slots.total }).map((_, idx) => (
                        <View
                          key={idx}
                          className={`slot-dot ${idx < task.slots.taken ? 'taken' : 'open'}`}
                        />
                      ))}
                      <Text className="slot-text">还剩 {task.slots.total - task.slots.taken} 个名额</Text>
                    </View>
                    <Button className="grab-btn" onClick={() => handleTaskClick(task)}>
                      立即接单
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 接单确认弹窗 */}
      {showModal && selectedTask && (
        <View className={`modal-overlay ${showModal ? 'show' : ''}`} onClick={handleCloseModal}>
          <View className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <View className="modal-handle" />
            <View className="modal-content">
              <Text className="modal-title">确认接单</Text>
              <Text className="modal-subtitle">请仔细确认任务信息后再操作</Text>

              <View className="task-summary-card">
                <Text className="summary-title">{selectedTask.title}</Text>
                <View className="summary-company">
                  <View className="summary-avatar">
                    <Text className="avatar-letter">{selectedTask.company.name[0]}</Text>
                  </View>
                  <Text className="summary-company-name">{selectedTask.company.name}</Text>
                </View>
                <View className="summary-info-grid">
                  <View className="summary-info-item">
                    <Text className="summary-info-value">¥ {selectedTask.price}</Text>
                    <Text className="summary-info-label">报酬</Text>
                  </View>
                  <View className="summary-info-item">
                    <Text className="summary-info-value">{selectedTask.days}天</Text>
                    <Text className="summary-info-label">交付期</Text>
                  </View>
                  <View className="summary-info-item">
                    <Text className="summary-info-value">7月19日</Text>
                    <Text className="summary-info-label">截止日期</Text>
                  </View>
                </View>
              </View>

              <View className="modal-warning">
                <View className="warning-icon">⚠</View>
                <View className="warning-content">
                  <Text className="warning-title">接单后不可退换</Text>
                  <Text className="warning-text">
                    请确认你有能力在规定时间内完成交付。一旦确认接单，任务将立即锁定，无法取消或转让。
                  </Text>
                </View>
              </View>

              <View className="modal-actions">
                <Button className="modal-btn cancel" onClick={handleCloseModal}>
                  取消
                </Button>
                <Button className="modal-btn confirm" onClick={handleConfirmAccept}>
                  确认接单
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
