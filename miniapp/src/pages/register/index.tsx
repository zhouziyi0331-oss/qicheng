import { View, Text, Input, Button, Radio, RadioGroup } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { authAPI } from '../../services/api'
import { saveUserInfo } from '../../utils'
import './index.scss'

export default function Register() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'student' | 'company'>('student')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (countdown > 0) return

    try {
      await authAPI.sendCode(phone)
      Taro.showToast({ title: '验证码已发送', icon: 'success' })
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

  const handleRegister = async () => {
    if (!phone || !code || !password) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    if (password.length < 8) {
      Taro.showToast({ title: '密码至少8位', icon: 'none' })
      return
    }

    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.register({ 
        phone, 
        code, 
        password,
        role,
        userType: role
      })
      
      // 保存token和用户信息
      Taro.setStorageSync('accessToken', res.data.accessToken)
      Taro.setStorageSync('refreshToken', res.data.refreshToken)
      Taro.setStorageSync('userInfo', {
        userId: res.data.userId,
        role: res.data.role,
        userType: res.data.userType
      })
      
      Taro.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        if (role === 'student') {
          Taro.redirectTo({ url: '/pages/onboarding/index' })
        } else {
          Taro.redirectTo({ url: '/pages/index/index' })
        }
      }, 1000)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '注册失败', icon: 'none' })
      console.error('注册失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="register-page">
      <View className="register-header">
        <View className="logo">🚀</View>
        <Text className="title">加入启程</Text>
        <Text className="subtitle">开启你的OPC成长之旅</Text>
      </View>

      <View className="register-form">
        <View className="form-item">
          <Text className="form-label">我是</Text>
          <RadioGroup onChange={(e) => setRole(e.detail.value as any)}>
            <View className="role-options">
              <View className="role-option">
                <Radio value="student" checked={role === 'student'} color="#8B5CF6" />
                <Text className="role-text">学生</Text>
              </View>
              <View className="role-option">
                <Radio value="company" checked={role === 'company'} color="#8B5CF6" />
                <Text className="role-text">企业</Text>
              </View>
            </View>
          </RadioGroup>
        </View>

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

        <View className="form-item">
          <Text className="form-label">密码</Text>
          <Input
            className="form-input"
            type="password"
            placeholder="请输入密码（至少8位）"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">确认密码</Text>
          <Input
            className="form-input"
            type="password"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword(e.detail.value)}
          />
        </View>

        <Button
          className="register-button"
          type="primary"
          loading={loading}
          onClick={handleRegister}
        >
          注册
        </Button>

        <View className="login-tip">
          <Text className="tip-text">已有账号？</Text>
          <Text className="tip-link" onClick={() => Taro.navigateBack()}>立即登录</Text>
        </View>
      </View>
    </View>
  )
}
