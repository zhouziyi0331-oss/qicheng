import Taro from '@tarojs/taro';
import { View, Text, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import './index.scss';

interface TaskDetail {
  id: number;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  company: {
    id: number;
    name: string;
    logo?: string;
  };
  requirements: string;
  deliverables: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
}

interface Supplement {
  id: number;
  taskId: number;
  description: string;
  additionalBudget: number;
  estimatedDays: number;
  oldDeadline: string;
  newDeadline: string;
  status: 'pending' | 'accepted' | 'rejected';
  studentResponse?: string;
  createdAt: string;
  respondedAt?: string;
}

export default function TaskDetail() {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const taskId = params?.id;
    if (taskId) {
      loadTaskDetail(taskId);
      loadSupplements(taskId);
    }
  }, []);

  const loadTaskDetail = async (taskId: string) => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/api/v1/student/tasks/${taskId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        setTask(res.data);
      }
    } catch (error) {
      console.error('加载任务详情失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSupplements = async (taskId: string) => {
    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: `${process.env.TARO_APP_API}/api/v1/student/tasks/${taskId}/supplements`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        setSupplements(res.data);
      }
    } catch (error) {
      console.error('加载追加需求失败:', error);
    }
  };

  const handleAcceptSupplement = async (supplementId: number) => {
    try {
      const token = Taro.getStorageSync('token');
      await Taro.request({
        url: `${process.env.TARO_APP_API}/api/v1/student/supplements/${supplementId}/accept`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      Taro.showToast({
        title: '已接受追加需求',
        icon: 'success'
      });

      // 重新加载数据
      if (task) {
        loadTaskDetail(task.id.toString());
        loadSupplements(task.id.toString());
      }
    } catch (error) {
      console.error('接受追加需求失败:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  };

  const handleRejectSupplement = async (supplementId: number) => {
    try {
      const result = await Taro.showModal({
        title: '拒绝追加需求',
        content: '请输入拒绝原因',
        editable: true,
        placeholderText: '请说明拒绝理由'
      });

      if (result.confirm) {
        const token = Taro.getStorageSync('token');
        await Taro.request({
          url: `${process.env.TARO_APP_API}/api/v1/student/supplements/${supplementId}/reject`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`
          },
          data: {
            reason: result.content || '学生拒绝了追加需求'
          }
        });

        Taro.showToast({
          title: '已拒绝追加需求',
          icon: 'success'
        });

        // 重新加载数据
        if (task) {
          loadTaskDetail(task.id.toString());
          loadSupplements(task.id.toString());
        }
      }
    } catch (error) {
      console.error('拒绝追加需求失败:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'published': '已发布',
      'matched': '已匹配',
      'accepted': '进行中',
      'in_progress': '进行中',
      'submitted': '待验收',
      'verified': '已验收',
      'paid': '已支付',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  const getSupplementStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待响应',
      'accepted': '已接受',
      'rejected': '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getSupplementStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      'pending': 'status-pending',
      'accepted': 'status-accepted',
      'rejected': 'status-rejected'
    };
    return classMap[status] || '';
  };

  if (loading) {
    return (
      <View className="task-detail">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!task) {
    return (
      <View className="task-detail">
        <View className="empty">任务不存在</View>
      </View>
    );
  }

  return (
    <View className="task-detail">
      {/* 任务基本信息 */}
      <View className="task-card">
        <View className="task-header">
          <Text className="task-title">{task.title}</Text>
          <View className={`status-badge status-${task.status}`}>
            {getStatusText(task.status)}
          </View>
        </View>

        <View className="company-info">
          <Text className="company-name">{task.company.name}</Text>
        </View>

        <View className="task-meta">
          <View className="meta-item">
            <Text className="meta-label">预算</Text>
            <Text className="meta-value budget">¥{task.budget}</Text>
          </View>
          <View className="meta-item">
            <Text className="meta-label">截止日期</Text>
            <Text className="meta-value">{task.deadline}</Text>
          </View>
        </View>
      </View>

      {/* 任务描述 */}
      <View className="section-card">
        <View className="section-title">任务描述</View>
        <Text className="section-content">{task.description}</Text>
      </View>

      {/* 任务要求 */}
      <View className="section-card">
        <View className="section-title">任务要求</View>
        <Text className="section-content">{task.requirements}</Text>
      </View>

      {/* 交付物要求 */}
      <View className="section-card">
        <View className="section-title">交付物要求</View>
        <Text className="section-content">{task.deliverables}</Text>
      </View>

      {/* 追加需求历史 */}
      {supplements.length > 0 && (
        <View className="section-card">
          <View className="section-title">追加需求历史</View>
          {supplements.map((supplement, index) => (
            <View key={supplement.id} className="supplement-item">
              <View className="supplement-header">
                <Text className="supplement-index">追加需求 #{index + 1}</Text>
                <View className={`supplement-status ${getSupplementStatusClass(supplement.status)}`}>
                  {getSupplementStatusText(supplement.status)}
                </View>
              </View>

              <View className="supplement-content">
                <Text className="supplement-desc">{supplement.description}</Text>

                <View className="supplement-meta">
                  <View className="meta-row">
                    <Text className="meta-label">追加预算：</Text>
                    <Text className="meta-value budget">¥{supplement.additionalBudget}</Text>
                  </View>
                  <View className="meta-row">
                    <Text className="meta-label">延长天数：</Text>
                    <Text className="meta-value">{supplement.estimatedDays} 天</Text>
                  </View>
                  <View className="meta-row">
                    <Text className="meta-label">原截止日期：</Text>
                    <Text className="meta-value">{supplement.oldDeadline}</Text>
                  </View>
                  <View className="meta-row">
                    <Text className="meta-label">新截止日期：</Text>
                    <Text className="meta-value highlight">{supplement.newDeadline}</Text>
                  </View>
                  <View className="meta-row">
                    <Text className="meta-label">创建时间：</Text>
                    <Text className="meta-value">{supplement.createdAt}</Text>
                  </View>
                  {supplement.respondedAt && (
                    <View className="meta-row">
                      <Text className="meta-label">响应时间：</Text>
                      <Text className="meta-value">{supplement.respondedAt}</Text>
                    </View>
                  )}
                </View>

                {supplement.studentResponse && (
                  <View className="student-response">
                    <Text className="response-label">学生回复：</Text>
                    <Text className="response-content">{supplement.studentResponse}</Text>
                  </View>
                )}

                {supplement.status === 'pending' && (
                  <View className="supplement-actions">
                    <Button
                      className="btn-accept"
                      onClick={() => handleAcceptSupplement(supplement.id)}
                    >
                      接受
                    </Button>
                    <Button
                      className="btn-reject"
                      onClick={() => handleRejectSupplement(supplement.id)}
                    >
                      拒绝
                    </Button>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 操作按钮区域 */}
      {task.status === 'accepted' && (
        <View className="action-area">
          <Button className="btn-primary">提交交付物</Button>
        </View>
      )}
    </View>
  );
}
