import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { dailyTasksAPI } from '../../../services/api'
import './index.scss'

interface DailyTask {
  id: string;
  title: string;
  desc: string;
  icon: string;
  reward: number;
  progress: number;
  target: number;
  progressPercent: number;
  completed: boolean;
}

export default function DailyTasks() {
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [totalReward, setTotalReward] = useState(0)
  const [bonusReward, setBonusReward] = useState(50)
  const [allCompleted, setAllCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDailyTasks()
  }, [])

  const loadDailyTasks = async () => {
    try {
      const res = await dailyTasksAPI.getDailyTasks()

      if (res.success) {
        const tasks = res.data.tasks || []
        setDailyTasks(tasks)

        const completed = tasks.filter(t => t.completed).length
        const total = tasks.length
        const reward = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.reward, 0)

        setCompletedCount(completed)
        setTotalCount(total)
        setTotalReward(reward)
        setAllCompleted(completed === total && total > 0)
        setBonusReward(res.data.bonusReward || 50)
      }
    } catch (error) {
      console.error('加载每日任务失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const showTaskDetail = (task: DailyTask) => {
    if (task.completed) {
      Taro.showToast({ title: '任务已完成', icon: 'success' })
    } else {
      Taro.showModal({
        title: task.title,
        content: `${task.desc}\n\n进度: ${task.progress}/${task.target}\n奖励: +${task.reward} ◇`,
        confirmText: '去完成',
        success: (res) => {
          if (res.confirm) {
            // 跳转到相应功能页面
            navigateToTaskPage(task)
          }
        }
      })
    }
  }

  const navigateToTaskPage = (task: DailyTask) => {
    // 根据任务类型跳转到不同页面
    if (task.id.includes('login')) {
      Taro.showToast({ title: '今日已签到', icon: 'none' })
    } else if (task.id.includes('learn')) {
      Taro.switchTab({ url: '/pages/tasks/index' })
    } else if (task.id.includes('share')) {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <View className="daily-tasks-page">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  return (
    <View className="daily-tasks-page">
      {/* 头部 */}
      <View className="tasks-header">
        <Text className="header-title">▪ 每日任务</Text>
        <Text className="header-subtitle">完成任务获得思考值奖励</Text>

        <View className="progress-summary">
          <View className="summary-item">
            <Text className="summary-value">{completedCount}/{totalCount}</Text>
            <Text className="summary-label">已完成</Text>
          </View>
          <View className="summary-item">
            <Text className="summary-value">+{totalReward}</Text>
            <Text className="summary-label">已获得</Text>
          </View>
        </View>
      </View>

      {/* 全部完成奖励卡片 */}
      {allCompleted && (
        <View className="bonus-card">
          <Text className="bonus-title">◇ 全部完成！</Text>
          <Text className="bonus-desc">恭喜你完成今日所有任务</Text>
          <Text className="bonus-reward">+{bonusReward} ◇</Text>
        </View>
      )}

      {/* 任务列表 */}
      {dailyTasks.length > 0 ? (
        <View className="tasks-list">
          {dailyTasks.map(task => (
            <View
              key={task.id}
              className={`task-card ${task.completed ? 'completed' : ''}`}
              onClick={() => showTaskDetail(task)}
            >
              {task.completed && <Text className="task-check">✓</Text>}

              <View className="task-header">
                <View className="task-icon">
                  <Text>{task.icon}</Text>
                </View>
                <View className="task-info">
                  <Text className="task-title">{task.title}</Text>
                  <Text className="task-desc">{task.desc}</Text>
                </View>
                <View className="task-reward">
                  <Text className="reward-icon">◇</Text>
                  <Text className="reward-value">+{task.reward}</Text>
                </View>
              </View>

              {!task.completed && (
                <View className="task-progress">
                  <View className="progress-bar">
                    <View className="progress-fill" style={{ width: `${task.progressPercent}%` }} />
                  </View>
                  <Text className="progress-text">{task.progress}/{task.target}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View className="empty">
          <Text className="empty-icon">▪</Text>
          <Text className="empty-text">暂无任务</Text>
        </View>
      )}
    </View>
  )
}
