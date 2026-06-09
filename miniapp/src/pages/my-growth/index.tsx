import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { mentorStageAPI } from '../../services/api';
import './index.scss';

interface EmotionData {
  emotion: string;
  intensity: number;
  detectedAt: string;
}

interface Milestone {
  id: string;
  type: string;
  description: string;
  achievedAt: string;
  celebrated: boolean;
}

interface Memory {
  id: string;
  content: string;
  importance: number;
  tags: string[];
  createdAt: string;
}

interface GrowthDashboard {
  profile: {
    studentId: string;
    learningStyle: string;
    preferredPace: string;
    strengthAreas: string[];
    improvementAreas: string[];
    totalMilestones: number;
    totalMessages: number;
  };
  recentEmotions: EmotionData[];
  recentMilestones: Milestone[];
  importantMemories: Memory[];
}

const EMOTION_MAP = {
  anxious: { name: '焦虑', icon: '😰', color: '#F59E0B' },
  frustrated: { name: '沮丧', icon: '😤', color: '#EF4444' },
  confused: { name: '困惑', icon: '😕', color: '#6B7280' },
  excited: { name: '兴奋', icon: '🤩', color: '#10B981' },
  confident: { name: '自信', icon: '😎', color: '#3B82F6' },
  overwhelmed: { name: '不堪重负', icon: '😵', color: '#DC2626' },
  proud: { name: '自豪', icon: '😊', color: '#8B5CF6' }
};

const MILESTONE_ICONS = {
  first_question: '❓',
  first_breakthrough: '💡',
  overcame_fear: '💪',
  independent_solution: '🎯',
  helped_others: '🤝',
  completed_challenge: '🏆',
  positive_feedback: '⭐',
  skill_mastery: '🎓',
  growth_reflection: '🌱'
};

export default function MyGrowth() {
  const [dashboard, setDashboard] = useState<GrowthDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'emotions' | 'milestones' | 'memories'>('emotions');

  useEffect(() => {
    loadGrowthData();
  }, []);

  const loadGrowthData = async () => {
    try {
      setLoading(true);
      const studentId = Taro.getStorageSync('userId');

      if (!studentId) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      const res = await mentorStageAPI.getGrowthDashboard(studentId);

      if (res.success && res.data) {
        setDashboard(res.data);
      }
    } catch (error) {
      console.error('加载成长数据失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <View className="my-growth-page">
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View className="my-growth-page">
        <View className="empty-container">
          <Text className="empty-text">暂无成长数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="my-growth-page">
      {/* 顶部统计卡片 */}
      <View className="stats-header">
        <View className="header-gradient" />
        <View className="stats-content">
          <Text className="page-title">我的成长</Text>
          <View className="stats-cards">
            <View className="stat-card">
              <Text className="stat-number">{dashboard.profile.totalMilestones}</Text>
              <Text className="stat-label">成长里程碑</Text>
            </View>
            <View className="stat-card">
              <Text className="stat-number">{dashboard.profile.totalMessages}</Text>
              <Text className="stat-label">对话次数</Text>
            </View>
            <View className="stat-card">
              <Text className="stat-number">{dashboard.importantMemories.length}</Text>
              <Text className="stat-label">重要记忆</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 学习档案 */}
      <View className="profile-card">
        <Text className="card-title">📊 学习档案</Text>
        <View className="profile-content">
          <View className="profile-item">
            <Text className="profile-label">学习风格</Text>
            <Text className="profile-value">{dashboard.profile.learningStyle || '探索中'}</Text>
          </View>
          <View className="profile-item">
            <Text className="profile-label">学习节奏</Text>
            <Text className="profile-value">{dashboard.profile.preferredPace || '适中'}</Text>
          </View>
          {dashboard.profile.strengthAreas.length > 0 && (
            <View className="profile-item">
              <Text className="profile-label">优势领域</Text>
              <View className="tags">
                {dashboard.profile.strengthAreas.map((area, index) => (
                  <View key={index} className="tag tag-success">
                    <Text>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {dashboard.profile.improvementAreas.length > 0 && (
            <View className="profile-item">
              <Text className="profile-label">成长空间</Text>
              <View className="tags">
                {dashboard.profile.improvementAreas.map((area, index) => (
                  <View key={index} className="tag tag-warning">
                    <Text>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Tab切换 */}
      <View className="tabs">
        <View
          className={`tab ${activeTab === 'emotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('emotions')}
        >
          <Text>情绪曲线</Text>
        </View>
        <View
          className={`tab ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          <Text>成长里程碑</Text>
        </View>
        <View
          className={`tab ${activeTab === 'memories' ? 'active' : ''}`}
          onClick={() => setActiveTab('memories')}
        >
          <Text>导师记忆</Text>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView className="content-area" scrollY>
        {/* 情绪曲线 */}
        {activeTab === 'emotions' && (
          <View className="emotions-section">
            {dashboard.recentEmotions.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-text">还没有情绪记录</Text>
              </View>
            ) : (
              <View className="emotions-list">
                {dashboard.recentEmotions.map((emotion, index) => {
                  const emotionInfo = EMOTION_MAP[emotion.emotion] || EMOTION_MAP.confused;
                  return (
                    <View key={index} className="emotion-item">
                      <View className="emotion-icon-wrapper">
                        <Text className="emotion-icon">{emotionInfo.icon}</Text>
                      </View>
                      <View className="emotion-info">
                        <View className="emotion-header">
                          <Text className="emotion-name">{emotionInfo.name}</Text>
                          <Text className="emotion-time">{formatDate(emotion.detectedAt)}</Text>
                        </View>
                        <View className="emotion-bar-container">
                          <View
                            className="emotion-bar"
                            style={{
                              width: `${emotion.intensity * 100}%`,
                              backgroundColor: emotionInfo.color
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* 成长里程碑 */}
        {activeTab === 'milestones' && (
          <View className="milestones-section">
            {dashboard.recentMilestones.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-text">还没有里程碑</Text>
              </View>
            ) : (
              <View className="timeline">
                {dashboard.recentMilestones.map((milestone, index) => {
                  const icon = MILESTONE_ICONS[milestone.type] || '🎉';
                  return (
                    <View key={milestone.id} className="timeline-item">
                      <View className="timeline-dot">
                        <Text className="timeline-icon">{icon}</Text>
                      </View>
                      {index < dashboard.recentMilestones.length - 1 && (
                        <View className="timeline-line" />
                      )}
                      <View className="timeline-content">
                        <Text className="milestone-description">{milestone.description}</Text>
                        <Text className="milestone-time">{formatDate(milestone.achievedAt)}</Text>
                        {milestone.celebrated && (
                          <View className="celebrated-badge">
                            <Text>✨ 已庆祝</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* 导师记忆 */}
        {activeTab === 'memories' && (
          <View className="memories-section">
            {dashboard.importantMemories.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-text">导师还没有记住什么</Text>
              </View>
            ) : (
              <View className="memories-list">
                {dashboard.importantMemories.map((memory) => (
                  <View key={memory.id} className="memory-card">
                    <View className="memory-header">
                      <View className="importance-indicator">
                        {[...Array(Math.round(memory.importance * 5))].map((_, i) => (
                          <Text key={i} className="star">⭐</Text>
                        ))}
                      </View>
                      <Text className="memory-time">{formatDate(memory.createdAt)}</Text>
                    </View>
                    <Text className="memory-content">{memory.content}</Text>
                    {memory.tags.length > 0 && (
                      <View className="memory-tags">
                        {memory.tags.map((tag, index) => (
                          <View key={index} className="memory-tag">
                            <Text>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
