import { View, Text, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { opcV2API } from '../../services/api'
import './choice-questions.scss'

interface ChoiceOption {
  value: string
  label: string
}

interface Question {
  id: string
  text: string
  options: ChoiceOption[]
}

export default function OPCChoiceQuestions() {
  const router = useRouter()
  const { assessmentId } = router.params

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  // 36道选择题
  const questions: Question[] = [
    // 开放性维度 (6题)
    { id: 'c1', text: '面对新事物时，你通常会？', options: [
      { value: 'A', label: '立刻尝试，充满好奇' },
      { value: 'B', label: '观察一下再决定' },
      { value: 'C', label: '等别人试过再说' },
      { value: 'D', label: '保持现状就好' }
    ]},
    { id: 'c2', text: '在学习新技能时，你更倾向于？', options: [
      { value: 'A', label: '探索多种方法，找到最适合自己的' },
      { value: 'B', label: '按照教程一步步来' },
      { value: 'C', label: '跟着别人学' },
      { value: 'D', label: '用最简单的方式完成' }
    ]},
    { id: 'c3', text: '遇到问题时，你会？', options: [
      { value: 'A', label: '从多个角度思考解决方案' },
      { value: 'B', label: '用以往的经验处理' },
      { value: 'C', label: '询问他人意见' },
      { value: 'D', label: '等问题自己解决' }
    ]},
    { id: 'c4', text: '对于不熟悉的领域，你的态度是？', options: [
      { value: 'A', label: '主动了解，拓展视野' },
      { value: 'B', label: '有需要时再学' },
      { value: 'C', label: '不太感兴趣' },
      { value: 'D', label: '完全不关注' }
    ]},
    { id: 'c5', text: '在团队讨论中，你更可能？', options: [
      { value: 'A', label: '提出创新的想法' },
      { value: 'B', label: '分析现有方案的优劣' },
      { value: 'C', label: '支持大多数人的意见' },
      { value: 'D', label: '保持沉默' }
    ]},
    { id: 'c6', text: '面对变化，你的反应是？', options: [
      { value: 'A', label: '兴奋，期待新可能' },
      { value: 'B', label: '谨慎，需要时间适应' },
      { value: 'C', label: '不安，希望保持稳定' },
      { value: 'D', label: '抗拒，不想改变' }
    ]},

    // 坚持性维度 (6题)
    { id: 'c7', text: '遇到困难时，你会？', options: [
      { value: 'A', label: '坚持到底，直到解决' },
      { value: 'B', label: '尝试一段时间' },
      { value: 'C', label: '容易放弃' },
      { value: 'D', label: '立刻放弃' }
    ]},
    { id: 'c8', text: '对于长期目标，你的态度是？', options: [
      { value: 'A', label: '制定计划并严格执行' },
      { value: 'B', label: '有计划但灵活调整' },
      { value: 'C', label: '想到就做，没有计划' },
      { value: 'D', label: '很少设定长期目标' }
    ]},
    { id: 'c9', text: '在枯燥的任务中，你能？', options: [
      { value: 'A', label: '保持专注直到完成' },
      { value: 'B', label: '中途休息几次' },
      { value: 'C', label: '很难集中注意力' },
      { value: 'D', label: '无法坚持' }
    ]},
    { id: 'c10', text: '面对挫折，你会？', options: [
      { value: 'A', label: '分析原因，继续努力' },
      { value: 'B', label: '休息后再尝试' },
      { value: 'C', label: '感到沮丧，难以继续' },
      { value: 'D', label: '彻底放弃' }
    ]},
    { id: 'c11', text: '对于重复性工作，你的表现是？', options: [
      { value: 'A', label: '保持高质量完成' },
      { value: 'B', label: '质量会有波动' },
      { value: 'C', label: '容易出错' },
      { value: 'D', label: '无法忍受' }
    ]},
    { id: 'c12', text: '在长期项目中，你的状态是？', options: [
      { value: 'A', label: '始终保持动力' },
      { value: 'B', label: '动力会逐渐减弱' },
      { value: 'C', label: '很快失去兴趣' },
      { value: 'D', label: '无法坚持长期项目' }
    ]},

    // 创造力维度 (6题)
    { id: 'c13', text: '在解决问题时，你更倾向于？', options: [
      { value: 'A', label: '创造全新的方法' },
      { value: 'B', label: '改进现有方法' },
      { value: 'C', label: '使用标准方法' },
      { value: 'D', label: '等待他人解决' }
    ]},
    { id: 'c14', text: '对于创意工作，你的感觉是？', options: [
      { value: 'A', label: '充满灵感，享受过程' },
      { value: 'B', label: '有时有想法' },
      { value: 'C', label: '很少有创意' },
      { value: 'D', label: '完全没有创意' }
    ]},
    { id: 'c15', text: '在头脑风暴中，你能？', options: [
      { value: 'A', label: '提出大量独特想法' },
      { value: 'B', label: '提出一些想法' },
      { value: 'C', label: '很少发言' },
      { value: 'D', label: '没有想法' }
    ]},
    { id: 'c16', text: '面对限制条件，你会？', options: [
      { value: 'A', label: '找到创新的突破口' },
      { value: 'B', label: '在限制内寻找方案' },
      { value: 'C', label: '感到束缚' },
      { value: 'D', label: '无法应对' }
    ]},
    { id: 'c17', text: '对于艺术和设计，你的态度是？', options: [
      { value: 'A', label: '有独特的审美和想法' },
      { value: 'B', label: '能欣赏但不擅长创作' },
      { value: 'C', label: '不太感兴趣' },
      { value: 'D', label: '完全不关注' }
    ]},
    { id: 'c18', text: '在日常生活中，你会？', options: [
      { value: 'A', label: '经常想出新点子' },
      { value: 'B', label: '偶尔有新想法' },
      { value: 'C', label: '很少有新想法' },
      { value: 'D', label: '从不思考新事物' }
    ]},

    // 学习力维度 (6题)
    { id: 'c19', text: '学习新知识时，你的速度是？', options: [
      { value: 'A', label: '很快掌握要点' },
      { value: 'B', label: '需要一些时间' },
      { value: 'C', label: '学得比较慢' },
      { value: 'D', label: '很难学会' }
    ]},
    { id: 'c20', text: '对于复杂概念，你能？', options: [
      { value: 'A', label: '快速理解并应用' },
      { value: 'B', label: '理解但应用困难' },
      { value: 'C', label: '理解困难' },
      { value: 'D', label: '完全无法理解' }
    ]},
    { id: 'c21', text: '在学习过程中，你会？', options: [
      { value: 'A', label: '主动总结规律' },
      { value: 'B', label: '按部就班学习' },
      { value: 'C', label: '被动接受' },
      { value: 'D', label: '很少思考' }
    ]},
    { id: 'c22', text: '面对不懂的内容，你会？', options: [
      { value: 'A', label: '主动查资料深入研究' },
      { value: 'B', label: '询问他人' },
      { value: 'C', label: '跳过不管' },
      { value: 'D', label: '放弃学习' }
    ]},
    { id: 'c23', text: '对于知识的掌握，你的标准是？', options: [
      { value: 'A', label: '深入理解原理' },
      { value: 'B', label: '会用就行' },
      { value: 'C', label: '知道大概' },
      { value: 'D', label: '没有标准' }
    ]},
    { id: 'c24', text: '在学习新技能后，你会？', options: [
      { value: 'A', label: '立刻实践应用' },
      { value: 'B', label: '等待机会使用' },
      { value: 'C', label: '很少使用' },
      { value: 'D', label: '从不使用' }
    ]},

    // 协作力维度 (6题)
    { id: 'c25', text: '在团队中，你更倾向于？', options: [
      { value: 'A', label: '主动协调，促进合作' },
      { value: 'B', label: '完成自己的部分' },
      { value: 'C', label: '被动配合' },
      { value: 'D', label: '独自工作' }
    ]},
    { id: 'c26', text: '面对团队冲突，你会？', options: [
      { value: 'A', label: '主动调解，寻找共识' },
      { value: 'B', label: '表达自己的观点' },
      { value: 'C', label: '保持中立' },
      { value: 'D', label: '回避冲突' }
    ]},
    { id: 'c27', text: '对于他人的意见，你会？', options: [
      { value: 'A', label: '认真倾听并整合' },
      { value: 'B', label: '选择性采纳' },
      { value: 'C', label: '很少采纳' },
      { value: 'D', label: '坚持己见' }
    ]},
    { id: 'c28', text: '在团队决策中，你的角色是？', options: [
      { value: 'A', label: '推动达成共识' },
      { value: 'B', label: '提供建议' },
      { value: 'C', label: '跟随多数' },
      { value: 'D', label: '不参与决策' }
    ]},
    { id: 'c29', text: '对于团队成员的困难，你会？', options: [
      { value: 'A', label: '主动提供帮助' },
      { value: 'B', label: '被请求时帮忙' },
      { value: 'C', label: '很少帮助' },
      { value: 'D', label: '不关心他人' }
    ]},
    { id: 'c30', text: '在团队沟通中，你的表现是？', options: [
      { value: 'A', label: '清晰表达，积极反馈' },
      { value: 'B', label: '能表达基本想法' },
      { value: 'C', label: '沟通困难' },
      { value: 'D', label: '很少沟通' }
    ]},

    // 抗压力维度 (6题)
    { id: 'c31', text: '面对压力，你的反应是？', options: [
      { value: 'A', label: '保持冷静，有条不紊' },
      { value: 'B', label: '有些紧张但能应对' },
      { value: 'C', label: '容易焦虑' },
      { value: 'D', label: '无法承受' }
    ]},
    { id: 'c32', text: '在紧急情况下，你能？', options: [
      { value: 'A', label: '快速做出正确决策' },
      { value: 'B', label: '需要时间思考' },
      { value: 'C', label: '难以决策' },
      { value: 'D', label: '完全慌乱' }
    ]},
    { id: 'c33', text: '对于多任务并行，你的感觉是？', options: [
      { value: 'A', label: '游刃有余' },
      { value: 'B', label: '能够应对' },
      { value: 'C', label: '感到吃力' },
      { value: 'D', label: '无法处理' }
    ]},
    { id: 'c34', text: '在高强度工作后，你的恢复速度是？', options: [
      { value: 'A', label: '很快恢复精力' },
      { value: 'B', label: '需要一段时间' },
      { value: 'C', label: '恢复很慢' },
      { value: 'D', label: '长期疲惫' }
    ]},
    { id: 'c35', text: '面对批评，你会？', options: [
      { value: 'A', label: '客观分析，积极改进' },
      { value: 'B', label: '接受但有些不适' },
      { value: 'C', label: '感到受伤' },
      { value: 'D', label: '无法接受' }
    ]},
    { id: 'c36', text: '在不确定的环境中，你的状态是？', options: [
      { value: 'A', label: '适应良好' },
      { value: 'B', label: '能够适应' },
      { value: 'C', label: '感到不安' },
      { value: 'D', label: '极度焦虑' }
    ]}
  ]

  useEffect(() => {
    // 尝试恢复断点
    const savedAnswers = Taro.getStorageSync('opc_choice_answers')
    const savedIndex = Taro.getStorageSync('opc_choice_index')

    if (savedAnswers && Object.keys(savedAnswers).length > 0) {
      setAnswers(savedAnswers)
      setCurrentIndex(savedIndex || 0)

      Taro.showModal({
        title: '继续测试',
        content: `检测到未完成的测试，已完成${Object.keys(savedAnswers).length}题，是否继续？`,
        confirmText: '继续',
        cancelText: '重新开始',
        success: (res) => {
          if (!res.confirm) {
            // 重新开始
            setAnswers({})
            setCurrentIndex(0)
            Taro.removeStorageSync('opc_choice_answers')
            Taro.removeStorageSync('opc_choice_index')
          }
        }
      })
    }
  }, [])

  const handleSelectOption = async (value: string) => {
    const currentQuestion = questions[currentIndex]
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    // 实时保存到本地
    Taro.setStorageSync('opc_choice_answers', newAnswers)
    Taro.setStorageSync('opc_choice_index', currentIndex)

    // 提交答案到后端
    try {
      await opcV2API.submitAnswer(assessmentId!, {
        questionId: currentQuestion.id,
        answerType: 'choice',
        selectedOption: value
      })
    } catch (error) {
      console.error('提交答案失败:', error)
    }

    // 自动进入下一题
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // 所有题目完成，提交测试
        handleSubmit()
      }
    }, 300)
  }

  const handleSubmit = async () => {
    setAnalyzing(true)

    try {
      // 完成测试
      const result = await opcV2API.completeAssessment(assessmentId!)

      if (result.success) {
        // 清除本地缓存
        Taro.removeStorageSync('opc_assessment_id')
        Taro.removeStorageSync('opc_pre_answers')
        Taro.removeStorageSync('opc_choice_answers')
        Taro.removeStorageSync('opc_choice_index')

        // 显示分析动画
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/opc-test/result?assessmentId=${assessmentId}`
          })
        }, 3000)
      } else {
        throw new Error(result.error?.message || '提交失败')
      }
    } catch (error: any) {
      setAnalyzing(false)
      console.error('提交测试失败:', error)
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
      Taro.setStorageSync('opc_choice_index', currentIndex - 1)
    }
  }

  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentQuestion.id]
  const progress = ((currentIndex + 1) / questions.length) * 100

  if (analyzing) {
    return (
      <View className="analyzing-page">
        <View className="analyzing-content">
          <View className="analyzing-animation">
            <View className="pulse-ring" />
            <View className="pulse-ring" />
            <View className="pulse-ring" />
          </View>
          <Text className="analyzing-title">AI正在分析你的画像...</Text>
          <Text className="analyzing-subtitle">这可能需要几秒钟</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="opc-choice-questions-page">
      {/* 进度条 */}
      <View className="progress-bar">
        <View className="progress-fill" style={{ width: `${progress}%` }} />
      </View>

      <View className="content-container">
        {/* 问题编号 */}
        <View className="question-number">
          <Text className="number-text">第 {currentIndex + 1}/{questions.length} 题</Text>
        </View>

        {/* 问题文本 */}
        <View className="question-text">
          <Text className="text-content">{currentQuestion.text}</Text>
        </View>

        {/* 选项列表 */}
        <View className="options-list">
          {currentQuestion.options.map((option) => (
            <View
              key={option.value}
              className={`option-item ${currentAnswer === option.value ? 'selected' : ''}`}
              onClick={() => handleSelectOption(option.value)}
            >
              <View className="option-radio">
                {currentAnswer === option.value && <View className="radio-dot" />}
              </View>
              <Text className="option-label">{option.label}</Text>
            </View>
          ))}
        </View>

        {/* 底部按钮 */}
        <View className="bottom-actions">
          {currentIndex > 0 && (
            <Button className="prev-button" onClick={handlePrevious}>
              <Text className="button-text">上一题</Text>
            </Button>
          )}
          <View className="progress-text">
            <Text className="progress-number">{currentIndex + 1}</Text>
            <Text className="progress-total">/{questions.length}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
