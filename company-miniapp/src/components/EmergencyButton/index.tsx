import { View, Text, Button, Picker, Textarea } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface EmergencyButtonProps {
  taskId: string
  onSubmitted?: () => void
}

export default function EmergencyButton(props: EmergencyButtonProps) {
  const { taskId, onSubmitted } = props
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState(0)
  const [reasonDetail, setReasonDetail] = useState('')
  const [loading, setLoading] = useState(false)

  const reasons = [
    '任务陷入停滞',
    '发生争议纠纷',
    '交付质量问题',
    '沟通出现障碍',
    '需求紧急变更'
  ]

  const submit = async () => {
    if (!reasonDetail.trim()) {
      Taro.showToast({ title: '请详细描述问题', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/task-tracking/emergency-interventions',
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
        data: {
          task_id: taskId,
          reason: reasons[reason].replace(/\s/g, '_').toLowerCase(),
          reason_detail: reasonDetail
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '已提交，平台将尽快处理', icon: 'success' })
        setShowModal(false)
        setReasonDetail('')
        onSubmitted?.()
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button className='emergency-button' onClick={() => setShowModal(true)}>
        🚨 紧急介入
      </Button>

      {showModal && (
        <View className='emergency-modal-overlay' onClick={() => setShowModal(false)}>
          <View className='emergency-modal' onClick={(e) => e.stopPropagation()}>
            <View className='modal-header'>
              <Text className='modal-icon'>🚨</Text>
              <Text className='modal-title'>紧急介入申请</Text>
              <Text className='modal-subtitle'>平台将在1小时内响应</Text>
            </View>

            <View className='modal-body'>
              <View className='form-item'>
                <Text className='form-label'>问题类型</Text>
                <Picker
                  mode='selector'
                  range={reasons}
                  value={reason}
                  onChange={(e) => setReason(e.detail.value)}
                >
                  <View className='picker-view'>
                    <Text>{reasons[reason]}</Text>
                    <Text className='arrow'>▼</Text>
                  </View>
                </Picker>
              </View>

              <View className='form-item'>
                <Text className='form-label'>详细描述*</Text>
                <Textarea
                  className='form-textarea'
                  placeholder='请详细描述遇到的问题，以便平台快速定位和处理...'
                  value={reasonDetail}
                  onInput={(e) => setReasonDetail(e.detail.value)}
                  maxlength={500}
                />
              </View>

              <View className='warning-box'>
                <Text className='warning-icon'>⚠️</Text>
                <Text className='warning-text'>
                  紧急介入将通知平台客服，请确保问题确实需要平台协助处理
                </Text>
              </View>
            </View>

            <View className='modal-actions'>
              <Button className='btn btn-cancel' onClick={() => setShowModal(false)}>
                取消
              </Button>
              <Button className='btn btn-submit' loading={loading} onClick={submit}>
                提交申请
              </Button>
            </View>
          </View>
        </View>
      )}
    </>
  )
}
