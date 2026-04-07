import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState, useRef } from 'react'
import { mentorAPI } from '../../services/api'
import { formatTime } from '../../utils'
import { detectEmotionState, saveEmotionState } from '../../utils/emotion'
import './index.scss'
import catLogo from '../../assets/images/cat-logo.png'

interface Message {
  id: string
  role: 'user' | 'mentor'
  content: string
  timestamp: string
}

export default function Mentor() {
  const router = useRouter()
  const { taskId, context, taskTitle } = router.params
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef<any>(null)

  useEffect(() => {
    // 根据上下文初始化对话
    if (context === 'task' && taskId) {
      // 场景1：任务详情页点击"问AI导师"
      const decodedTitle = decodeURIComponent(taskTitle || '')
      setMessages([{
        id: '1',
        role: 'mentor',
        content: `你好！我看到你在查看任务「${decodedTitle}」。\n\n我可以帮你：\n• 分析任务要求和难点\n• 评估你的能力匹配度\n• 制定执行计划\n• 推荐学习资源\n\n有什么我可以帮你的吗？`,
        timestamp: new Date().toISOString()
      }])
    } else if (context === 'working' && taskId) {
      // 场景2：任务进行中（30秒后主动推送）
      const decodedTitle = decodeURIComponent(taskTitle || '')
      setMessages([{
        id: '1',
        role: 'mentor',
        content: `嗨！我注意到你已经开始「${decodedTitle}」这个任务了。\n\n进展如何？我可以帮你：\n• 梳理思路和执行步骤\n• 解答遇到的问题\n• 提供相关学习资源\n• 检查工作成果\n\n需要我帮忙吗？`,
        timestamp: new Date().toISOString()
      }])
    } else if (context === 'stuck' && taskId) {
      // 场景3：学生说"我卡住了"
      const decodedTitle = decodeURIComponent(taskTitle || '')
      setMessages([{
        id: '1',
        role: 'mentor',
        content: `别担心，卡住是很正常的！让我来帮你。\n\n关于「${decodedTitle}」这个任务，你具体卡在哪里了？\n\n• 不知道从哪里开始？\n• 遇到技术难题？\n• 不确定方向是否正确？\n• 缺少某些资源或工具？\n\n告诉我具体情况，我们一起解决！`,
        timestamp: new Date().toISOString()
      }])
    } else if (context === 'rejected' && taskId) {
      // 场景4：任务被打回
      const decodedTitle = decodeURIComponent(taskTitle || '')
      setMessages([{
        id: '1',
        role: 'mentor',
        content: `我看到你的任务「${decodedTitle}」被打回了。\n\n别灰心！这是成长的机会。让我帮你分析一下：\n\n• 需求方的反馈是什么？\n• 哪些地方需要改进？\n• 如何避免类似问题？\n• 需要补充哪些知识？\n\n我们一起把它做得更好！`,
        timestamp: new Date().toISOString()
      }])
    } else if (context === 'milestone' && taskId) {
      // 场景5：完成里程碑
      const decodedTitle = decodeURIComponent(taskTitle || '')
      setMessages([{
        id: '1',
        role: 'mentor',
        content: `太棒了！你完成了「${decodedTitle}」的一个重要里程碑！\n\n让我们回顾一下：\n• 你学到了什么新技能？\n• 哪些地方做得特别好？\n• 还有哪些可以优化的？\n• 下一步计划是什么？\n\n继续保持这个势头！`,
        timestamp: new Date().toISOString()
      }])
    } else if (taskId) {
      // 任务进行中（通用）
      loadHistory()
      loadFirstStep()
    } else {
      // 通用AI导师对话
      setMessages([{
        id: '1',
        role: 'mentor',
        content: '你好，我是启程小猫，你的 AI 成长伙伴。\n\n我可以帮你：\n• 分析你的能力和成长方向\n• 推荐适合的任务\n• 解答学习和工作中的问题\n• 制定个人成长计划\n\n有什么可以帮你的吗？',
        timestamp: new Date().toISOString()
      }])
    }
  }, [taskId, context, taskTitle])

  const loadHistory = async () => {
    try {
      const res = await mentorAPI.getHistory(taskId!)
      setMessages(res.messages || [])
    } catch (error) {
      console.error('加载对话历史失败:', error)
    }
  }

  const loadFirstStep = async () => {
    try {
      const res = await mentorAPI.getFirstStep(taskId!)
      if (res.message) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'mentor',
          content: res.message,
          timestamp: new Date().toISOString()
        }])
      }
    } catch (error) {
      console.error('加载第一步引导失败:', error)
    }
  }

  const handleSend = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputText
    setInputText('')
    setLoading(true)

    // 检测情绪状态
    const emotion = detectEmotionState(messageToSend)
    const user = Taro.getStorageSync('user')
    if (user?.id) {
      saveEmotionState(user.id, emotion)
    }

    try {
      // 调用真实AI API
      const validContext = ['task', 'working', 'stuck', 'rejected', 'milestone'].includes(context || '')
        ? (context as 'task' | 'working' | 'stuck' | 'rejected' | 'milestone')
        : undefined

      const res = await mentorAPI.sendMessage({
        taskId,
        message: messageToSend,
        context: validContext,
        emotionState: emotion, // 传递情绪状态给AI
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })

      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: res.reply,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, mentorMessage])

      // 滚动到底部
      setTimeout(() => {
        scrollViewRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('发送消息失败:', error)
      Taro.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="mentor-page">
      {/* 头部 */}
      <View className="mentor-header">
        <View className="mentor-avatar-circle">
          <Image src={catLogo} className="mentor-logo-img" mode="aspectFit" />
        </View>
        <View className="mentor-info">
          <Text className="mentor-name">启程小猫</Text>
          <Text className="mentor-status">在线 · AI成长伙伴</Text>
        </View>
      </View>

      {/* 消息列表 */}
      <ScrollView scrollY className="message-list" scrollIntoView="bottom">
        {messages.map(msg => (
          <View
            key={msg.id}
            className={`message-item ${msg.role === 'user' ? 'user' : 'mentor'}`}
          >
            {msg.role === 'mentor' && (
              <View className="message-avatar mentor-avatar-small">
                <Image src={catLogo} className="mentor-logo-small" mode="aspectFit" />
              </View>
            )}
            <View className="message-content">
              <View className="message-bubble">
                <Text className="message-text">{msg.content}</Text>
              </View>
              <Text className="message-time">{formatTime(msg.timestamp)}</Text>
            </View>
            {msg.role === 'user' && (
              <View className="message-avatar user-avatar-small">
                <Text className="avatar-letter-small">我</Text>
              </View>
            )}
          </View>
        ))}
        <View id="bottom" ref={scrollViewRef} />
      </ScrollView>

      {/* 输入框 */}
      <View className="input-area">
        <Input
          className="message-input"
          placeholder="和启程小猫聊聊..."
          value={inputText}
          onInput={(e) => setInputText(e.detail.value)}
          onConfirm={handleSend}
        />
        <View
          className={`send-button ${loading || !inputText.trim() ? 'disabled' : ''}`}
          onClick={handleSend}
        >
          <Text className="send-text">发送</Text>
        </View>
      </View>

      {/* 快捷回复 */}
      {messages.length === 1 && (
        <View className="quick-replies">
          <View className="quick-reply-list">
            {context === 'task' ? (
              <>
                <View className="quick-reply-item" onClick={() => setInputText('这个任务怎么做？')}>
                  怎么开始？
                </View>
                <View className="quick-reply-item" onClick={() => setInputText('有什么注意事项？')}>
                  注意事项
                </View>
                <View className="quick-reply-item" onClick={() => setInputText('需要哪些技能？')}>
                  需要技能
                </View>
                <View className="quick-reply-item" onClick={() => setInputText('给我制定计划')}>
                  制定计划
                </View>
              </>
            ) : (
              <>
                <View className="quick-reply-item" onClick={() => setInputText('我卡住了，帮帮我')}>
                  我卡住了
                </View>
                <View className="quick-reply-item" onClick={() => setInputText('这个任务怎么做？')}>
                  怎么开始？
                </View>
                <View className="quick-reply-item" onClick={() => setInputText('给我一些建议')}>
                  给点建议
                </View>
                <View className="quick-reply-item" onClick={() => setInputText('我想了解OPC')}>
                  了解OPC
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
