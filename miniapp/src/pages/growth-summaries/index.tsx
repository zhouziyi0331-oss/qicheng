import { View, Text, ScrollView, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface GrowthSummary {
  id: string;
  order_id: string;
  order_title: string;
  summary_json: {
    headline: string;
    before_after_comparison: string;
    breakthrough_point: string;
    skills_demonstrated: string[];
    stuck_point_resolved: string;
    next_recommendation: string;
  };
  generated_at: string;
  user_viewed: boolean;
}

export default function GrowthSummaries() {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<GrowthSummary[]>([]);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/growth/summaries',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setSummaries(res.data.data || []);
      } else {
        Taro.showToast({ title: res.data.message || '加载失败', icon: 'none' });
      }
    } catch (error) {
      console.error('加载成长总结失败:', error);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummary = async (summaryId: string) => {
    try {
      await Taro.request({
        url: `http://localhost:3000/api/v1/growth/summaries/${summaryId}/view`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });
    } catch (error) {
      console.error('标记已查看失败:', error);
    }
  };

  const handleFeedback = async (summaryId: string, feedback: string) => {
    try {
      await Taro.request({
        url: `http://localhost:3000/api/v1/growth/summaries/${summaryId}/feedback`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        },
        data: { feedback }
      });

      Taro.showToast({ title: '反馈已提交', icon: 'success' });
      loadSummaries();
    } catch (error) {
      console.error('提交反馈失败:', error);
      Taro.showToast({ title: '提交失败', icon: 'none' });
    }
  };

  if (loading) {
    return (
      <View className="growth-summaries-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <ScrollView className="growth-summaries-page" scrollY>
      {/* 页面标题 */}
      <View className="page-header">
        <Text className="page-title">📈 我的成长总结</Text>
        <Text className="page-subtitle">每次任务完成后的成长记录</Text>
      </View>

      {/* 成长总结列表 */}
      {summaries.length > 0 ? (
        <View className="summaries-list">
          {summaries.map((summary) => (
            <View
              key={summary.id}
              className={`summary-card ${!summary.user_viewed ? 'unread' : ''}`}
              onClick={() => handleViewSummary(summary.id)}
            >
              {/* 未读标记 */}
              {!summary.user_viewed && (
                <View className="unread-badge">
                  <Text className="badge-text">新</Text>
                </View>
              )}

              {/* 订单信息 */}
              <View className="summary-header">
                <Text className="order-title">{summary.order_title}</Text>
                <Text className="generated-date">
                  {new Date(summary.generated_at).toLocaleDateString('zh-CN')}
                </Text>
              </View>

              {/* 成长亮点 */}
              <View className="headline-section">
                <Text className="headline-icon">✨</Text>
                <Text className="headline-text">{summary.summary_json.headline}</Text>
              </View>

              {/* 对比变化 */}
              <View className="comparison-section">
                <Text className="section-label">📊 成长对比</Text>
                <Text className="section-content">
                  {summary.summary_json.before_after_comparison}
                </Text>
              </View>

              {/* 突破点 */}
              <View className="breakthrough-section">
                <Text className="section-label">🚀 最大突破</Text>
                <Text className="section-content">
                  {summary.summary_json.breakthrough_point}
                </Text>
              </View>

              {/* 展示的技能 */}
              {summary.summary_json.skills_demonstrated &&
               summary.summary_json.skills_demonstrated.length > 0 && (
                <View className="skills-section">
                  <Text className="section-label">💡 展示的技能</Text>
                  <View className="skills-tags">
                    {summary.summary_json.skills_demonstrated.map((skill, idx) => (
                      <View key={idx} className="skill-tag">
                        <Text className="skill-text">{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 解决的卡点 */}
              {summary.summary_json.stuck_point_resolved && (
                <View className="stuck-point-section">
                  <Text className="section-label">🔧 解决的问题</Text>
                  <Text className="section-content">
                    {summary.summary_json.stuck_point_resolved}
                  </Text>
                </View>
              )}

              {/* 下一步建议 */}
              <View className="recommendation-section">
                <Text className="section-label">💭 下一步建议</Text>
                <Text className="section-content">
                  {summary.summary_json.next_recommendation}
                </Text>
              </View>

              {/* 反馈按钮 */}
              <View className="feedback-section">
                <Text className="feedback-label">这个总结对你有帮助吗？</Text>
                <View className="feedback-buttons">
                  <Button
                    className="feedback-btn helpful"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFeedback(summary.id, 'helpful');
                    }}
                  >
                    👍 有帮助
                  </Button>
                  <Button
                    className="feedback-btn neutral"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFeedback(summary.id, 'neutral');
                    }}
                  >
                    😐 一般
                  </Button>
                  <Button
                    className="feedback-btn not-helpful"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFeedback(summary.id, 'not_helpful');
                    }}
                  >
                    👎 没帮助
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="empty-state">
          <Text className="empty-icon">📭</Text>
          <Text className="empty-text">还没有成长总结</Text>
          <Text className="empty-hint">完成任务后会自动生成成长总结</Text>
        </View>
      )}
    </ScrollView>
  );
}
