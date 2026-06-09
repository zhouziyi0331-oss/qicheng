import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { authAPI } from '../../services/api'
import { saveUserInfo } from '../../utils'
import './index.scss'

export default function Login() {
  const [loginType, setLoginType] = useState<'wechat' | 'phone'>('wechat')
  const [phoneLoginType, setPhoneLoginType] = useState<'password' | 'code'>('password')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  // 开发模式：快速登录（跳过真实认证）
  const handleDevLogin = () => {
    const mockUser = {
      id: 'dev_user_001',
      nickname: '测试用户',
      avatar: 'https://via.placeholder.com/100',
      phone: '13800138000',
      opc_tags: ['创造力', '学习力', '执行力']
    }
    const mockToken = 'dev_token_' + Date.now()

    Taro.setStorageSync('user', mockUser)
    Taro.setStorageSync('token', mockToken)
    Taro.setStorageSync('userId', mockUser.id)

    Taro.showToast({ title: '开发模式登录成功', icon: 'success' })
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/index/index' })
    }, 1000)
  }

  // 微信一键登录
  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      // 1. 获取微信登录code
      const loginRes = await Taro.login()

      // 2. 获取用户信息
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      })

      // 3. 调用后端微信登录接口
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/auth/wechat/login',
        method: 'POST',
        data: {
          code: loginRes.code,
          userType: 'student',
          userInfo: {
            nickName: userInfoRes.userInfo.nickName,
            avatarUrl: userInfoRes.userInfo.avatarUrl
          }
        }
      })

      if (res.data.success) {
        const { userId, accessToken, refreshToken, isNewUser, needBindPhone } = res.data.data

        // 保存token
        Taro.setStorageSync('token', accessToken)
        Taro.setStorageSync('refreshToken', refreshToken)
        Taro.setStorageSync('userId', userId)

        Taro.showToast({ title: isNewUser ? '注册成功' : '登录成功', icon: 'success' })

        // 如果需要绑定手机号，跳转到绑定页面
        if (needBindPhone) {
          setTimeout(() => {
            Taro.navigateTo({ url: '/pages/bind-phone/index' })
          }, 1000)
        } else {
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/index/index' })
          }, 1000)
        }
      } else {
        Taro.showToast({ title: res.data.message || '登录失败', icon: 'none' })
      }
    } catch (error: any) {
      console.error('微信登录失败:', error)
      if (error.errMsg && error.errMsg.includes('getUserProfile')) {
        Taro.showToast({ title: '需要授权才能登录', icon: 'none' })
      } else {
        Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
      }
    } finally {
      setLoading(false)
    }
  }

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    if (countdown > 0) return

    try {
      await authAPI.sendCode(phone)
      Taro.showToast({ title: '验证码已发送', icon: 'success' })

      // 开始倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      console.error('发送验证码失败:', error)
    }
  }

  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!phone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }

    if (phoneLoginType === 'password' && !password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    if (phoneLoginType === 'code' && !code) {
      Taro.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.login(
        phoneLoginType === 'password' 
          ? { phone, password }
          : { phone, code }
      )
      
      // 保存token和用户信息
      Taro.setStorageSync('accessToken', res.data.accessToken)
      Taro.setStorageSync('refreshToken', res.data.refreshToken)
      Taro.setStorageSync('userInfo', {
        userId: res.data.userId,
        role: res.data.role,
        userType: res.data.userType
      })

      Taro.showToast({ title: '登录成功', icon: 'success' })

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1000)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
      console.error('登录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 跳转注册
  const handleGoRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className="login-page">
      <View className="login-header">
        <View className="logo">🚀</View>
        <Text className="title">欢迎回来</Text>
        <Text className="subtitle">登录启程，继续你的成长之旅</Text>
      </View>

      {/* 开发模式快速登录 */}
      <View className="dev-login">
        <Button
          className="dev-button"
          type="warn"
          onClick={handleDevLogin}
        >
          🔧 开发模式登录（测试用）
        </Button>
      </View>

      {/* 登录方式切换 */}
      <View className="login-type-tabs">
        <View
          className={`tab ${loginType === 'wechat' ? 'active' : ''}`}
          onClick={() => setLoginType('wechat')}
        >
          微信登录
        </View>
        <View
          className={`tab ${loginType === 'phone' ? 'active' : ''}`}
          onClick={() => setLoginType('phone')}
        >
          手机号登录
        </View>
      </View>

      {/* 微信登录 */}
      {loginType === 'wechat' && (
        <View className="wechat-login">
          <View className="wechat-icon">💚</View>
          <Text className="wechat-tip">使用微信授权登录</Text>
          <Text className="wechat-desc">自动同步微信昵称和头像</Text>
          <Button
            className="wechat-button"
            loading={loading}
            onClick={handleWechatLogin}
          >
            微信一键登录
          </Button>
        </View>
      )}

      {/* 手机号登录 */}
      {loginType === 'phone' && (
        <View className="login-form">
          <View className="form-item">
            <Text className="form-label">手机号</Text>
            <Input
              className="form-input"
              type="number"
              maxlength={11}
              placeholder="请输入手机号"
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>

          {phoneLoginType === 'password' ? (
            <View className="form-item">
              <Text className="form-label">密码</Text>
              <Input
                className="form-input"
                type="password"
                placeholder="请输入密码"
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
              />
            </View>
          ) : (
            <View className="form-item">
              <Text className="form-label">验证码</Text>
              <View className="code-input-wrapper">
                <Input
                  className="form-input code-input"
                  type="number"
                  maxlength={6}
                  placeholder="请输入验证码"
                  value={code}
                  onInput={(e) => setCode(e.detail.value)}
                />
                <Button
                  className="code-button"
                  size="mini"
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </View>
            </View>
          )}

          <View className="login-type-switch">
            <Text 
              className="switch-link" 
              onClick={() => setPhoneLoginType(phoneLoginType === 'password' ? 'code' : 'password')}
            >
              {phoneLoginType === 'password' ? '验证码登录' : '密码登录'}
            </Text>
          </View>

          <Button
            className="login-button"
            type="primary"
            loading={loading}
            onClick={handlePhoneLogin}
          >
            登录
          </Button>

          <View className="register-tip">
            <Text className="tip-text">还没有账号？</Text>
            <Text className="tip-link" onClick={handleGoRegister}>立即注册</Text>
          </View>
        </View>
      )}
    </View>
  )
}
