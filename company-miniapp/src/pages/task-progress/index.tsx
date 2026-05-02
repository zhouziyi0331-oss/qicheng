import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './index.scss'

interface ProgressStep {
  id: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending'
  timestamp?: string
  operator?: string
}

interface TaskProgress {
  taskId: string
  taskTitle: string
  currentStatus: string
  steps: ProgressStep[]
}

export default function TaskProgress() {
  const router = useRouter()
  const { taskId } = router.params
  const [progress, setProgress] = useState<TaskProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/company/tasks/${taskId}/progress`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.statusCode === 200 && res.data.success) {
        setProgress(res.data.data)
      } else {
        throw new Error(res.data.message || '加载失败')
      }
    } catch (error) {
      console.error('加载任务进度失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'current':
        return '●'
      case 'pending':
        return '○'
      default:
        return '○'
    }
  }

  if (loading) {
    return <View className="task-progress loading">加载中...</View>
  }

  if (!progress) {
    return <View className="task-progress empty">任务不存在</View>
  }

  return (
    <View className="task-progress">
      {/* 任务信息 */}
      <View className="task-header">
        <Text className="task-title">{progress.taskTitle}</Text>
        <View className="current-status">
          <Text className="status-label">当前状态</Text>
          <Text className="status-value">{progress.currentStatus}</Text>
        </View>
      </View>

      {/* 进度时间轴 */}
      <View className="timeline">
        {progress.steps.map((step, index) => (
          <View key={step.id} className={`timeline-item ${step.status}`}>
            <View className="timeline-dot">
              <Text className="dot-icon">{getStatusIcon(step.status)}</Text>
            </View>

            {index < progress.steps.length - 1 && (
              <View className={`timeline-line ${step.status === 'completed' ? 'completed' : ''}`} />
            )}

            <View className="timeline-content">
              <Text className="step-title">{step.title}</Text>
              <Text className="step-description">{step.description}</Text>
              {step.timestamp && (
                <View className="step-meta">
                  <Text className="meta-time">{step.timestamp}</Text>
                  {step.operator && (
                    <>
                      <Text className="meta-divider">·</Text>
                      <Text className="meta-operator">{step.operator}</Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
