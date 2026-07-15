import { View, Text, Button, Radio, RadioGroup } from '@tarojs/components'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import './test-questions.scss'

interface Question {
  id: string
  question: string
  options: string[]
}

export default function TestQuestions() {
  const router = useRouter()
  const { testId, targetLevel, questions: questionsParam } = router.params
  const questions: Question[] = JSON.parse(decodeURIComponent(questionsParam || '[]'))

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const hasAnswer = answers[currentQuestion?.id] !== undefined

  const handleAnswerChange = (e: any) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: parseInt(e.detail.value)
    })
  }

  const handleNext = () => {
    if (!hasAnswer) {
      Taro.showToast({ title: '请选择答案', icon: 'none' })
      return
    }
    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      Taro.showModal({
        title: '提示',
        content: `还有${questions.length - Object.keys(answers).length}道题未作答，确定提交吗？`,
        success: (res) => {
          if (res.confirm) {
            submitAnswers()
          }
        }
      })
    } else {
      submitAnswers()
    }
  }

  const submitAnswers = async () => {
    try {
      setSubmitting(true)
      Taro.showLoading({ title: '提交中...' })
      const token = tokenManager.getAccessToken()
      const res = await Taro.request({
        url: getApiUrl('/api/v1/student/submit-skip-test'),
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: { testId, answers }
      })
      Taro.hideLoading()
      if (res.data.success) {
        Taro.redirectTo({
          url: `/packageAdvanced/pages/level-up/test-result?testId=${testId}&passed=${res.data.data.passed}&score=${res.data.data.score}&targetLevel=${targetLevel}`
        })
      } else {
        Taro.showToast({ title: res.data.message || '提交失败', icon: 'none' })
      }
    } catch (err) {
      Taro.hideLoading()
      console.error('提交测试失败:', err)
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!currentQuestion) {
    return (
      <View className="test-questions-page">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className="test-questions-page">
      <View className="progress-bar">
        <View className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </View>

      <View className="question-header">
        <Text className="question-number">第 {currentIndex + 1} / {questions.length} 题</Text>
        <Text className="target-level">目标：Lv.{targetLevel}</Text>
      </View>

      <View className="question-card">
        <Text className="question-text">{currentQuestion.question}</Text>
        <RadioGroup onChange={handleAnswerChange}>
          {currentQuestion.options.map((option, index) => (
            <View key={index} className="option-item">
              <Radio
                value={String(index)}
                checked={answers[currentQuestion.id] === index}
                className="option-radio"
              />
              <Text className="option-text">{option}</Text>
            </View>
          ))}
        </RadioGroup>
      </View>

      <View className="action-buttons">
        <Button
          className="btn-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <Text className="btn-text">上一题</Text>
        </Button>
        <Button
          className="btn-next"
          onClick={handleNext}
          disabled={submitting}
        >
          <Text className="btn-text">
            {isLastQuestion ? '提交' : '下一题'}
          </Text>
        </Button>
      </View>

      <View className="answer-status">
        {questions.map((q, index) => (
          <View
            key={index}
            className={`status-dot ${answers[q.id] !== undefined ? 'answered' : ''} ${index === currentIndex ? 'current' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </View>
    </View>
  )
}
