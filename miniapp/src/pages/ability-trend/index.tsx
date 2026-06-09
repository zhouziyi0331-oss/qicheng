import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface ProfileVersion {
  version: number;
  information_processing: number;
  creative_drive: number;
  tool_learning: number;
  task_execution: number;
  collaboration_tendency: number;
  risk_attitude: number;
  personality_label: string;
  updated_reason: string;
  dimension_descriptions: any;
  created_at: string;
  is_current: boolean;
}

export default function AbilityTrend() {
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<ProfileVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ProfileVersion | null>(null);

  useEffect(() => {
    loadProfileVersions();
  }, []);

  const loadProfileVersions = async () => {
    try {
      setLoading(true);
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/growth/profile-versions',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        const profileVersions = res.data.data || [];
        setVersions(profileVersions);

        // 默认选中当前版本
        const current = profileVersions.find((v: ProfileVersion) => v.is_current);
        if (current) {
          setSelectedVersion(current);
        }
      } else {
        Taro.showToast({ title: res.data.message || '加载失败', icon: 'none' });
      }
    } catch (error) {
      console.error('加载能力版本失败:', error);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const getDimensionName = (key: string): string => {
    const names = {
      information_processing: '信息处理',
      creative_drive: '创作驱动',
      tool_learning: '工具学习',
      task_execution: '任务执行',
      collaboration_tendency: '协作倾向',
      risk_attitude: '风险态度'
    };
    return names[key] || key;
  };

  const getDimensionColor = (key: string): string => {
    const colors = {
      information_processing: '#3b82f6',
      creative_drive: '#ec4899',
      tool_learning: '#8b5cf6',
      task_execution: '#10b981',
      collaboration_tendency: '#f59e0b',
      risk_attitude: '#ef4444'
    };
    return colors[key] || '#6b7280';
  };

  const calculateChange = (dimension: string): number => {
    if (versions.length < 2) return 0;
    const initial = versions[0][dimension] || 0;
    const current = versions[versions.length - 1][dimension] || 0;
    return current - initial;
  };

  const renderRadarChart = (profile: ProfileVersion) => {
    const dimensions = [
      'information_processing',
      'creative_drive',
      'tool_learning',
      'task_execution',
      'collaboration_tendency',
      'risk_attitude'
    ];

    return (
      <View className="radar-chart">
        {dimensions.map((dim, index) => {
          const score = profile[dim] || 0;
          const angle = (index * 60 - 90) * (Math.PI / 180);
          const radius = 100;
          const x = 120 + Math.cos(angle) * (radius * score / 100);
          const y = 120 + Math.sin(angle) * (radius * score / 100);

          return (
            <View key={dim} className="radar-point" style={{
              left: `${x}px`,
              top: `${y}px`,
              backgroundColor: getDimensionColor(dim)
            }}>
              <View className="point-label">
                <Text className="label-text">{getDimensionName(dim)}</Text>
                <Text className="label-score">{score}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="ability-trend-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (versions.length === 0) {
    return (
      <View className="ability-trend-page">
        <View className="empty-state">
          <Text className="empty-icon">📊</Text>
          <Text className="empty-text">还没有能力数据</Text>
          <Text className="empty-hint">完成任务后会自动更新能力数据</Text>
        </View>
      </View>
    );
  }

  const initialProfile = versions[0];
  const currentProfile = versions[versions.length - 1];

  return (
    <ScrollView className="ability-trend-page" scrollY>
      {/* 页面标题 */}
      <View className="page-header">
        <Text className="page-title">📈 能力变化趋势</Text>
        <Text className="page-subtitle">追踪你的成长轨迹</Text>
      </View>

      {/* 版本概览 */}
      <View className="version-overview">
        <View className="overview-item">
          <Text className="overview-label">当前版本</Text>
          <Text className="overview-value">v{currentProfile.version}</Text>
        </View>
        <View className="overview-divider"></View>
        <View className="overview-item">
          <Text className="overview-label">总更新次数</Text>
          <Text className="overview-value">{versions.length - 1}次</Text>
        </View>
        <View className="overview-divider"></View>
        <View className="overview-item">
          <Text className="overview-label">人格标签</Text>
          <Text className="overview-value">{currentProfile.personality_label || '未设置'}</Text>
        </View>
      </View>

      {/* 六维对比卡片 */}
      <View className="comparison-card">
        <Text className="card-title">📊 六维能力对比</Text>
        <Text className="card-subtitle">入驻时 vs 当前</Text>

        <View className="dimensions-list">
          {['information_processing', 'creative_drive', 'tool_learning',
            'task_execution', 'collaboration_tendency', 'risk_attitude'].map((dim) => {
            const initialScore = initialProfile[dim] || 0;
            const currentScore = currentProfile[dim] || 0;
            const change = currentScore - initialScore;
            const changePercent = initialScore > 0 ? ((change / initialScore) * 100).toFixed(1) : '0';

            return (
              <View key={dim} className="dimension-item">
                <View className="dimension-header">
                  <Text className="dimension-name">{getDimensionName(dim)}</Text>
                  <View className="dimension-change">
                    <Text className={`change-value ${change >= 0 ? 'positive' : 'negative'}`}>
                      {change >= 0 ? '+' : ''}{change}
                    </Text>
                    <Text className="change-percent">
                      ({change >= 0 ? '+' : ''}{changePercent}%)
                    </Text>
                  </View>
                </View>

                <View className="dimension-bars">
                  <View className="bar-row">
                    <Text className="bar-label">入驻</Text>
                    <View className="bar-container">
                      <View
                        className="bar initial"
                        style={{ width: `${initialScore}%`, backgroundColor: getDimensionColor(dim) }}
                      ></View>
                    </View>
                    <Text className="bar-value">{initialScore}</Text>
                  </View>

                  <View className="bar-row">
                    <Text className="bar-label">当前</Text>
                    <View className="bar-container">
                      <View
                        className="bar current"
                        style={{ width: `${currentScore}%`, backgroundColor: getDimensionColor(dim) }}
                      ></View>
                    </View>
                    <Text className="bar-value">{currentScore}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 版本历史 */}
      <View className="version-history">
        <Text className="card-title">📜 版本历史</Text>

        <View className="timeline">
          {versions.map((version, index) => (
            <View
              key={version.version}
              className={`timeline-item ${version.is_current ? 'current' : ''}`}
              onClick={() => setSelectedVersion(version)}
            >
              <View className="timeline-dot"></View>
              <View className="timeline-content">
                <View className="version-header">
                  <Text className="version-number">v{version.version}</Text>
                  {version.is_current && (
                    <View className="current-badge">
                      <Text className="badge-text">当前</Text>
                    </View>
                  )}
                </View>
                <Text className="version-reason">{version.updated_reason || '初始版本'}</Text>
                <Text className="version-date">
                  {new Date(version.created_at).toLocaleDateString('zh-CN')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 选中版本的详细信息 */}
      {selectedVersion && selectedVersion.dimension_descriptions && (
        <View className="version-detail">
          <Text className="card-title">💡 能力解读（v{selectedVersion.version}）</Text>

          {JSON.parse(selectedVersion.dimension_descriptions).map((desc: any, index: number) => (
            <View key={index} className="description-item">
              <View className="desc-header">
                <Text className="desc-dimension">{desc.dimension}</Text>
                <View className="desc-scores">
                  <Text className="desc-old">{desc.old_score}</Text>
                  <Text className="desc-arrow">→</Text>
                  <Text className="desc-new">{desc.new_score}</Text>
                </View>
              </View>
              <Text className="desc-reason">{desc.change_reason}</Text>
              <Text className="desc-current">{desc.current_description}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
