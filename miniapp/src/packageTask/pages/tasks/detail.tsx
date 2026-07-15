import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getUserInfo, saveUserInfo } from '../../../utils'
import { taskAPI, securityAPI, studentRecommendationAPI } from '../../../services/api'
import GuideDialog from '../../../components/GuideDialog'
import Loading from '../../../components/Loading'
import CollaborationProgressHint from '../../../components/CollaborationProgressHint'
import UnlockContactModal from '../../../components/UnlockContactModal'
import TaskTranslation from '../../../components/TaskTranslation'
import './detail.scss'
import catLogo from '../../../assets/images/cat-logo.png'

export default function TaskDetail() {
  const router = useRouter()
  const [task, setTask] = useState<any>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [guideType, setGuideType] = useState<'first-task' | 'first-complete' | 'level-up'>('first-task')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockStatus, setUnlockStatus] = useState<any>(null)
  const [isFirstOrder, setIsFirstOrder] = useState(false)

  useEffect(() => {
    loadTaskDetail()
  }, [])

  useEffect(() => {
    if (task?.companyId) {
      loadUnlockStatus()
    }
  }, [task?.companyId])

  const loadUnlockStatus = async () => {
    try {
      const studentId = Taro.getStorageSync('userId')
      const res = await securityAPI.getUnlockStatus(studentId, task.companyId)

      if (res.success) {
        setUnlockStatus(res.data)
      }
    } catch (err) {
      console.error('加载解锁状态失败:', err)
    }
  }

  const loadTaskDetail = async () => {
    try {
      setLoading(true)
      const taskId = router.params.id
      if (!taskId) {
        Taro.showToast({ title: '任务ID不存在', icon: 'none' })
        return
      }

      const [taskRes, firstOrderRes] = await Promise.all([
        taskAPI.getDetail(taskId).catch(() => null),
        studentRecommendationAPI.isFirstOrder().catch(() => null)
      ])

      if (firstOrderRes?.success) {
        setIsFirstOrder(firstOrderRes.data.isFirstOrder)
      }

      if (taskRes?.success && taskRes.data) {
        setTask(taskRes.data)
      } else {
        // 降级到模拟数据
        const mockTask = {
          id: taskId,
          title: '设计一套品牌VI系统',
          description: '为一家新创科技公司设计完整的品牌视觉识别系统，包括logo、配色方案、字体规范等。',
          budget_net: 800,
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
      }

      // 检查是否是首次接任务
      const userInfo = getUserInfo()
      if (userInfo && !userInfo.hasAcceptedFirstTask) {
        setGuideType('first-task')
        setShowGuide(true)
      }
    } catch (error) {
      console.error('加载任务详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTask = async () => {
    if (accepting) return
    
    try {
      setAccepting(true)
      const userInfo = getUserInfo()

      // 调用接取任务API
      const res = await taskAPI.accept(task.id)
      
      if (res.success) {
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
            url: `/packageTask/pages/tasks/working?id=${task.id}`
          })
        }, 1500)
      } else {
        Taro.showToast({
          title: res.message || '接取失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('接取任务失败:', error)
      Taro.showToast({
        title: '接取失败，请重试',
        icon: 'none'
      })
    } finally {
      setAccepting(false)
    }
  }

  const handleCloseGuide = () => {
    setShowGuide(false)
  }

  const handleAskMentor = () => {
    // 跳转到统一的AI导师页面，并传递任务上下文
    Taro.navigateTo({
      url: `/pages/mentor/index?context=task&taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`
    })
  }

  if (loading || !task) {
    return <Loading text="正在加载任务详情..." />
  }

  return (
    <View className="task-detail-page">
      {/* 首单保障横幅 */}
      {isFirstOrder && (
        <View className="first-order-banner">
          <View className="banner-icon">◇</View>
          <View className="banner-content">
            <Text className="banner-title">首单保障：验收通过后24小时到账</Text>
            <Text className="banner-subtitle">平台自有资金垫付，无需等待企业结算</Text>
          </View>
        </View>
      )}

      {/* 任务头部 */}
      <View className="task-header">
        <Text className="task-title">{task.title}</Text>
        <View className="task-meta">
          <View className="meta-item">
            <Text className="meta-label">难度</Text>
            <Text className="meta-value">{task.difficulty || '中等'}</Text>
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

        {/* 启程老师翻译 - 新增 */}
        {task.id && (
          <View className="translation-section">
            <TaskTranslation taskId={task.id} />
          </View>
        )}

        {/* 合作进度提示 */}
        {task.companyId && (
          <View className="collaboration-section">
            <CollaborationProgressHint
              companyId={task.companyId}
              mode="card"
              showAction={true}
              onUnlockRequest={() => setShowUnlockModal(true)}
            />
          </View>
        )}

        {task.requirements && task.requirements.length > 0 && (
          <View className="content-section">
            <Text className="section-title">任务要求</Text>
            {task.requirements.map((req, index) => (
              <View key={index} className="requirement-item">
                <Text className="requirement-text">• {req}</Text>
              </View>
            ))}
          </View>
        )}

        {task.tags && task.tags.length > 0 && (
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
        )}

        {task.publisher && (
          <View className="content-section">
            <Text className="section-title">发布者</Text>
            <View className="publisher-info">
              <View className="publisher-avatar">
                <Text className="avatar-text">{task.publisher.avatar || task.publisher.name?.charAt(0) || 'U'}</Text>
              </View>
              <Text className="publisher-name">{task.publisher.name || '匿名用户'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 底部操作栏 */}
      <View className="task-footer">
        <View className="reward-info">
          <Text className="reward-label">任务报酬</Text>
          <Text className="reward-value">¥{task.budget_net || task.reward || 0}</Text>
        </View>
        <Button 
          className={`accept-btn ${accepting ? 'disabled' : ''}`}
          onClick={handleAcceptTask}
          disabled={accepting}
        >
          <Text className="btn-text">{accepting ? '接取中...' : '接取任务'}</Text>
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

      {/* 解锁联系方式弹窗 */}
      {task?.companyId && unlockStatus && (
        <UnlockContactModal
          visible={showUnlockModal}
          studentId={Taro.getStorageSync('userId')}
          companyId={task.companyId}
          studentName="我"
          companyName={task.publisher?.name || '企业'}
          userType="student"
          status={unlockStatus}
          onClose={() => setShowUnlockModal(false)}
          onSuccess={() => {
            loadUnlockStatus()
            Taro.showToast({ title: '操作成功', icon: 'success' })
          }}
        />
      )}
    </View>
  )
}
