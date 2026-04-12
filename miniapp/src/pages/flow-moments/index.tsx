import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { passionSparkAPI } from '../../services/api';
import './index.scss';

interface FlowMoment {
  id: string;
  taskId: string;
  taskTitle: string;
  momentText: string;
  durationMinutes?: number;
  capturedAt: string;
}

interface PassionSpark {
  id: string;
  taskId: string;
  taskTitle: string;
  sparkText: string;
  context: string;
  wantExplore: boolean;
  createdAt: string;
}

export default function FlowMoments() {
  const [flowMoments, setFlowMoments] = useState<FlowMoment[]>([]);
  const [passionSparks, setPassionSparks] = useState<PassionSpark[]>([]);
  const [activeTab, setActiveTab] = useState<'flow' | 'spark'>('flow');
  const [loading, setLoading] = useState(true);
  const studentId = Taro.getStorageSync('userId');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载穿越感时刻（从后端API获取）
      // TODO: 需要添加 flowMomentAPI.getList()
      const mockFlowMoments: FlowMoment[] = [
        {
          id: '1',
          taskId: '101',
          taskTitle: 'UI设计项目',
          momentText: '做配色方案的时候，完全忘记了时间',
          durationMinutes: 120,
          capturedAt: '2024-04-10T14:30:00Z'
        },
        {
          id: '2',
          taskId: '102',
          taskTitle: '前端开发项目',
          momentText: '写动画效果的时候，感觉特别专注',
          durationMinutes: 90,
          capturedAt: '2024-04-08T10:15:00Z'
        }
      ];

      // 加载热情火花
      const sparkRes = await passionSparkAPI.getList(studentId);
      if (sparkRes.success) {
        setPassionSparks(sparkRes.sparks || []);
      }

      setFlowMoments(mockFlowMoments);
    } catch (error) {
      console.error('加载数据失败:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkExplore = async (sparkId: string) => {
    try {
      await passionSparkAPI.markExplore(sparkId);
      Taro.showToast({ title: '已标记为想探索', icon: 'success' });
      loadData();
    } catch (error) {
      console.error('标记失败:', error);
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <View className='flow-moments-page'>
      {/* 顶部标题 */}
      <View className='page-header'>
        <Text className='header-title'>你的河流记录</Text>
        <Text className='header-subtitle'>这些时刻，你在流动</Text>
      </View>

      {/* 标签页切换 */}
      <View className='tab-bar'>
        <View
          className={`tab-item ${activeTab === 'flow' ? 'active' : ''}`}
          onClick={() => setActiveTab('flow')}
        >
          <Text className='tab-text'>🌊 穿越感时刻</Text>
          {flowMoments.length > 0 && (
            <View className='tab-badge'>
              <Text className='badge-text'>{flowMoments.length}</Text>
            </View>
          )}
        </View>
        <View
          className={`tab-item ${activeTab === 'spark' ? 'active' : ''}`}
          onClick={() => setActiveTab('spark')}
        >
          <Text className='tab-text'>✨ 热情火花</Text>
          {passionSparks.length > 0 && (
            <View className='tab-badge'>
              <Text className='badge-text'>{passionSparks.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView className='content-area' scrollY>
        {loading ? (
          <View className='loading-state'>
            <Text className='loading-text'>加载中...</Text>
          </View>
        ) : (
          <>
            {/* 穿越感时刻列表 */}
            {activeTab === 'flow' && (
              <View className='flow-list'>
                {flowMoments.length === 0 ? (
                  <View className='empty-state'>
                    <View className='empty-icon'>
                      <Text className='icon-text'>🌊</Text>
                    </View>
                    <Text className='empty-title'>还没有穿越感时刻</Text>
                    <Text className='empty-desc'>
                      当你在项目中感觉时间过得特别快时，AI导师会帮你记录下来
                    </Text>
                  </View>
                ) : (
                  flowMoments.map((moment) => (
                    <View key={moment.id} className='flow-card'>
                      <View className='card-header'>
                        <View className='flow-icon'>🌊</View>
                        <View className='card-info'>
                          <Text className='task-title'>{moment.taskTitle}</Text>
                          <Text className='capture-time'>{formatDate(moment.capturedAt)}</Text>
                        </View>
                      </View>
                      <View className='card-content'>
                        <Text className='moment-text'>{moment.momentText}</Text>
                      </View>
                      {moment.durationMinutes && (
                        <View className='card-footer'>
                          <Text className='duration-text'>
                            持续了 {moment.durationMinutes} 分钟
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                )}

                {/* 穿越感模式分析 */}
                {flowMoments.length > 0 && (
                  <View className='pattern-card'>
                    <Text className='pattern-title'>你的穿越感模式</Text>
                    <Text className='pattern-desc'>
                      你在「设计」和「开发」类型的事情上最有穿越感
                    </Text>
                    <Text className='pattern-hint'>
                      这可能是你的热情所在
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 热情火花列表 */}
            {activeTab === 'spark' && (
              <View className='spark-list'>
                {passionSparks.length === 0 ? (
                  <View className='empty-state'>
                    <View className='empty-icon'>
                      <Text className='icon-text'>✨</Text>
                    </View>
                    <Text className='empty-title'>还没有热情火花</Text>
                    <Text className='empty-desc'>
                      当你在对话中表现出热情时，AI导师会帮你捕捉下来
                    </Text>
                  </View>
                ) : (
                  passionSparks.map((spark) => (
                    <View key={spark.id} className='spark-card'>
                      <View className='card-header'>
                        <View className='spark-icon'>✨</View>
                        <View className='card-info'>
                          <Text className='task-title'>{spark.taskTitle || '对话中'}</Text>
                          <Text className='capture-time'>{formatDate(spark.createdAt)}</Text>
                        </View>
                      </View>
                      <View className='card-content'>
                        <Text className='spark-text'>{spark.sparkText}</Text>
                        {spark.context && (
                          <Text className='context-text'>「{spark.context}」</Text>
                        )}
                      </View>
                      <View className='card-footer'>
                        {spark.wantExplore ? (
                          <View className='explore-badge'>
                            <Text className='badge-text'>✓ 想要探索</Text>
                          </View>
                        ) : (
                          <View
                            className='explore-btn'
                            onClick={() => handleMarkExplore(spark.id)}
                          >
                            <Text className='btn-text'>标记为想探索</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
