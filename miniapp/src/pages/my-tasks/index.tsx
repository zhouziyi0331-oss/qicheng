import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { taskAPI } from '../../services/api'
import Loading from '../../components/Loading'
import './index.scss'

interface Task {
  id: string
  title: string
  budget: number
  status: 'working' | 'submitted' | 'completed' | 'rejected'
  statusText: string
  progress: number
  deadline: string
  submittedAt?: string
  completedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

export default function MyTasks() {
  const [activeTab, setActiveTab] = useState<'working' | 'submitted' | 'completed' | 'rejected'>('working')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [activeTab])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await taskAPI.getMyTasks(activeTab)
      setTasks(data)
    } catch (err: any) {
      Taro.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    if (task.status === 'working') {
      Taro.navigateTo({ url: `/pages/tasks/working?id=${task.id}` })
    } else if (task.status === 'rejected') {
      // 被打回的任务，跳转到AI导师获取引导
      Taro.navigateTo({
        url: `/pages/mentor/index?context=rejected&taskId=${task.id}`
      })
    } else {
      Taro.navigateTo({ url: `/pages/tasks/detail?id=${task.id}` })
    }
  }

  const handleContinue = (taskId: string) => {
    Taro.navigateTo({ url: `/pages/tasks/working?id=${taskId}` })
  }

  const handleResubmit = (taskId: string) => {
    Taro.navigateTo({ url: `/pages/tasks/submit?id=${taskId}` })
  }

  const handleAskMentor = (taskId: string) => {
    Taro.navigateTo({
      url: `/pages/mentor/index?context=rejected&taskId=${taskId}`
    })
  }

  const renderTaskCard = (task: Task) => {
    return (
      <View key={task.id} className="task-card" onClick={() => handleTaskClick(task)}>
        <View className="task-header">
          <Text className="task-title">{task.title}</Text>
          <View className={`task-status status-${task.status}`}>
            <Text className="status-text">{task.statusText}</Text>
          </View>
        </View>

        <View className="task-info">
          <View className="info-item">
            <Text className="info-label">报酬</Text>
            <Text className="info-value budget">¥{task.budget}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">截止时间</Text>
            <Text className="info-value">{task.deadline}</Text>
          </View>
        </View>

        {task.status === 'working' && (
          <View className="task-progress">
            <View className="progress-bar">
              <View className="progress-fill" style={{ width: `${task.progress}%` }} />
            </View>
            <Text className="progress-text">进度 {task.progress}%</Text>
          </View>
        )}

        {task.status === 'submitted' && (
          <View className="task-time">
            <Text className="time-label">提交时间：</Text>
            <Text className="time-value">{task.submittedAt}</Text>
          </View>
        )}

        {task.status === 'completed' && (
          <View className="task-time">
            <Text className="time-label">完成时间：</Text>
            <Text className="time-value">{task.completedAt}</Text>
          </View>
        )}

        {task.status === 'rejected' && (
          <View className="rejection-info">
            <View className="rejection-header">
              <Text className="rejection-label">打回原因：</Text>
              <Text className="rejection-time">{task.rejectedAt}</Text>
            </View>
            <Text className="rejection-reason">{task.rejectionReason}</Text>
            <View className="rejection-actions">
              <Button
                className="action-btn mentor-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAskMentor(task.id)
                }}
              >
                问AI导师
              </Button>
              <Button
                className="action-btn resubmit-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleResubmit(task.id)
                }}
              >
                重新提交
              </Button>
            </View>
          </View>
        )}

        {task.status === 'working' && (
          <Button
            className="continue-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleContinue(task.id)
            }}
          >
            继续任务
          </Button>
        )}
      </View>
    )
  }

  return (
    <View className="my-tasks-page">
      <View className="page-header">
        <Text className="page-title">我的任务</Text>
      </View>

      <View className="tabs">
        <View
          className={`tab-item ${activeTab === 'working' ? 'active' : ''}`}
          onClick={() => setActiveTab('working')}
        >
          <Text className="tab-text">进行中</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'submitted' ? 'active' : ''}`}
          onClick={() => setActiveTab('submitted')}
        >
          <Text className="tab-text">待验收</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <Text className="tab-text">已完成</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          <Text className="tab-text">已打回</Text>
        </View>
      </View>

      <ScrollView className="tasks-list" scrollY>
        {loading ? (
          <Loading text="正在加载我的任务..." />
        ) : tasks.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📋</Text>
            <Text className="empty-text">
              {activeTab === 'working' && '暂无进行中的任务'}
              {activeTab === 'submitted' && '暂无待验收的任务'}
              {activeTab === 'completed' && '暂无已完成的任务'}
              {activeTab === 'rejected' && '暂无被打回的任务'}
            </Text>
            {activeTab === 'working' && (
              <Button
                className="go-tasks-btn"
                onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}
              >
                去接任务
              </Button>
            )}
          </View>
        ) : (
          <View className="tasks-container">
            {tasks.map(task => renderTaskCard(task))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
