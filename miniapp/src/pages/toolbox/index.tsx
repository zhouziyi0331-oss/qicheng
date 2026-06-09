import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { mentorStageAPI } from '../../services/api';
import './index.scss';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  usageCount: number;
  lastUsedAt?: string;
  relevanceScore?: number;
  recommendedReason?: string;
}

interface ToolboxData {
  recommendedTools: Tool[];
  popularTools: Tool[];
  myTools: Tool[];
}

const CATEGORY_ICONS = {
  design: '🎨',
  development: '💻',
  collaboration: '🤝',
  productivity: '⚡',
  learning: '📚',
  other: '🔧'
};

export default function Toolbox() {
  const [toolboxData, setToolboxData] = useState<ToolboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommended' | 'popular' | 'my'>('recommended');

  useEffect(() => {
    loadToolboxData();
  }, []);

  const loadToolboxData = async () => {
    try {
      setLoading(true);
      const studentId = Taro.getStorageSync('userId');

      if (!studentId) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      // 获取推荐工具
      const recommendedRes = await mentorStageAPI.getRecommendedTools(studentId);

      // 获取热门工具
      const popularRes = await mentorStageAPI.getPopularTools();

      // 获取我使用过的工具
      const myToolsRes = await mentorStageAPI.getMyTools(studentId);

      setToolboxData({
        recommendedTools: recommendedRes.data || [],
        popularTools: popularRes.data || [],
        myTools: myToolsRes.data || []
      });
    } catch (error) {
      console.error('加载工具箱数据失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = (tool: Tool) => {
    Taro.showModal({
      title: tool.name,
      content: tool.description,
      confirmText: '我会试试',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            const studentId = Taro.getStorageSync('userId');
            await mentorStageAPI.recordToolUsage(studentId, tool.id);

            Taro.showToast({
              title: '已记录',
              icon: 'success'
            });

            // 刷新数据
            loadToolboxData();
          } catch (error) {
            console.error('记录工具使用失败:', error);
          }
        }
      }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未使用';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return date.toLocaleDateString('zh-CN');
  };

  const renderToolCard = (tool: Tool, showRecommendation: boolean = false) => {
    const categoryIcon = CATEGORY_ICONS[tool.category] || CATEGORY_ICONS.other;

    return (
      <View
        key={tool.id}
        className="tool-card"
        onClick={() => handleToolClick(tool)}
      >
        <View className="tool-header">
          <View className="tool-icon">
            <Text>{categoryIcon}</Text>
          </View>
          <View className="tool-info">
            <Text className="tool-name">{tool.name}</Text>
            <Text className="tool-category">{tool.category}</Text>
          </View>
          {showRecommendation && tool.relevanceScore && tool.relevanceScore >= 0.8 && (
            <View className="recommended-badge">
              <Text>强烈推荐</Text>
            </View>
          )}
        </View>

        <Text className="tool-description">{tool.description}</Text>

        {showRecommendation && tool.recommendedReason && (
          <View className="recommendation-reason">
            <Text className="reason-label">💡 推荐理由：</Text>
            <Text className="reason-text">{tool.recommendedReason}</Text>
          </View>
        )}

        {tool.tags.length > 0 && (
          <View className="tool-tags">
            {tool.tags.map((tag, index) => (
              <View key={index} className="tool-tag">
                <Text>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View className="tool-footer">
          <Text className="usage-count">使用 {tool.usageCount} 次</Text>
          <Text className="last-used">最近使用：{formatDate(tool.lastUsedAt)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="toolbox-page">
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    );
  }

  if (!toolboxData) {
    return (
      <View className="toolbox-page">
        <View className="empty-container">
          <Text className="empty-text">暂无工具数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="toolbox-page">
      {/* 顶部标题 */}
      <View className="page-header">
        <View className="header-gradient" />
        <View className="header-content">
          <Text className="page-title">🧰 工具箱</Text>
          <Text className="page-subtitle">发现适合你的学习工具</Text>
        </View>
      </View>

      {/* Tab切换 */}
      <View className="tabs">
        <View
          className={`tab ${activeTab === 'recommended' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommended')}
        >
          <Text>为你推荐</Text>
          {toolboxData.recommendedTools.length > 0 && (
            <View className="tab-badge">
              <Text>{toolboxData.recommendedTools.length}</Text>
            </View>
          )}
        </View>
        <View
          className={`tab ${activeTab === 'popular' ? 'active' : ''}`}
          onClick={() => setActiveTab('popular')}
        >
          <Text>热门工具</Text>
        </View>
        <View
          className={`tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <Text>我的工具</Text>
          {toolboxData.myTools.length > 0 && (
            <View className="tab-badge">
              <Text>{toolboxData.myTools.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView className="content-area" scrollY>
        {/* 推荐工具 */}
        {activeTab === 'recommended' && (
          <View className="tools-section">
            {toolboxData.recommendedTools.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-icon">🔍</Text>
                <Text className="empty-text">暂无推荐工具</Text>
                <Text className="empty-hint">多与导师对话，我会为你推荐合适的工具</Text>
              </View>
            ) : (
              <View className="tools-list">
                {toolboxData.recommendedTools.map((tool) => renderToolCard(tool, true))}
              </View>
            )}
          </View>
        )}

        {/* 热门工具 */}
        {activeTab === 'popular' && (
          <View className="tools-section">
            {toolboxData.popularTools.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-icon">📊</Text>
                <Text className="empty-text">暂无热门工具</Text>
              </View>
            ) : (
              <View className="tools-list">
                {toolboxData.popularTools.map((tool) => renderToolCard(tool, false))}
              </View>
            )}
          </View>
        )}

        {/* 我的工具 */}
        {activeTab === 'my' && (
          <View className="tools-section">
            {toolboxData.myTools.length === 0 ? (
              <View className="empty-state">
                <Text className="empty-icon">🎯</Text>
                <Text className="empty-text">还没有使用过工具</Text>
                <Text className="empty-hint">试试推荐的工具吧</Text>
              </View>
            ) : (
              <View className="tools-list">
                {toolboxData.myTools.map((tool) => renderToolCard(tool, false))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
