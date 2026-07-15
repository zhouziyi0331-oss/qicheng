import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Button } from '@tarojs/components';
import { tokenManager } from '../../../../utils/token';
import { config } from '../../../../config';
import './index.scss';

/**
 * ✓ 简单的登录页面 - 用于测试
 */
export default function Login() {
  useEffect(() => {
    console.log('● 登录页面已加载');
  }, []);

  const handleTestLogin = async () => {
    try {
      // ✓ 测试：直接保存一个测试Token
      await tokenManager.saveTokens('test_access_token', 'test_refresh_token');

      await tokenManager.saveUserInfo({
        id: 'test_user_id',
        phone: '13800138000',
        nickname: '测试用户',
        role: 'student',
      });

      Taro.showToast({
        title: '登录成功（测试模式）',
        icon: 'success',
      });

      // 跳转到首页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1500);

    } catch (error) {
      console.error('登录失败:', error);
      Taro.showToast({
        title: '登录失败',
        icon: 'none',
      });
    }
  };

  return (
    <View className="login-page">
      <View className="login-header">
        <Text className="login-title">启程学生端</Text>
        <Text className="login-subtitle">用实战项目成长</Text>
      </View>

      <View className="login-form">
        <Text className="tip">● 测试模式登录</Text>
        <Text className="tip-small">正在连接后端...</Text>
        <Text className="tip-small">API: {config.apiBaseUrl}</Text>

        <Button
          className="login-btn"
          onClick={handleTestLogin}
        >
          测试登录
        </Button>
      </View>

      <View className="debug-info">
        <Text className="debug-text">● 当前页面: pages/auth/login</Text>
        <Text className="debug-text">● 后端地址: {config.apiBaseUrl}</Text>
        <Text className="debug-text">✓ 小程序已加载成功</Text>
      </View>
    </View>
  );
}
