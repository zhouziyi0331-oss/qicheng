import { View, Text, Button, Textarea, Checkbox } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface CooperationWillingnessProps {
  taskId: string
  studentId: string
  companyId: string
  onSubmitted?: () => void
}

export default function CooperationWillingness(props: CooperationWillingnessProps) {
  const { taskId, studentId, companyId, onSubmitted } = props
  const [willing, setWilling] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const positiveTags = [
    '工作态度好', '技术能力强', '沟通及时', '交付质量高',
    '理解能力强', '响应速度快', '专业可靠'
  ]

  const negativeTags = [
    '响应较慢', '理解有偏差', '需要多次修改', '沟通不够顺畅'
  ]

  const tags = willing ? positiveTags : willing === false ? negativeTags : []

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const submit = async () => {
    if (willing === null) {
      Taro.showToast({ title: '请选择是否愿意再次合作', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/acceptance/cooperation-willingness',
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
        data: {
          task_id: taskId,
          student_id: studentId,
          company_id: companyId,
          willing,
          reason,
          tags: selectedTags
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '提交成功', icon: 'success' })
        onSubmitted?.()
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='cooperation-willingness'>
      <View className='section-header'>
        <Text className='section-title'>🤝 合作意愿标记</Text>
        <Text className='section-subtitle'>您的评价将影响学生的推荐权重</Text>
      </View>

      <View className='willingness-options'>
        <View
          className={`option ${willing === true ? 'selected' : ''}`}
          onClick={() => setWilling(true)}
        >
          <Text className='option-icon'>✅</Text>
          <Text className='option-label'>愿意再次合作</Text>
        </View>

        <View
          className={`option ${willing === false ? 'selected' : ''}`}
          onClick={() => setWilling(false)}
        >
          <Text className='option-icon'>❌</Text>
          <Text className='option-label'>不愿再次合作</Text>
        </View>
      </View>

      {willing !== null && (
        <>
          <View className='tags-section'>
            <Text className='tags-title'>选择标签（可多选）</Text>
            <View className='tags-list'>
              {tags.map((tag) => (
                <View
                  key={tag}
                  className={`tag-item ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </View>
              ))}
            </View>
          </View>

          <View className='reason-section'>
            <Text className='reason-title'>补充说明（选填）</Text>
            <Textarea
              className='reason-textarea'
              placeholder='请简要说明原因...'
              value={reason}
              onInput={(e) => setReason(e.detail.value)}
              maxlength={200}
            />
          </View>

          <Button
            className='submit-btn'
            loading={loading}
            onClick={submit}
          >
            {loading ? '提交中...' : '提交评价'}
          </Button>
        </>
      )}
    </View>
  )
}
