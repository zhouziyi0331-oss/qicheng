'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'student' | 'mentor' | 'system';
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  taskId: string;
  currentStage: string;
  stageStatus: string;
  totalMessages: number;
}

interface MentorStageChatProps {
  taskId: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  requirement_understanding: '需求理解',
  execution_guidance: '执行引导',
  quality_review: '质量预审',
  communication_bridge: '沟通桥梁',
};

const STAGE_ICONS: Record<string, string> = {
  requirement_understanding: '📋',
  execution_guidance: '🚀',
  quality_review: '✅',
  communication_bridge: '🌉',
};

export function MentorStageChat({ taskId, isOpen = true, onToggle }: MentorStageChatProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载会话
  useEffect(() => {
    if (taskId) {
      loadSession();
    }
  }, [taskId]);

  // 加载消息历史
  useEffect(() => {
    if (session) {
      loadMessages();
    }
  }, [session]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/mentor-stage/tasks/${taskId}/session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('加载会话失败');
      }

      const { data } = await response.json();
      setSession(data);
    } catch (error) {
      console.error('加载会话失败', error);
      setError('加载会话失败，请刷新页面重试');
    }
  };

  const loadMessages = async () => {
    if (!session) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/mentor-stage/sessions/${session.id}/messages?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('加载消息失败');
      }

      const { data } = await response.json();
      setMessages(data.messages.reverse());
    } catch (error) {
      console.error('加载消息失败', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    // 立即显示用户消息
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'student',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/mentor-stage/sessions/${session.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) {
        throw new Error('发送消息失败');
      }

      const { data } = await response.json();

      // 移除临时消息，添加真实消息
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempMessage.id);
        return [
          ...filtered,
          {
            id: data.messageId,
            role: 'mentor',
            content: data.content,
            createdAt: new Date().toISOString(),
          }
        ];
      });
    } catch (error) {
      console.error('发送消息失败', error);
      setError('发送消息失败，请重试');
      // 移除临时消息
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl z-50"
      >
        🐱
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">启程小猫 🐱</h3>
          <p className="text-xs opacity-90">
            {session ? STAGE_LABELS[session.currentStage] || '加载中...' : '加载中...'}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="text-white hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* 阶段指示器 */}
      {session && <StageIndicator currentStage={session.currentStage} />}

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-4xl mb-2">🐱</p>
            <p className="text-sm">还没有消息，开始对话吧！</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">小猫正在思考...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题或想法..."
            className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>

        {/* 快捷操作 */}
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => setInput('我遇到了一些困难，需要帮助')}
            className="text-xs bg-white hover:bg-gray-100 px-3 py-1 rounded border border-gray-200 transition-colors"
            disabled={loading}
          >
            我卡住了
          </button>
          <button
            onClick={() => setInput('请帮我检查一下我的理解是否正确')}
            className="text-xs bg-white hover:bg-gray-100 px-3 py-1 rounded border border-gray-200 transition-colors"
            disabled={loading}
          >
            检查理解
          </button>
        </div>
      </div>
    </div>
  );
}

// 消息气泡组件
function MessageBubble({ message }: { message: Message }) {
  const isStudent = message.role === 'student';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isStudent
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {!isStudent && <div className="text-xs font-bold mb-1">启程小猫 🐱</div>}
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        <div className={`text-xs mt-1 ${isStudent ? 'text-purple-100' : 'text-gray-500'}`}>
          {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

// 阶段指示器组件
function StageIndicator({ currentStage }: { currentStage: string }) {
  const stages = [
    { key: 'requirement_understanding', label: '需求理解', icon: '📋' },
    { key: 'execution_guidance', label: '执行引导', icon: '🚀' },
    { key: 'quality_review', label: '质量预审', icon: '✅' },
    { key: 'communication_bridge', label: '沟通桥梁', icon: '🌉' },
  ];

  const currentIndex = stages.findIndex(s => s.key === currentStage);

  return (
    <div className="flex justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
      {stages.map((stage, index) => {
        const isActive = stage.key === currentStage;
        const isPassed = currentIndex > index;

        return (
          <div key={stage.key} className="flex flex-col items-center flex-1 relative">
            {/* 连接线 */}
            {index < stages.length - 1 && (
              <div
                className={`absolute top-4 left-1/2 w-full h-0.5 ${
                  isPassed ? 'bg-green-400' : 'bg-gray-200'
                }`}
                style={{ zIndex: 0 }}
              />
            )}

            {/* 图标 */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm relative z-10 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                  : isPassed
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-400'
              }`}
            >
              {stage.icon}
            </div>

            {/* 标签 */}
            <div className={`text-xs mt-1 text-center ${
              isActive ? 'font-bold text-purple-600' : 'text-gray-500'
            }`}>
              {stage.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
