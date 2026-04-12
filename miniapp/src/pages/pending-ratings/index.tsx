import { View, Text, ScrollView } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import Loading from '../../components/Loading';
import './index.scss';

interface Task {
  id: number;
  title: string;
  company_price: number;
  student_price: number;
  completed_at: string;
  other_party_nickname: string;
  other_party_avatar: string;
}

export default function PendingRatings() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingTasks();
  }, []);

  const loadPendingTasks = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/rating/pending',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        setTasks(res.data.tasks || []);
      }
    } catch (error) {
      console.error('加载待评价任务失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRate = (taskId: number) => {
    Taro.navigateTo({
      url: `/pages/rate-task/index?taskId=${taskId}`
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <View className="pending-ratings-page">
      {/* 头部 */}
      <View className="header">
        <Text className="title">待评价任务</Text>
        <Text className="subtitle">完成评价，帮助平台更好地匹配</Text>
      </View>

      {/* 任务列表 */}
      <ScrollView
        className="task-list"
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadPendingTasks}
      >
        {loading && tasks.length === 0 ? (
          <Loading text="正在加载待评价任务..." />
        ) : tasks.length === 0 ? (
          <View className="empty">
            <Text className="empty-icon">✓</Text>
            <Text className="empty-text">暂无待评价任务</Text>
            <Text className="empty-hint">完成任务后可以评价企业</Text>
          </View>
        ) : (
          tasks.map(task => (
            <View key={task.id} className="task-item">
              {/* 企业信息 */}
              <View className="company-info">
                <View className="avatar">
                  {task.other_party_avatar ? (
                    <image src={task.other_party_avatar} className="avatar-img" />
                  ) : (
                    <Text className="avatar-text">企</Text>
                  )}
                </View>
                <View className="info">
                  <Text className="company-name">{task.other_party_nickname}</Text>
                  <Text className="complete-time">完成于 {formatDate(task.completed_at)}</Text>
                </View>
              </View>

              {/* 任务信息 */}
              <View className="task-info">
                <Text className="task-title">{task.title}</Text>
                <View className="task-meta">
                  <Text className="price">¥{task.student_price}</Text>
                  <Text className="status-tag completed">已完成</Text>
                </View>
              </View>

              {/* 评价按钮 */}
              <View className="action">
                <View
                  className="rate-btn"
                  onClick={() => handleRate(task.id)}
                >
                  <Text className="rate-btn-text">立即评价</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 底部提示 */}
      {tasks.length > 0 && (
        <View className="footer-tip">
          <Text className="tip-text">💡 评价后可获得信用积分奖励</Text>
        </View>
      )}
    </View>
  );
}
