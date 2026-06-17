/**
 * ✅ 学生端登录页面示例
 *
 * 使用安全API层，集成：
 * - P1: 登录锁定提示
 * - P0: Token安全存储
 */

import { View, Input, Button, Text } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { authService } from '@/services/authSecure';
import './index.scss';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'wechat' | 'sms'>('password');

  // ✅ P1安全: 密码登录（自动显示锁定提示）
  const handlePasswordLogin = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!password || password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }

    try {
      setLoading(true);

      // ✅ 使用安全登录服务
      await authService.loginWithPassword(phone, password);

      Taro.showToast({ title: '登录成功', icon: 'success' });

      // 跳转首页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1500);

    } catch (error: any) {
      // ✅ 错误已在authService中处理
      // 包括登录锁定提示："请30分钟后重试"
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 微信一键登录
  const handleWechatLogin = async () => {
    try {
      setLoading(true);

      // 获取微信登录code
      const { code } = await Taro.login();

      // 调用安全登录服务
      await authService.loginWithWechat({ code });

      Taro.showToast({ title: '登录成功', icon: 'success' });

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1500);

    } catch (error: any) {
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ 验证码登录
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleSendSmsCode = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    try {
      await authService.sendSmsCode(phone);

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      Taro.showToast({
        title: error.message || '发送失败',
        icon: 'none',
      });
    }
  };

  const handleSmsLogin = async () => {
    if (!phone || !smsCode) {
      Taro.showToast({ title: '请输入手机号和验证码', icon: 'none' });
      return;
    }

    try {
      setLoading(true);

      await authService.loginWithSmsCode(phone, smsCode);

      Taro.showToast({ title: '登录成功', icon: 'success' });

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1500);

    } catch (error: any) {
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="login-page">
      <View className="login-header">
        <Text className="login-title">启程学生端</Text>
        <Text className="login-subtitle">用实战项目成长</Text>
      </View>

      <View className="login-methods">
        <View
          className={`method-tab ${loginMethod === 'password' ? 'active' : ''}`}
          onClick={() => setLoginMethod('password')}
        >
          密码登录
        </View>
        <View
          className={`method-tab ${loginMethod === 'sms' ? 'active' : ''}`}
          onClick={() => setLoginMethod('sms')}
        >
          验证码登录
        </View>
        <View
          className={`method-tab ${loginMethod === 'wechat' ? 'active' : ''}`}
          onClick={() => setLoginMethod('wechat')}
        >
          微信登录
        </View>
      </View>

      {loginMethod === 'password' && (
        <View className="login-form">
          <Input
            className="input"
            type="number"
            placeholder="请输入手机号"
            maxlength={11}
            value={phone}
            onInput={e => setPhone(e.detail.value)}
          />
          <Input
            className="input"
            type="password"
            placeholder="请输入密码"
            value={password}
            onInput={e => setPassword(e.detail.value)}
          />
          <Button
            className="login-btn"
            onClick={handlePasswordLogin}
            loading={loading}
            disabled={loading}
          >
            登录
          </Button>
        </View>
      )}

      {loginMethod === 'sms' && (
        <View className="login-form">
          <Input
            className="input"
            type="number"
            placeholder="请输入手机号"
            maxlength={11}
            value={phone}
            onInput={e => setPhone(e.detail.value)}
          />
          <View className="sms-input-wrapper">
            <Input
              className="input sms-input"
              type="number"
              placeholder="请输入验证码"
              maxlength={6}
              value={smsCode}
              onInput={e => setSmsCode(e.detail.value)}
            />
            <Button
              className="sms-btn"
              onClick={handleSendSmsCode}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}秒` : '获取验证码'}
            </Button>
          </View>
          <Button
            className="login-btn"
            onClick={handleSmsLogin}
            loading={loading}
            disabled={loading}
          >
            登录
          </Button>
        </View>
      )}

      {loginMethod === 'wechat' && (
        <View className="login-form">
          <Button
            className="wechat-login-btn"
            onClick={handleWechatLogin}
            loading={loading}
            disabled={loading}
          >
            <Text className="wechat-icon">📱</Text>
            微信一键登录
          </Button>
          <Text className="wechat-tip">
            授权后自动获取微信头像和昵称
          </Text>
        </View>
      )}

      <View className="login-footer">
        <Text className="tip">登录即同意</Text>
        <Text className="link">《用户协议》</Text>
        <Text className="tip">和</Text>
        <Text className="link">《隐私政策》</Text>
      </View>
    </View>
  );
}
