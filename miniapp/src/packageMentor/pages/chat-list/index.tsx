import { View, Text, Image, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { tokenManager } from '../../../utils/token';
import { getApiUrl } from '../../../config';
import Loading from '../../../components/Loading';
import './index.scss';

interface ChatSession {
  id: number;
  task_id: number;
  task_title: string;
  task_status: string;
  other_user_name: string;
  other_user_avatar: string;
  my_unread_count: number;
  last_message: string;
  last_message_at: string;
}

export default function ChatList() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  // 加载会话列表
  const loadSessions = async () => {
    try {
      setLoading(true);
      const token = tokenManager.getAccessToken();
      const res = await Taro.request({
        url: getApiUrl('/api/v1/chat/sessions'),
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  // 进入聊天详情
  const handleChatClick = (session: ChatSession) => {
    Taro.navigateTo({
      url: `/pages/chat-detail/index?sessionId=${session.id}`
    });
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 获取任务状态文本
  const getTaskStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待接单',
      'in_progress': '进行中',
      'submitted': '已提交',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <Loading text="正在加载聊天列表..." />
  }

  if (sessions.length === 0) {
    return (
      <View className="chat-list">
        <View className="empty">
          <Text className="empty-icon">●</Text>
          <Text className="empty-text">暂无聊天记录</Text>
          <Text className="empty-hint">接单后可与企业沟通</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="chat-list">
      <ScrollView
        scrollY
        className="session-list"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {sessions.map((session) => (
          <View
            key={session.id}
            className="session-item"
            onClick={() => handleChatClick(session)}
          >
            <View className="avatar-wrapper">
              <Image
                className="avatar"
                src={session.other_user_avatar || 'https://via.placeholder.com/100'}
                mode="aspectFill"
              />
              {session.my_unread_count > 0 && (
                <View className="badge">
                  <Text className="badge-text">
                    {session.my_unread_count > 99 ? '99+' : session.my_unread_count}
                  </Text>
                </View>
              )}
            </View>

            <View className="content">
              <View className="header">
                <Text className="name">{session.other_user_name}</Text>
                <Text className="time">{formatTime(session.last_message_at)}</Text>
              </View>

              <View className="task-info">
                <Text className="task-title">{session.task_title}</Text>
                <Text className={`task-status status-${session.task_status}`}>
                  {getTaskStatusText(session.task_status)}
                </Text>
              </View>

              <Text className="last-message" numberOfLines={1}>
                {session.last_message || '暂无消息'}
              </Text>
            </View>

            <View className="arrow">›</View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
