import { View, Text, Textarea, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { lifeQuestionAPI } from '../../services/api'
import './index.scss'

export default function LifeQuestion() {
  const [question, setQuestion] = useState('')
  const [existingQuestion, setExistingQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadQuestion()
  }, [])

  const loadQuestion = async () => {
    try {
      const user = Taro.getStorageSync('user')
      if (!user || !user.id) return

      const result = await lifeQuestionAPI.get(user.id)
      if (result.success && result.question) {
        setExistingQuestion(result.question)
        setQuestion(result.question.question)
      }
    } catch (error) {
      console.error('加载目标失败:', error)
    }
  }

  const handleSave = async () => {
    if (!question.trim()) {
      Taro.showToast({ title: '请输入你的目标', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      const user = Taro.getStorageSync('user')
      if (!user || !user.id) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      await lifeQuestionAPI.save(user.id, question)
      Taro.showToast({ title: '已保存', icon: 'success' })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="life-question-page">
      <View className="header">
        <Text className="title">你当下最想探索的目标是什么？</Text>
        <Text className="subtitle">不是职业规划问题，不是技能学习问题，是你真正好奇的、困惑的、想探索的</Text>
      </View>

      <View className="examples">
        <Text className="examples-title">示例：</Text>
        <View className="example-item">
          <Text className="example-text">• 我想知道自己真正喜欢什么</Text>
        </View>
        <View className="example-item">
          <Text className="example-text">• 我想找到自己的节奏，不是别人的节奏</Text>
        </View>
        <View className="example-item">
          <Text className="example-text">• 我想看看AI能帮我做什么我自己做不到的事</Text>
        </View>
      </View>

      <View className="input-section">
        <Textarea
          className="question-input"
          placeholder="写下你的目标..."
          value={question}
          onInput={(e) => setQuestion(e.detail.value)}
          maxlength={200}
          autoHeight
        />
        <Text className="char-count">{question.length}/200</Text>
      </View>

      <View className="hint-section">
        <Text className="hint-title">AI导师会怎么用这个目标？</Text>
        <View className="hint-item">
          <Text className="hint-icon">✦</Text>
          <Text className="hint-text">在项目执行中，会问："这个项目和你的目标有关系吗？"</Text>
        </View>
        <View className="hint-item">
          <Text className="hint-icon">✦</Text>
          <Text className="hint-text">在卡点时，会问："这个卡点是不是和你的目标有关？"</Text>
        </View>
        <View className="hint-item">
          <Text className="hint-icon">✦</Text>
          <Text className="hint-text">在完成时，会问："这个项目让你对自己的目标有新的看法吗？"</Text>
        </View>
      </View>

      <Button
        className="save-btn"
        onClick={handleSave}
        loading={loading}
        disabled={loading}
      >
        {existingQuestion ? '更新我的目标' : '保存我的目标'}
      </Button>
    </View>
  )
}
