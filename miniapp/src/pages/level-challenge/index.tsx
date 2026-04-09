import { View, Text, Button, Radio, RadioGroup, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { studentAPI } from '../../services/api'
import './index.scss'

interface Question {
  id: string
  question: string
  type: 'single' | 'multiple' | 'text'
  options?: string[]
  minLength?: number
}

const QUESTIONS: Question[] = [
  {
    id: '1',
    question: '你使用过哪些AI工具？',
    type: 'multiple',
    options: ['ChatGPT', 'Claude', 'Midjourney', 'Stable Diffusion', 'GitHub Copilot', '其他']
  },
  {
    id: '2',
    question: '请描述你最近完成的一个AI相关项目（至少100字）',
    type: 'text',
    minLength: 100
  },
  {
    id: '3',
    question: '你对Prompt工程的理解程度？',
    type: 'single',
    options: ['完全不了解', '听说过但没实践', '有一些实践经验', '能熟练编写复杂Prompt', '能教别人写Prompt']
  },
  {
    id: '4',
    question: '你是否有过真实的AI项目交付经验？',
    type: 'single',
    options: ['没有', '有1-2个', '有3-5个', '有5个以上']
  },
  {
    id: '5',
    question: '请描述一个你用AI解决的实际问题（至少80字）',
    type: 'text',
    minLength: 80
  }
]

export default function LevelChallenge() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  const currentQuestion = QUESTIONS[currentStep]
  const isLastQuestion = currentStep === QUESTIONS.length - 1
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100

  const handleAnswer = (value: string | string[]) => {
    setAnswers({ ...answers, [currentQuestion.id]: value })
  }

  const handleNext = () => {
    const answer = answers[currentQuestion.id]

    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      Taro.showToast({ title: '请回答当前问题', icon: 'none' })
      return
    }

    if (currentQuestion.type === 'text' && currentQuestion.minLength) {
      const text = answer as string
      if (text.length < currentQuestion.minLength) {
        Taro.showToast({ title: `请至少输入${currentQuestion.minLength}字`, icon: 'none' })
        return
      }
    }

    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await studentAPI.submitLevelChallenge(answers)

      if (res.passed) {
        Taro.showModal({
          title: '恭喜！',
          content: `跳级成功，当前等级：Lv.${res.new_level}`,
          showCancel: false,
          success: () => {
            Taro.navigateTo({ url: '/pages/ability/index' })
          }
        })
      } else {
        Taro.showModal({
          title: '挑战未通过',
          content: `继续保持当前等级 Lv.${res.current_level}`,
          showCancel: false,
          success: () => {
            Taro.navigateTo({ url: '/pages/ability/index' })
          }
        })
      }
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="level-challenge-page">
      {/* 进度条 */}
      <View className="progress-section">
        <View className="progress-info">
          <Text className="progress-text">问题 {currentStep + 1} / {QUESTIONS.length}</Text>
          <Text className="progress-percent">{Math.round(progress)}%</Text>
        </View>
        <View className="progress-bar">
          <View className="progress-fill" style={{ width: `${progress}%` }} />
        </View>
      </View>

      {/* 问题卡片 */}
      <View className="question-card">
        <Text className="question-title">{currentQuestion.question}</Text>

        {/* 单选 */}
        {currentQuestion.type === 'single' && currentQuestion.options && (
          <RadioGroup onChange={(e) => handleAnswer(e.detail.value)}>
            <View className="options-list">
              {currentQuestion.options.map((option) => (
                <View
                  key={option}
                  className={`option-item ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                >
                  <Radio value={option} checked={answers[currentQuestion.id] === option} />
                  <Text className="option-text">{option}</Text>
                </View>
              ))}
            </View>
          </RadioGroup>
        )}

        {/* 多选 */}
        {currentQuestion.type === 'multiple' && currentQuestion.options && (
          <View className="options-list">
            {currentQuestion.options.map((option) => {
              const selected = (answers[currentQuestion.id] as string[] || []).includes(option)
              return (
                <View
                  key={option}
                  className={`option-item ${selected ? 'selected' : ''}`}
                  onClick={() => {
                    const current = (answers[currentQuestion.id] as string[]) || []
                    if (selected) {
                      handleAnswer(current.filter(v => v !== option))
                    } else {
                      handleAnswer([...current, option])
                    }
                  }}
                >
                  <View className={`checkbox ${selected ? 'checked' : ''}`}>
                    {selected && <Text className="check-icon">✓</Text>}
                  </View>
                  <Text className="option-text">{option}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* 文本 */}
        {currentQuestion.type === 'text' && (
          <View className="text-input-wrapper">
            <Textarea
              className="text-input"
              placeholder="请详细描述..."
              value={(answers[currentQuestion.id] as string) || ''}
              onInput={(e) => handleAnswer(e.detail.value)}
              maxlength={500}
            />
            <Text className="char-count">
              {((answers[currentQuestion.id] as string) || '').length} 字
            </Text>
          </View>
        )}
      </View>

      {/* 按钮 */}
      <View className="button-group">
        {currentStep > 0 && (
          <Button className="btn-secondary" onClick={handlePrev}>
            上一题
          </Button>
        )}
        <Button
          className="btn-primary"
          onClick={handleNext}
          loading={submitting}
        >
          {isLastQuestion ? '提交测试' : '下一题'}
        </Button>
      </View>

      {/* 提示 */}
      <View className="hint-box">
        <Text className="hint-text">💡 跳级测试会评估你的实际能力，请如实回答。通过后可跳过1-2个等级。</Text>
      </View>
    </View>
  )
}
