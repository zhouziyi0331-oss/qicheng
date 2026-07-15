import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import catLogo from '../../assets/images/cat-logo.png'
import './index.scss'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  suggestions?: string[]
  milestone?: {
    title: string
    description: string
    progress: number
    deadline: string
  }
}

export default function Mentor() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickReplies] = useState<string[]>([
    '我遇到了困难',
    '帮我分析项目',
    '我想了解 OPC'
  ])

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    const page = Taro.getCurrentInstance().page
    if (page && typeof page.getTabBar === 'function') {
      const tabBar = page.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 2 })
      }
    }

    // 初始化欢迎消息
    initWelcomeMessage()
  }, [])

  const initWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: '你好，我是启程小猫，你的 AI 成长伙伴\n\n我会陪伴你的成长旅程：\n• 当你遇到困难时，和你一起分析问题、寻找方法\n• 当你感到迷茫时，倾听你的想法、给予鼓励\n• 引导你在实践中学习，通过项目提升能力\n• 看见你的每一步成长，陪你走得更远\n\n想聊什么呢？',
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMessage])
  }

  const handleSend = async () => {
    if (!inputText.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputText
    setInputText('')
    setLoading(true)

    // 模拟AI回复（带里程碑卡片示例）
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: '选题是小红书运营的核心。我帮你梳理一个思路框架：\n\n1. 找痛点 — 目标用户最常搜什么、最困惑什么\n2. 蹭热点 — 结合当下趋势做差异化内容\n3. 测数据 — 发 3-5 篇测试，看哪类互动率高',
        timestamp: new Date().toISOString(),
        milestone: {
          title: '小红书账号冷启动',
          description: '完成选题策划 → 发布 3 篇测试内容',
          progress: 60,
          deadline: '剩余 5 天'
        },
        suggestions: ['继续分析', '给我案例', '制定计划', '我明白了']
      }
      setMessages(prev => [...prev, aiMessage])
      setLoading(false)
    }, 1500)
  }

  const handleQuickReply = (text: string) => {
    setInputText(text)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
  }

  const handlePBLClick = () => {
    Taro.showToast({
      title: 'PBL功能开发中',
      icon: 'none'
    })
  }

  const handleSwitchMode = () => {
    Taro.showToast({
      title: '切换模式功能开发中',
      icon: 'none'
    })
  }

  return (
    <View className="mentor-page">
      {/* Hero Header */}
      <View className="mentor-hero">
        <View className="hero-inner">
          <View className="cat-avatar">
            <Image src={catLogo} className="cat-logo" mode="aspectFit" />
          </View>
          <View className="hero-text">
            <Text className="hero-title">启程小猫</Text>
            <View className="online-row">
              <View className="online-dot"></View>
              <Text className="online-text">在线 · 陪你成长的 AI 伙伴</Text>
            </View>
          </View>
          <View className="switch-btn" onClick={handleSwitchMode}>
            <Text className="switch-text">切换模式</Text>
          </View>
        </View>
      </View>

      {/* PBL Bar */}
      <View className="pbl-bar">
        <Text className="pbl-title">我的 PBL 项目</Text>
        <View className="pbl-btn" onClick={handlePBLClick}>
          <Text className="pbl-btn-icon">+</Text>
          <Text className="pbl-btn-text">创建项目</Text>
        </View>
      </View>

      {/* Chat Area */}
      <ScrollView
        scrollY
        className="chat-area"
        scrollIntoView={`msg-${messages.length - 1}`}
        scrollWithAnimation
      >
        <View className="chat-date">今天</View>

        {messages.map((msg, index) => (
          <View key={msg.id}>
            {msg.role === 'assistant' ? (
              <View className="msg-row">
                <View className="msg-avatar">
                  <Image src={catLogo} className="avatar-img" mode="aspectFit" />
                </View>
                <View className="bubble-wrap">
                  <View className={`bubble ${index === 0 ? 'intro' : ''}`}>
                    {index === 0 ? (
                      <>
                        <Text className="greeting">你好，我是启程小猫，你的 AI 成长伙伴</Text>
                        <View className="service-list">
                          <Text className="service-header">我会陪伴你的成长旅程：</Text>
                          <View className="service-item">
                            <View className="service-dot coral"></View>
                            <Text className="service-text">当你遇到困难时，和你一起分析问题、寻找方法</Text>
                          </View>
                          <View className="service-item">
                            <View className="service-dot terra"></View>
                            <Text className="service-text">当你感到迷茫时，倾听你的想法、给予鼓励</Text>
                          </View>
                          <View className="service-item">
                            <View className="service-dot sand"></View>
                            <Text className="service-text">引导你在实践中学习，通过项目提升能力</Text>
                          </View>
                          <View className="service-item">
                            <View className="service-dot mist"></View>
                            <Text className="service-text">看见你的每一步成长，陪你走得更远</Text>
                          </View>
                        </View>
                        <Text className="cta-text">想聊什么呢？</Text>
                      </>
                    ) : (
                      <>
                        <Text className="bubble-text">{msg.content}</Text>

                        {/* 里程碑卡片 */}
                        {msg.milestone && (
                          <View className="milestone-card">
                            <View className="mc-label">
                              <Text className="mc-label-icon">▪</Text>
                              <Text className="mc-label-text">当前任务进度</Text>
                            </View>
                            <Text className="mc-title">{msg.milestone.title}</Text>
                            <Text className="mc-desc">{msg.milestone.description}</Text>
                            <View className="mc-progress">
                              <View className="mc-progress-bar">
                                <View
                                  className="mc-progress-fill"
                                  style={{ width: `${msg.milestone.progress}%` }}
                                ></View>
                              </View>
                              <Text className="mc-progress-label">
                                {msg.milestone.progress}% · {msg.milestone.deadline}
                              </Text>
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                  <Text className="msg-time">刚刚</Text>
                </View>
              </View>
            ) : (
              <View className="msg-row user">
                <View className="bubble-wrap">
                  <View className="bubble">
                    <Text className="bubble-text">{msg.content}</Text>
                  </View>
                  <Text className="msg-time">刚刚</Text>
                </View>
              </View>
            )}

            {/* 建议chips - 只在AI消息后显示 */}
            {msg.role === 'assistant' && msg.suggestions && (
              <View className="suggest-row">
                {msg.suggestions.map((sug, idx) => (
                  <View
                    key={idx}
                    className="suggest-chip"
                    onClick={() => handleSuggestionClick(sug)}
                  >
                    <Text>{sug}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 初始建议chips */}
            {index === 0 && (
              <View className="suggest-row">
                {quickReplies.map((reply, idx) => (
                  <View
                    key={idx}
                    className="suggest-chip"
                    onClick={() => handleQuickReply(reply)}
                  >
                    <Text>{reply}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Typing indicator */}
        {loading && (
          <View className="typing-indicator">
            <View className="msg-avatar">
              <Image src={catLogo} className="avatar-img" mode="aspectFit" />
            </View>
            <View className="typing-bubble">
              <View className="typing-dot"></View>
              <View className="typing-dot"></View>
              <View className="typing-dot"></View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar - 微信风格 */}
      <View className="input-bar">
        <View className="input-wrap">
          <Input
            className="message-input"
            placeholder="和小猫聊聊吧..."
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            onConfirm={handleSend}
            disabled={loading}
          />
        </View>
        <View
          className={`send-btn ${(!inputText.trim() || loading) ? 'disabled' : ''}`}
          onClick={handleSend}
        >
          <Text className="send-text">发送</Text>
        </View>
      </View>
    </View>
  )
}
