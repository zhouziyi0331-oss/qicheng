import { View, Text, Textarea, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { opcV2API } from '../../services/api'
import './pre-questions.scss'

interface PreQuestion {
  id: string
  question: string
  placeholder: string
  maxLength: number
  hint: string
}

export default function OPCPreQuestions() {
  const [assessmentId, setAssessmentId] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const preQuestions: PreQuestion[] = [
    {
      id: 'q1',
      question: '用三个词描述"你眼中的自己"',
      placeholder: '例如：好奇、拆解、创造',
      maxLength: 20,
      hint: '这三个词会在后面的报告中被引用对比'
    },
    {
      id: 'q2',
      question: '写一件你觉得自己做得很厉害的事',
      placeholder: '可以是学习、工作、生活中的任何事情...\n\n不用谦虚，尽量具体地描述：\n- 你做了什么？\n- 遇到了什么困难？\n- 你是怎么解决的？\n- 最后的结果如何？',
      maxLength: 500,
      hint: '这段描述会帮助AI更准确地理解你的能力特点'
    }
  ]

  useEffect(() => {
    startAssessment()
  }, [])

  const startAssessment = async () => {
    try {
      const result = await opcV2API.startAssessment()
      if (result.success && result.data?.assessmentId) {
        setAssessmentId(result.data.assessmentId)

        // 保存到本地，支持断点续答
        Taro.setStorageSync('opc_assessment_id', result.data.assessmentId)
        Taro.setStorageSync('opc_pre_answers', {})
      } else {
        throw new Error(result.error?.message || '启动测试失败')
      }
    } catch (error: any) {
      console.error('启动测试失败:', error)
      Taro.showToast({
        title: error.message || '启动测试失败',
        icon: 'none',
        duration: 2000
      })
    }
  }

  const handleAnswerChange = (value: string) => {
    const currentQuestion = preQuestions[currentIndex]
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    // 实时保存到本地
    Taro.setStorageSync('opc_pre_answers', newAnswers)
  }

  const handleNext = async () => {
    const currentQuestion = preQuestions[currentIndex]
    const answer = answers[currentQuestion.id]?.trim()

    // 验证答案
    if (!answer) {
      Taro.showToast({
        title: '请回答当前问题',
        icon: 'none'
      })
      return
    }

    if (answer.length < 2) {
      Taro.showToast({
        title: '回答内容太短，请详细描述',
        icon: 'none'
      })
      return
    }

    // 提交当前答案到后端
    try {
      const result = await opcV2API.submitAnswer(assessmentId, {
        questionId: currentQuestion.id,
        answerType: 'definition',
        answerText: answer
      })

      if (!result.success) {
        throw new Error(result.error?.message || '提交失败')
      }

      // 进入下一题或完成前置题
      if (currentIndex < preQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // 前置题完成，跳转到选择题
        Taro.redirectTo({
          url: `/pages/opc-test/choice-questions?assessmentId=${assessmentId}`
        })
      }
    } catch (error: any) {
      console.error('提交答案失败:', error)
      Taro.showToast({
        title: error.message || '提交失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const currentQuestion = preQuestions[currentIndex]
  const currentAnswer = answers[currentQuestion.id] || ''

  return (
    <View className="opc-pre-questions-page">
      {/* 进度指示器 */}
      <View className="progress-bar">
        <View className="progress-fill" style={{ width: `${((currentIndex + 1) / preQuestions.length) * 100}%` }} />
      </View>

      <View className="content-container">
        {/* 问题编号 */}
        <View className="question-number">
          <Text className="number-text">前置题 {currentIndex + 1}/{preQuestions.length}</Text>
        </View>

        {/* 问题标题 */}
        <View className="question-title">
          <Text className="title-text">{currentQuestion.question}</Text>
        </View>

        {/* 答案输入框 */}
        <Textarea
          className="answer-input"
          placeholder={currentQuestion.placeholder}
          value={currentAnswer}
          onInput={(e) => handleAnswerChange(e.detail.value)}
          maxlength={currentQuestion.maxLength}
          autoHeight
          focus
        />

        {/* 字数统计 */}
        <View className="char-count">
          <Text className="count-text">{currentAnswer.length}/{currentQuestion.maxLength}</Text>
        </View>

        {/* 提示信息 */}
        <View className="hint-box">
          <Text className="hint-icon">💡</Text>
          <Text className="hint-text">{currentQuestion.hint}</Text>
        </View>

        {/* 按钮组 */}
        <View className="button-group">
          {currentIndex > 0 && (
            <Button className="prev-button" onClick={handlePrevious}>
              <Text className="button-text">上一题</Text>
            </Button>
          )}
          <Button
            className="next-button"
            onClick={handleNext}
            disabled={submitting || !currentAnswer.trim()}
          >
            <Text className="button-text">
              {currentIndex === preQuestions.length - 1 ? '开始测试' : '下一题'}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
