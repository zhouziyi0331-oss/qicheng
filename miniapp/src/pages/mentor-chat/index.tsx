import { View, Text, ScrollView, Input, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { mentorAPI } from '../../services/api';
import catAvatar from '../../assets/images/cat-logo.png';
import './index.scss';

interface Message {
  id: string;
  role: 'student' | 'mentor';
  content: string;
  detectedPassionSpark?: boolean;
  detectedFlowMoment?: boolean;
  timestamp: string;
}

export default function MentorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const studentId = Taro.getStorageSync('userId');

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.taskId) {
      setTaskId(params.taskId);
      setTaskTitle(params.taskTitle || '项目');
      loadWelcomeMessage(params.taskId);
    }
  }, []);

  // 加载欢迎消息
  const loadWelcomeMessage = async (taskId: string) => {
    try {
      const res = await mentorAPI.getWelcomeMessage(studentId, taskId);
      if (res.success) {
        setMessages([{
          id: Date.now().toString(),
          role: 'mentor',
          content: res.message,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('加载欢迎消息失败:', error);
    }
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'student',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    const content = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await mentorAPI.chat(studentId, taskId, content, conversationHistory);

      if (res.success) {
        const mentorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'mentor',
          content: res.response,
          detectedPassionSpark: res.detectedPassionSpark,
          detectedFlowMoment: res.detectedFlowMoment,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, mentorMessage]);

        // 显示检测到的兴趣发现或专注时刻
        if (res.detectedPassionSpark) {
          Taro.showToast({
            title: '✨ 捕捉到兴趣发现！',
            icon: 'none',
            duration: 2000
          });
        }

        if (res.detectedFlowMoment) {
          Taro.showToast({
            title: '🌊 记录专注时刻！',
            icon: 'none',
            duration: 2000
          });
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Taro.showToast({ title: '发送失败', icon: 'none' });
      setInputText(content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='mentor-chat-page'>
      {/* 顶部提示 */}
      <View className='chat-header'>
        <Text className='header-title'>AI导师</Text>
        <Text className='header-subtitle'>不是来教技能的，是来帮你看见自己的</Text>
      </View>

      {/* 消息列表 */}
      <ScrollView
        className='message-list'
        scrollY
        scrollIntoView={`msg-${messages.length - 1}`}
      >
        {messages.map((msg, index) => (
          <View
            key={msg.id}
            id={`msg-${index}`}
            className={`message-item ${msg.role === 'student' ? 'student' : 'mentor'}`}
          >
            {/* 导师头像 */}
            {msg.role === 'mentor' && (
              <Image className='avatar' src={catAvatar} mode='aspectFill' />
            )}

            <View className='message-bubble'>
              <Text className='message-content'>{msg.content}</Text>

              {/* 兴趣发现标记 */}
              {msg.detectedPassionSpark && (
                <View className='spark-badge'>
                  <Text className='badge-text'>✨ 兴趣发现</Text>
                </View>
              )}

              {/* 专注时刻标记 */}
              {msg.detectedFlowMoment && (
                <View className='flow-badge'>
                  <Text className='badge-text'>🌊 专注时刻</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {loading && (
          <View className='message-item mentor'>
            <Image className='avatar' src={catAvatar} mode='aspectFill' />
            <View className='message-bubble loading'>
              <Text className='loading-text'>导师正在思考...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 输入框 */}
      <View className='input-bar'>
        <Input
          className='message-input'
          type='text'
          placeholder='说说你的想法...'
          value={inputText}
          onInput={(e) => setInputText(e.detail.value)}
          onConfirm={handleSend}
          disabled={loading}
        />
        <View
          className={`send-btn ${inputText.trim() ? 'active' : ''}`}
          onClick={handleSend}
        >
          <Text className='btn-text'>发送</Text>
        </View>
      </View>
    </View>
  );
}
