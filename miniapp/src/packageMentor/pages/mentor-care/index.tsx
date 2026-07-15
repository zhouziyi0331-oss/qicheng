import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { mentorStageAPI } from '../../../services/api';
import './index.scss';

interface FollowUpMessage {
  id: string;
  type: string;
  content: string;
  priority: number;
  scheduledFor: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'responded';
  context?: {
    lastTopic?: string;
    lastEmotion?: string;
    daysSinceLastInteraction?: number;
  };
}

interface CareData {
  pendingMessages: FollowUpMessage[];
  sentMessages: FollowUpMessage[];
  totalCareCount: number;
  lastInteractionDate: string;
}

const MESSAGE_TYPE_INFO = {
  check_in: { icon: '○', label: '日常问候', color: '#3B82F6' },
  encouragement: { icon: '▲', label: '鼓励支持', color: '#10B981' },
  reminder: { icon: '●', label: '学习提醒', color: '#F59E0B' },
  celebration: { icon: '◇', label: '成就庆祝', color: '#8B5CF6' },
  concern: { icon: '○', label: '关心问候', color: '#EC4899' },
  resource: { icon: '●', label: '资源推荐', color: '#06B6D4' }
};

const PRIORITY_LABELS = {
  1: { text: '低', color: '#9CA3AF' },
  2: { text: '中', color: '#F59E0B' },
  3: { text: '高', color: '#EF4444' }
};

export default function MentorCare() {
  const [careData, setCareData] = useState<CareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent'>('pending');

  useEffect(() => {
    loadCareData();
  }, []);

  const loadCareData = async () => {
    try {
      setLoading(true);
      const studentId = Taro.getStorageSync('userId');

      if (!studentId) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      const res = await mentorStageAPI.getFollowUpMessages(studentId);

      if (res.success && res.data) {
        setCareData(res.data);
      }
    } catch (error) {
      console.error('加载关心数据失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message: FollowUpMessage) => {
    if (message.status === 'pending') {
      // 跳转到对话页面
      Taro.navigateTo({
        url: '/pages/mentor/index'
      });
    } else if (message.status === 'sent') {
      // 显示消息详情
      Taro.showModal({
        title: MESSAGE_TYPE_INFO[message.type]?.label || '导师消息',
        content: message.content,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    }
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return date.toLocaleDateString('zh-CN');
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) return '即将发送';
    if (hours < 1) return '1小时内';
    if (hours < 24) return `${hours}小时后`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天后`;
    return date.toLocaleDateString('zh-CN');
  };

  const renderMessageCard = (message: FollowUpMessage) => {
    const typeInfo = MESSAGE_TYPE_INFO[message.type] || MESSAGE_TYPE_INFO.check_in;
    const priorityInfo = PRIORITY_LABELS[message.priority] || PRIORITY_LABELS[1];

    return (
      <View
        key={message.id}
        className={`message-card ${message.status}`}
        onClick={() => handleMessageClick(message)}
      >
        <View className="message-header">
          <View className="message-type" style={{ backgroundColor: typeInfo.color }}>
            <Text className="type-icon">{typeInfo.icon}</Text>
            <Text className="type-label">{typeInfo.label}</Text>
          </View>
          <View className="priority-badge" style={{ color: priorityInfo.color }}>
            <Text>{priorityInfo.text}优先级</Text>
          </View>
        </View>

        <Text className="message-content">{message.content}</Text>

        {message.context && (
          <View className="message-context">
            {message.context.lastTopic && (
              <View className="context-item">
                <Text className="context-label">上次话题：</Text>
                <Text className="context-value">{message.context.lastTopic}</Text>
              </View>
            )}
            {message.context.lastEmotion && (
              <View className="context-item">
                <Text className="context-label">上次情绪：</Text>
                <Text className="context-value">{message.context.lastEmotion}</Text>
              </View>
            )}
            {message.context.daysSinceLastInteraction !== undefined && (
              <View className="context-item">
                <Text className="context-label">距上次互动：</Text>
                <Text className="context-value">{message.context.daysSinceLastInteraction}天</Text>
              </View>
            )}
          </View>
        )}

        <View className="message-footer">
          {message.status === 'pending' && (
            <Text className="scheduled-time">
              ● 计划{formatScheduledTime(message.scheduledFor)}发送
            </Text>
          )}
          {message.status === 'sent' && message.sentAt && (
            <Text className="sent-time">
              ✓ {formatDate(message.sentAt)}已发送
            </Text>
          )}
          {message.status === 'responded' && (
            <Text className="responded-badge">
              ● 已回复
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="mentor-care-page">
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    );
  }

  if (!careData) {
    return (
      <View className="mentor-care-page">
        <View className="empty-container">
          <Text className="empty-text">暂无关心数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mentor-care-page">
      {/* 顶部统计 */}
      <View className="care-header">
        <View className="header-gradient" />
        <View className="header-content">
          <Text className="page-title">● 导师关心</Text>
          <View className="stats-row">
            <View className="stat-item">
              <Text className="stat-number">{careData.totalCareCount}</Text>
              <Text className="stat-label">总关心次数</Text>
            </View>
            <View className="stat-divider" />
            <View className="stat-item">
              <Text className="stat-number">{careData.pendingMessages.length}</Text>
              <Text className="stat-label">待发送消息</Text>
            </View>
            <View className="stat-divider" />
            <View className="stat-item">
              <Text className="stat-value">{formatDate(careData.lastInteractionDate)}</Text>
              <Text className="stat-label">上次互动</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab切换 */}
      <View className="tabs">
        <View
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Text>待发送</Text>
          {careData.pendingMessages.length > 0 && (
            <View className="tab-badge">
              <Text>{careData.pendingMessages.length}</Text>
            </View>
          )}
        </View>
        <View
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <Text>已发送</Text>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView className="content-area" scrollY>
        {activeTab === 'pending' && (
          <View className="messages-section">
            {careData.pendingMessages.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-icon">●</Text>
                <Text className="empty-text">暂无待发送消息</Text>
                <Text className="empty-hint">导师会在合适的时候主动关心你</Text>
              </View>
            ) : (
              <View className="messages-list">
                {careData.pendingMessages.map((message) => renderMessageCard(message))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'sent' && (
          <View className="messages-section">
            {careData.sentMessages.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-icon">●</Text>
                <Text className="empty-text">还没有发送过消息</Text>
              </View>
            ) : (
              <View className="messages-list">
                {careData.sentMessages.map((message) => renderMessageCard(message))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
