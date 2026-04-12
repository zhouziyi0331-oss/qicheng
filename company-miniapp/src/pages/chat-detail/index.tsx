import { View, Text, ScrollView, Input, Image } from '@tarojs/components';
import { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface Message {
  id: number;
  sender_id: number;
  sender_type: 'student' | 'company' | 'system';
  sender_name: string;
  sender_avatar: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  content: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  is_read: boolean;
}

interface Session {
  id: number;
  task_id: number;
  task_title: string;
  student_id: number;
  company_id: number;
}

export default function ChatDetail() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const currentUserId = Taro.getStorageSync('userId');

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const sessionId = params?.sessionId;
    const taskId = params?.taskId;
    const studentId = params?.studentId;

    if (sessionId) {
      loadSession(parseInt(sessionId));
    } else if (taskId && studentId) {
      createSession(parseInt(taskId), parseInt(studentId));
    }
  }, []);

  const createSession = async (taskId: number, studentId: number) => {
    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/chat/sessions',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          taskId,
          studentId,
          companyId: currentUserId
        }
      });

      if (res.data.success) {
        setSession(res.data.data);
        loadMessages(res.data.data.id);
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    }
  };

  const loadSession = async (sessionId: number) => {
    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/chat/sessions',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.data.success) {
        const foundSession = res.data.data.find((s: any) => s.id === sessionId);
        if (foundSession) {
          setSession(foundSession);
          loadMessages(sessionId);
        }
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/chat/sessions/${sessionId}/messages`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: {
          page: 1,
          limit: 100
        }
      });

      if (res.data.success) {
        setMessages(res.data.data.messages);
        markAsRead(sessionId);
        setTimeout(() => scrollToBottom(), 300);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (sessionId: number) => {
    try {
      const token = Taro.getStorageSync('token');
      await Taro.request({
        url: `http://localhost:3000/api/v1/chat/sessions/${sessionId}/read`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !session) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/chat/sessions/${session.id}/messages`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          content,
          messageType: 'text'
        }
      });

      if (res.data.success) {
        setMessages([...messages, res.data.data]);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Taro.showToast({ title: '发送失败', icon: 'none' });
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    Taro.createSelectorQuery()
      .select('#message-list')
      .boundingClientRect()
      .exec((res) => {
        if (res[0]) {
          Taro.pageScrollTo({
            scrollTop: res[0].height,
            duration: 300
          });
        }
      });
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        Taro.showToast({ title: '图片上传功能开发中', icon: 'none' });
      }
    });
  };

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

  if (loading) {
    return (
      <View className="chat-detail-company">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="chat-detail-company">
      {session && (
        <View className="chat-header">
          <Text className="task-title">{session.task_title}</Text>
        </View>
      )}

      <ScrollView
        id="message-list"
        scrollY
        className="message-list"
        scrollIntoView={`msg-${messages.length - 1}`}
      >
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === currentUserId;
          const isSystem = msg.message_type === 'system';

          if (isSystem) {
            return (
              <View key={msg.id} className="message-item system">
                <Text className="system-text">{msg.content}</Text>
              </View>
            );
          }

          return (
            <View
              key={msg.id}
              id={`msg-${index}`}
              className={`message-item ${isMine ? 'mine' : 'other'}`}
            >
              {!isMine && (
                <Image
                  className="avatar"
                  src={msg.sender_avatar || 'https://via.placeholder.com/80'}
                  mode="aspectFill"
                />
              )}
              <View className="message-content">
                {!isMine && <Text className="sender-name">{msg.sender_name}</Text>}
                <View className="bubble">
                  <Text className="text">{msg.content}</Text>
                </View>
                <Text className="time">{formatTime(msg.created_at)}</Text>
              </View>
              {isMine && (
                <Image
                  className="avatar"
                  src={msg.sender_avatar || 'https://via.placeholder.com/80'}
                  mode="aspectFill"
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <View className="input-bar">
        <View className="input-wrapper">
          <Input
            className="input"
            type="text"
            placeholder="输入消息..."
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            confirmType="send"
            onConfirm={handleSend}
          />
        </View>
        <View className="action-buttons">
          <View className="icon-btn" onClick={handleChooseImage}>
            <Text className="icon">📷</Text>
          </View>
          <View
            className={`send-btn ${inputText.trim() ? 'active' : ''}`}
            onClick={handleSend}
          >
            <Text className="send-text">{sending ? '发送中' : '发送'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
