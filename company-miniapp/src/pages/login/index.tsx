import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function Login() {
  const [loginType, setLoginType] = useState<'wechat' | 'phone'>('wechat')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  // 微信一键登录
  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      // 1. 获取微信登录code
      const loginRes = await Taro.login()

      // 2. 获取用户信息
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善企业资料'
      })

      // 3. 调用后端微信登录接口
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/auth/wechat/login',
        method: 'POST',
        data: {
          code: loginRes.code,
          userType: 'company',
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
      await Taro.request({
        url: 'http://localhost:3000/api/v1/auth/send-code',
        method: 'POST',
        data: { phone }
      })
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
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' })
    }
  }

  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!phone || !code) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/auth/login',
        method: 'POST',
        data: { phone, code, userType: 'company' }
      })

      if (res.data.success) {
        const { user, token } = res.data.data
        Taro.setStorageSync('token', token)
        Taro.setStorageSync('userId', user.id)
        Taro.setStorageSync('userInfo', user)

        Taro.showToast({ title: '登录成功', icon: 'success' })

        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1000)
      } else {
        Taro.showToast({ title: res.data.message || '登录失败', icon: 'none' })
      }
    } catch (error) {
      console.error('登录失败:', error)
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="login-page">
      <View className="login-header">
        <View className="logo">🏢</View>
        <Text className="title">企业端登录</Text>
        <Text className="subtitle">启程平台 · 企业服务</Text>
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

          <Button
            className="login-button"
            type="primary"
            loading={loading}
            onClick={handlePhoneLogin}
          >
            登录
          </Button>

          <View className="register-tip">
            <Text className="tip-text">首次登录将自动注册企业账号</Text>
          </View>
        </View>
      )}

      {/* 平台特色说明 */}
      <View className="platform-features">
        <View className="feature-item">
          <View className="feature-icon">🔒</View>
          <Text className="feature-text">数据加密存储，企业信息安全保障</Text>
        </View>
        <View className="feature-item">
          <View className="feature-icon">🤝</View>
          <Text className="feature-text">与学生完成2单后可解锁联系方式</Text>
        </View>
        <View className="feature-item">
          <View className="feature-icon">⭐</View>
          <Text className="feature-text">AI智能匹配，快速找到合适人才</Text>
        </View>
      </View>
    </View>
  )
}
