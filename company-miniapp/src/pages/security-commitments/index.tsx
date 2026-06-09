import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { securityAPI } from '../../services/api';
import './index.scss';

interface SecurityCommitment {
  id: string;
  title: string;
  content: string;
  category: string;
  displayOrder: number;
}

export default function SecurityCommitments() {
  const [commitments, setCommitments] = useState<SecurityCommitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommitments();
  }, []);

  const loadCommitments = async () => {
    setLoading(true);
    try {
      const res = await securityAPI.getCommitments();
      if (res.success) {
        setCommitments(res.data);
      } else {
        Taro.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载安全承诺失败:', err);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      data_security: '🔒',
      privacy_protection: '🛡️',
      encryption: '🔐',
      access_control: '👁️',
      audit_log: '📋'
    };
    return icons[category] || '✓';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      data_security: '数据安全',
      privacy_protection: '隐私保护',
      encryption: '加密存储',
      access_control: '权限控制',
      audit_log: '审计日志'
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <View className="security-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="security-page">
      {/* 头部 */}
      <View className="header">
        <View className="header-icon">🔐</View>
        <Text className="header-title">平台安全承诺</Text>
        <Text className="header-subtitle">我们如何保护您的企业数据</Text>
      </View>

      {/* 核心保障 */}
      <View className="core-features">
        <View className="feature-card">
          <View className="feature-icon">🔒</View>
          <Text className="feature-title">交付物加密存储</Text>
          <Text className="feature-desc">AES-256-GCM加密算法，军事级安全</Text>
        </View>
        <View className="feature-card">
          <View className="feature-icon">🛡️</View>
          <Text className="feature-title">企业数据隔离</Text>
          <Text className="feature-desc">物理隔离，绝不泄露给竞品</Text>
        </View>
        <View className="feature-card">
          <View className="feature-icon">📋</View>
          <Text className="feature-title">访问全程记录</Text>
          <Text className="feature-desc">所有操作可追溯，可审计</Text>
        </View>
      </View>

      {/* 详细承诺 */}
      <ScrollView className="commitments-list" scrollY>
        {commitments.map((item) => (
          <View key={item.id} className="commitment-card">
            <View className="card-header">
              <View className="card-icon">{getCategoryIcon(item.category)}</View>
              <View className="card-header-text">
                <Text className="card-category">{getCategoryName(item.category)}</Text>
                <Text className="card-title">{item.title}</Text>
              </View>
            </View>
            <Text className="card-content">{item.content}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 底部说明 */}
      <View className="footer-note">
        <Text className="note-text">
          我们承诺严格遵守《网络安全法》和《数据安全法》，保护您的企业数据安全
        </Text>
      </View>
    </View>
  );
}
