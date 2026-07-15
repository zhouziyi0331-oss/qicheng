import { View, Text, Button, ScrollView, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../../services/api';
import './index.scss';

interface Challenge {
  id: number;
  level: number;
  track: string;
  title: string;
  description: string;
  requirements: any;
  time_limit: number;
  pass_score: number;
}

interface ChallengeRecord {
  id: number;
  title: string;
  level: number;
  track: string;
  status: string;
  score?: number;
  feedback?: string;
  started_at: string;
  submitted_at?: string;
  reviewed_at?: string;
  cooldown_until?: string;
}

export default function LevelChallenge() {
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [challengeHistory, setChallengeHistory] = useState<ChallengeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [availableRes, historyRes] = await Promise.all([
        api.challengeGraduation.getAvailableChallenges(),
        api.challengeGraduation.getChallengeHistory()
      ]);

      if (availableRes.success) {
        setAvailableChallenges(availableRes.data);
      }

      if (historyRes.success) {
        setChallengeHistory(historyRes.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallenge = async (challengeTaskId: number) => {
    try {
      const res = await api.challengeGraduation.startChallenge(challengeTaskId);
      if (res.success) {
        Taro.showToast({ title: '挑战已开始', icon: 'success' });
        loadData();
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '开始挑战失败', icon: 'none' });
    }
  };

  const handleSubmitChallenge = (challengeId: number) => {
    Taro.navigateTo({
      url: `/pages/challenge-submit/index?challengeId=${challengeId}`
    });
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      in_progress: '进行中',
      submitted: '已提交',
      passed: '通过',
      failed: '未通过'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap = {
      in_progress: 'status-progress',
      submitted: 'status-submitted',
      passed: 'status-passed',
      failed: 'status-failed'
    };
    return classMap[status] || '';
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('zh-CN');
  };

  const renderRequirements = (requirements: any) => {
    if (!requirements) return null;
    return Object.entries(requirements).map(([key, value]) => (
      <View key={key} className="requirement-item">
        <Text className="req-key">{key}:</Text>
        <Text className="req-value">{String(value)}</Text>
      </View>
    ));
  };

  return (
    <View className="level-challenge">
      <View className="header">
        <Text className="title">跳级挑战</Text>
        <Text className="subtitle">完成挑战任务，快速升级</Text>
      </View>

      <View className="tabs">
        <View
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          <Text>可用挑战</Text>
        </View>
        <View
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Text>挑战历史</Text>
        </View>
      </View>

      {activeTab === 'available' && (
        <ScrollView className="content" scrollY>
          {loading ? (
            <View className="loading">加载中...</View>
          ) : availableChallenges.length === 0 ? (
            <View className="empty">
              <Text>暂无可用挑战</Text>
              <Text className="tip">完成当前等级任务后解锁</Text>
            </View>
          ) : (
            availableChallenges.map(challenge => (
              <View key={challenge.id} className="challenge-card">
                <View className="card-header">
                  <View className="level-badge">Lv.{challenge.level}</View>
                  <View className="track-badge">{challenge.track === 'content' ? 'AI内容创作' : 'AI工具开发'}</View>
                </View>

                <Text className="challenge-title">{challenge.title}</Text>
                <Text className="challenge-desc">{challenge.description}</Text>

                <View className="requirements">
                  <Text className="section-title">验收标准</Text>
                  {renderRequirements(challenge.requirements)}
                </View>

                <View className="challenge-info">
                  <View className="info-item">
                    <Text className="label">时限</Text>
                    <Text className="value">{challenge.time_limit}小时</Text>
                  </View>
                  <View className="info-item">
                    <Text className="label">通过分数</Text>
                    <Text className="value">{challenge.pass_score}分</Text>
                  </View>
                </View>

                <Button
                  className="start-btn"
                  onClick={() => handleStartChallenge(challenge.id)}
                >
                  开始挑战
                </Button>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'history' && (
        <ScrollView className="content" scrollY>
          {loading ? (
            <View className="loading">加载中...</View>
          ) : challengeHistory.length === 0 ? (
            <View className="empty">
              <Text>暂无挑战记录</Text>
            </View>
          ) : (
            challengeHistory.map(record => (
              <View key={record.id} className="history-card">
                <View className="card-header">
                  <View className="level-badge">Lv.{record.level}</View>
                  <View className={`status-badge ${getStatusClass(record.status)}`}>
                    {getStatusText(record.status)}
                  </View>
                </View>

                <Text className="challenge-title">{record.title}</Text>

                <View className="timeline">
                  <View className="timeline-item">
                    <Text className="time-label">开始时间</Text>
                    <Text className="time-value">{formatTime(record.started_at)}</Text>
                  </View>
                  {record.submitted_at && (
                    <View className="timeline-item">
                      <Text className="time-label">提交时间</Text>
                      <Text className="time-value">{formatTime(record.submitted_at)}</Text>
                    </View>
                  )}
                  {record.reviewed_at && (
                    <View className="timeline-item">
                      <Text className="time-label">评审时间</Text>
                      <Text className="time-value">{formatTime(record.reviewed_at)}</Text>
                    </View>
                  )}
                </View>

                {record.score !== undefined && (
                  <View className="score-section">
                    <Text className="score-label">评分</Text>
                    <Text className={`score-value ${record.status === 'passed' ? 'passed' : 'failed'}`}>
                      {record.score}分
                    </Text>
                  </View>
                )}

                {record.feedback && (
                  <View className="feedback-section">
                    <Text className="feedback-label">评审反馈</Text>
                    <Text className="feedback-content">{record.feedback}</Text>
                  </View>
                )}

                {record.status === 'in_progress' && (
                  <Button
                    className="submit-btn"
                    onClick={() => handleSubmitChallenge(record.id)}
                  >
                    提交作品
                  </Button>
                )}

                {record.status === 'failed' && record.cooldown_until && (
                  <View className="cooldown-notice">
                    <Text>冷却期至: {formatTime(record.cooldown_until)}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
