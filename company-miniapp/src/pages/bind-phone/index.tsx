import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function BindPhone() {
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

  // 绑定手机号
  const handleBindPhone = async () => {
    if (!phone || !code) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/user/bind-phone',
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`
        },
        data: { phone, code }
      })

      if (res.data.success) {
        Taro.showToast({ title: '绑定成功', icon: 'success' })
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1000)
      } else {
        Taro.showToast({ title: res.data.message || '绑定失败', icon: 'none' })
      }
    } catch (error) {
      console.error('绑定失败:', error)
      Taro.showToast({ title: '绑定失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 跳过绑定
  const handleSkip = () => {
    Taro.showModal({
      title: '提示',
      content: '跳过绑定手机号可能影响部分功能使用，确定跳过吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.switchTab({ url: '/pages/index/index' })
        }
      }
    })
  }

  return (
    <View className="bind-phone-page">
      <View className="bind-header">
        <View className="icon icon-phone"></View>
        <Text className="title">绑定手机号</Text>
        <Text className="subtitle">绑定后可接收任务通知和重要消息</Text>
      </View>

      <View className="bind-form">
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
          className="bind-button"
          type="primary"
          loading={loading}
          onClick={handleBindPhone}
        >
          立即绑定
        </Button>

        <View className="skip-tip" onClick={handleSkip}>
          <Text className="skip-text">暂不绑定</Text>
        </View>
      </View>
    </View>
  )
}
