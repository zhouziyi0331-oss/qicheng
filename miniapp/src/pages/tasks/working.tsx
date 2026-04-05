import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { taskAPI } from '../../services/api'
import './working.scss'

interface TaskStep {
  title: string
  desc: string
  tool: string
  est_minutes: number
}

export default function TaskWorking() {
  const router = useRouter()
  const { id } = router.params
  const [task, setTask] = useState<any>(null)
  const [steps, setSteps] = useState<TaskStep[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showMentorTip, setShowMentorTip] = useState(false)

  useEffect(() => {
    loadTaskData()

    // 30秒后显示AI导师推送
    const timer = setTimeout(() => {
      setShowMentorTip(true)
      Taro.showModal({
        title: '启程小猫来啦',
        content: '我注意到你已经开始任务了！需要我帮你梳理一下思路吗？',
        confirmText: '好的',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) {
            handleAskMentor()
          }
        }
      })
    }, 30000)

    return () => clearTimeout(timer)
  }, [id])

  useEffect(() => {
    if (!task) return

    // 计算剩余时间
    const deadline = new Date(task.deadline).getTime()
    const now = Date.now()
    const diff = Math.max(0, deadline - now)
    setTimeLeft(Math.floor(diff / 1000))

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [task])

  const loadTaskData = async () => {
    try {
      // 加载任务详情
      const taskRes = await taskAPI.getDetail(id!)
      setTask(taskRes.task)

      // 加载任务步骤拆解（AI生成）
      const stepsRes = await taskAPI.getTaskSteps(id!)
      setSteps(stepsRes.steps || [])
    } catch (error) {
      console.error('加载任务数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAskMentor = () => {
    Taro.navigateTo({
      url: `/pages/mentor/index?taskId=${id}&context=working&taskTitle=${encodeURIComponent(task?.title || '')}`
    })
  }

  const handleStuck = () => {
    Taro.navigateTo({
      url: `/pages/mentor/index?taskId=${id}&context=stuck&taskTitle=${encodeURIComponent(task?.title || '')}`
    })
  }

  const handleSubmit = () => {
    Taro.showModal({
      title: '提交任务',
      content: '确认提交任务成果吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({
            url: `/pages/tasks/submit?id=${id}`
          })
        }
      }
    })
  }

  if (!task) {
    return <View className="task-working-page">加载中...</View>
  }

  return (
    <View className="task-working-page">
      {/* 任务信息卡片 */}
      <View className="task-info-card">
        <Text className="task-title">{task.title}</Text>
        <View className="task-meta">
          <View className="meta-item">
            <Text className="meta-label">预算</Text>
            <Text className="meta-value">¥{task.budget_net}</Text>
          </View>
          <View className="meta-item">
            <Text className="meta-label">剩余时间</Text>
            <Text className="meta-value time">{formatTime(timeLeft)}</Text>
          </View>
        </View>
      </View>

      {/* 进度卡片 */}
      <View className="progress-card">
        <Text className="card-title">任务进度</Text>
        <View className="progress-steps">
          <View className={`step-item ${currentStep >= 0 ? 'active' : ''}`}>
            <View className="step-circle">1</View>
            <Text className="step-text">已接取</Text>
          </View>
          <View className="step-line" />
          <View className={`step-item ${currentStep >= 1 ? 'active' : ''}`}>
            <View className="step-circle">2</View>
            <Text className="step-text">执行中</Text>
          </View>
          <View className="step-line" />
          <View className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>
            <View className="step-circle">3</View>
            <Text className="step-text">待提交</Text>
          </View>
          <View className="step-line" />
          <View className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
            <View className="step-circle">4</View>
            <Text className="step-text">已完成</Text>
          </View>
        </View>
      </View>

      {/* AI生成的任务步骤 */}
      {steps.length > 0 && (
        <View className="progress-card">
          <Text className="card-title">执行步骤（AI为你拆解）</Text>
          {steps.map((step, index) => (
            <View key={index} className="step-detail">
              <View className="step-header">
                <Text className="step-number">步骤 {index + 1}</Text>
                <Text className="step-time">约 {step.est_minutes} 分钟</Text>
              </View>
              <Text className="step-title">{step.title}</Text>
              <Text className="step-desc">{step.desc}</Text>
              {step.tool !== '无' && (
                <Text className="step-tool">推荐工具：{step.tool}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 快捷操作 */}
      <View className="actions-card">
        <Text className="card-title">需要帮助？</Text>
        <View className="action-buttons">
          <View className="action-btn mentor" onClick={handleAskMentor}>
            <Text className="action-icon">◉</Text>
            <Text className="action-text">问导师</Text>
          </View>
          <View className="action-btn stuck" onClick={handleStuck}>
            <Text className="action-icon">◈</Text>
            <Text className="action-text">我卡住了</Text>
          </View>
        </View>
      </View>

      {/* AI导师推送气泡 */}
      {showMentorTip && (
        <View className="mentor-tip-bubble" onClick={handleAskMentor}>
          <Text className="bubble-avatar">◉</Text>
          <View className="bubble-content">
            <Text className="bubble-text">需要帮助吗？</Text>
          </View>
        </View>
      )}

      {/* 底部提交按钮 */}
      <View className="bottom-actions">
        <View className="submit-btn" onClick={handleSubmit}>
          <Text className="btn-text">提交作品</Text>
        </View>
      </View>
    </View>
  )
}
