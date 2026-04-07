// 前端 - AI导师聊天组件

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Message {
  id: string;
  type: 'user' | 'mentor';
  content: string;
  timestamp: Date;
}

interface MentorChatProps {
  taskId: string;
  onClose?: () => void;
}

export default function MentorChat({ taskId, onClose }: MentorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [taskId]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/mentor/conversations/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const msgs: Message[] = [];
        data.data.forEach((c: any) => {
          if (c.user_message) {
            msgs.push({
              id: c.id + '-user',
              type: 'user',
              content: c.user_message,
              timestamp: new Date(c.created_at),
            });
          }
          msgs.push({
            id: c.id,
            type: 'mentor',
            content: c.mentor_response,
            timestamp: new Date(c.created_at),
          });
        });
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/mentor/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId, message: input }),
      });

      const data = await res.json();

      if (data.success && data.data.isStuck) {
        const mentorMessage: Message = {
          id: Date.now().toString() + '-mentor',
          type: 'mentor',
          content: data.data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, mentorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gradient-soft">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
            <Image src="/cat-logo.png" alt="启程小猫" width={32} height={32} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">启程小猫</h3>
            <p className="text-xs text-gray-500">AI导师 · 随时为你解答</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden animate-float">
              <Image src="/cat-logo.png" alt="启程小猫" width={64} height={64} />
            </div>
            <p className="text-gray-600 mb-2">你好！我是启程小猫</p>
            <p className="text-sm text-gray-500">有什么问题随时问我，我会一直陪着你</p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-slide-up ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* 头像 */}
            <div
              className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0
              ${
                msg.type === 'mentor'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white overflow-hidden'
                  : 'bg-gray-200 text-gray-700'
              }
            `}
            >
              {msg.type === 'mentor' ? <Image src="/cat-logo.png" alt="AI导师" width={32} height={32} /> : '我'}
            </div>

            {/* 消息气泡 */}
            <div
              className={`
              max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
              ${
                msg.type === 'mentor'
                  ? 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              }
            `}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
              <Image src="/cat-logo.png" alt="AI导师" width={32} height={32} />
            </div>
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="有什么问题随时问我..."
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-sm"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            发送
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">💡 提示：说「我卡住了」「不知道怎么做」，我会给你线索</p>
      </div>
    </div>
  );
}
