import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../services/api';
import './index.scss';

interface Question {
  id: number;
  question: string;
  ai_answer?: string;
  ai_confidence?: number;
  company_answer?: string;
  status: 'pending' | 'answered' | 'forwarded';
  created_at: string;
  needsForward?: boolean;
  forwardReason?: string;
}

interface Clarification {
  id: number;
  content: string;
  company_name: string;
  created_at: string;
}

export default function TaskCommunication() {
  const [taskId, setTaskId] = useState<number>(0);
  const [userRole, setUserRole] = useState<'student' | 'company'>('student');
  const [activeTab, setActiveTab] = useState<'qa' | 'clarification'>('qa');

  // 问答相关
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  // 补充说明相关
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [newClarification, setNewClarification] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // 从路由参数获取任务ID
    const instance = Taro.getCurrentInstance();
    const id = instance.router?.params.taskId;
    if (id) {
      setTaskId(parseInt(id));
    }

    // 获取用户角色
    const role = Taro.getStorageSync('userRole') || 'student';
    setUserRole(role);
  }, []);

  useEffect(() => {
    if (taskId) {
      loadQuestions();
      loadClarifications();
    }
  }, [taskId]);

  const loadQuestions = async () => {
    try {
      const res = await api.communication.getQuestions(taskId);
      if (res.success) {
        setQuestions(res.data);
      }
    } catch (error) {
      console.error('加载问答失败:', error);
    }
  };

  const loadClarifications = async () => {
    try {
      const res = await api.communication.getClarifications(taskId);
      if (res.success) {
        setClarifications(res.data);
      }
    } catch (error) {
      console.error('加载补充说明失败:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      Taro.showToast({ title: '请输入问题', icon: 'none' });
      return;
    }

    setIsAsking(true);
    try {
      const res = await api.communication.askQuestion(taskId, question);
      if (res.success) {
        Taro.showToast({ title: 'AI正在分析...', icon: 'loading' });
        setQuestion('');

        // 等待1秒后刷新列表
        setTimeout(() => {
          loadQuestions();
        }, 1000);
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '提问失败', icon: 'none' });
    } finally {
      setIsAsking(false);
    }
  };

  const handleForwardToCompany = async (questionId: number) => {
    try {
      const res = await api.communication.forwardToCompany(questionId);
      if (res.success) {
        Taro.showToast({ title: '已转发给企业', icon: 'success' });
        loadQuestions();
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '转发失败', icon: 'none' });
    }
  };

  const handleMarkHelpful = async (questionId: number, isHelpful: boolean) => {
    try {
      await api.communication.markAIAnswerHelpful(questionId, isHelpful);
      Taro.showToast({ title: '感谢反馈', icon: 'success' });
    } catch (error) {
      console.error('标记失败:', error);
    }
  };

  const handleAddClarification = async () => {
    if (!newClarification.trim()) {
      Taro.showToast({ title: '请输入补充说明', icon: 'none' });
      return;
    }

    setIsAdding(true);
    try {
      const res = await api.communication.addClarification(taskId, newClarification);
      if (res.success) {
        Taro.showToast({ title: '添加成功', icon: 'success' });
        setNewClarification('');
        loadClarifications();
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '添加失败', icon: 'none' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAnswerQuestion = async (questionId: number) => {
    Taro.showModal({
      title: '回复学生',
      editable: true,
      placeholderText: '请输入回复内容',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await api.communication.answerQuestion(questionId, res.content);
            Taro.showToast({ title: '回复成功', icon: 'success' });
            loadQuestions();
          } catch (error: any) {
            Taro.showToast({ title: error.message || '回复失败', icon: 'none' });
          }
        }
      }
    });
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  return (
    <View className="task-communication">
      {/* Tab切换 */}
      <View className="tabs">
        <View
          className={`tab ${activeTab === 'qa' ? 'active' : ''}`}
          onClick={() => setActiveTab('qa')}
        >
          <Text>问答</Text>
        </View>
        <View
          className={`tab ${activeTab === 'clarification' ? 'active' : ''}`}
          onClick={() => setActiveTab('clarification')}
        >
          <Text>补充说明</Text>
        </View>
      </View>

      {/* 问答Tab */}
      {activeTab === 'qa' && (
        <View className="qa-section">
          {/* 学生提问区 */}
          {userRole === 'student' && (
            <View className="ask-box">
              <View className="ask-header">
                <Text className="title">向AI提问</Text>
                <Text className="tip">AI会先尝试回答，如果答不出会转发给企业</Text>
              </View>
              <Input
                className="question-input"
                placeholder="请输入您的问题..."
                value={question}
                onInput={(e) => setQuestion(e.detail.value)}
                maxlength={500}
              />
              <Button
                className="ask-btn"
                onClick={handleAskQuestion}
                loading={isAsking}
                disabled={isAsking}
              >
                提问
              </Button>
            </View>
          )}

          {/* 问答列表 */}
          <ScrollView className="qa-list" scrollY>
            {questions.length === 0 ? (
              <View className="empty">
                <Text>暂无问答记录</Text>
              </View>
            ) : (
              questions.map(q => (
                <View key={q.id} className="qa-item">
                  <View className="question-box">
                    <Text className="label">问题</Text>
                    <Text className="content">{q.question}</Text>
                    <Text className="time">{formatTime(q.created_at)}</Text>
                  </View>

                  {/* AI回答 */}
                  {q.ai_answer && (
                    <View className="answer-box ai">
                      <View className="answer-header">
                        <Text className="label">AI回答</Text>
                        {q.ai_confidence && (
                          <Text className="confidence">
                            置信度: {(q.ai_confidence * 100).toFixed(0)}%
                          </Text>
                        )}
                      </View>
                      <Text className="content">{q.ai_answer}</Text>

                      {userRole === 'student' && q.status === 'answered' && !q.company_answer && (
                        <View className="actions">
                          <Button
                            className="action-btn helpful"
                            size="mini"
                            onClick={() => handleMarkHelpful(q.id, true)}
                          >
                            有帮助
                          </Button>
                          <Button
                            className="action-btn not-helpful"
                            size="mini"
                            onClick={() => handleMarkHelpful(q.id, false)}
                          >
                            没帮助
                          </Button>
                          {q.needsForward && (
                            <Button
                              className="action-btn forward"
                              size="mini"
                              onClick={() => handleForwardToCompany(q.id)}
                            >
                              转发给企业
                            </Button>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* 企业回答 */}
                  {q.company_answer && (
                    <View className="answer-box company">
                      <Text className="label">企业回答</Text>
                      <Text className="content">{q.company_answer}</Text>
                    </View>
                  )}

                  {/* 待回复状态 */}
                  {q.status === 'forwarded' && !q.company_answer && (
                    <View className="answer-box pending">
                      <Text className="label">等待企业回复...</Text>
                      {userRole === 'company' && (
                        <Button
                          className="reply-btn"
                          size="mini"
                          onClick={() => handleAnswerQuestion(q.id)}
                        >
                          回复
                        </Button>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* 补充说明Tab */}
      {activeTab === 'clarification' && (
        <View className="clarification-section">
          {/* 企业添加补充说明 */}
          {userRole === 'company' && (
            <View className="add-box">
              <View className="add-header">
                <Text className="title">添加补充说明</Text>
                <Text className="tip">为学生提供更详细的任务说明</Text>
              </View>
              <Input
                className="clarification-input"
                placeholder="请输入补充说明..."
                value={newClarification}
                onInput={(e) => setNewClarification(e.detail.value)}
                maxlength={1000}
              />
              <Button
                className="add-btn"
                onClick={handleAddClarification}
                loading={isAdding}
                disabled={isAdding}
              >
                添加
              </Button>
            </View>
          )}

          {/* 补充说明列表 */}
          <ScrollView className="clarification-list" scrollY>
            {clarifications.length === 0 ? (
              <View className="empty">
                <Text>暂无补充说明</Text>
              </View>
            ) : (
              clarifications.map(c => (
                <View key={c.id} className="clarification-item">
                  <View className="header">
                    <Text className="company-name">{c.company_name}</Text>
                    <Text className="time">{formatTime(c.created_at)}</Text>
                  </View>
                  <Text className="content">{c.content}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
