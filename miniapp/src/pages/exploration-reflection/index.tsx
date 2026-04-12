import { View, Text, Textarea } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import api from '../../services/api'
import './index.scss'

/**
 * 探索反思页面
 *
 * 核心理念：不只是"评价任务"，而是"发现新模式"
 * - 这个项目让你发现了什么新模式？
 * - 你在这个项目中找到了什么更好的做法？
 * - 你会把这个模式用到生活的其他地方吗？
 */

export default function ExplorationReflection() {
  const router = useRouter()
  const { taskId, taskTitle } = router.params

  const [reflections, setReflections] = useState({
    newPattern: '',
    betterWay: '',
    lifeApplication: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reflections.newPattern.trim() || !reflections.betterWay.trim()) {
      Taro.showToast({ title: '请完成前两个问题', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      const studentId = Taro.getStorageSync('userId')

      const reflectionData = [
        { type: 'new_pattern', text: reflections.newPattern },
        { type: 'better_way', text: reflections.betterWay },
        { type: 'life_application', text: reflections.lifeApplication }
      ]

      await api.exploration.submitReflection(studentId, taskId, reflectionData)

      Taro.showToast({ title: '反思已保存', icon: 'success' })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交反思失败:', error)
      Taro.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='exploration-reflection-page'>
      {/* 顶部说明 */}
      <View className='header-card'>
        <View className='header-icon'>🌱</View>
        <View className='header-content'>
          <View className='header-title'>探索反思</View>
          <View className='header-desc'>
            不只是完成任务，更重要的是发现新模式
          </View>
        </View>
      </View>

      {/* 任务信息 */}
      <View className='task-info'>
        <View className='task-label'>刚完成的项目</View>
        <View className='task-title'>{taskTitle || '项目名称'}</View>
      </View>

      {/* 反思问题 */}
      <View className='reflection-section'>
        <View className='question-card'>
          <View className='question-header'>
            <View className='question-icon'>💡</View>
            <View className='question-title'>发现了什么新模式？</View>
          </View>
          <View className='question-hint'>
            不是"学会了XX技能"，而是"发现了XX这种做法"
          </View>
          <Textarea
            className='reflection-input'
            placeholder='例如：我发现先画草图再做设计，效率会高很多'
            value={reflections.newPattern}
            onInput={(e) => setReflections({ ...reflections, newPattern: e.detail.value })}
            maxlength={500}
          />
          <View className='char-count'>{reflections.newPattern.length}/500</View>
        </View>

        <View className='question-card'>
          <View className='question-header'>
            <View className='question-icon'>✨</View>
            <View className='question-title'>找到了什么更好的做法？</View>
          </View>
          <View className='question-hint'>
            有没有发现比之前更好的方法？
          </View>
          <Textarea
            className='reflection-input'
            placeholder='例如：我发现用Figma的组件功能，可以快速复用设计'
            value={reflections.betterWay}
            onInput={(e) => setReflections({ ...reflections, betterWay: e.detail.value })}
            maxlength={500}
          />
          <View className='char-count'>{reflections.betterWay.length}/500</View>
        </View>

        <View className='question-card'>
          <View className='question-header'>
            <View className='question-icon'>🌍</View>
            <View className='question-title'>会用到生活的其他地方吗？</View>
          </View>
          <View className='question-hint'>
            这个模式可以应用到学习、工作、生活的其他场景吗？
          </View>
          <Textarea
            className='reflection-input'
            placeholder='例如：这种"先整体后细节"的思路，我可以用在写论文上'
            value={reflections.lifeApplication}
            onInput={(e) => setReflections({ ...reflections, lifeApplication: e.detail.value })}
            maxlength={500}
          />
          <View className='char-count'>{reflections.lifeApplication.length}/500</View>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View className='submit-btn' onClick={handleSubmit}>
          {submitting ? '保存中...' : '完成反思'}
        </View>
        <View className='skip-btn' onClick={() => Taro.navigateBack()}>
          暂时跳过
        </View>
      </View>
    </View>
  )
}
