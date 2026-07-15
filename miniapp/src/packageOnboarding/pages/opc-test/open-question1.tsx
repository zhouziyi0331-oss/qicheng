import { View, Text, Textarea, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './open-question.scss'

export default function OpenQuestion1() {
  const router = useRouter()
  const { answers: answersStr } = router.params
  const choiceAnswers = answersStr ? JSON.parse(decodeURIComponent(answersStr)) : []

  const [text, setText] = useState('')
  const maxLength = 500

  const handleNext = () => {
    if (!text.trim()) {
      Taro.showToast({ title: '请完成答题', icon: 'none' })
      return
    }

    // 传递选择题答案和第一题开放题答案
    Taro.navigateTo({
      url: `/packageOnboarding/pages/opc-test/open-question2?choiceAnswers=${encodeURIComponent(JSON.stringify(choiceAnswers))}&answer1=${encodeURIComponent(text)}`
    })
  }

  const handlePrev = () => {
    Taro.navigateBack()
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
            <Text className="question-counter">1 / 2</Text>
          </View>

          <View className="progress-dots">
            <View className="dot active" />
            <View className="dot" />
          </View>

          <Text className="question-title">"去掉你的工作，去掉你的学校，你还是谁？"</Text>
          <Text className="question-subtitle">没有标准答案，写下你的真实感受就好</Text>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView scrollY className="open-scroll">
        <View className="open-content">
          {/* 输入框 */}
          <View className="textarea-wrapper">
            <Textarea
              className="answer-textarea"
              placeholder="比如：我是一个喜欢把复杂事情讲清楚的人……"
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
                <Text className="hint-text">你在什么时候感觉最像自己？</Text>
              </View>
              <View className="hint-item">
                <Text className="hint-dot">·</Text>
                <Text className="hint-text">别人常常来找你帮忙做什么事？</Text>
              </View>
              <View className="hint-item">
                <Text className="hint-dot">·</Text>
                <Text className="hint-text">如果不需要赚钱，你会花时间做什么？</Text>
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
        <View className="next-button" onClick={handleNext}>
          <Text className="button-text">下一题 →</Text>
        </View>
      </View>
    </View>
  )
}
