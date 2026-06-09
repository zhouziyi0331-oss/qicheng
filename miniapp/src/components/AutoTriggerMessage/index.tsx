import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { apiService } from '../../services/api';
import './auto-trigger-message.scss';

interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context: string;
  triggeredBy: string;
  autoTriggered: boolean;
  studentViewed: boolean;
  viewedAt?: string;
  studentReplied: boolean;
  repliedAt?: string;
  createdAt: string;
}

interface AutoTriggerMessageProps {
  orderId: string;
  onMessageViewed?: (messageId: string) => void;
}

export default function AutoTriggerMessage({ orderId, onMessageViewed }: AutoTriggerMessageProps) {
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [orderId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/mentor-trigger/messages/${orderId}`);

      if (response.success) {
        const msgs = response.data || [];
        setMessages(msgs);

        // 标记未查看的消息为已查看
        const unviewedMessages = msgs.filter(m => !m.studentViewed && m.role === 'assistant');
        for (const msg of unviewedMessages) {
          await markAsViewed(msg.id);
        }
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (messageId: string) => {
    try {
      await apiService.post(`/mentor-trigger/messages/${messageId}/viewed`);
      if (onMessageViewed) {
        onMessageViewed(messageId);
      }
    } catch (error) {
      console.error('Mark as viewed error:', error);
    }
  };

  const getTriggerLabel = (triggeredBy: string): string => {
    const labels: Record<string, string> = {
      'T-01': '接单引导',
      'T-03': '打回指导',
      'T-05': '完成庆祝',
      'manual': '手动触发'
    };
    return labels[triggeredBy] || triggeredBy;
  };

  const getTriggerIcon = (triggeredBy: string): string => {
    const icons: Record<string, string> = {
      'T-01': '🎯',
      'T-03': '💡',
      'T-05': '🎉',
      'manual': '✨'
    };
    return icons[triggeredBy] || '💬';
  };

  const getContextLabel = (context: string): string => {
    const labels: Record<string, string> = {
      'task_start': '任务开始',
      'stuck': '遇到困难',
      'rejection_guidance': '修改指导',
      'milestone_celebration': '里程碑庆祝'
    };
    return labels[context] || context;
  };

  if (loading) {
    return (
      <View className="auto-trigger-loading">
        <Text className="loading-text">加载中...</Text>
      </View>
    );
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <View className="auto-trigger-messages">
      {messages.map((message) => (
        <View key={message.id} className="trigger-message-item">
          {/* 触发标签 */}
          {message.autoTriggered && (
            <View className="trigger-badge">
              <Text className="badge-icon">{getTriggerIcon(message.triggeredBy)}</Text>
              <Text className="badge-text">{getTriggerLabel(message.triggeredBy)}</Text>
            </View>
          )}

          {/* 消息内容 */}
          <View className={`message-bubble ${message.role}`}>
            <Text className="message-content">{message.content}</Text>

            {/* 时间戳 */}
            <View className="message-meta">
              <Text className="message-time">
                {new Date(message.createdAt).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              {message.context && (
                <Text className="message-context">· {getContextLabel(message.context)}</Text>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
