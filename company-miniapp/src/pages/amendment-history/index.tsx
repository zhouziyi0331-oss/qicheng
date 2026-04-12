import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import './index.scss';

interface Amendment {
  id: number;
  task_id: number;
  amendment_type: string;
  description: string;
  original_deadline: string;
  new_deadline: string;
  original_budget: number;
  new_budget: number;
  status: string;
  student_response: string;
  created_at: string;
  responded_at: string;
}

export default function AmendmentHistory() {
  const router = useRouter();
  const taskId = router.params.taskId;

  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAmendments();
  }, []);

  const loadAmendments = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/${taskId}/amendments`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        setAmendments(res.data.data || []);
      }
    } catch (error) {
      console.error('加载追加需求历史失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'add_requirement': '追加任务需求',
      'extend_deadline': '延长截止时间',
      'increase_budget': '增加任务预算'
    };
    return typeMap[type] || type;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待学生确认',
      'accepted': '已接受',
      'rejected': '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      'pending': 'pending',
      'accepted': 'accepted',
      'rejected': 'rejected'
    };
    return classMap[status] || '';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="amendment-history-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (amendments.length === 0) {
    return (
      <View className="amendment-history-page">
        <View className="empty">
          <Text className="empty-icon">📝</Text>
          <Text className="empty-text">暂无追加需求记录</Text>
          <Text className="empty-hint">您可以在任务详情页面提交追加需求</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="amendment-history-page">
      <ScrollView className="content" scrollY>
        {amendments.map((amendment) => (
          <View key={amendment.id} className="amendment-card">
            {/* 头部 */}
            <View className="card-header">
              <View className="type-badge">
                <Text className="type-text">{getTypeText(amendment.amendment_type)}</Text>
              </View>
              <View className={`status-badge ${getStatusClass(amendment.status)}`}>
                <Text className="status-text">{getStatusText(amendment.status)}</Text>
              </View>
            </View>

            {/* 说明 */}
            <View className="description-section">
              <Text className="section-label">变更说明</Text>
              <Text className="description-text">{amendment.description}</Text>
            </View>

            {/* 变更内容 */}
            {amendment.amendment_type === 'extend_deadline' && (
              <View className="change-section">
                <Text className="section-label">截止时间变更</Text>
                <View className="change-row">
                  <Text className="change-label">原截止时间:</Text>
                  <Text className="change-value">
                    {amendment.original_deadline ? new Date(amendment.original_deadline).toLocaleDateString() : '-'}
                  </Text>
                </View>
                <View className="change-row">
                  <Text className="change-label">新截止时间:</Text>
                  <Text className="change-value highlight">
                    {amendment.new_deadline ? new Date(amendment.new_deadline).toLocaleDateString() : '-'}
                  </Text>
                </View>
              </View>
            )}

            {amendment.amendment_type === 'increase_budget' && (
              <View className="change-section">
                <Text className="section-label">预算变更</Text>
                <View className="change-row">
                  <Text className="change-label">原预算:</Text>
                  <Text className="change-value">¥{amendment.original_budget}</Text>
                </View>
                <View className="change-row">
                  <Text className="change-label">新预算:</Text>
                  <Text className="change-value highlight">¥{amendment.new_budget}</Text>
                </View>
                <View className="change-row">
                  <Text className="change-label">增加金额:</Text>
                  <Text className="change-value increase">
                    +¥{(amendment.new_budget - amendment.original_budget).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* 学生回复 */}
            {amendment.status !== 'pending' && amendment.student_response && (
              <View className="response-section">
                <Text className="section-label">学生回复</Text>
                <Text className="response-text">{amendment.student_response}</Text>
              </View>
            )}

            {/* 时间信息 */}
            <View className="time-section">
              <Text className="time-item">提交时间: {formatDate(amendment.created_at)}</Text>
              {amendment.responded_at && (
                <Text className="time-item">响应时间: {formatDate(amendment.responded_at)}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
