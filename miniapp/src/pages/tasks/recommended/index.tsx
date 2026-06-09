import Taro from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import './index.scss';

/**
 * 学生端 - 推荐任务页面
 *
 * 功能：
 * 1. 显示AI推荐的任务列表
 * 2. 显示匹配分数和推荐原因
 * 3. 查看任务详情（包含翻译）
 * 4. 接受推荐任务
 */

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

export default function RecommendedTasksPage() {
  const [tasks, setTasks] = useState<RecommendedTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecommendedTasks();
  }, []);

  // 获取推荐任务
  const fetchRecommendedTasks = async () => {
    try {
      setLoading(true);

      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/students/recommended-tasks`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      });

      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 跳转到任务详情
  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({
      url: `/pages/tasks/detail-translated/index?taskId=${taskId}`,
    });
  };

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#1890ff';
    if (score >= 0.4) return '#faad14';
    return '#f5222d';
  };

  // 获取难度标签
  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty >= 8) return { label: '挑战', color: '#f5222d' };
    if (difficulty >= 6) return { label: '中等', color: '#faad14' };
    if (difficulty >= 4) return { label: '适中', color: '#1890ff' };
    return { label: '简单', color: '#52c41a' };
  };

  // 格式化时间
  const formatTime = (time: string) => {
    const now = new Date().getTime();
    const pushTime = new Date(time).getTime();
    const diff = now - pushTime;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return '刚刚';
    if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
    if (diff < day) return `${Math.floor(diff / hour)}小时前`;
    if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
    return new Date(time).toLocaleDateString();
  };

  return (
    <View className='recommended-tasks-page'>
      {/* 头部 */}
      <View className='header'>
        <View className='title'>为你精选</View>
        <View className='subtitle'>AI为你推荐最合适的任务</View>
      </View>

      {/* 任务列表 */}
      <View className='tasks-container'>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : tasks.length === 0 ? (
          <View className='empty'>
            <View className='empty-icon'>📭</View>
            <View className='empty-text'>暂无推荐任务</View>
            <View className='empty-tip'>
              企业发布任务后，AI会自动为你推荐最合适的任务
            </View>
          </View>
        ) : (
          <ScrollView scrollY className='tasks-list'>
            {tasks.map((task) => {
              const difficultyInfo = getDifficultyLabel(task.difficulty);
              return (
                <View
                  key={task.taskId}
                  className='task-card'
                  onClick={() => handleTaskClick(task.taskId)}
                >
                  {/* 新任务标记 */}
                  {!task.viewed && <View className='new-badge'>NEW</View>}

                  {/* 匹配分数 */}
                  <View
                    className='match-score'
                    style={{ color: getScoreColor(task.matchScore) }}
                  >
                    <Text className='score-value'>
                      {Math.round(task.matchScore * 100)}%
                    </Text>
                    <Text className='score-label'>匹配</Text>
                  </View>

                  {/* 任务标题 */}
                  <View className='task-title'>{task.title}</View>

                  {/* 任务描述 */}
                  <View className='task-description'>{task.description}</View>

                  {/* 推荐原因 */}
                  <View className='match-reason'>
                    <View className='reason-title'>🎯 为什么推荐给你</View>
                    {task.matchReason?.skillMatch && (
                      <View className='reason-item'>
                        <Text className='reason-icon'>✓</Text>
                        <Text className='reason-text'>
                          {task.matchReason.skillMatch.reason ||
                            `你的技能很匹配（${Math.round(
                              task.matchReason.skillMatch.score * 100
                            )}%）`}
                        </Text>
                      </View>
                    )}
                    {task.matchReason?.difficultyMatch && (
                      <View className='reason-item'>
                        <Text className='reason-icon'>✓</Text>
                        <Text className='reason-text'>
                          {task.matchReason.difficultyMatch.reason ||
                            `难度适合你的水平（${Math.round(
                              task.matchReason.difficultyMatch.score * 100
                            )}%）`}
                        </Text>
                      </View>
                    )}
                    {task.matchReason?.growthPotential && (
                      <View className='reason-item'>
                        <Text className='reason-icon'>✓</Text>
                        <Text className='reason-text'>
                          {task.matchReason.growthPotential.reason ||
                            `有很好的学习价值（${Math.round(
                              task.matchReason.growthPotential.score * 100
                            )}%）`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 你会学到什么 */}
                  {task.whatYouWillLearn && (
                    <View className='learning-value'>
                      <View className='learning-title'>📚 你会学到</View>
                      <View className='learning-text'>{task.whatYouWillLearn}</View>
                    </View>
                  )}

                  {/* 任务信息 */}
                  <View className='task-info'>
                    <View className='info-row'>
                      <View className='info-item'>
                        <Text className='info-icon'>💰</Text>
                        <Text className='info-text'>
                          ¥{task.budgetMin}-{task.budgetMax}
                        </Text>
                      </View>
                      <View className='info-item'>
                        <Text className='info-icon'>⏱</Text>
                        <Text className='info-text'>{task.estimatedHours}小时</Text>
                      </View>
                      <View
                        className='info-item'
                        style={{ color: difficultyInfo.color }}
                      >
                        <Text className='info-icon'>📊</Text>
                        <Text className='info-text'>{difficultyInfo.label}</Text>
                      </View>
                    </View>
                    <View className='info-row'>
                      <View className='info-item'>
                        <Text className='info-icon'>🏢</Text>
                        <Text className='info-text'>{task.companyName}</Text>
                      </View>
                      <View className='info-item'>
                        <Text className='info-icon'>🕐</Text>
                        <Text className='info-text'>
                          {formatTime(task.pushedAt)}推送
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 查看详情按钮 */}
                  <View className='view-detail-btn'>
                    查看详情 →
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 提示 */}
      <View className='tip-card'>
        <View className='tip-icon'>💡</View>
        <View className='tip-text'>
          这些任务是AI根据你的能力、经验和学习目标精心挑选的，点击查看详情了解更多
        </View>
      </View>
    </View>
  );
}
