import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { notificationAPI } from '../../services/api'
import { formatTime } from '../../utils'
import './index.scss'

interface Notification {
  id: string
  title: string
  content: string
  type: 'system' | 'task' | 'payment' | 'message'
  is_read: boolean
  created_at: string
  link?: string
}

const TYPE_CONFIG = {
  system: { icon: '🔔', label: '系统通知', color: '#667eea' },
  task: { icon: '📋', label: '任务通知', color: '#f093fb' },
  payment: { icon: '💰', label: '财务通知', color: '#43e97b' },
  message: { icon: '💬', label: '消息通知', color: '#4facfe' }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const res = await notificationAPI.getList()
      setNotifications(res.notifications || [])
      setUnreadCount(res.unread_count || 0)
    } catch (error) {
      console.error('加载通知失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await notificationAPI.markRead(id)
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      Taro.showToast({ title: '已全部标记为已读', icon: 'success' })
    } catch (error) {
      console.error('标记全部已读失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id)
    }

    if (notification.link) {
      Taro.navigateTo({ url: notification.link })
    }
  }

  return (
    <View className="notifications-page">
      {/* 头部 */}
      <View className="header">
        <View className="header-content">
          <Text className="header-title">通知中心</Text>
          {unreadCount > 0 && (
            <View className="unread-badge">
              <Text className="unread-text">{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Text className="mark-all-btn" onClick={handleMarkAllRead}>
            全部已读
          </Text>
        )}
      </View>

      {/* 通知列表 */}
      <ScrollView scrollY className="notifications-list">
        {loading ? (
          <View className="loading-state">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📭</Text>
            <Text className="empty-text">暂无通知</Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const config = TYPE_CONFIG[notification.type]
            return (
              <View
                key={notification.id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* 未读标记 */}
                {!notification.is_read && <View className="unread-dot" />}

                {/* 图标 */}
                <View className="notification-icon" style={{ background: config.color + '20' }}>
                  <Text className="icon-emoji">{config.icon}</Text>
                </View>

                {/* 内容 */}
                <View className="notification-content">
                  <View className="notification-header">
                    <Text className="notification-title">{notification.title}</Text>
                    <Text className="notification-type" style={{ color: config.color }}>
                      {config.label}
                    </Text>
                  </View>
                  <Text className="notification-text">{notification.content}</Text>
                  <Text className="notification-time">{formatTime(notification.created_at)}</Text>
                </View>

                {/* 箭头 */}
                {notification.link && (
                  <View className="notification-arrow">
                    <Text className="arrow-icon">›</Text>
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}
