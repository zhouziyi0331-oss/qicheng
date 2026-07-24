import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

interface DataRow {
  label: string
  value: string
  highlight?: boolean
}

interface DataCard {
  rows: DataRow[]
}

interface TimelineNode {
  date: string
  label: string
  isNow?: boolean
}

interface Option {
  letter: 'A' | 'B' | 'C' | 'D'
  text: string
}

interface LevelUpSheetProps {
  visible: boolean
  fromLevel: number
  toLevel: number
  mentorText: string[]
  question: string
  options: Option[]
  mentorReply: string
  dataCards?: DataCard[]
  timeline?: TimelineNode[]
  onClose: () => void
  onConfirm: () => void
  onAnswer: (option: string) => void
}

export default function LevelUpSheet({
  visible,
  fromLevel,
  toLevel,
  mentorText,
  question,
  options,
  mentorReply,
  dataCards,
  timeline,
  onClose,
  onConfirm,
  onAnswer
}: LevelUpSheetProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [showReply, setShowReply] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [showCloseBtn, setShowCloseBtn] = useState(false)

  useEffect(() => {
    if (!visible) {
      // 重置状态
      setSelectedOption('')
      setShowReply(false)
      setShowButton(false)
      setShowCloseBtn(false)
    }
  }, [visible])

  const handleOptionClick = (option: string) => {
    if (selectedOption) return // 已选择，不能再改

    setSelectedOption(option)
    onAnswer(option)

    // 300ms后显示导师回复
    setTimeout(() => {
      setShowReply(true)
      // 滚动到底部
      setTimeout(() => {
        const query = Taro.createSelectorQuery()
        query.select('.sheet-body').boundingClientRect()
        query.exec((res) => {
          if (res[0]) {
            Taro.pageScrollTo({
              scrollTop: res[0].height,
              duration: 300
            })
          }
        })
      }, 50)
    }, 300)

    // 700ms后显示关闭按钮和晋级按钮
    setTimeout(() => {
      setShowCloseBtn(true)
      setShowButton(true)
    }, 700)
  }

  if (!visible) return null

  return (
    <View className="level-up-sheet-container">
      {/* 遮罩 */}
      <View className="sheet-backdrop" onClick={showCloseBtn ? onClose : undefined} />

      {/* 弹窗 */}
      <View className="sheet">
        {/* 拖拽条 */}
        <View className="sheet-handle" />

        {/* 导师信息栏 */}
        <View className="sheet-head">
          <View className="mentor-dot">🎓</View>
          <View>
            <View className="mentor-name">导师</View>
            <View className="mentor-role">陪你走过这条路的人</View>
          </View>
          <View
            className={`sheet-close ${showCloseBtn ? 'show' : ''}`}
            onClick={onClose}
          >
            ×
          </View>
        </View>

        {/* 对话区域（可滚动） */}
        <ScrollView
          scrollY
          className="sheet-body"
          scrollWithAnimation
        >
          {/* 导师讲述 */}
          <View className="mentor-block">
            {mentorText.map((text, index) => (
              <Text key={index} className="mentor-text">{text}</Text>
            ))}

            {/* 数据卡片 */}
            {dataCards && dataCards.map((card, cardIndex) => (
              <View key={cardIndex} className="data-card">
                {card.rows.map((row, rowIndex) => (
                  <View key={rowIndex} className="data-row">
                    <Text className="dk">{row.label}</Text>
                    <Text className={`dv ${row.highlight ? 'g' : 'd'}`}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            {/* 时间线 */}
            {timeline && (
              <View className="timeline">
                {timeline.map((node, index) => (
                  <View key={index} className="tl-item">
                    <View className={`tl-dot ${node.isNow ? 'now' : ''}`} />
                    <View className="tl-body">
                      <Text className="tl-date">{node.date}</Text>
                      <Text className={`tl-label ${node.isNow ? 'now' : ''}`}>
                        {node.label}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 导师回复（选择后显示） */}
          {showReply && (
            <View className="mentor-reply show">
              {mentorReply.split('\n\n').map((para, index) => (
                <Text key={index} className="mentor-text">{para}</Text>
              ))}
            </View>
          )}

          <View style={{ height: '4px' }} />
        </ScrollView>

        {/* 问题区域（固定） */}
        <View className="sheet-q">
          <View className="q-eyebrow">导师想问你</View>
          <View className="q-text">{question}</View>
          <View className="options">
            {options.map((option) => (
              <Button
                key={option.letter}
                className={`opt ${selectedOption === option.letter ? 'sel' : ''}`}
                onClick={() => handleOptionClick(option.letter)}
              >
                <View className="opt-letter">{option.letter}</View>
                <View className="opt-text">{option.text}</View>
              </Button>
            ))}
          </View>
        </View>

        {/* 晋级按钮 */}
        <View className="sheet-foot">
          <Button
            className={`lv-btn ${showButton ? 'show' : ''}`}
            onClick={onConfirm}
          >
            走，升 Lv.{toLevel}
          </Button>
        </View>
      </View>
    </View>
  )
}
