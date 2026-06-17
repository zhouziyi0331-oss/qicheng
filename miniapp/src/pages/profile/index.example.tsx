/**
 * ✅ 学生端个人中心示例
 *
 * 使用安全API层，展示：
 * - 手机号脱敏
 * - 安全退出登录
 * - 退出所有设备
 */

import { View, Text, Button, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { authService } from '@/services/authSecure';
import { maskPhone } from '@/utils/token';
import './index.scss';

export default function Profile() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const info = await authService.getCurrentUser();
      setUserInfo(info);
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  // ✅ P0安全: 退出登录（清除所有Token）
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            setLoading(true);
            await authService.logout();
            // authService.logout会自动跳转到登录页
          } catch (error: any) {
            Taro.showToast({
              title: error.message || '退出失败',
              icon: 'none',
            });
          } finally {
            setLoading(false);
          }
        }
      },
    });
  };

  // ✅ 退出所有设备
  const handleLogoutAll = () => {
    Taro.showModal({
      title: '确认退出所有设备',
      content: '将会退出您在所有设备上的登录，包括手机、平板、电脑等',
      confirmText: '确认退出',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            setLoading(true);
            await authService.logoutAll();
          } catch (error: any) {
            Taro.showToast({
              title: error.message || '操作失败',
              icon: 'none',
            });
          } finally {
            setLoading(false);
          }
        }
      },
    });
  };

  // 刷新用户信息
  const handleRefresh = async () => {
    try {
      setLoading(true);
      await authService.refreshUserInfo();
      await loadUserInfo();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '刷新失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <View className="profile-page loading">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className="profile-page">
      {/* 用户信息卡片 */}
      <View className="user-card">
        <Image
          className="avatar"
          src={userInfo.avatarUrl || '/assets/default-avatar.png'}
          mode="aspectFill"
        />
        <View className="user-info">
          <Text className="nickname">{userInfo.nickname || '未设置昵称'}</Text>
          {/* ✅ 显示脱敏手机号 */}
          <Text className="phone">{maskPhone(userInfo.phone)}</Text>
          <Text className="level">Lv.{userInfo.currentLevel || 1}</Text>
        </View>
        <Button
          className="refresh-btn"
          onClick={handleRefresh}
          loading={loading}
          disabled={loading}
        >
          刷新
        </Button>
      </View>

      {/* 统计信息 */}
      <View className="stats-card">
        <View className="stat-item">
          <Text className="stat-value">{userInfo.completedOrders || 0}</Text>
          <Text className="stat-label">完成订单</Text>
        </View>
        <View className="stat-item">
          <Text className="stat-value">¥{userInfo.totalIncome || 0}</Text>
          <Text className="stat-label">累计收入</Text>
        </View>
        <View className="stat-item">
          <Text className="stat-value">{userInfo.rating || 5.0}</Text>
          <Text className="stat-label">好评率</Text>
        </View>
      </View>

      {/* 菜单列表 */}
      <View className="menu-list">
        <View className="menu-item" onClick={() => Taro.navigateTo({ url: '/pages/profile/edit' })}>
          <Text className="menu-label">✏️ 编辑资料</Text>
          <Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={() => Taro.navigateTo({ url: '/pages/orders/list' })}>
          <Text className="menu-label">📦 我的订单</Text>
          <Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={() => Taro.navigateTo({ url: '/pages/wallet/index' })}>
          <Text className="menu-label">💰 我的钱包</Text>
          <Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={() => Taro.navigateTo({ url: '/pages/settings/index' })}>
          <Text className="menu-label">⚙️ 设置</Text>
          <Text className="menu-arrow">›</Text>
        </View>
      </View>

      {/* 退出按钮 */}
      <View className="logout-section">
        <Button
          className="logout-all-btn"
          onClick={handleLogoutAll}
          loading={loading}
          disabled={loading}
        >
          退出所有设备
        </Button>
        <Button
          className="logout-btn"
          onClick={handleLogout}
          loading={loading}
          disabled={loading}
        >
          退出登录
        </Button>
      </View>

      {/* 安全提示 */}
      <View className="security-tip">
        <Text className="tip-icon">🔒</Text>
        <Text className="tip-text">
          您的登录已受保护，退出后Token立即失效
        </Text>
      </View>
    </View>
  );
}
