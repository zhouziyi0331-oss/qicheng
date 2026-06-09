import { View, Text, ScrollView } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { useWebSocket } from '../../hooks/useWebSocket';
import './notification-center.scss';

export default function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useWebSocket();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'ai_task_complete': '🤖',
      'profile_analysis_complete': '✨',
      'task_recommended': '🎯',
      'mentor_message': '💬',
      'order_status_changed': '📦'
    };
    return icons[type] || '🔔';
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);

    // 根据通知类型跳转到相应页面
    switch (notification.type) {
      case 'profile_analysis_complete':
        Taro.navigateTo({ url: '/pages/opc-test/result' });
        break;
      case 'task_recommended':
        Taro.navigateTo({ url: '/pages/tasks/recommended' });
        break;
      case 'mentor_message':
        if (notification.data?.taskId) {
          Taro.navigateTo({ url: `/pages/mentor-chat/index?taskId=${notification.data.taskId}` });
        }
        break;
      case 'order_status_changed':
        if (notification.data?.orderId) {
          Taro.navigateTo({ url: `/pages/orders/detail?id=${notification.data.orderId}` });
        }
        break;
      default:
        break;
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <View className="notification-center">
      {/* 头部 */}
      <View className="header">
        <Text className="header-title">通知中心</Text>
        {unreadCount > 0 && (
          <View className="unread-badge">
            <Text className="badge-text">{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* 过滤器 */}
      <View className="filter-tabs">
        <View
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <Text className="tab-text">全部</Text>
        </View>
        <View
          className={`tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          <Text className="tab-text">未读</Text>
          {unreadCount > 0 && (
            <View className="tab-badge">
              <Text className="badge-text">{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 操作按钮 */}
      {notifications.length > 0 && (
        <View className="actions">
          {unreadCount > 0 && (
            <Text className="action-btn" onClick={markAllAsRead}>
              全部标记为已读
            </Text>
          )}
          <Text className="action-btn danger" onClick={clearNotifications}>
            清空通知
          </Text>
        </View>
      )}

      {/* 通知列表 */}
      <ScrollView className="notification-list" scrollY>
        {filteredNotifications.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">🔔</Text>
            <Text className="empty-text">
              {filter === 'unread' ? '暂无未读通知' : '暂无通知'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <View
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* 未读标记 */}
              {!notification.read && <View className="unread-dot" />}

              {/* 图标 */}
              <View className="notification-icon">
                <Text className="icon-text">{getNotificationIcon(notification.type)}</Text>
              </View>

              {/* 内容 */}
              <View className="notification-content">
                <Text className="notification-title">{notification.title}</Text>
                <Text className="notification-message">{notification.message}</Text>
                <Text className="notification-time">{formatTime(notification.timestamp)}</Text>
              </View>

              {/* 箭头 */}
              <View className="notification-arrow">
                <Text className="arrow-icon">›</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
