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
      // TODO: 调用真实API
      // const res = await api.get(`/company/tasks/${taskId}/progress`)

      // 模拟数据
      setProgress({
        taskId: taskId || '1',
        taskTitle: '企业官网UI设计',
        currentStatus: '学生执行中',
        steps: [
          {
            id: '1',
            title: '任务发布',
            description: '企业发布任务并支付30%定金',
            status: 'completed',
            timestamp: '2025-12-15 10:00',
            operator: '企业方'
          },
          {
            id: '2',
            title: 'AI匹配学生',
            description: 'AI为您匹配了10位合适的学生',
            status: 'completed',
            timestamp: '2025-12-15 10:05',
            operator: '系统'
          },
          {
            id: '3',
            title: '企业选择学生',
            description: '您选择了5位学生并发送邀请',
            status: 'completed',
            timestamp: '2025-12-15 11:30',
            operator: '企业方'
          },
          {
            id: '4',
            title: '学生接单',
            description: '张小明接受了任务邀请',
            status: 'completed',
            timestamp: '2025-12-15 14:20',
            operator: '张小明'
          },
          {
            id: '5',
            title: '学生执行中',
            description: '学生正在完成任务，当前进度60%',
            status: 'current',
            timestamp: '2025-12-18 16:00',
            operator: '张小明'
          },
          {
            id: '6',
            title: '学生提交交付物',
            description: '等待学生提交任务成果',
            status: 'pending'
          },
          {
            id: '7',
            title: 'AI初审',
            description: 'AI将对交付物进行初步审核',
            status: 'pending'
          },
          {
            id: '8',
            title: '企业验收',
            description: '您需要验收交付物并决定通过或打回',
            status: 'pending'
          },
          {
            id: '9',
            title: '支付尾款',
            description: '验收通过后支付70%尾款',
            status: 'pending'
          },
          {
            id: '10',
            title: '任务完成',
            description: '平台将款项支付给学生，任务结束',
            status: 'pending'
          }
        ]
      })
    } catch (error) {
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
