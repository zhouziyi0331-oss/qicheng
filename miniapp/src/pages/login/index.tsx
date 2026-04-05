import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { authAPI } from '../../services/api'
import { saveUserInfo } from '../../utils'
import './index.scss'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

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

  // 登录
  const handleLogin = async () => {
    if (!phone || !code) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.login({ phone, code })
      saveUserInfo(res.user, res.token)

      Taro.showToast({ title: '登录成功', icon: 'success' })

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1000)
    } catch (error) {
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
          onClick={handleLogin}
        >
          登录
        </Button>

        <View className="register-tip">
          <Text className="tip-text">还没有账号？</Text>
          <Text className="tip-link" onClick={handleGoRegister}>立即注册</Text>
        </View>
      </View>
    </View>
  )
}
