import { View, Text, ScrollView, Input, Image, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { mentorAPI } from '../../services/api';
import catAvatar from '../../assets/images/cat-logo.png';
import './index.scss';

interface Message {
  id: string;
  role: 'student' | 'mentor';
  content: string;
  stage?: 'requirement' | 'guidance' | 'review' | 'bridge';
  accuracy?: number;
  productFramework?: string;
  issues?: any[];
  strengths?: any[];
  timestamp: string;
}

interface TaskStage {
  current: 'requirement_confirmation' | 'execution' | 'review' | 'revision' | 'completed';
  requirementConfirmed: boolean;
  aiReviewPassed: boolean;
  companyReviewPassed: boolean;
}

export default function EnhancedMentorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStage, setTaskStage] = useState<TaskStage>({
    current: 'requirement_confirmation',
    requirementConfirmed: false,
    aiReviewPassed: false,
    companyReviewPassed: false
  });
  const [showProductFramework, setShowProductFramework] = useState(false);
  const [productFramework, setProductFramework] = useState('');
  const studentId = Taro.getStorageSync('userId');

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.taskId) {
      setTaskId(params.taskId);
      setTaskTitle(params.taskTitle || '项目');
      initializeRequirementConfirmation(params.taskId);
    }
  }, []);

  // 初始化需求确认对话
  const initializeRequirementConfirmation = async (taskId: string) => {
    try {
      Taro.showLoading({ title: '启程小猫来了...' });
      
      const res = await Taro.request({
        url: `http://localhost:3000/api/mentor/tasks/${taskId}/requirement-confirmation/start`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('accessToken')}`
        }
      });

      if (res.data.success) {
        setMessages([{
          id: Date.now().toString(),
          role: 'mentor',
          content: res.data.data.message,
          stage: 'requirement',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('初始化失败:', error);
      // 降级方案
      setMessages([{
        id: Date.now().toString(),
        role: 'mentor',
        content: `嗨！我是启程小猫 🐱\n\n你刚接到了「${taskTitle}」这个任务，先别急着动手。\n\n我想先听听你的想法：看完任务描述后，你觉得这个任务主要是要做什么呀？用你自己的话说说看～`,
        stage: 'requirement',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      Taro.hideLoading();
    }
  };

  // 发送消息（根据当前阶段调用不同API）
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
      let apiUrl = '';
      let requestBody: any = {};

      // 根据当前阶段选择API
      switch (taskStage.current) {
        case 'requirement_confirmation':
          apiUrl = `http://localhost:3000/api/mentor/tasks/${taskId}/requirement-confirmation/analyze`;
          requestBody = { studentResponse: content };
          break;
        
        case 'execution':
          apiUrl = `http://localhost:3000/api/mentor/tasks/${taskId}/guidance/help`;
          requestBody = { 
            question: content,
            currentStep: '执行中',
            context: messages.slice(-3).map(m => m.content).join('\n')
          };
          break;
        
        default:
          apiUrl = `http://localhost:3000/api/mentor/tasks/${taskId}/guidance/help`;
          requestBody = { question: content };
      }

      const res = await Taro.request({
        url: apiUrl,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('accessToken')}`,
          'Content-Type': 'application/json'
        },
        data: requestBody
      });

      if (res.data.success) {
        const data = res.data.data;
        
        const mentorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'mentor',
          content: data.message || data.translatedFeedback || data.feedback,
          accuracy: data.accuracy,
          productFramework: data.productFramework,
          issues: data.issues,
          strengths: data.strengths,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, mentorMessage]);

        // 如果需求确认通过
        if (data.isAccurate && data.productFramework) {
          setTaskStage(prev => ({
            ...prev,
            current: 'execution',
            requirementConfirmed: true
          }));
          setProductFramework(data.productFramework);
          setShowProductFramework(true);
          
          Taro.showToast({
            title: '✅ 需求理解正确！',
            icon: 'success',
            duration: 2000
          });
        }

        // 如果有准确度评分
        if (data.accuracy !== undefined) {
          if (data.accuracy >= 80) {
            Taro.showToast({
              title: `理解准确度：${data.accuracy}分`,
              icon: 'success'
            });
          } else {
            Taro.showToast({
              title: `还有些偏差，再想想～`,
              icon: 'none'
            });
          }
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

  // 快捷操作：我卡住了
  const handleStuck = () => {
    setInputText('我卡住了，不知道下一步该怎么做...');
  };

  // 快捷操作：完成了一步
  const handleStepCompleted = async (step: string) => {
    try {
      setLoading(true);
      const res = await Taro.request({
        url: `http://localhost:3000/api/mentor/tasks/${taskId}/guidance/celebrate`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('accessToken')}`,
          'Content-Type': 'application/json'
        },
        data: {
          completedStep: step,
          achievement: '完成了这一步'
        }
      });

      if (res.data.success) {
        const mentorMessage: Message = {
          id: Date.now().toString(),
          role: 'mentor',
          content: res.data.data.message,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, mentorMessage]);
      }
    } catch (error) {
      console.error('庆祝失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 提交作品给AI审核
  const handleSubmitForReview = () => {
    Taro.navigateTo({
      url: `/pages/tasks/submit?taskId=${taskId}&aiReview=true`
    });
  };

  // 查看产品功能框架
  const viewProductFramework = () => {
    Taro.showModal({
      title: '产品功能框架',
      content: productFramework,
      showCancel: false,
      confirmText: '知道了'
    });
  };

  return (
    <View className='enhanced-mentor-chat'>
      {/* 顶部状态栏 */}
      <View className='stage-header'>
        <View className='stage-indicator'>
          <View className={`stage-dot ${taskStage.current === 'requirement_confirmation' ? 'active' : taskStage.requirementConfirmed ? 'completed' : ''}`}>
            <Text className='stage-text'>需求确认</Text>
          </View>
          <View className='stage-line' />
          <View className={`stage-dot ${taskStage.current === 'execution' ? 'active' : ''}`}>
            <Text className='stage-text'>执行引导</Text>
          </View>
          <View className='stage-line' />
          <View className={`stage-dot ${taskStage.current === 'review' ? 'active' : taskStage.aiReviewPassed ? 'completed' : ''}`}>
            <Text className='stage-text'>质量审核</Text>
          </View>
        </View>
        
        {productFramework && (
          <View className='framework-badge' onClick={viewProductFramework}>
            <Text className='badge-text'>📋 查看功能框架</Text>
          </View>
        )}
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
            {msg.role === 'mentor' && (
              <Image className='avatar' src={catAvatar} mode='aspectFill' />
            )}

            <View className='message-bubble'>
              <Text className='message-content'>{msg.content}</Text>

              {/* 准确度评分 */}
              {msg.accuracy !== undefined && (
                <View className='accuracy-badge'>
                  <Text className='badge-text'>
                    理解准确度：{msg.accuracy}分
                    {msg.accuracy >= 80 ? ' ✅' : ' 🤔'}
                  </Text>
                </View>
              )}

              {/* 优点列表 */}
              {msg.strengths && msg.strengths.length > 0 && (
                <View className='strengths-list'>
                  <Text className='list-title'>✨ 做得好的地方：</Text>
                  {msg.strengths.map((s: string, i: number) => (
                    <Text key={i} className='list-item'>• {s}</Text>
                  ))}
                </View>
              )}

              {/* 问题列表 */}
              {msg.issues && msg.issues.length > 0 && (
                <View className='issues-list'>
                  <Text className='list-title'>💡 需要改进：</Text>
                  {msg.issues.map((issue: any, i: number) => (
                    <View key={i} className='issue-item'>
                      <Text className='issue-type'>[{issue.type}]</Text>
                      <Text className='issue-desc'>{issue.description}</Text>
                      <Text className='issue-suggestion'>💭 {issue.suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        {loading && (
          <View className='message-item mentor'>
            <Image className='avatar' src={catAvatar} mode='aspectFill' />
            <View className='message-bubble loading'>
              <Text className='loading-text'>启程小猫正在思考...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 快捷操作栏 */}
      {taskStage.current === 'execution' && (
        <View className='quick-actions'>
          <View className='action-btn' onClick={handleStuck}>
            <Text className='btn-text'>🆘 我卡住了</Text>
          </View>
          <View className='action-btn' onClick={() => handleStepCompleted('当前步骤')}>
            <Text className='btn-text'>✅ 完成一步</Text>
          </View>
          <View className='action-btn' onClick={handleSubmitForReview}>
            <Text className='btn-text'>📤 提交审核</Text>
          </View>
        </View>
      )}

      {/* 输入框 */}
      <View className='input-bar'>
        <Input
          className='message-input'
          type='text'
          placeholder={
            taskStage.current === 'requirement_confirmation' 
              ? '用你自己的话说说...' 
              : '有什么问题随时问我...'
          }
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
