import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface RecommendedTask {
  taskId: string;
  title: string;
  description: string;
  originalTitle: string;
  budgetMin: number;
  budgetMax: number;
  trackType: string;
  levelRequired: string;
  companyName: string;
  matchScore: number;
  matchReason: any;
  whatYouWillLearn: string;
  estimatedHours: number;
  difficulty: number;
  pushedAt: string;
  viewed: boolean;
}

export default function RecommendedTasks() {
  const [tasks, setTasks] = useState<RecommendedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendedTasks();
  }, []);

  const loadRecommendedTasks = async () => {
    setLoading(true);
    try {
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/tasks/students/recommended-tasks',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (error) {
      console.error('加载推荐任务失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({
      url: `/pages/tasks/detail?id=${taskId}`
    });
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 0.8) return '非常适合你';
    if (score >= 0.6) return '比较适合你';
    return '可以尝试';
  };

  const getDifficultyStars = (difficulty: number) => {
    const stars = Math.round(difficulty / 2);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View className="recommended-tasks loading">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className="recommended-tasks">
      <View className="header">
        <View className="header-icon">✨</View>
        <View className="header-content">
          <Text className="header-title">为你精选的任务</Text>
          <Text className="header-subtitle">
            AI根据你的能力和偏好，为你推荐了{tasks.length}个任务
          </Text>
        </View>
      </View>

      {tasks.length === 0 ? (
        <View className="empty">
          <Image
            className="empty-image"
            src="https://via.placeholder.com/300x200?text=No+Tasks"
            mode="aspectFit"
          />
          <Text className="empty-text">暂无推荐任务</Text>
          <Text className="empty-hint">完善你的个人资料，获得更多推荐</Text>
        </View>
      ) : (
        <ScrollView className="tasks-container" scrollY>
          {tasks.map((task) => (
            <View
              key={task.taskId}
              className="task-card"
              onClick={() => handleTaskClick(task.taskId)}
            >
              {!task.viewed && <View className="new-badge">NEW</View>}

              <View className="task-header">
                <View className="match-score-badge">
                  <Text
                    className="match-score-value"
                    style={{ color: getMatchScoreColor(task.matchScore) }}
                  >
                    {(task.matchScore * 100).toFixed(0)}%
                  </Text>
                  <Text className="match-score-label">匹配度</Text>
                </View>
                <View className="task-meta">
                  <Text className="company-name">{task.companyName}</Text>
                  <Text className="pushed-time">{formatDate(task.pushedAt)}</Text>
                </View>
              </View>

              <View className="task-content">
                <Text className="task-title">{task.title}</Text>
                <Text className="task-description">{task.description}</Text>

                <View className="task-tags">
                  <View className="tag budget-tag">
                    💰 ¥{task.budgetMin}-{task.budgetMax}
                  </View>
                  <View className="tag time-tag">
                    ⏱️ 约{task.estimatedHours}小时
                  </View>
                  <View className="tag difficulty-tag">
                    {getDifficultyStars(task.difficulty)}
                  </View>
                </View>
              </View>

              <View className="match-reason">
                <View className="reason-header">
                  <Text className="reason-icon">🎯</Text>
                  <Text className="reason-title">为什么推荐给你</Text>
                </View>
                <Text
                  className="reason-text"
                  style={{ color: getMatchScoreColor(task.matchScore) }}
                >
                  {getMatchScoreLabel(task.matchScore)}
                </Text>
              </View>

              {task.whatYouWillLearn && (
                <View className="learning-value">
                  <View className="learning-header">
                    <Text className="learning-icon">📚</Text>
                    <Text className="learning-title">你会学到</Text>
                  </View>
                  <Text className="learning-text">{task.whatYouWillLearn}</Text>
                </View>
              )}

              <View className="task-footer">
                <Text className="view-detail">查看详情 →</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
