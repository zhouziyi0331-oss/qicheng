import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import './index.scss';

interface GrowthEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  impact_score: number;
  event_date: string;
  related_skill?: string;
  metric_change?: any;
}

interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  description: string;
  icon?: string;
  badge_color?: string;
  unlocked_at: string;
  is_featured: boolean;
}

interface SkillEvolution {
  skill_name: string;
  current_level: number;
  current_proficiency: number;
  practice_count: number;
  growth_rate: number;
  trend: 'rising' | 'stable' | 'declining';
  level_history: Array<{
    date: string;
    level: number;
    proficiency: number;
  }>;
}

interface GrowthTimeline {
  events: GrowthEvent[];
  milestones: Milestone[];
  skill_evolution: SkillEvolution[];
  summary: {
    total_events: number;
    total_milestones: number;
    high_impact_events: number;
    skills_mastered: number;
    growth_trend: string;
  };
}

export default function StudentGrowthTimeline() {
  const router = useRouter();
  const { studentId } = router.params;

  const [timeline, setTimeline] = useState<GrowthTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'milestones' | 'skills'>('events');

  useEffect(() => {
    loadGrowthTimeline();
  }, [studentId]);

  const loadGrowthTimeline = async () => {
    setLoading(true);
    try {
      const token = Taro.getStorageSync('token');
      const res = await Taro.request({
        url: `/api/students/${studentId}/growth-timeline`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setTimeline(res.data.data);
      } else {
        Taro.showToast({ title: res.data.message || '加载失败', icon: 'none' });
      }
    } catch (error) {
      console.error('加载成长轨迹失败:', error);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string): string => {
    const iconMap: Record<string, string> = {
      level_up: '🎯',
      task_completed: '✅',
      skill_acquired: '💡',
      milestone_reached: '🏆',
      rating_improved: '⭐',
      specialization: '🎓',
    };
    return iconMap[eventType] || '📌';
  };

  const getImpactColor = (score: number): string => {
    if (score >= 0.7) return '#10B981';
    if (score >= 0.5) return '#3B82F6';
    return '#6B7280';
  };

  const getTrendIcon = (trend: string): string => {
    if (trend === 'rising') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  const getTrendText = (trend: string): string => {
    if (trend === 'rising') return '上升';
    if (trend === 'declining') return '下降';
    return '稳定';
  };

  const getGrowthTrendText = (trend: string): string => {
    const trendMap: Record<string, string> = {
      accelerating: '快速成长中',
      steady: '稳步提升中',
      slowing: '成长放缓',
      inactive: '近期无活动',
      insufficient_data: '数据不足',
    };
    return trendMap[trend] || '未知';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  };

  if (loading) {
    return (
      <View className="growth-timeline-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!timeline) {
    return (
      <View className="growth-timeline-page">
        <View className="empty">暂无成长数据</View>
      </View>
    );
  }

  return (
    <View className="growth-timeline-page">
      {/* 成长概览 */}
      <View className="growth-summary">
        <View className="summary-header">
          <Text className="summary-title">成长概览</Text>
          <View className="trend-badge" style={{ color: '#8B5CF6' }}>
            {getGrowthTrendText(timeline.summary.growth_trend)}
          </View>
        </View>

        <View className="summary-stats">
          <View className="stat-item">
            <Text className="stat-value">{timeline.summary.total_events}</Text>
            <Text className="stat-label">成长事件</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{timeline.summary.total_milestones}</Text>
            <Text className="stat-label">解锁里程碑</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{timeline.summary.high_impact_events}</Text>
            <Text className="stat-label">高光时刻</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{timeline.summary.skills_mastered}</Text>
            <Text className="stat-label">精通技能</Text>
          </View>
        </View>
      </View>

      {/* 标签切换 */}
      <View className="tabs">
        <View
          className={`tab-item ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Text>成长事件</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          <Text>里程碑</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Text>技能进化</Text>
        </View>
      </View>

      <ScrollView className="content-area" scrollY>
        {/* 成长事件列表 */}
        {activeTab === 'events' && (
          <View className="events-list">
            {timeline.events.length === 0 ? (
              <View className="empty-state">暂无成长事件</View>
            ) : (
              <View className="timeline">
                {timeline.events.map((event, index) => (
                  <View key={event.id} className="timeline-item">
                    <View className="timeline-marker">
                      <View
                        className="marker-dot"
                        style={{ backgroundColor: getImpactColor(event.impact_score) }}
                      />
                      {index < timeline.events.length - 1 && <View className="marker-line" />}
                    </View>

                    <View className="event-card">
                      <View className="event-header">
                        <Text className="event-icon">{getEventIcon(event.event_type)}</Text>
                        <View className="event-info">
                          <Text className="event-title">{event.title}</Text>
                          <Text className="event-date">{formatDate(event.event_date)}</Text>
                        </View>
                        <View
                          className="impact-badge"
                          style={{ backgroundColor: getImpactColor(event.impact_score) }}
                        >
                          <Text className="impact-text">
                            {(event.impact_score * 100).toFixed(0)}
                          </Text>
                        </View>
                      </View>

                      {event.description && (
                        <Text className="event-description">{event.description}</Text>
                      )}

                      {event.related_skill && (
                        <View className="event-tag">
                          <Text className="tag-text">{event.related_skill}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 里程碑列表 */}
        {activeTab === 'milestones' && (
          <View className="milestones-list">
            {timeline.milestones.length === 0 ? (
              <View className="empty-state">暂无里程碑</View>
            ) : (
              timeline.milestones.map((milestone) => (
                <View key={milestone.id} className="milestone-card">
                  <View
                    className="milestone-icon"
                    style={{ backgroundColor: milestone.badge_color || '#8B5CF6' }}
                  >
                    <Text className="icon-text">{milestone.icon || '🏆'}</Text>
                  </View>

                  <View className="milestone-content">
                    <Text className="milestone-title">{milestone.title}</Text>
                    <Text className="milestone-description">{milestone.description}</Text>
                    <Text className="milestone-date">
                      解锁于 {formatDate(milestone.unlocked_at)}
                    </Text>
                  </View>

                  {milestone.is_featured && (
                    <View className="featured-badge">
                      <Text className="featured-text">精选</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* 技能进化列表 */}
        {activeTab === 'skills' && (
          <View className="skills-list">
            {timeline.skill_evolution.length === 0 ? (
              <View className="empty-state">暂无技能数据</View>
            ) : (
              timeline.skill_evolution.map((skill) => (
                <View key={skill.skill_name} className="skill-card">
                  <View className="skill-header">
                    <Text className="skill-name">{skill.skill_name}</Text>
                    <View className="skill-level">
                      <Text className="level-text">Lv.{skill.current_level}</Text>
                    </View>
                  </View>

                  <View className="skill-progress">
                    <View className="progress-bar">
                      <View
                        className="progress-fill"
                        style={{ width: `${skill.current_proficiency * 100}%` }}
                      />
                    </View>
                    <Text className="progress-text">
                      {(skill.current_proficiency * 100).toFixed(0)}%
                    </Text>
                  </View>

                  <View className="skill-stats">
                    <View className="stat">
                      <Text className="stat-label">练习次数</Text>
                      <Text className="stat-value">{skill.practice_count}</Text>
                    </View>
                    <View className="stat">
                      <Text className="stat-label">成长趋势</Text>
                      <Text className="stat-value">
                        {getTrendIcon(skill.trend)} {getTrendText(skill.trend)}
                      </Text>
                    </View>
                    <View className="stat">
                      <Text className="stat-label">成长速率</Text>
                      <Text className="stat-value">
                        {skill.growth_rate > 0 ? '+' : ''}
                        {(skill.growth_rate * 100).toFixed(1)}%/天
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
