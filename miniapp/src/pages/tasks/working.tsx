import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { taskAPI } from '../../services/api'
import Loading from '../../components/Loading'
import Timeline from '../../components/Timeline'
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
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressNote, setProgressNote] = useState('')
  const [showProgressModal, setShowProgressModal] = useState(false)

  // 任务状态时间线
  const getTimelineNodes = () => {
    const status = task?.status || 'accepted'

    return [
      {
        status: 'created',
        label: '任务创建',
        time: task?.createdAt ? new Date(task.createdAt).toLocaleString('zh-CN') : '',
        icon: '📝',
        completed: true,
        current: false
      },
      {
        status: 'accepted',
        label: '已接取',
        time: task?.acceptedAt ? new Date(task.acceptedAt).toLocaleString('zh-CN') : '',
        description: '开始执行任务',
        icon: '✅',
        completed: status !== 'created',
        current: status === 'accepted'
      },
      {
        status: 'in_progress',
        label: '进行中',
        time: task?.startedAt ? new Date(task.startedAt).toLocaleString('zh-CN') : '',
        description: '正在完成任务',
        icon: '🚀',
        completed: ['submitted', 'reviewing', 'completed'].includes(status),
        current: status === 'in_progress'
      },
      {
        status: 'submitted',
        label: '已提交',
        time: task?.submittedAt ? new Date(task.submittedAt).toLocaleString('zh-CN') : '',
        description: '等待企业审核',
        icon: '📤',
        completed: ['reviewing', 'completed'].includes(status),
        current: status === 'submitted'
      },
      {
        status: 'reviewing',
        label: '审核中',
        time: task?.reviewingAt ? new Date(task.reviewingAt).toLocaleString('zh-CN') : '',
        description: 'AI质量预审',
        icon: '🔍',
        completed: status === 'completed',
        current: status === 'reviewing'
      },
      {
        status: 'completed',
        label: '已完成',
        time: task?.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '',
        description: '任务圆满完成',
        icon: '🎉',
        completed: status === 'completed',
        current: status === 'completed'
      }
    ]
  }

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
      url: `/pages/mentor-chat/index?taskId=${id}&context=working&taskTitle=${encodeURIComponent(task?.title || '')}`
    })
  }

  const handleStuck = () => {
    Taro.navigateTo({
      url: `/pages/mentor-chat/index?taskId=${id}&context=stuck&taskTitle=${encodeURIComponent(task?.title || '')}`
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

  const handleUpdateProgress = () => {
    setShowProgressModal(true)
  }

  const handleProgressSubmit = async () => {
    if (progressPercent < 0 || progressPercent > 100) {
      Taro.showToast({ title: '进度必须在0-100之间', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '更新中...' })
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/flow/${id}/progress`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        },
        data: {
          progressPercent,
          note: progressNote
        }
      })

      Taro.hideLoading()

      if (res.data.success) {
        Taro.showToast({ title: '进度已更新', icon: 'success' })
        setShowProgressModal(false)
        setProgressNote('')
        loadTaskData() // 重新加载任务数据
      } else {
        Taro.showToast({ title: res.data.message || '更新失败', icon: 'none' })
      }
    } catch (err) {
      Taro.hideLoading()
      console.error('更新进度失败:', err)
      Taro.showToast({ title: '网络错误', icon: 'none' })
    }
  }

  if (!task) {
    return <Loading text="正在加载任务..." />
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

      {/* 任务状态时间线 */}
      <View className="progress-card">
        <Text className="card-title">任务状态</Text>
        <Timeline nodes={getTimelineNodes()} />
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
          <View className="action-btn progress" onClick={handleUpdateProgress}>
            <Text className="action-icon">◐</Text>
            <Text className="action-text">更新进度</Text>
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

      {/* 进度更新弹窗 */}
      {showProgressModal && (
        <View className="progress-modal" onClick={() => setShowProgressModal(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">更新任务进度</Text>
              <Text className="modal-close" onClick={() => setShowProgressModal(false)}>×</Text>
            </View>

            <View className="modal-body">
              <View className="form-item">
                <Text className="form-label">当前进度 (%)</Text>
                <input
                  className="form-input"
                  type="number"
                  value={progressPercent}
                  onInput={(e) => setProgressPercent(Number(e.detail.value))}
                  placeholder="请输入0-100的数字"
                />
              </View>

              <View className="form-item">
                <Text className="form-label">进度说明（选填）</Text>
                <textarea
                  className="form-textarea"
                  value={progressNote}
                  onInput={(e) => setProgressNote(e.detail.value)}
                  placeholder="简单描述一下当前完成的内容..."
                  maxlength={200}
                />
                <Text className="char-count">{progressNote.length}/200</Text>
              </View>

              <View className="progress-preview">
                <Text className="preview-label">进度预览</Text>
                <View className="progress-bar">
                  <View className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </View>
                <Text className="progress-text">{progressPercent}%</Text>
              </View>
            </View>

            <View className="modal-footer">
              <View className="modal-btn cancel" onClick={() => setShowProgressModal(false)}>
                <Text>取消</Text>
              </View>
              <View className="modal-btn confirm" onClick={handleProgressSubmit}>
                <Text>确认更新</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
