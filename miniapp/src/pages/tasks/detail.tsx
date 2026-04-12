import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getUserInfo, saveUserInfo } from '../../utils'
import GuideDialog from '../../components/GuideDialog'
import Loading from '../../components/Loading'
import './detail.scss'
import catLogo from '../../assets/images/cat-logo.png'

export default function TaskDetail() {
  const router = useRouter()
  const [task, setTask] = useState<any>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [guideType, setGuideType] = useState<'first-task' | 'first-complete' | 'level-up'>('first-task')

  useEffect(() => {
    // 模拟任务数据
    const mockTask = {
      id: router.params.id || '1',
      title: '设计一套品牌VI系统',
      description: '为一家新创科技公司设计完整的品牌视觉识别系统，包括logo、配色方案、字体规范等。',
      reward: 800,
      difficulty: '中等',
      deadline: '2024-03-20',
      publisher: {
        name: '创新科技',
        avatar: 'C'
      },
      requirements: [
        '具备平面设计经验',
        '熟悉品牌设计流程',
        '能够独立完成设计方案'
      ],
      tags: ['设计', '品牌', 'VI']
    }
    setTask(mockTask)

    // 检查是否是首次接任务
    const userInfo = getUserInfo()
    if (userInfo && !userInfo.hasAcceptedFirstTask) {
      setGuideType('first-task')
      setShowGuide(true)
    }
  }, [])

  const handleAcceptTask = () => {
    const userInfo = getUserInfo()

    // 标记已接受首个任务
    if (!userInfo.hasAcceptedFirstTask) {
      saveUserInfo({
        ...userInfo,
        hasAcceptedFirstTask: true
      })
    }

    Taro.showToast({
      title: '接取成功',
      icon: 'success'
    })

    setTimeout(() => {
      // 跳转到任务执行页面
      Taro.redirectTo({
        url: `/pages/tasks/working?id=${task.id}`
      })
    }, 1500)
  }

  const handleCloseGuide = () => {
    setShowGuide(false)
  }

  const handleAskMentor = () => {
    // 跳转到AI导师页面，并传递任务上下文
    Taro.navigateTo({
      url: `/pages/mentor/index?context=task&taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`
    })
  }

  if (!task) {
    return <Loading text="正在加载任务详情..." />
  }

  return (
    <View className="task-detail-page">
      {/* 任务头部 */}
      <View className="task-header">
        <Text className="task-title">{task.title}</Text>
        <View className="task-meta">
          <View className="meta-item">
            <Text className="meta-label">难度</Text>
            <Text className="meta-value">{task.difficulty}</Text>
          </View>
          <View className="meta-item">
            <Text className="meta-label">截止日期</Text>
            <Text className="meta-value">{task.deadline}</Text>
          </View>
        </View>
      </View>

      {/* 任务详情 */}
      <View className="task-content">
        <View className="content-section">
          <Text className="section-title">任务描述</Text>
          <Text className="section-text">{task.description}</Text>
        </View>

        <View className="content-section">
          <Text className="section-title">任务要求</Text>
          {task.requirements.map((req, index) => (
            <View key={index} className="requirement-item">
              <Text className="requirement-text">• {req}</Text>
            </View>
          ))}
        </View>

        <View className="content-section">
          <Text className="section-title">技能标签</Text>
          <View className="tags-container">
            {task.tags.map((tag, index) => (
              <View key={index} className="tag-item">
                <Text className="tag-text">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="content-section">
          <Text className="section-title">发布者</Text>
          <View className="publisher-info">
            <View className="publisher-avatar">
              <Text className="avatar-text">{task.publisher.avatar}</Text>
            </View>
            <Text className="publisher-name">{task.publisher.name}</Text>
          </View>
        </View>
      </View>

      {/* 底部操作栏 */}
      <View className="task-footer">
        <View className="reward-info">
          <Text className="reward-label">任务报酬</Text>
          <Text className="reward-value">¥{task.reward}</Text>
        </View>
        <Button className="accept-btn" onClick={handleAcceptTask}>
          <Text className="btn-text">接取任务</Text>
        </Button>
      </View>

      {/* 新手引导 */}
      <GuideDialog
        visible={showGuide}
        type={guideType}
        onClose={handleCloseGuide}
      />

      {/* AI导师悬浮按钮 */}
      <View className="mentor-float-btn" onClick={handleAskMentor}>
        <Image src={catLogo} className="mentor-logo" mode="aspectFit" />
        <Text className="mentor-text">问AI导师</Text>
      </View>
    </View>
  )
}
