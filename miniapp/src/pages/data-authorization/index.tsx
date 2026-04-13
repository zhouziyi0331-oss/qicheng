import { View, Text, Button, ScrollView, Switch } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../services/api';
import './index.scss';

interface AuthSettings {
  basic_data_authorized: boolean;
  task_data_authorized: boolean;
  ability_data_authorized: boolean;
  commercial_use_authorized: boolean;
  marketing_authorized: boolean;
  third_party_share_authorized: boolean;
  ai_training_authorized: boolean;
}

export default function DataAuthorizationSettings() {
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.agreement.getAuthorizationSettings();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error('加载授权设置失败:', error);
    }
  };

  const handleToggle = async (authType: string, value: boolean) => {
    // 基础授权不可修改
    if (['basic_data_authorized', 'task_data_authorized', 'ability_data_authorized'].includes(authType)) {
      Taro.showToast({ title: '基础授权为必选项', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      await api.agreement.updateAuthorization(authType, value);
      Taro.showToast({ title: '设置已更新', icon: 'success' });
      loadSettings();
    } catch (error: any) {
      Taro.showToast({ title: error.message || '更新失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    Taro.navigateTo({ url: '/pages/authorization-history/index' });
  };

  if (!settings) {
    return (
      <View className="data-authorization">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="data-authorization">
      <View className="header">
        <Text className="title">数据授权设置</Text>
        <Text className="subtitle">管理您的数据使用权限</Text>
      </View>

      <ScrollView className="content" scrollY>
        {/* 基础授权（不可修改） */}
        <View className="section">
          <Text className="section-title">基础授权（必选）</Text>
          <Text className="section-desc">以下授权为使用平台的必要条件，无法关闭</Text>

          <View className="auth-item disabled">
            <View className="auth-info">
              <Text className="auth-title">基础信息授权</Text>
              <Text className="auth-desc">姓名、联系方式、学校信息等</Text>
            </View>
            <Switch checked={settings.basic_data_authorized} disabled />
          </View>

          <View className="auth-item disabled">
            <View className="auth-info">
              <Text className="auth-title">任务数据授权</Text>
              <Text className="auth-desc">任务执行记录、作品提交等</Text>
            </View>
            <Switch checked={settings.task_data_authorized} disabled />
          </View>

          <View className="auth-item disabled">
            <View className="auth-info">
              <Text className="auth-title">能力数据授权</Text>
              <Text className="auth-desc">OPC测评结果、能力画像等</Text>
            </View>
            <Switch checked={settings.ability_data_authorized} disabled />
          </View>
        </View>

        {/* 商业化授权（可选） */}
        <View className="section">
          <Text className="section-title">商业化授权（可选）</Text>
          <Text className="section-desc">您可以随时修改以下授权设置</Text>

          <View className="auth-item">
            <View className="auth-info">
              <Text className="auth-title">数据商业化使用</Text>
              <Text className="auth-desc">匿名化后用于行业研究和数据分析</Text>
            </View>
            <Switch
              checked={settings.commercial_use_authorized}
              onChange={(e) => handleToggle('commercial_use_authorized', e.detail.value)}
              disabled={loading}
            />
          </View>

          <View className="auth-item">
            <View className="auth-info">
              <Text className="auth-title">营销推广授权</Text>
              <Text className="auth-desc">接收任务推荐、活动通知等</Text>
            </View>
            <Switch
              checked={settings.marketing_authorized}
              onChange={(e) => handleToggle('marketing_authorized', e.detail.value)}
              disabled={loading}
            />
          </View>

          <View className="auth-item">
            <View className="auth-info">
              <Text className="auth-title">第三方数据共享</Text>
              <Text className="auth-desc">与合作企业共享您的能力画像</Text>
            </View>
            <Switch
              checked={settings.third_party_share_authorized}
              onChange={(e) => handleToggle('third_party_share_authorized', e.detail.value)}
              disabled={loading}
            />
          </View>

          <View className="auth-item">
            <View className="auth-info">
              <Text className="auth-title">AI模型训练</Text>
              <Text className="auth-desc">用于改进AI推荐和匹配算法</Text>
            </View>
            <Switch
              checked={settings.ai_training_authorized}
              onChange={(e) => handleToggle('ai_training_authorized', e.detail.value)}
              disabled={loading}
            />
          </View>
        </View>

        {/* 说明 */}
        <View className="notice">
          <Text className="notice-title">数据安全承诺</Text>
          <Text className="notice-text">
            • 所有数据均采用加密技术存储和传输
          </Text>
          <Text className="notice-text">
            • 商业化使用的数据将进行匿名化处理
          </Text>
          <Text className="notice-text">
            • 您可以随时查看和修改授权设置
          </Text>
          <Text className="notice-text">
            • 撤回授权不影响已完成的数据使用
          </Text>
        </View>

        <Button className="history-btn" onClick={handleViewHistory}>
          查看授权变更历史
        </Button>
      </ScrollView>
    </View>
  );
}
