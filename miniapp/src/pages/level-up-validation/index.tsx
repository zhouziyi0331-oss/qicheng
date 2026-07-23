import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { levelUpValidationAPI } from '../../services/api'
import catLogo from '../../assets/images/cat-logo.png'
import './index.scss'

interface ValidationData {
  fromLevel: number
  toLevel: number
  mentorMessages: string[]
  question: {
    eyebrow: string
    text: string
    options: Array<{
      letter: string
      text: string
    }>
  }
  mentorReply: string
  timeline?: Array<{
    date: string
    label: string
    isNow?: boolean
  }>
  dataCard?: Array<{
    label: string
    value: string
    isGood?: boolean
  }>
}

export default function LevelUpValidation() {
  const [validation, setValidation] = useState<ValidationData | null>(null)
  const [selectedOption, setSelectedOption] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [loading, setLoading] = useState(true)

  useLoad((options) => {
    const targetLevel = parseInt(options.targetLevel || '1')
    loadValidationData(targetLevel)
  })

  const loadValidationData = async (targetLevel: number) => {
    try {
      setLoading(true)

      // 调用真实API
      const res = await levelUpValidationAPI.generate(targetLevel)

      if (res.success && res.data) {
        // 将后端数据转换为前端格式
        const data: ValidationData = {
          fromLevel: res.data.fromLevel || targetLevel - 1,
          toLevel: res.data.toLevel || targetLevel,
          mentorMessages: res.data.mentorMessages || [],
          question: {
            eyebrow: res.data.question?.eyebrow || '导师想问你',
            text: res.data.question?.text || '',
            options: res.data.question?.options || []
          },
          mentorReply: res.data.mentorReply || '好。\n\n走吧。',
          timeline: res.data.timeline,
          dataCard: res.data.dataCard
        }

        setValidation(data)
      } else {
        throw new Error('数据格式错误')
      }

      setLoading(false)

    } catch (error: any) {
      console.error('加载验证数据失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })

      // 加载失败后使用模拟数据
      const mockData: ValidationData = getMockData(targetLevel)
      setValidation(mockData)
      setLoading(false)
    }
  }

  const getMockData = (targetLevel: number): ValidationData => {
    const dataMap = {
      1: {
        fromLevel: 0,
        toLevel: 1,
        mentorMessages: [
          '第一单做完了。',
          '我记得你来那天，问卷给自己AI的熟悉度打了 2分，工具只用过 ChatGPT。',
          '做《写小红书文案》的时候，你卡在"怎么让AI写出真人的调性"。后来你自己想出了一个办法，一步一步做完了。'
        ],
        dataCard: [
          { label: '客户评分', value: '4.8 / 5.0', isGood: true },
          { label: '客户评语', value: '"比预期的好，文案有自己的风格"' },
          { label: '到账时间', value: '昨天下午 3:17' },
          { label: '到账金额', value: '¥ 80.00' }
        ],
        question: {
          eyebrow: '导师想问你',
          text: '这几个瞬间里，哪一个让你觉得"嗯，好像我真的可以"？',
          options: [
            { letter: 'A', text: '卡住之后，自己想办法想通了' },
            { letter: 'B', text: '看到客户说"比预期的好"' },
            { letter: 'C', text: '收到钱的那一刻' },
            { letter: 'D', text: '其实都没有，但我做完了' }
          ]
        },
        mentorReply: '好。我记住了。\n\n走吧，Lv.1 了。'
      },
      2: {
        fromLevel: 1,
        toLevel: 2,
        mentorMessages: [
          '三单了。我翻了一下你第一单和这一单，有件事你应该知道。'
        ],
        dataCard: [
          { label: '第1单 · 修改次数', value: '3 次' },
          { label: '第3单 · 修改次数', value: '0 次，直接过', isGood: true },
          { label: '第1单 · 问导师次数', value: '5 次' },
          { label: '第3单 · 问导师次数', value: '0 次，自己做完了', isGood: true }
        ],
        question: {
          eyebrow: '导师想问你',
          text: '你觉得，是什么不一样了？',
          options: [
            { letter: 'A', text: '工具用熟了，不用想就知道点哪里' },
            { letter: 'B', text: '拿到任务大概知道该做什么了' },
            { letter: 'C', text: '不那么慌了' },
            { letter: 'D', text: '我其实没觉得有什么不一样，就是做完了' }
          ]
        },
        mentorReply: '行。不管是哪种，三单都做完了。\n\n走，Lv.2。'
      },
      3: {
        fromLevel: 2,
        toLevel: 3,
        mentorMessages: [
          '五单了。我看了一下你做过的东西，有一个事挺明显的。'
        ],
        dataCard: [
          { label: '文案创作类 · 3单', value: '均分 4.7 · 最快2天', isGood: true },
          { label: '其他类型 · 2单', value: '均分 4.1' }
        ],
        question: {
          eyebrow: '导师想问你',
          text: '你自己觉得，你擅长做"文案创作类"吗？',
          options: [
            { letter: 'A', text: '是，我做这个确实顺手' },
            { letter: 'B', text: '好像是，但我没仔细想过' },
            { letter: 'C', text: '不，我觉得我做别的更好' },
            { letter: 'D', text: '我也不知道我擅长什么' }
          ]
        },
        mentorReply: '好。不管答案是什么，五单了你还在做，这就够了。\n\n走，Lv.3。'
      },
      4: {
        fromLevel: 3,
        toLevel: 4,
        mentorMessages: [
          '八单了。说一个你可能没注意的事。',
          '你最近三单的客户评价里，出现最多的词是"细心"。不是"不错"，不是"还行"，是"细心"。'
        ],
        dataCard: [
          { label: '第6单', value: '"很细心，改了我想改的"' },
          { label: '第7单', value: '"比较细心，没有遗漏"' },
          { label: '第8单', value: '"细心，交付质量稳定"' }
        ],
        question: {
          eyebrow: '导师想问你',
          text: '你觉得客户说你"细心"，是因为什么？',
          options: [
            { letter: 'A', text: '我交付前会自己看一遍，不行的我不交' },
            { letter: 'B', text: '可能是我比较在意客户的实际需求' },
            { letter: 'C', text: '我觉得只是运气好，碰到的客户比较宽容' },
            { letter: 'D', text: '还没想过这个问题' }
          ]
        },
        mentorReply: '嗯。不管是因为什么，你已经不是在被标准推着走了。\n\n走，Lv.4。'
      },
      5: {
        fromLevel: 4,
        toLevel: 5,
        mentorMessages: [
          '十单了。给你看一条路。',
          '这是你从"我不知道怎么做"走到今天的整条路。每一步都是真的。',
          '如果有一天，一个刚进来的人，卡在你卡过的地方——你愿意过去跟他说一句"没事，我也卡过这里"吗？'
        ],
        timeline: [
          { date: '6月11日', label: '第1单 · "我不知道怎么做"' },
          { date: '6月18日', label: '升 Lv.2 · 开始有自己的套路' },
          { date: '6月29日', label: '升 Lv.3 · 知道自己擅长什么了' },
          { date: '7月10日', label: '升 Lv.4 · 有了自己的标准' },
          { date: '今天', label: '第10单完成', isNow: true }
        ],
        question: {
          eyebrow: '导师想问你',
          text: '你愿意吗？',
          options: [
            { letter: 'A', text: '愿意，他卡的地方我懂' },
            { letter: 'B', text: '可以，但我得先看看他是什么样的人' },
            { letter: 'C', text: '有时不太想，我自己都还在走' },
            { letter: 'D', text: '不想，我不擅长带人' }
          ]
        },
        mentorReply: '好。不管你选哪个，这条路你已经走完了。\n\n走，Lv.5。'
      }
    }

    return dataMap[targetLevel] || dataMap[1]
  }

  const handleOptionSelect = (letter: string) => {
    setSelectedOption(letter)

    // 300ms后显示导师回复
    setTimeout(() => {
      setShowReply(true)
      // 滚动到底部
      setTimeout(() => {
        const query = Taro.createSelectorQuery()
        query.select('.sheet-body').boundingClientRect()
        query.selectViewport().scrollOffset()
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

    // 700ms后显示升级按钮
    setTimeout(() => {
      setShowButton(true)
    }, 700)

    // 900ms后显示关闭按钮
    setTimeout(() => {
      setShowClose(true)
    }, 900)
  }

  const handleLevelUp = async () => {
    if (!validation) return

    try {
      Taro.showLoading({ title: '提交中...' })

      // 提交选择的答案
      await levelUpValidationAPI.submit({
        fromLevel: validation.fromLevel,
        toLevel: validation.toLevel,
        selectedOption
      })

      Taro.hideLoading()

      // 跳转到升级完成页
      Taro.redirectTo({
        url: `/pages/level-up-done/index?level=${validation.toLevel}`
      })

    } catch (error: any) {
      console.error('提交失败:', error)
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    }
  }

  const handleClose = () => {
    Taro.navigateBack()
  }

  if (loading || !validation) {
    return (
      <View className="level-up-validation loading">
        <View className="loading-content">
          <Image src={catLogo} className="loading-cat" mode="aspectFit" />
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="level-up-validation">
      {/* 背景遮罩 */}
      <View className="backdrop" onClick={handleClose}></View>

      {/* 底部弹窗 */}
      <View className="sheet">
        {/* 手柄 */}
        <View className="sheet-handle"></View>

        {/* 头部 */}
        <View className="sheet-head">
          <View className="mentor-dot">
            <Image src={catLogo} className="mentor-icon" mode="aspectFit" />
          </View>
          <View className="mentor-info">
            <Text className="mentor-name">导师</Text>
            <Text className="mentor-role">陪你走这条路的人</Text>
          </View>
          <View
            className={`sheet-close ${showClose ? 'show' : ''}`}
            onClick={handleClose}
          >
            ×
          </View>
        </View>

        {/* 可滚动的导师消息区 */}
        <ScrollView className="sheet-body" scrollY>
          <View className="mentor-block">
            {validation.mentorMessages.map((msg, index) => (
              <Text key={index} className="mentor-text">{msg}</Text>
            ))}

            {/* 数据卡片 */}
            {validation.dataCard && (
              <View className="data-card">
                {validation.dataCard.map((item, index) => (
                  <View key={index} className="data-row">
                    <Text className="data-key">{item.label}</Text>
                    <Text className={`data-value ${item.isGood ? 'good' : ''}`}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 时间线 */}
            {validation.timeline && (
              <View className="timeline">
                {validation.timeline.map((item, index) => (
                  <View key={index} className="timeline-item">
                    <View className={`timeline-dot ${item.isNow ? 'now' : ''}`}></View>
                    <View className="timeline-body">
                      <Text className="timeline-date">{item.date}</Text>
                      <Text className={`timeline-label ${item.isNow ? 'now' : ''}`}>
                        {item.label}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 导师回复（选择后显示） */}
          {showReply && (
            <View className="mentor-reply">
              <Text className="mentor-text">{validation.mentorReply}</Text>
            </View>
          )}

          <View style={{ height: '8px' }}></View>
        </ScrollView>

        {/* 固定在底部的问题区 */}
        <View className="sheet-question">
          <Text className="question-eyebrow">{validation.question.eyebrow}</Text>
          <Text className="question-text">{validation.question.text}</Text>
          <View className="options">
            {validation.question.options.map((option) => (
              <View
                key={option.letter}
                className={`option ${selectedOption === option.letter ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option.letter)}
              >
                <View className="option-letter">{option.letter}</View>
                <Text className="option-text">{option.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 升级按钮 */}
        <View className="sheet-foot">
          <View
            className={`level-up-btn ${showButton ? 'show' : ''}`}
            onClick={handleLevelUp}
          >
            走，升 Lv.{validation.toLevel}
          </View>
        </View>
      </View>
    </View>
  )
}
