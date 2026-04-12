import { View, Text, Image, Textarea, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './index.scss'

interface TaskDelivery {
  id: string
  taskId: string
  taskTitle: string
  studentName: string
  studentAvatar: string
  submittedAt: string
  description: string
  images: string[]
  links: string[]
  status: 'pending' | 'approved' | 'rejected'
}

export default function TaskVerification() {
  const router = useRouter()
  const { taskId } = router.params
  const [delivery, setDelivery] = useState<TaskDelivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    loadDelivery()
  }, [])

  const loadDelivery = async () => {
    try {
      // TODO: 调用真实API
      // const res = await api.get(`/company/tasks/${taskId}/delivery`)

      // 模拟数据
      setDelivery({
        id: '1',
        taskId: taskId || '1',
        taskTitle: '企业官网UI设计',
        studentName: '张小明',
        studentAvatar: 'https://via.placeholder.com/100',
        submittedAt: '2025-12-20 14:30',
        description: '已完成企业官网的UI设计，包括首页、产品页、关于我们等5个页面。采用现代简约风格，响应式布局，适配PC和移动端。',
        images: [
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200'
        ],
        links: [
          'https://figma.com/file/xxx',
          'https://github.com/xxx/project'
        ],
        status: 'pending'
      })
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    Taro.showModal({
      title: '确认验收通过',
      content: '验收通过后将支付70%尾款给学生，此操作不可撤销',
      success: async (res) => {
        if (res.confirm) {
          try {
            // TODO: 调用真实API
            // await api.post(`/company/tasks/${taskId}/approve`)

            Taro.showToast({ title: '验收通过', icon: 'success' })
            setTimeout(() => {
              Taro.navigateBack()
            }, 1500)
          } catch (error) {
            Taro.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleReject = () => {
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      Taro.showToast({ title: '请填写打回原因', icon: 'none' })
      return
    }

    try {
      // TODO: 调用真实API
      // await api.post(`/company/tasks/${taskId}/reject`, { reason: rejectionReason })

      Taro.showToast({ title: '已打回重做', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const previewImage = (url: string) => {
    Taro.previewImage({
      urls: delivery?.images || [],
      current: url
    })
  }

  const copyLink = (link: string) => {
    Taro.setClipboardData({
      data: link,
      success: () => {
        Taro.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  }

  if (loading) {
    return <View className="task-verification loading">加载中...</View>
  }

  if (!delivery) {
    return <View className="task-verification empty">交付物不存在</View>
  }

  return (
    <View className="task-verification">
      {/* 任务信息 */}
      <View className="task-info">
        <Text className="task-title">{delivery.taskTitle}</Text>
        <View className="student-info">
          <Image className="avatar" src={delivery.studentAvatar} />
          <View className="info">
            <Text className="name">{delivery.studentName}</Text>
            <Text className="time">提交于 {delivery.submittedAt}</Text>
          </View>
        </View>
      </View>

      {/* 交付说明 */}
      <View className="section">
        <Text className="section-title">交付说明</Text>
        <Text className="description">{delivery.description}</Text>
      </View>

      {/* 交付图片 */}
      {delivery.images.length > 0 && (
        <View className="section">
          <Text className="section-title">交付图片</Text>
          <View className="images">
            {delivery.images.map((img, index) => (
              <Image
                key={index}
                className="image"
                src={img}
                mode="aspectFill"
                onClick={() => previewImage(img)}
              />
            ))}
          </View>
        </View>
      )}

      {/* 相关链接 */}
      {delivery.links.length > 0 && (
        <View className="section">
          <Text className="section-title">相关链接</Text>
          {delivery.links.map((link, index) => (
            <View key={index} className="link-item" onClick={() => copyLink(link)}>
              <Text className="link-text">{link}</Text>
              <Text className="link-copy">复制</Text>
            </View>
          ))}
        </View>
      )}

      {/* 操作按钮 */}
      {delivery.status === 'pending' && (
        <View className="actions">
          <Button className="btn-reject" onClick={handleReject}>
            打回重做
          </Button>
          <Button className="btn-approve" onClick={handleApprove}>
            验收通过
          </Button>
        </View>
      )}

      {/* 打回原因弹窗 */}
      {showRejectModal && (
        <View className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">打回原因</Text>
            <Textarea
              className="modal-textarea"
              placeholder="请详细说明需要修改的地方，帮助学生更好地完成任务"
              value={rejectionReason}
              onInput={(e) => setRejectionReason(e.detail.value)}
              maxlength={500}
            />
            <View className="modal-actions">
              <Button className="modal-btn cancel" onClick={() => setShowRejectModal(false)}>
                取消
              </Button>
              <Button className="modal-btn confirm" onClick={confirmReject}>
                确认打回
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
