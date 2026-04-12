import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface ReportData {
  overview: {
    total_tasks: number;
    active_tasks: number;
    completed_tasks: number;
    total_spent: number;
    avg_task_price: number;
    completion_rate: number;
  };
  monthly_stats: Array<{
    month: string;
    tasks: number;
    spent: number;
  }>;
  category_stats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  top_students: Array<{
    id: number;
    nickname: string;
    avatar: string;
    tasks_count: number;
    total_amount: number;
  }>;
}

export default function DataReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, year, month

  useEffect(() => {
    loadReportData();
  }, [timeRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/company/report',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: {
          range: timeRange
        }
      });

      if (res.statusCode === 200) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('加载报表数据失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="data-report-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="data-report-page">
        <View className="empty">
          <Text className="empty-text">暂无数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="data-report-page">
      {/* 时间范围选择 */}
      <View className="time-range">
        <View
          className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
          onClick={() => setTimeRange('all')}
        >
          <Text className="range-text">全部</Text>
        </View>
        <View
          className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
          onClick={() => setTimeRange('year')}
        >
          <Text className="range-text">本年</Text>
        </View>
        <View
          className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => setTimeRange('month')}
        >
          <Text className="range-text">本月</Text>
        </View>
      </View>

      <ScrollView className="content" scrollY>
        {/* 概览数据 */}
        <View className="overview-section">
          <Text className="section-title">数据概览</Text>
          <View className="overview-grid">
            <View className="overview-item">
              <Text className="item-value">{data.overview.total_tasks}</Text>
              <Text className="item-label">总任务数</Text>
            </View>
            <View className="overview-item">
              <Text className="item-value active">{data.overview.active_tasks}</Text>
              <Text className="item-label">进行中</Text>
            </View>
            <View className="overview-item">
              <Text className="item-value completed">{data.overview.completed_tasks}</Text>
              <Text className="item-label">已完成</Text>
            </View>
            <View className="overview-item">
              <Text className="item-value rate">{data.overview.completion_rate}%</Text>
              <Text className="item-label">完成率</Text>
            </View>
          </View>
        </View>

        {/* 财务数据 */}
        <View className="finance-section">
          <Text className="section-title">财务数据</Text>
          <View className="finance-cards">
            <View className="finance-card">
              <Text className="card-label">总支出</Text>
              <Text className="card-value">¥{data.overview.total_spent.toFixed(2)}</Text>
            </View>
            <View className="finance-card">
              <Text className="card-label">平均任务价格</Text>
              <Text className="card-value">¥{data.overview.avg_task_price.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* 月度趋势 */}
        {data.monthly_stats && data.monthly_stats.length > 0 && (
          <View className="monthly-section">
            <Text className="section-title">月度趋势</Text>
            <View className="monthly-list">
              {data.monthly_stats.map((item, index) => (
                <View key={index} className="monthly-item">
                  <Text className="month-text">{item.month}</Text>
                  <View className="month-stats">
                    <Text className="stat-text">{item.tasks}个任务</Text>
                    <Text className="stat-amount">¥{item.spent.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 任务类型分布 */}
        {data.category_stats && data.category_stats.length > 0 && (
          <View className="category-section">
            <Text className="section-title">任务类型分布</Text>
            <View className="category-list">
              {data.category_stats.map((item, index) => (
                <View key={index} className="category-item">
                  <View className="category-header">
                    <Text className="category-name">{item.category}</Text>
                    <Text className="category-count">{item.count}个</Text>
                  </View>
                  <View className="progress-bar">
                    <View
                      className="progress-fill"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </View>
                  <Text className="percentage-text">{item.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 合作学生排行 */}
        {data.top_students && data.top_students.length > 0 && (
          <View className="students-section">
            <Text className="section-title">合作学生排行</Text>
            <View className="students-list">
              {data.top_students.map((student, index) => (
                <View key={student.id} className="student-item">
                  <View className="rank-badge">
                    <Text className="rank-text">{index + 1}</Text>
                  </View>
                  <image
                    className="student-avatar"
                    src={student.avatar || 'https://via.placeholder.com/80'}
                  />
                  <View className="student-info">
                    <Text className="student-name">{student.nickname}</Text>
                    <Text className="student-stats">
                      {student.tasks_count}个任务 · ¥{student.total_amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
