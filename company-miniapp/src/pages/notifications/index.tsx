import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadNotifications()
  }, [activeTab])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const url = activeTab === 'unread' 
        ? '/api/v1/task-tracking/delivery-notifications?unread_only=true'
        : '/api/v1/task-tracking/delivery-notifications'
      
      const res = await Taro.request({
        url,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` }
      })

      if (res.data.success) {
        setNotifications(res.data.data)
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = Taro.getStorageSync('token')
      await Taro.request({
        url: `/api/v1/task-tracking/delivery-notifications/${notificationId}/read`,
        method: 'POST',
        header: { Authorization: `Bearer ${token}` }
      })
      loadNotifications()
    } catch (error) {
      console.error('标记已读失败', error)
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    if (notification.task_id) {
      Taro.navigateTo({
        url: `/pages/task-detail/index?id=${notification.task_id}`
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    const map: any = {
      milestone_due_soon: '⏰',
      milestone_submitted: '📌',
      final_delivery_due_soon: '🔔',
      delivery_submitted: '✅'
    }
    return map[type] || '📬'
  }

  const getNotificationColor = (type: string) => {
    const map: any = {
      milestone_due_soon: '#faad14',
      milestone_submitted: '#1890ff',
      final_delivery_due_soon: '#ff4d4f',
      delivery_submitted: '#52c41a'
    }
    return map[type] || '#999'
  }

  return (
    <View className='notifications-page'>
      <View className='page-header'>
        <Text className='title'>通知中心</Text>
      </View>

      <View className='tabs'>
        <View
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部
        </View>
        <View
          className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          未读
        </View>
      </View>

      <ScrollView className='notifications-list' scrollY>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : notifications.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>📭</Text>
            <Text className='empty-text'>暂无通知</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View
              key={notification.id}
              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <View
                className='notification-icon'
                style={{ background: getNotificationColor(notification.notification_type) }}
              >
                {getNotificationIcon(notification.notification_type)}
              </View>

              <View className='notification-content'>
                <Text className='notification-title'>{notification.title}</Text>
                <Text className='notification-message'>{notification.message}</Text>

                {notification.task_title && (
                  <Text className='notification-task'>任务：{notification.task_title}</Text>
                )}

                {notification.days_until_due && (
                  <Text className='notification-time'>
                    {notification.days_until_due}天后到期
                  </Text>
                )}

                <Text className='notification-date'>
                  {new Date(notification.created_at).toLocaleString('zh-CN')}
                </Text>
              </View>

              {!notification.is_read && (
                <View className='unread-badge' />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
