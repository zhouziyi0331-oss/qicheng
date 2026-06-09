// 学生端 - 推荐任务页面
// 文件位置: miniapp/src/pages/tasks/recommended.tsx

import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './recommended.scss';

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
  // 新增：6维度匹配分数
  matchBreakdown?: {
    skillMatchScore?: number;
    difficultyMatchScore?: number;
    domainMatchScore?: number;
    growthPotentialScore?: number;
    reliabilityScore?: number;
    preferenceScore?: number;
  };
  // 新增：详细匹配理由
  detailedMatchReason?: string;
}

export default function RecommendedTasks() {
  const [tasks, setTasks] = useState<RecommendedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载推荐任务
  const loadRecommendedTasks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await Taro.request({
        url: '/api/v1/students/recommended-tasks',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (error) {
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 查看任务详情
  const handleViewTask = (taskId: string) => {
    Taro.navigateTo({
      url: `/pages/tasks/detail?id=${taskId}&from=recommended`
    });
  };

  // 接受推荐任务
  const handleAcceptTask = async (taskId: string) => {
    try {
      Taro.showLoading({ title: '处理中...' });

      const res = await Taro.request({
        url: `/api/v1/tasks/${taskId}/accept-recommendation`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        Taro.showToast({
          title: '已接受任务推荐',
          icon: 'success'
        });

        // 跳转到任务详情
        setTimeout(() => {
          handleViewTask(taskId);
        }, 1500);
      }
    } catch (error) {
      Taro.showToast({
        title: '操作失败，请重试',
        icon: 'error'
      });
    } finally {
      Taro.hideLoading();
    }
  };

  // 下拉刷新
  const handleRefresh = () => {
    loadRecommendedTasks(true);
  };

  // 获取匹配度颜色
  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#1890ff';
    if (score >= 0.4) return '#faad14';
    return '#ff4d4f';
  };

  // 获取难度标签
  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty >= 8) return '高难度';
    if (difficulty >= 5) return '中等难度';
    return '入门级';
  };

  // 获取维度标签
  const getDimensionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      skillMatchScore: '技能匹配',
      difficultyMatchScore: '难度匹配',
      domainMatchScore: '领域匹配',
      growthPotentialScore: '成长潜力',
      reliabilityScore: '可靠性',
      preferenceScore: '偏好对齐'
    };
    return labels[key] || key;
  };

  // 获取维度图标
  const getDimensionIcon = (key: string): string => {
    const icons: Record<string, string> = {
      skillMatchScore: '🎯',
      difficultyMatchScore: '📊',
      domainMatchScore: '🏷️',
      growthPotentialScore: '🌱',
      reliabilityScore: '⭐',
      preferenceScore: '❤️'
    };
    return icons[key] || '•';
  };

  useEffect(() => {
    loadRecommendedTasks();
  }, []);

  return (
    <View className="recommended-tasks-page">
      {/* 页面标题 */}
      <View className="page-header">
        <Text className="page-title">🎯 为你精选的任务</Text>
        <Text className="page-subtitle">
          AI根据你的能力和偏好，为你推荐最合适的任务
        </Text>
      </View>

      {/* 任务列表 */}
      <ScrollView
        className="tasks-scroll"
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {loading && tasks.length === 0 ? (
          <View className="loading-state">
            <Text>加载中...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View className="empty-state">
            <Image
              className="empty-image"
              src="/assets/empty-tasks.png"
            />
            <Text className="empty-text">暂无推荐任务</Text>
            <Text className="empty-tip">
              完善你的个人资料和技能标签，获得更多推荐
            </Text>
            <Button
              className="goto-profile-btn"
              onClick={() => Taro.navigateTo({ url: '/pages/profile/index' })}
            >
              完善资料
            </Button>
          </View>
        ) : (
          <View className="tasks-list">
            {tasks.map((task) => (
              <View key={task.taskId} className="task-card">
                {/* 匹配度标签 */}
                <View
                  className="match-badge"
                  style={{ background: getMatchScoreColor(task.matchScore) }}
                >
                  <Text className="match-score">
                    {(task.matchScore * 100).toFixed(0)}%
                  </Text>
                  <Text className="match-label">匹配</Text>
                </View>

                {/* 任务标题 */}
                <View className="task-header">
                  <Text className="task-title">{task.title}</Text>
                  <View className="task-meta">
                    <Text className="company-name">{task.companyName}</Text>
                    <Text className="task-level">{task.levelRequired}</Text>
                  </View>
                </View>

                {/* 任务描述 */}
                <Text className="task-description">{task.description}</Text>

                {/* 为什么推荐给你 */}
                <View className="match-reason-section">
                  <Text className="section-title">💡 为什么推荐给你</Text>
                  <View className="reason-tags">
                    {task.matchReason?.skillMatch && (
                      <View className="reason-tag">
                        <Text>✓ 技能匹配</Text>
                      </View>
                    )}
                    {task.matchReason?.difficultyMatch && (
                      <View className="reason-tag">
                        <Text>✓ 难度适中</Text>
                      </View>
                    )}
                    {task.matchReason?.growthPotential && (
                      <View className="reason-tag">
                        <Text>✓ 成长价值高</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 你会学到什么 */}
                {task.whatYouWillLearn && (
                  <View className="learning-section">
                    <Text className="section-title">📚 你会学到</Text>
                    <Text className="learning-text">{task.whatYouWillLearn}</Text>
                  </View>
                )}

                {/* 6维度匹配分析 */}
                {task.matchBreakdown && (
                  <View className="match-breakdown-section">
                    <Text className="section-title">🎯 匹配度分析</Text>
                    <View className="dimensions-grid">
                      {Object.entries(task.matchBreakdown).map(([key, value]) => {
                        if (value === undefined || value === null) return null;
                        const score = Math.round(value * 100);
                        return (
                          <View key={key} className="dimension-item">
                            <View className="dimension-header">
                              <Text className="dimension-icon">{getDimensionIcon(key)}</Text>
                              <Text className="dimension-label">{getDimensionLabel(key)}</Text>
                            </View>
                            <View className="dimension-bar-container">
                              <View
                                className="dimension-bar"
                                style={{
                                  width: `${score}%`,
                                  backgroundColor: getMatchScoreColor(value)
                                }}
                              />
                            </View>
                            <Text className="dimension-score">{score}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* 详细匹配理由 */}
                {task.detailedMatchReason && (
                  <View className="detailed-reason-section">
                    <Text className="section-title">💬 AI的推荐理由</Text>
                    <Text className="detailed-reason-text">{task.detailedMatchReason}</Text>
                  </View>
                )}

                {/* 任务信息 */}
                <View className="task-info">
                  <View className="info-item">
                    <Text className="info-label">预算</Text>
                    <Text className="info-value">
                      ¥{task.budgetMin}-{task.budgetMax}
                    </Text>
                  </View>
                  <View className="info-item">
                    <Text className="info-label">预计时间</Text>
                    <Text className="info-value">{task.estimatedHours}小时</Text>
                  </View>
                  <View className="info-item">
                    <Text className="info-label">难度</Text>
                    <Text className="info-value">
                      {getDifficultyLabel(task.difficulty)}
                    </Text>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View className="task-actions">
                  <Button
                    className="view-btn"
                    onClick={() => handleViewTask(task.taskId)}
                  >
                    查看详情
                  </Button>
                  <Button
                    className="accept-btn"
                    type="primary"
                    onClick={() => handleAcceptTask(task.taskId)}
                  >
                    接受任务
                  </Button>
                </View>

                {/* 推送时间 */}
                <Text className="pushed-time">
                  推送于 {new Date(task.pushedAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 底部提示 */}
      {tasks.length > 0 && (
        <View className="bottom-tip">
          <Text>已显示全部推荐任务</Text>
        </View>
      )}
    </View>
  );
}
