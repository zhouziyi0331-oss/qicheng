import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './messages.scss'

interface Message {
  id: string
  type: 'enterprise' | 'review-pass' | 'review-fail' | 'platform'
  company: string
  title: string
  content: string
  time: string
  isUnread: boolean
  taskId?: string
  taskTitle?: string
  rating?: number
}

export default function TaskMessagesPage() {
  const [activeTask, setActiveTask] = useState('all')
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(3)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    // TODO: 替换为真实API
    const mockMessages: Message[] = [
      {
        id: '1',
        type: 'enterprise',
        company: '晨曦教育科技',
        title: '关于视觉学习路径图的补充说明',
        content: '你好，补充一下需求：路径图需要支持深色模式，另外第3个模块"AI工具应用"希望能突出互动，可以加入一些流程箭头的设计。其他模块按原方向继续即可。',
        time: '14:32',
        isUnread: true,
        taskId: '1',
        taskTitle: '为青少年AI课程设计视觉化学习路径图'
      },
      {
        id: '2',
        type: 'review-pass',
        company: '启程平台',
        title: '《社区运营SOP》交付审核通过',
        content: '你提交的SOP文档结构清晰，三个模块要点完整，企业方已确认验收。¥500 将在24小时内到账。',
        time: '11:05',
        isUnread: true,
        taskId: '2',
        taskTitle: '梳理社区运营的标准化流程文档',
        rating: 4.9
      },
      {
        id: '3',
        type: 'review-fail',
        company: '启程平台',
        title: '《烘焙内容模板》需要修改后重新提交',
        content: '修改意见：\n• 模板尺寸需调整为 1080×1080px（现在为 800×800px）\n• 字体需使用企业指定字体，见附件商务规范',
        time: '昨天 16:20',
        isUnread: true,
        taskId: '3',
        taskTitle: '为烘焙店设计社交媒体内容模板'
      },
      {
        id: '4',
        type: 'platform',
        company: '启程平台',
        title: '你的月度评分已更新',
        content: '本月完成 3 个任务，综合评分 4.8 分，已达到「优质OPC」认证标准。',
        time: '昨天 09:00',
        isUnread: false
      },
      {
        id: '5',
        type: 'enterprise',
        company: '晨曦烘焙工作室',
        title: '烘焙内容模板任务已确认',
        content: '你已成功接单，请在7月13日前完成交付。如有疑问请及时联系。',
        time: '2天前',
        isUnread: false,
        taskId: '3',
        taskTitle: '为烘焙店设计社交媒体内容模板'
      }
    ]
    setMessages(mockMessages)
    setUnreadCount(mockMessages.filter(m => m.isUnread).length)
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleMessageAction = (message: Message, action: string) => {
    if (action === 'confirm') {
      Taro.showToast({ title: '已确认收到', icon: 'success' })
      // 标记为已读
      setMessages(messages.map(m =>
        m.id === message.id ? { ...m, isUnread: false } : m
      ))
    } else if (action === 'resubmit') {
      Taro.navigateTo({
        url: `/packageTask/pages/tasks/submit?id=${message.taskId}`
      })
    }
  }

  const getMessageTypeInfo = (type: string) => {
    switch (type) {
      case 'enterprise':
        return { className: 'type-enterprise', text: '企业需求' }
      case 'review-pass':
        return { className: 'type-review-pass', text: '审核通过' }
      case 'review-fail':
        return { className: 'type-review-fail', text: '需要修改' }
      case 'platform':
        return { className: 'type-platform', text: '平台通知' }
      default:
        return { className: '', text: '' }
    }
  }

  const getCompanyAvatar = (company: string) => {
    if (company === '启程平台') return '⬡'
    return company[0]
  }

  const filteredMessages = activeTask === 'all'
    ? messages
    : messages.filter(m => m.taskTitle?.includes(activeTask))

  return (
    <View className="task-messages-page">
      {/* 顶部导航 */}
      <View className="messages-header">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="header-title">任务消息</Text>
        <View className="unread-badge">
          <Text className="unread-text">{unreadCount} 条未读</Text>
        </View>
      </View>

      {/* 任务选择器 */}
      <View className="task-selector">
        <View className="selector-scroll">
          <View
            className={`selector-tab ${activeTask === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTask('all')}
          >
            <Text>全部任务</Text>
          </View>
          <View
            className={`selector-tab ${activeTask === '视觉学习路径图' ? 'active' : ''}`}
            onClick={() => setActiveTask('视觉学习路径图')}
          >
            <Text>视觉学习路径图</Text>
          </View>
          <View
            className={`selector-tab ${activeTask === '社区运营SOP' ? 'active' : ''}`}
            onClick={() => setActiveTask('社区运营SOP')}
          >
            <Text>社区运营SOP</Text>
          </View>
          <View
            className={`selector-tab ${activeTask === '烘焙内容模板' ? 'active' : ''}`}
            onClick={() => setActiveTask('烘焙内容模板')}
          >
            <Text>烘焙内容模板</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="messages-scroll">
        <View className="messages-content">
          {/* 时间分组：今天 */}
          <View className="time-group">今天</View>

          {filteredMessages
            .filter(m => m.time.includes(':'))
            .map((message) => {
              const typeInfo = getMessageTypeInfo(message.type)
              return (
                <View
                  key={message.id}
                  className={`message-item ${message.isUnread ? 'unread' : ''}`}
                >
                  {message.isUnread && <View className="unread-indicator" />}

                  <View className="message-avatar">
                    <Text className="avatar-text">{getCompanyAvatar(message.company)}</Text>
                  </View>

                  <View className="message-body">
                    <View className="message-header">
                      <View className={`message-type ${typeInfo.className}`}>
                        <Text>{typeInfo.text}</Text>
                      </View>
                      {message.isUnread && <View className="unread-dot" />}
                      <Text className="message-time">{message.time}</Text>
                    </View>

                    <Text className="message-company">{message.company}</Text>
                    <Text className="message-title">{message.title}</Text>

                    <View className="message-content-box">
                      <Text className="message-content">{message.content}</Text>
                    </View>

                    {message.rating && (
                      <View className="rating-info">
                        <View className="rating-star">★</View>
                        <Text className="rating-text">企业评分：{message.rating} / 5.0</Text>
                      </View>
                    )}

                    {/* 操作按钮 */}
                    {message.type === 'enterprise' && message.isUnread && (
                      <View className="message-actions">
                        <Button
                          className="action-btn primary"
                          onClick={() => handleMessageAction(message, 'confirm')}
                        >
                          已收到，明白了
                        </Button>
                        <Button className="action-btn secondary">
                          有疑问，需确认
                        </Button>
                      </View>
                    )}

                    {message.type === 'review-fail' && (
                      <View className="message-actions">
                        <Button
                          className="action-btn primary full"
                          onClick={() => handleMessageAction(message, 'resubmit')}
                        >
                          修改后重新提交
                        </Button>
                        <Button className="action-btn secondary">
                          查看商务规范
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}

          {/* 时间分组：昨天 */}
          <View className="time-group">昨天</View>

          {filteredMessages
            .filter(m => m.time.includes('昨天'))
            .map((message) => {
              const typeInfo = getMessageTypeInfo(message.type)
              return (
                <View
                  key={message.id}
                  className={`message-item ${message.isUnread ? 'unread' : ''}`}
                >
                  {message.isUnread && <View className="unread-indicator" />}

                  <View className="message-avatar">
                    <Text className="avatar-text">{getCompanyAvatar(message.company)}</Text>
                  </View>

                  <View className="message-body">
                    <View className="message-header">
                      <View className={`message-type ${typeInfo.className}`}>
                        <Text>{typeInfo.text}</Text>
                      </View>
                      {message.isUnread && <View className="unread-dot" />}
                      <Text className="message-time">{message.time}</Text>
                    </View>

                    <Text className="message-company">{message.company}</Text>
                    <Text className="message-title">{message.title}</Text>

                    <View className="message-content-box">
                      <Text className="message-content">{message.content}</Text>
                    </View>

                    {message.type === 'review-fail' && (
                      <View className="message-actions">
                        <Button
                          className="action-btn primary full"
                          onClick={() => handleMessageAction(message, 'resubmit')}
                        >
                          修改后重新提交
                        </Button>
                        <Button className="action-btn secondary">
                          查看商务规范
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}

          <View style={{ height: '16rpx' }} />
        </View>
      </ScrollView>
    </View>
  )
}
