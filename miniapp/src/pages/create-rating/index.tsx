import { View, Text, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { ratingAPI } from '../../services/api'
import './index.scss'

interface Tag {
  id: string
  name: string
  type: 'positive' | 'negative'
}

export default function CreateRatingPage() {
  const router = useRouter()
  const { taskId, companyId, taskTitle } = router.params

  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const res = await ratingAPI.getTags()
      setTags(res.data || [])
    } catch (err) {
      console.error('获取标签失败:', err)
    }
  }

  const handleStarClick = (star: number) => {
    setRating(star)
  }

  const handleTagClick = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Taro.showToast({ title: '请选择评分', icon: 'none' })
      return
    }

    if (selectedTags.length === 0) {
      Taro.showToast({ title: '请至少选择一个标签', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      await ratingAPI.create({
        task_id: taskId!,
        ratee_id: companyId!,
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags,
        is_anonymous: isAnonymous
      })

      Taro.showToast({ title: '评价成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err) {
      console.error('提交评价失败:', err)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingText = (rating: number) => {
    const texts = ['', '非常不满意', '不满意', '一般', '满意', '非常满意']
    return texts[rating] || ''
  }

  const positiveTags = tags.filter(t => t.type === 'positive')
  const negativeTags = tags.filter(t => t.type === 'negative')

  return (
    <View className='create-rating-page'>
      <Text className='page-title'>评价企业</Text>

      {/* 任务信息 */}
      <View className='task-info-card'>
        <Text className='task-title'>{decodeURIComponent(taskTitle || '任务')}</Text>
        <Text className='company-name'>企业方</Text>
      </View>

      {/* 评分 */}
      <View className='rating-section'>
        <Text className='section-title'>整体评分</Text>
        <View className='stars-container'>
          {[1, 2, 3, 4, 5].map(star => (
            <Text
              key={star}
              className={`star ${star <= rating ? 'filled' : 'empty'}`}
              onClick={() => handleStarClick(star)}
            >
              ★
            </Text>
          ))}
        </View>
        {rating > 0 && (
          <Text className='rating-text'>{getRatingText(rating)}</Text>
        )}
      </View>

      {/* 正面标签 */}
      {positiveTags.length > 0 && (
        <View className='tags-section'>
          <Text className='section-title'>优点（可多选）</Text>
          <View className='tags-grid'>
            {positiveTags.map(tag => (
              <View
                key={tag.id}
                className={`tag-item positive ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                onClick={() => handleTagClick(tag.id)}
              >
                {tag.name}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 负面标签 */}
      {negativeTags.length > 0 && (
        <View className='tags-section'>
          <Text className='section-title'>需要改进（可多选）</Text>
          <View className='tags-grid'>
            {negativeTags.map(tag => (
              <View
                key={tag.id}
                className={`tag-item negative ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                onClick={() => handleTagClick(tag.id)}
              >
                {tag.name}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 评价内容 */}
      <View className='comment-section'>
        <Text className='section-title'>详细评价（选填）</Text>
        <Textarea
          className='comment-textarea'
          placeholder='分享你的真实体验，帮助其他学生做出更好的选择...'
          value={comment}
          onInput={(e) => setComment(e.detail.value)}
          maxlength={500}
        />
        <Text className='char-count'>{comment.length}/500</Text>
      </View>

      {/* 匿名选项 */}
      <View className='anonymous-section'>
        <View className='anonymous-option'>
          <View>
            <Text className='option-label'>匿名评价</Text>
            <Text className='option-desc'>企业方将看不到你的身份信息</Text>
          </View>
          <View
            className={`switch ${isAnonymous ? 'active' : ''}`}
            onClick={() => setIsAnonymous(!isAnonymous)}
          >
            <View className='switch-thumb' />
          </View>
        </View>
      </View>

      {/* 提交按钮 */}
      <View
        className={`submit-btn ${submitting || rating === 0 ? 'disabled' : ''}`}
        onClick={handleSubmit}
      >
        {submitting ? '提交中...' : '提交评价'}
      </View>
    </View>
  )
}
