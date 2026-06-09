import { View, Text, ScrollView, Input, Image } from '@tarojs/components';
import { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import { mentorStageAPI } from '../../services/api';
import { EmotionIndicator, ToolCard, MilestoneCelebration } from '../../components/mentor';
import catAvatar from '../../assets/images/cat-logo.png';
import './index.scss';

interface Message {
  id: string;
  role: 'student' | 'mentor' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    requirementScore?: number;
    productFramework?: string;
    qualityScore?: number;
    suggestions?: string[];
    passed?: boolean;
    emotion?: {
      type: string;
      intensity: number;
    };
    toolRecommendation?: {
      toolName: string;
      description: string;
      reason: string;
      relevanceScore: number;
    };
  };
}

interface Session {
  id: string;
  taskId: string;
  currentStage: string;
  stageStatus: string;
  totalMessages: number;
  requirementUnderstandingCompleted?: boolean;
  executionGuidanceCount?: number;
  qualityReviewScore?: number;
  qualityReviewPassed?: boolean;
}

interface QualityReviewResult {
  passed: boolean;
  score: number;
  suggestions: string[];
  detailedFeedback: string;
}

interface Milestone {
  id: string;
  type: string;
  title: string;
  description: string;
  reward?: string;
}

const STAGE_CONFIG = {
  requirement_understanding: { label: '需求理解', icon: '📋', color: '#8B5CF6' },
  execution_guidance: { label: '执行引导', icon: '🚀', color: '#EC4899' },
  quality_review: { label: '质量预审', icon: '✅', color: '#10B981' },
  communication_bridge: { label: '沟通桥梁', icon: '🌉', color: '#06B6D4' }
};

export default function MentorChat() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [showQualityReview, setShowQualityReview] = useState(false);
  const [qualityReviewResult, setQualityReviewResult] = useState<QualityReviewResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const scrollViewRef = useRef<any>(null);

  // 新增状态
  const [currentEmotion, setCurrentEmotion] = useState<{ type: string; intensity: number } | null>(null);
  const [currentTool, setCurrentTool] = useState<any>(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.taskId) {
      setTaskId(params.taskId);
      setTaskTitle(params.taskTitle || '任务');
      loadSession(params.taskId);
    }

    // 获取学生ID
    const userId = Taro.getStorageSync('userId');
    if (userId) {
      setStudentId(userId);
      checkUncelebratedMilestones(userId);
    }
  }, []);

  // 检查未庆祝的里程碑
  const checkUncelebratedMilestones = async (studentId: string) => {
    try {
      const res = await mentorStageAPI.getUncelebratedMilestones(studentId);
      if (res.success && res.data && res.data.length > 0) {
        const milestone = res.data[0];
        setCurrentMilestone({
          id: milestone.id,
          type: milestone.type,
          title: milestone.description,
          description: `你在${new Date(milestone.achievedAt).toLocaleDateString()}达成了这个成就！`,
          reward: '继续加油，更多成就等你解锁！'
        });
        setShowMilestone(true);
      }
    } catch (error) {
      console.error('检查里程碑失败:', error);
    }
  };

  // 庆祝里程碑
  const handleCelebrateMilestone = async () => {
    if (currentMilestone) {
      try {
        await mentorStageAPI.celebrateMilestone(currentMilestone.id);
      } catch (error) {
        console.error('庆祝里程碑失败:', error);
      }
    }
    setShowMilestone(false);
    setCurrentMilestone(null);
  };

  // 加载会话
  const loadSession = async (taskId: string) => {
    try {
      Taro.showLoading({ title: '加载中...' });
      const res = await mentorStageAPI.getSession(taskId);

      if (res.success && res.data) {
        setSession(res.data);
        loadMessages(res.data.id);
      } else {
        Taro.showToast({
          title: '暂无导师会话',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载会话失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      Taro.hideLoading();
    }
  };

  // 加载消息历史
  const loadMessages = async (sessionId: string) => {
    try {
      const res = await mentorStageAPI.getMessages(sessionId, 50, 0);

      if (res.success && res.data) {
        setMessages(res.data.messages.reverse());

        // 检查最后一条消息的情绪和工具推荐
        const lastMessage = res.data.messages[res.data.messages.length - 1];
        if (lastMessage?.metadata?.emotion) {
          setCurrentEmotion(lastMessage.metadata.emotion);
        }
        if (lastMessage?.metadata?.toolRecommendation) {
          setCurrentTool(lastMessage.metadata.toolRecommendation);
        }

        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (messages.length > 0) {
      const query = Taro.createSelectorQuery();
      query.select('.message-list').boundingClientRect();
      query.selectViewport().scrollOffset();
      query.exec((res) => {
        if (res[0]) {
          Taro.pageScrollTo({
            scrollTop: res[0].height,
            duration: 300
          });
        }
      });
    }
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() || !session) {
      return;
    }

    const content = inputText.trim();
    const userMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'student',
      content,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setTimeout(() => scrollToBottom(), 100);

    try {
      const res = await mentorStageAPI.sendMessage(session.id, content);

      if (res.success && res.data) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== userMessage.id);
          return [
            ...filtered,
            {
              id: res.data.messageId,
              role: 'student',
              content,
              createdAt: new Date().toISOString()
            },
            {
              id: res.data.messageId + '-mentor',
              role: 'mentor',
              content: res.data.content,
              createdAt: new Date().toISOString(),
              metadata: res.data.metadata
            }
          ];
        });

        // 更新情绪和工具推荐
        if (res.data.metadata?.emotion) {
          setCurrentEmotion(res.data.metadata.emotion);
        }
        if (res.data.metadata?.toolRecommendation) {
          setCurrentTool(res.data.metadata.toolRecommendation);
        }

        setTimeout(() => scrollToBottom(), 100);
        setRetryCount(0);
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      setInputText(content);

      Taro.showToast({
        title: error.message || '发送失败，请重试',
        icon: 'none',
        duration: 2000
      });

      setRetryCount(prev => prev + 1);
      if (retryCount >= 2) {
        Taro.showModal({
          title: '网络异常',
          content: '多次发送失败，请检查网络连接或稍后再试',
          showCancel: false
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 快捷操作
  const handleQuickAction = (text: string) => {
    setInputText(text);
  };

  // 请求质量预审
  const handleQualityReview = async () => {
    if (!taskId) {
      Taro.showToast({
        title: '任务信息缺失',
        icon: 'none'
      });
      return;
    }

    Taro.showModal({
      title: '质量预审',
      content: '请输入您的提交内容描述',
      editable: true,
      placeholderText: '例如：我已完成了...',
      success: async (modalRes) => {
        if (modalRes.confirm && modalRes.content) {
          try {
            Taro.showLoading({ title: '预审中...' });
            const res = await mentorStageAPI.requestQualityReview(taskId, modalRes.content);

            if (res.success && res.data) {
              const result: QualityReviewResult = {
                passed: res.data.passed,
                score: res.data.score,
                suggestions: parseSuggestions(res.data.feedback),
                detailedFeedback: res.data.feedback
              };

              setQualityReviewResult(result);
              setShowQualityReview(true);

              const systemMsg: Message = {
                id: 'review-' + Date.now(),
                role: 'system',
                content: result.passed
                  ? `✅ 质量预审通过！得分：${result.score}/100`
                  : `⚠️ 质量预审未通过，得分：${result.score}/100，请根据建议改进`,
                createdAt: new Date().toISOString(),
                metadata: {
                  qualityScore: result.score,
                  passed: result.passed,
                  suggestions: result.suggestions
                }
              };

              setMessages(prev => [...prev, systemMsg]);
            }
          } catch (error: any) {
            console.error('质量预审失败:', error);
            Taro.showToast({
              title: error.message || '预审失败',
              icon: 'none'
            });
          } finally {
            Taro.hideLoading();
          }
        }
      }
    });
  };

  // 解析建议列表
  const parseSuggestions = (feedback: string): string[] => {
    const suggestions: string[] = [];
    const suggestionsMatch = feedback.match(/改进建议[：:]([\s\S]*?)(?=\n\n|导师寄语|是否通过|$)/);

    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1];
      const lines = suggestionsText.split('\n')
        .map(s => s.trim())
        .filter(s => s && (s.startsWith('-') || s.startsWith('•') || /^\d+\./.test(s)))
        .map(s => s.replace(/^[-•\d.]\s*/, ''));
      suggestions.push(...lines);
    }

    if (suggestions.length === 0) {
      suggestions.push('请仔细检查功能完整性');
      suggestions.push('确保代码质量和规范');
      suggestions.push('完善文档和注释');
    }

    return suggestions;
  };

  // 使用工具
  const handleUseTool = () => {
    if (currentTool) {
      Taro.showToast({
        title: '已记录使用',
        icon: 'success'
      });
      // TODO: 调用API记录工具使用
      setCurrentTool(null);
    }
  };

  // 关闭工具推荐
  const handleDismissTool = () => {
    setCurrentTool(null);
  };

  const currentStageConfig = session
    ? STAGE_CONFIG[session.currentStage as keyof typeof STAGE_CONFIG]
    : null;

  return (
    <View className='mentor-chat-page'>
      {/* 顶部导航栏 */}
      <View className='chat-header'>
        <View className='header-content'>
          <Image className='cat-icon' src={catAvatar} mode='aspectFill' />
          <View className='header-text'>
            <Text className='header-title'>启程小猫 🐱</Text>
            {currentStageConfig && (
              <Text className='header-subtitle'>
                {currentStageConfig.icon} {currentStageConfig.label}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* 阶段进度条 */}
      {session && (
        <View className='stage-progress'>
          {Object.entries(STAGE_CONFIG).map(([key, config], index) => {
            const isActive = session.currentStage === key;
            const stages = Object.keys(STAGE_CONFIG);
            const currentIndex = stages.indexOf(session.currentStage);
            const isPassed = currentIndex > index;

            return (
              <View key={key} className='stage-item'>
                <View
                  className={`stage-dot ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                  style={{ backgroundColor: isActive ? config.color : isPassed ? '#10B981' : '#E5E7EB' }}
                >
                  <Text className='stage-icon'>{config.icon}</Text>
                </View>
                <Text className={`stage-label ${isActive ? 'active' : ''}`}>
                  {config.label}
                </Text>
                {index < Object.keys(STAGE_CONFIG).length - 1 && (
                  <View
                    className='stage-line'
                    style={{ backgroundColor: isPassed ? '#10B981' : '#E5E7EB' }}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* 情绪指示器 */}
      {currentEmotion && (
        <EmotionIndicator
          emotion={currentEmotion.type}
          intensity={currentEmotion.intensity}
          showTip={true}
        />
      )}

      {/* 工具推荐卡片 */}
      {currentTool && (
        <ToolCard
          toolName={currentTool.toolName}
          description={currentTool.description}
          reason={currentTool.reason}
          relevanceScore={currentTool.relevanceScore}
          onUse={handleUseTool}
          onDismiss={handleDismissTool}
        />
      )}

      {/* 消息列表 */}
      <ScrollView
        className='message-list'
        scrollY
        scrollIntoView={`msg-${messages.length - 1}`}
        scrollWithAnimation
      >
        {messages.length === 0 && !loading && (
          <View className='empty-state'>
            <Image className='empty-icon' src={catAvatar} mode='aspectFill' />
            <Text className='empty-text'>还没有消息，开始对话吧！</Text>
          </View>
        )}

        {messages.map((msg, index) => (
          <View
            key={msg.id}
            id={`msg-${index}`}
            className={`message-item ${msg.role}`}
          >
            {/* 系统消息 */}
            {msg.role === 'system' && (
              <View className='system-message'>
                <Text className='system-text'>{msg.content}</Text>
              </View>
            )}

            {/* 导师消息 */}
            {msg.role === 'mentor' && (
              <View className='mentor-message'>
                <Image className='avatar' src={catAvatar} mode='aspectFill' />
                <View className='message-bubble mentor-bubble'>
                  <Text className='message-content'>{msg.content}</Text>
                  <Text className='message-time'>
                    {new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* 学生消息 */}
            {msg.role === 'student' && (
              <View className='student-message'>
                <View className='message-bubble student-bubble'>
                  <Text className='message-content'>{msg.content}</Text>
                  <Text className='message-time'>
                    {new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* 加载中 */}
        {loading && (
          <View className='message-item mentor'>
            <Image className='avatar' src={catAvatar} mode='aspectFill' />
            <View className='message-bubble mentor-bubble loading'>
              <Text className='loading-text'>小猫正在思考...</Text>
              <View className='loading-dots'>
                <View className='dot' />
                <View className='dot' />
                <View className='dot' />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 快捷操作 */}
      <View className='quick-actions'>
        <View
          className='quick-btn'
          onClick={() => handleQuickAction('我遇到了一些困难，需要帮助')}
        >
          <Text className='quick-text'>我卡住了</Text>
        </View>
        <View
          className='quick-btn'
          onClick={() => handleQuickAction('请帮我检查一下我的理解是否正确')}
        >
          <Text className='quick-text'>检查理解</Text>
        </View>
        <View className='quick-btn' onClick={handleQualityReview}>
          <Text className='quick-text'>质量预审</Text>
        </View>
      </View>

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
          confirmType='send'
        />
        <View
          className={`send-btn ${inputText.trim() && !loading ? 'active' : ''}`}
          onClick={handleSend}
        >
          <Text className='btn-text'>发送</Text>
        </View>
      </View>

      {/* 里程碑庆祝弹窗 */}
      {currentMilestone && (
        <MilestoneCelebration
          visible={showMilestone}
          milestone={currentMilestone}
          onClose={handleCelebrateMilestone}
        />
      )}
    </View>
  );
}
