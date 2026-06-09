import { View, Text, ScrollView, Input, Image } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import pblAPI from '../../services/pbl'
import catAvatar from '../../assets/images/cat-logo.png'
import './index.scss'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  mentorType?: 'emotional' | 'project' | 'coordinated'
  emotionalContent?: string
  projectContent?: string
  transitionText?: string
  suggestions?: string[]
  projectGuidance?: {
    socraticQuestions?: string[]
    mvpSuggestion?: any
  }
  createdAt: string
}

export default function PBLChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [currentMode, setCurrentMode] = useState<'emotional' | 'project' | 'auto'>('auto')
  const scrollViewRef = useRef<any>(null)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.projectId) {
      setProjectId(params.projectId)
      setProjectTitle(params.projectTitle || '项目')
      loadHistory(params.projectId)
    }
  }, [])

  // 加载对话历史
  const loadHistory = async (projectId: string) => {
    try {
      // TODO: 实现加载历史对话的API
      // const res = await pblAPI.getChatHistory(projectId)
      // if (res.success && res.data) {
      //   setMessages(res.data.messages)
      //   setSessionId(res.data.sessionId)
      // }
    } catch (error) {
      console.error('加载历史失败:', error)
    }
  }

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    try {
      const res = await pblAPI.chat(userMessage.content, {
        sessionId,
        projectId,
        forceMode: currentMode === 'auto' ? undefined : currentMode
      })

      if (res.success && res.data) {
        const { response, sessionId: newSessionId } = res.data

        if (!sessionId) {
          setSessionId(newSessionId)
        }

        const assistantMessage: Message = {
          id: Date.now().toString() + '_assistant',
          role: 'assistant',
          content: response.content,
          mentorType: response.mentorType,
          emotionalContent: response.emotionalContent,
          projectContent: response.projectContent,
          transitionText: response.transitionText,
          suggestions: response.suggestions,
          projectGuidance: response.projectGuidance,
          createdAt: new Date().toISOString()
        }

        setMessages(prev => [...prev, assistantMessage])

        // 滚动到底部
        setTimeout(() => {
          scrollViewRef.current?.scrollIntoView?.()
        }, 100)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      Taro.showToast({
        title: '发送失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 切换模式
  const handleSwitchMode = async (mode: 'emotional' | 'project' | 'auto') => {
    setCurrentMode(mode)

    if (mode !== 'auto') {
      try {
        await pblAPI.switchMode(mode)
        Taro.showToast({
          title: `已切换到${mode === 'emotional' ? '情感' : '项目'}模式`,
          icon: 'success'
        })
      } catch (error) {
        console.error('切换模式失败:', error)
      }
    }
  }

  // 使用建议
  const handleUseSuggestion = (suggestion: string) => {
    setInputText(suggestion)
  }

  // 查看MVP方案
  const handleViewMVP = (mvp: any) => {
    Taro.showModal({
      title: mvp.title,
      content: `${mvp.description}\n\n实现步骤：\n${mvp.implementationSteps?.join('\n')}`,
      showCancel: false
    })
  }

  return (
    <View className='pbl-chat-page'>
      {/* 头部 */}
      <View className='chat-header'>
        <View className='header-left'>
          <Image className='cat-avatar' src={catAvatar} />
          <View className='header-info'>
            <Text className='header-title'>启程小猫 🐱</Text>
            <Text className='header-subtitle'>{projectTitle}</Text>
          </View>
        </View>

        {/* 模式切换 */}
        <View className='mode-switch'>
          <View
            className={`mode-btn ${currentMode === 'emotional' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('emotional')}
          >
            <Text>💝</Text>
          </View>
          <View
            className={`mode-btn ${currentMode === 'project' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('project')}
          >
            <Text>💼</Text>
          </View>
          <View
            className={`mode-btn ${currentMode === 'auto' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('auto')}
          >
            <Text>🤖</Text>
          </View>
        </View>
      </View>

      {/* 消息列表 */}
      <ScrollView
        className='messages-list'
        scrollY
        scrollIntoView='bottom'
        enableBackToTop
      >
        {messages.length === 0 && (
          <View className='welcome'>
            <Image className='welcome-avatar' src={catAvatar} />
            <Text className='welcome-text'>嗨！我是启程小猫 🐱</Text>
            <Text className='welcome-hint'>
              我既可以陪你聊聊心事，也可以帮你做项目。
              {'\n'}
              想聊什么呢？
            </Text>
          </View>
        )}

        {messages.map(msg => (
          <View key={msg.id} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && (
              <Image className='message-avatar' src={catAvatar} />
            )}

            <View className='message-content'>
              {/* 协同模式消息 */}
              {msg.mentorType === 'coordinated' ? (
                <View className='coordinated-message'>
                  {/* 情感部分 */}
                  <View className='emotional-part'>
                    <View className='part-label'>
                      <Text>💝 情感陪伴</Text>
                    </View>
                    <Text className='part-content'>{msg.emotionalContent}</Text>
                  </View>

                  {/* 过渡 */}
                  {msg.transitionText && (
                    <View className='transition'>
                      <Text>{msg.transitionText}</Text>
                    </View>
                  )}

                  {/* 项目部分 */}
                  <View className='project-part'>
                    <View className='part-label'>
                      <Text>💼 项目指导</Text>
                    </View>
                    <Text className='part-content'>{msg.projectContent}</Text>
                  </View>
                </View>
              ) : (
                /* 普通消息 */
                <View className='normal-message'>
                  {msg.mentorType && (
                    <View className='message-badge'>
                      <Text>
                        {msg.mentorType === 'emotional' ? '💝 情感模式' : '💼 项目模式'}
                      </Text>
                    </View>
                  )}
                  <Text className='message-text'>{msg.content}</Text>
                </View>
              )}

              {/* 建议 */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <View className='suggestions'>
                  <Text className='suggestions-title'>💡 建议：</Text>
                  {msg.suggestions.map((suggestion, index) => (
                    <View
                      key={index}
                      className='suggestion-item'
                      onClick={() => handleUseSuggestion(suggestion)}
                    >
                      <Text>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* MVP方案 */}
              {msg.projectGuidance?.mvpSuggestion && (
                <View className='mvp-card'>
                  <View className='mvp-header'>
                    <Text className='mvp-icon'>🚀</Text>
                    <Text className='mvp-title'>
                      {msg.projectGuidance.mvpSuggestion.title}
                    </Text>
                  </View>
                  <Text className='mvp-description'>
                    {msg.projectGuidance.mvpSuggestion.description}
                  </Text>
                  <View
                    className='mvp-btn'
                    onClick={() => handleViewMVP(msg.projectGuidance.mvpSuggestion)}
                  >
                    <Text>查看详情</Text>
                  </View>
                </View>
              )}

              {/* 苏格拉底式问题 */}
              {msg.projectGuidance?.socraticQuestions &&
                msg.projectGuidance.socraticQuestions.length > 0 && (
                  <View className='socratic-questions'>
                    <Text className='questions-title'>🤔 思考一下：</Text>
                    {msg.projectGuidance.socraticQuestions.map((question, index) => (
                      <View key={index} className='question-item'>
                        <Text className='question-bullet'>•</Text>
                        <Text className='question-text'>{question}</Text>
                      </View>
                    ))}
                  </View>
                )}

              <Text className='message-time'>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </Text>
            </View>

            {msg.role === 'user' && (
              <View className='message-avatar user-avatar'>
                <Text>👤</Text>
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View className='message assistant'>
            <Image className='message-avatar' src={catAvatar} />
            <View className='message-content'>
              <View className='typing'>
                <View className='typing-dot' />
                <View className='typing-dot' />
                <View className='typing-dot' />
              </View>
            </View>
          </View>
        )}

        <View id='bottom' ref={scrollViewRef} />
      </ScrollView>

      {/* 输入框 */}
      <View className='input-area'>
        <Input
          className='message-input'
          type='text'
          placeholder={
            currentMode === 'emotional'
              ? '和启程小猫聊聊...'
              : currentMode === 'project'
              ? '描述你的项目问题...'
              : '想聊什么呢？'
          }
          value={inputText}
          onInput={(e) => setInputText(e.detail.value)}
          onConfirm={handleSend}
          disabled={loading}
        />
        <View
          className={`send-btn ${inputText.trim() && !loading ? 'active' : ''}`}
          onClick={handleSend}
        >
          <Text>发送</Text>
        </View>
      </View>
    </View>
  )
}
