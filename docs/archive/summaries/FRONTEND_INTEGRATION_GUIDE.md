# 前端集成快速开始指南

## 概述

本指南帮助前端开发者快速集成AI导师4阶段系统。

---

## 第一步：创建导师对话组件

### 1. 基础组件结构

创建文件：`frontend/components/mentor/MentorStageChat.tsx`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

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

export function MentorStageChat({ taskId, isOpen = true, onToggle }: MentorStageChatProps) {
  const { token } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载会话
  useEffect(() => {
    loadSession();
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
      const response = await fetch(`/api/v1/mentor-stage/tasks/${taskId}/session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const { data } = await response.json();
      setSession(data);
    } catch (error) {
      console.error('加载会话失败', error);
    }
  };

  const loadMessages = async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/v1/mentor-stage/sessions/${session.id}/messages?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const { data } = await response.json();
      setMessages(data.messages.reverse()); // 反转顺序，最新的在底部
    } catch (error) {
      console.error('加载消息失败', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // 立即显示用户消息
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'student',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(`/api/v1/mentor-stage/sessions/${session.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userMessage }),
      });

      const { data } = await response.json();

      // 添加导师回复
      const mentorMessage: Message = {
        id: data.messageId,
        role: 'mentor',
        content: data.content,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev.filter(m => m.id !== tempMessage.id), mentorMessage]);
    } catch (error) {
      console.error('发送消息失败', error);
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
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center"
      >
        🐱
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">启程小猫 🐱</h3>
          <p className="text-xs opacity-90">
            {session ? getStageLabel(session.currentStage) : '加载中...'}
          </p>
        </div>
        <button onClick={onToggle} className="text-white hover:bg-white/20 rounded p-1">
          ✕
        </button>
      </div>

      {/* 阶段指示器 */}
      {session && <StageIndicator currentStage={session.currentStage} />}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-bounce">🐱</div>
            <span className="text-sm">小猫正在思考...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题或想法..."
            className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
        
        {/* 快捷操作 */}
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => setInput('我遇到了一些困难，需要帮助')}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
          >
            我卡住了
          </button>
          <button
            onClick={() => setInput('请帮我检查一下我的理解是否正确')}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
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
  
  return (
    <div className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isStudent
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {!isStudent && <div className="text-xs font-bold mb-1">启程小猫 🐱</div>}
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        <div className={`text-xs mt-1 ${isStudent ? 'text-blue-100' : 'text-gray-500'}`}>
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

  return (
    <div className="flex justify-between px-4 py-2 bg-gray-50 border-b">
      {stages.map((stage, index) => {
        const isActive = stage.key === currentStage;
        const isPassed = stages.findIndex(s => s.key === currentStage) > index;
        
        return (
          <div key={stage.key} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : isPassed
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {stage.icon}
            </div>
            <div className={`text-xs mt-1 ${isActive ? 'font-bold text-blue-500' : 'text-gray-500'}`}>
              {stage.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 辅助函数
function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    requirement_understanding: '阶段1：需求理解',
    execution_guidance: '阶段2：执行引导',
    quality_review: '阶段3：质量预审',
    communication_bridge: '阶段4：沟通桥梁',
  };
  return labels[stage] || '未知阶段';
}
```

---

## 第二步：创建质量预审组件

创建文件：`frontend/components/mentor/PreCheckResult.tsx`

```typescript
'use client';

interface PreCheckResultProps {
  result: {
    passed: boolean;
    score: number;
    review: {
      totalScore: number;
      scores: {
        functionality: number;
        usability: number;
        codeQuality: number;
        documentation: number;
        innovation: number;
      };
      issues?: Array<{
        severity: 'critical' | 'warning' | 'suggestion';
        description: string;
        suggestion: string;
      }>;
      strengths: string[];
      feedback: string;
    };
  };
  onRecheck: () => void;
  onForceSubmit: () => void;
}

export function PreCheckResult({ result, onRecheck, onForceSubmit }: PreCheckResultProps) {
  const { passed, score, review } = result;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className={`p-6 ${passed ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {passed ? '✅ 预审通过！' : '⚠️ 需要改进'}
            </h2>
            <div className="text-4xl font-bold">{score}分</div>
          </div>
          <p className="mt-2 opacity-90">
            {passed
              ? '恭喜！你的作品已达到提交标准'
              : '你的作品还有一些需要改进的地方'}
          </p>
        </div>

        {/* 五维度评分 */}
        <div className="p-6 border-b">
          <h3 className="font-bold text-lg mb-4">📊 五维度评分</h3>
          <div className="space-y-3">
            {Object.entries(review.scores).map(([key, value]) => (
              <ScoreBar
                key={key}
                label={getDimensionLabel(key)}
                score={value}
                maxScore={20}
              />
            ))}
          </div>
        </div>

        {/* 亮点 */}
        {review.strengths.length > 0 && (
          <div className="p-6 border-b bg-green-50">
            <h3 className="font-bold text-lg mb-3 text-green-700">✨ 做得好的地方</h3>
            <ul className="space-y-2">
              {review.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 问题和建议 */}
        {review.issues && review.issues.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="font-bold text-lg mb-3 text-orange-700">🔧 改进建议</h3>
            <div className="space-y-4">
              {review.issues.map((issue, index) => (
                <IssueCard key={index} issue={issue} />
              ))}
            </div>
          </div>
        )}

        {/* 总体反馈 */}
        <div className="p-6 border-b bg-blue-50">
          <h3 className="font-bold text-lg mb-3 text-blue-700">💬 导师寄语</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{review.feedback}</p>
        </div>

        {/* 操作按钮 */}
        <div className="p-6 flex space-x-4">
          {passed ? (
            <button
              onClick={onForceSubmit}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600"
            >
              继续提交 →
            </button>
          ) : (
            <>
              <button
                onClick={onRecheck}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600"
              >
                修改后重新检查
              </button>
              <button
                onClick={onForceSubmit}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400"
              >
                强制提交（不推荐）
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 评分条组件
function ScoreBar({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  const color = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">{score}/{maxScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 问题卡片组件
function IssueCard({ issue }: { issue: { severity: string; description: string; suggestion: string } }) {
  const severityConfig = {
    critical: { icon: '🔴', label: '严重', color: 'border-red-500 bg-red-50' },
    warning: { icon: '🟡', label: '警告', color: 'border-yellow-500 bg-yellow-50' },
    suggestion: { icon: '🔵', label: '建议', color: 'border-blue-500 bg-blue-50' },
  };

  const config = severityConfig[issue.severity as keyof typeof severityConfig];

  return (
    <div className={`border-l-4 ${config.color} p-4 rounded`}>
      <div className="flex items-center mb-2">
        <span className="mr-2">{config.icon}</span>
        <span className="font-bold text-sm">{config.label}</span>
      </div>
      <p className="text-gray-700 mb-2">{issue.description}</p>
      <p className="text-sm text-gray-600">
        <span className="font-medium">💡 建议：</span>
        {issue.suggestion}
      </p>
    </div>
  );
}

// 辅助函数
function getDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    functionality: '功能完整性',
    usability: '可用性',
    codeQuality: '代码质量',
    documentation: '文档完善度',
    innovation: '创新性',
  };
  return labels[key] || key;
}
```

---

## 第三步：集成到任务详情页

修改文件：`frontend/app/tasks/[id]/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { MentorStageChat } from '@/components/mentor/MentorStageChat';
import { PreCheckResult } from '@/components/mentor/PreCheckResult';

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const [chatOpen, setChatOpen] = useState(true);
  const [preCheckResult, setPreCheckResult] = useState(null);
  const [showPreCheck, setShowPreCheck] = useState(false);

  // 提交前预审
  const handleSubmit = async (submissionData: any) => {
    try {
      const response = await fetch(`/api/v1/mentor-stage/tasks/${params.id}/quality-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission: submissionData.description,
        }),
      });

      const result = await response.json();

      if (result.requiresImprovement) {
        // 显示预审结果
        setPreCheckResult(result.data.preCheckResult);
        setShowPreCheck(true);
      } else if (result.success && result.data.passed) {
        // 通过预审，继续提交
        await actuallySubmit(submissionData);
      }
    } catch (error) {
      console.error('预审失败', error);
    }
  };

  const actuallySubmit = async (submissionData: any) => {
    // 实际的提交逻辑
    // ...
  };

  return (
    <div>
      {/* 任务详情内容 */}
      {/* ... */}

      {/* AI导师对话 */}
      <MentorStageChat
        taskId={params.id}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />

      {/* 预审结果弹窗 */}
      {showPreCheck && preCheckResult && (
        <PreCheckResult
          result={preCheckResult}
          onRecheck={() => setShowPreCheck(false)}
          onForceSubmit={() => {
            setShowPreCheck(false);
            actuallySubmit(submissionData);
          }}
        />
      )}
    </div>
  );
}
```

---

## 第四步：测试

### 1. 启动后端服务
```bash
cd backend
npm run dev
```

### 2. 启动前端服务
```bash
cd frontend
npm run dev
```

### 3. 测试流程
1. 登录学生账号
2. 接受一个任务
3. 等待3秒，导师对话窗口应该自动出现
4. 发送消息测试对话功能
5. 准备提交时测试质量预审功能

---

## 样式优化建议

### 1. 使用Tailwind CSS
已在示例代码中使用，确保项目已安装Tailwind CSS。

### 2. 响应式设计
```typescript
// 移动端适配
<div className="fixed bottom-4 right-4 w-full md:w-96 h-[600px] ...">
```

### 3. 动画效果
```typescript
// 添加过渡动画
<div className="transition-all duration-300 ease-in-out">
```

---

## 常见问题

### Q1: 如何处理token过期？
```typescript
const response = await fetch(url, { headers });
if (response.status === 401) {
  // 重新登录
  router.push('/login');
}
```

### Q2: 如何优化消息加载性能？
- 使用分页加载历史消息
- 实现虚拟滚动（react-window）
- 缓存已加载的消息

### Q3: 如何实现实时消息推送？
- 方案1：轮询（简单但不高效）
- 方案2：WebSocket（推荐）
- 方案3：Server-Sent Events

---

## 下一步

1. ✅ 实现基础对话功能
2. ✅ 实现质量预审功能
3. ⏳ 添加Markdown渲染支持
4. ⏳ 实现消息搜索功能
5. ⏳ 添加导师评分功能
6. ⏳ 实现消息导出功能

---

**文档版本**: v1.0.0  
**最后更新**: 2026-05-08
