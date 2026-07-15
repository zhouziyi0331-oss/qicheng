import { View, Text, Textarea, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './open-question.scss'

export default function OpenQuestion2() {
  const router = useRouter()
  const { choiceAnswers: choiceAnswersStr, answer1 } = router.params
  const choiceAnswers = choiceAnswersStr ? JSON.parse(decodeURIComponent(choiceAnswersStr)) : []
  const openAnswer1 = answer1 ? decodeURIComponent(answer1) : ''

  const [text, setText] = useState('')
  const maxLength = 500

  const handleSubmit = async () => {
    if (!text.trim()) {
      Taro.showToast({ title: '请完成答题', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '生成结果中...' })

      // 计算六维能力得分
      const dimensionScores = calculateScores(choiceAnswers)

      // 保存结果到本地
      Taro.setStorageSync('opc_scores', dimensionScores)
      Taro.setStorageSync('opc_open_answers', [openAnswer1, text])

      Taro.hideLoading()

      // 跳转到结果页面
      setTimeout(() => {
        Taro.redirectTo({
          url: '/packageOnboarding/pages/opc-test/result'
        })
      }, 500)
    } catch (error) {
      console.error('提交测评失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    }
  }

  const handlePrev = () => {
    Taro.navigateBack()
  }

  // 计算六维得分
  const calculateScores = (answers: number[]) => {
    const QUESTIONS = [
      // 维度定义与quiz.tsx中相同
      { dim: 0, scores: [4, 2, 3, 1] },
      { dim: 0, scores: [4, 3, 2, 1] },
      { dim: 0, scores: [4, 2, 3, 1] },
      { dim: 0, scores: [4, 3, 2, 1] },
      { dim: 0, scores: [3, 2, 4, 1] },
      { dim: 0, scores: [4, 2, 3, 1] },
      { dim: 1, scores: [4, 2, 3, 1] },
      { dim: 1, scores: [4, 3, 2, 1] },
      { dim: 1, scores: [4, 2, 3, 1] },
      { dim: 1, scores: [4, 2, 1, 3] },
      { dim: 1, scores: [4, 3, 2, 1] },
      { dim: 1, scores: [4, 3, 1, 2] },
      { dim: 2, scores: [4, 2, 1, 3] },
      { dim: 2, scores: [4, 2, 3, 1] },
      { dim: 2, scores: [4, 2, 3, 1] },
      { dim: 2, scores: [4, 3, 2, 1] },
      { dim: 2, scores: [4, 3, 2, 1] },
      { dim: 2, scores: [4, 2, 3, 1] },
      { dim: 3, scores: [3, 4, 2, 1] },
      { dim: 3, scores: [4, 3, 2, 1] },
      { dim: 3, scores: [3, 4, 2, 1] },
      { dim: 3, scores: [3, 4, 2, 1] },
      { dim: 3, scores: [3, 4, 2, 1] },
      { dim: 3, scores: [2, 4, 3, 1] },
      { dim: 4, scores: [1, 4, 3, 2] },
      { dim: 4, scores: [1, 4, 3, 2] },
      { dim: 4, scores: [1, 4, 2, 3] },
      { dim: 4, scores: [1, 4, 2, 3] },
      { dim: 4, scores: [1, 4, 2, 3] },
      { dim: 4, scores: [1, 4, 3, 2] },
      { dim: 5, scores: [4, 2, 3, 1] },
      { dim: 5, scores: [4, 2, 3, 1] },
      { dim: 5, scores: [4, 2, 3, 1] },
      { dim: 5, scores: [4, 2, 3, 1] },
      { dim: 5, scores: [4, 3, 2, 1] },
      { dim: 5, scores: [4, 3, 2, 1] }
    ]

    const dimSums = [0, 0, 0, 0, 0, 0]
    const dimCounts = [0, 0, 0, 0, 0, 0]

    QUESTIONS.forEach((q, i) => {
      if (answers[i] !== null && answers[i] !== undefined) {
        dimSums[q.dim] += q.scores[answers[i]]
        dimCounts[q.dim]++
      }
    })

    // 归一化到0-100分
    return dimSums.map((sum, i) => {
      const maxPossible = dimCounts[i] * 4
      return Math.round(20 + (sum / maxPossible) * 80)
    })
  }

  return (
    <View className="open-question-page">
      {/* 顶部导航 */}
      <View className="open-header">
        <View className="header-bg" />
        <View className="header-content">
          <View className="topbar">
            <View className="back-btn" onClick={handlePrev}>
              <Text className="back-icon">‹</Text>
            </View>
            <Text className="topbar-title">开放题</Text>
            <Text className="question-counter">2 / 2</Text>
          </View>

          <View className="progress-dots">
            <View className="dot active" />
            <View className="dot active" />
          </View>

          <Text className="question-title">"什么事情让你沉浸忘我并且感受到成就感，哪怕是一件小事儿"</Text>
          <Text className="question-subtitle">越具体越好，一个细节就够了</Text>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView scrollY className="open-scroll">
        <View className="open-content">
          {/* 输入框 */}
          <View className="textarea-wrapper">
            <Textarea
              className="answer-textarea"
              placeholder="比如：帮朋友整理了一份混乱的文档，花了两小时，但看到最后整洁的样子特别满足……"
              placeholderClass="textarea-placeholder"
              value={text}
              onInput={(e) => setText(e.detail.value)}
              maxlength={maxLength}
              autoHeight
            />
            <View className="char-count">
              <Text className="count-text">{text.length} / {maxLength}字</Text>
            </View>
          </View>

          {/* 提示卡片 */}
          <View className="hint-card">
            <Text className="hint-title">思考提示</Text>
            <View className="hint-list">
              <View className="hint-item">
                <Text className="hint-dot">·</Text>
                <Text className="hint-text">可以是工作、学习、生活中的任何事</Text>
              </View>
              <View className="hint-item">
                <Text className="hint-dot">·</Text>
                <Text className="hint-text">不需要是"大事"，越日常越真实</Text>
              </View>
              <View className="hint-item">
                <Text className="hint-dot">·</Text>
                <Text className="hint-text">描述当时的感受，而不只是结果</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="open-footer">
        <View className="prev-button" onClick={handlePrev}>
          <Text className="button-text">上一步</Text>
        </View>
        <View className="next-button" onClick={handleSubmit}>
          <Text className="button-text">提交测试 →</Text>
        </View>
      </View>
    </View>
  )
}
