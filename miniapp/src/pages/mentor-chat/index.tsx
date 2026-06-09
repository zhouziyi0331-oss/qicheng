import { View, Text, ScrollView, Input, Image } from '@tarojs/components';
import { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import { mentorStageAPI } from '../../services/api';
import TypewriterText from '../../components/TypewriterText';
import ToolCard from '../../components/ToolCard';
import AutoTriggerMessage from '../../components/AutoTriggerMessage';
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
    tools?: Array<{
      name: string;
      icon: string;
      description: string;
      url?: string;
      category: 'design' | 'dev' | 'ai' | 'productivity';
    }>;
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

const STAGE_CONFIG = {
  requirement_understanding: { label: '需求理解', icon: '📋', color: '#8B5CF6' },
  execution_guidance: { label: '执行引导', icon: '🚀', color: '#EC4899' },
  quality_review: { label: '质量预审', icon: '✅', color: '#10B981' },
  communication_bridge: { label: '沟通桥梁', icon: '🌉', color: '#06B6D4' }
};

// 推荐工具库
const RECOMMENDED_TOOLS = {
  design: [
    { name: 'Figma', icon: '🎨', description: '协作设计工具，适合UI/UX设计', url: 'https://figma.com', category: 'design' as const },
    { name: 'Canva', icon: '✨', description: '简单易用的图形设计工具', url: 'https://canva.com', category: 'design' as const },
    { name: '即时设计', icon: '🖌️', description: '国产协作设计工具', url: 'https://js.design', category: 'design' as const }
  ],
  dev: [
    { name: 'VS Code', icon: '💻', description: '强大的代码编辑器', url: 'https://code.visualstudio.com', category: 'dev' as const },
    { name: 'GitHub', icon: '🐙', description: '代码托管和协作平台', url: 'https://github.com', category: 'dev' as const },
    { name: 'Stack Overflow', icon: '📚', description: '开发者问答社区', url: 'https://stackoverflow.com', category: 'dev' as const }
  ],
  ai: [
    { name: 'ChatGPT', icon: '🤖', description: 'AI对话助手，帮助解决问题', url: 'https://chat.openai.com', category: 'ai' as const },
    { name: 'Claude', icon: '🧠', description: 'Anthropic的AI助手', url: 'https://claude.ai', category: 'ai' as const },
    { name: 'Midjourney', icon: '🎭', description: 'AI图像生成工具', url: 'https://midjourney.com', category: 'ai' as const }
  ],
  productivity: [
    { name: 'Notion', icon: '📝', description: '全能笔记和协作工具', url: 'https://notion.so', category: 'productivity' as const },
    { name: 'Trello', icon: '📊', description: '看板式项目管理工具', url: 'https://trello.com', category: 'productivity' as const },
    { name: '飞书', icon: '🚀', description: '企业协作平台', url: 'https://feishu.cn', category: 'productivity' as const }
  ]
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
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null); // 正在打字的消息ID
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.taskId) {
      setTaskId(params.taskId);
      setTaskTitle(params.taskTitle || '任务');
      loadSession(params.taskId);
    }
  }, []);

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
        // 反转消息顺序，最新的在底部
        setMessages(res.data.messages.reverse());

        // 滚动到底部
        setTimeout(() => {
          scrollToBottom();
        }, 100);
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

    // 立即显示用户消息
    const userMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'student',
      content,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    // 滚动到底部
    setTimeout(() => scrollToBottom(), 100);

    try {
      const res = await mentorStageAPI.sendMessage(session.id, content);

      if (res.success && res.data) {
        // 移除临时消息，添加真实消息
        const mentorMessageId = res.data.messageId || 'mentor-' + Date.now();

        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== userMessage.id);
          return [
            ...filtered,
            {
              id: userMessage.id.replace('temp-', 'user-'),
              role: 'student',
              content,
              createdAt: new Date().toISOString()
            },
            {
              id: mentorMessageId,
              role: 'mentor',
              content: res.data.content,
              createdAt: new Date().toISOString()
            }
          ];
        });

        // 设置打字机效果
        setTypingMessageId(mentorMessageId);

        // 滚动到底部
        setTimeout(() => scrollToBottom(), 100);

        // 显示token使用提示
        if (res.data.tokensUsed) {
          console.log(`AI回复使用了 ${res.data.tokensUsed} tokens`);
        }

        // 重置重试计数
        setRetryCount(0);
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);

      // 移除临时消息
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));

      // 恢复输入框内容
      setInputText(content);

      // 显示详细错误信息
      const errorMsg = error.message || '发送失败，请重试';
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });

      // 增加重试计数
      setRetryCount(prev => prev + 1);

      // 如果重试次数过多，提示用户
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
              // 解析预审结果
              const result: QualityReviewResult = {
                passed: res.data.passed,
                score: res.data.score,
                suggestions: parseSuggestions(res.data.feedback),
                detailedFeedback: res.data.feedback
              };

              setQualityReviewResult(result);
              setShowQualityReview(true);

              // 添加系统消息
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

    // 尝试提取改进建议部分
    const suggestionsMatch = feedback.match(/改进建议[：:]([\s\S]*?)(?=\n\n|导师寄语|是否通过|$)/);
    if (suggestionsMatch) {
      const suggestionsText = suggestionsMatch[1];
      const lines = suggestionsText.split('\n')
        .map(s => s.trim())
        .filter(s => s && (s.startsWith('-') || s.startsWith('•') || /^\d+\./.test(s)))
        .map(s => s.replace(/^[-•\d.]\s*/, ''));

      suggestions.push(...lines);
    }

    // 如果没有找到，返回默认建议
    if (suggestions.length === 0) {
      suggestions.push('请仔细检查功能完整性');
      suggestions.push('确保代码质量符合标准');
      suggestions.push('完善文档和注释');
    }

    return suggestions;
  };

  // 快捷操作
  const handleQuickAction = (text: string) => {
    setInputText(text);
  };

  // 长按消息复制
  const handleLongPress = (content: string) => {
    Taro.setClipboardData({
      data: content,
      success: () => {
        Taro.showToast({
          title: '已复制',
          icon: 'success',
          duration: 1000
        });
      }
    });
  };

  // 刷新会话
  const handleRefresh = () => {
    if (taskId) {
      loadSession(taskId);
    }
  };

  // 查看会话统计
  const handleViewStats = async () => {
    if (!session) return;

    try {
      const res = await mentorStageAPI.getSessionStats(session.id);

      if (res.success && res.data) {
        const stats = res.data;
        Taro.showModal({
          title: '会话统计',
          content: `总消息数：${stats.totalMessages}\n` +
                   `学生消息：${stats.messagesByRole?.student || 0}\n` +
                   `导师消息：${stats.messagesByRole?.mentor || 0}\n` +
                   `使用tokens：${stats.totalTokensUsed}\n` +
                   `总成本：$${stats.totalCost?.toFixed(4) || '0.0000'}`,
          showCancel: false
        });
      }
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  // 获取当前阶段配置
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

        {/* AI导师自动触发消息 */}
        {taskId && (
          <AutoTriggerMessage
            orderId={taskId}
            onMessageViewed={(messageId) => {
              console.log('Message viewed:', messageId);
            }}
          />
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
                <View className='message-content-wrapper'>
                  <View className='message-bubble mentor-bubble'>
                    {typingMessageId === msg.id ? (
                      <TypewriterText
                        text={msg.content}
                        speed={30}
                        onComplete={() => setTypingMessageId(null)}
                        className='message-content'
                      />
                    ) : (
                      <Text className='message-content'>{msg.content}</Text>
                    )}
                    <Text className='message-time'>
                      {new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>

                  {/* 工具推荐卡片 */}
                  {msg.metadata?.tools && msg.metadata.tools.length > 0 && (
                    <View className='tools-section'>
                      <Text className='tools-title'>💡 推荐工具</Text>
                      {msg.metadata.tools.map((tool, idx) => (
                        <ToolCard key={idx} tool={tool} />
                      ))}
                    </View>
                  )}
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
          className='quick-btn stuck'
          onClick={() => handleQuickAction('我卡住了，遇到了一些困难，需要帮助')}
        >
          <Text className='quick-icon'>🆘</Text>
          <Text className='quick-text'>我卡住了</Text>
        </View>
        <View
          className='quick-btn check'
          onClick={() => handleQuickAction('请帮我检查一下我的理解是否正确')}
        >
          <Text className='quick-icon'>✅</Text>
          <Text className='quick-text'>检查理解</Text>
        </View>
        <View
          className='quick-btn tool'
          onClick={() => handleQuickAction('有什么工具可以帮助我完成这个任务？')}
        >
          <Text className='quick-icon'>🛠️</Text>
          <Text className='quick-text'>推荐工具</Text>
        </View>
        <View
          className='quick-btn example'
          onClick={() => handleQuickAction('能给我一个具体的例子吗？')}
        >
          <Text className='quick-icon'>💡</Text>
          <Text className='quick-text'>举个例子</Text>
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
    </View>
  );
}
