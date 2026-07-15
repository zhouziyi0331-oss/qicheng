import { View, Text, Button, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './invite.scss'

export default function MentorInvite() {
  const [inviteCode, setInviteCode] = useState('')
  const [inviteCount, setInviteCount] = useState(0)
  const [inviteRewards, setInviteRewards] = useState(0)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInviteInfo()
  }, [])

  const loadInviteInfo = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo')

      if (userInfo?.id) {
        // 模拟生成邀请码（实际应从API获取）
        const code = `QICHENG${userInfo.id.slice(0, 6).toUpperCase()}`
        setInviteCode(code)

        // TODO: 从API加载真实数据
        // const response = await inviteAPI.getInviteInfo()
        setInviteCount(0)
        setInviteRewards(0)

        // 生成二维码URL（实际应从API获取）
        setQrCodeUrl(`https://qicheng.com/invite/${code}`)
      }
    } catch (error: any) {
      console.error('加载邀请信息失败:', error)
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInviteCode = () => {
    Taro.setClipboardData({
      data: inviteCode,
      success: () => {
        Taro.showToast({
          title: '邀请码已复制',
          icon: 'success'
        })
      }
    })
  }

  const handleShareInvite = () => {
    Taro.showModal({
      title: '分享邀请',
      content: `我在启程OPC发现了很棒的成长机会，邀请你一起加入！\n\n邀请码：${inviteCode}\n\n双方都可获得成长奖励 ◆`,
      showCancel: true,
      cancelText: '取消',
      confirmText: '复制',
      success: (res) => {
        if (res.confirm) {
          Taro.setClipboardData({
            data: `我在启程OPC发现了很棒的成长机会，邀请你一起加入！\n\n邀请码：${inviteCode}\n\n双方都可获得成长奖励 ◆`,
            success: () => {
              Taro.showToast({
                title: '已复制，快去分享吧',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }

  const handleSaveQRCode = () => {
    Taro.showToast({
      title: '二维码保存功能开发中',
      icon: 'none'
    })
    // TODO: 实现二维码保存功能
  }

  const handleViewInviteHistory = () => {
    Taro.showToast({
      title: '邀请记录功能开发中',
      icon: 'none'
    })
    // TODO: 跳转到邀请记录页面
  }

  if (loading) {
    return (
      <View className="mentor-invite-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="mentor-invite-page">
      {/* 顶部标题 */}
      <View className="header-section">
        <Text className="page-title">邀请引路人</Text>
        <Text className="page-subtitle">一起成长，共同进步</Text>
      </View>

      {/* 邀请统计 */}
      <View className="stats-section">
        <View className="stat-card">
          <Text className="stat-icon">●</Text>
          <Text className="stat-value">{inviteCount}</Text>
          <Text className="stat-label">已邀请人数</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-icon">●</Text>
          <Text className="stat-value">¥{inviteRewards}</Text>
          <Text className="stat-label">累计奖励</Text>
        </View>
      </View>

      {/* 邀请码卡片 */}
      <View className="invite-code-section">
        <View className="code-card">
          <Text className="code-label">我的邀请码</Text>
          <View className="code-display">
            <Text className="code-text">{inviteCode}</Text>
          </View>
          <View className="code-actions">
            <View className="action-btn" onClick={handleCopyInviteCode}>
              <Text className="btn-icon">▪</Text>
              <Text className="btn-text">复制邀请码</Text>
            </View>
            <View className="action-btn primary" onClick={handleShareInvite}>
              <Text className="btn-icon">●</Text>
              <Text className="btn-text">立即分享</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 二维码 */}
      <View className="qrcode-section">
        <Text className="section-title">邀请二维码</Text>
        <View className="qrcode-card">
          <View className="qrcode-placeholder">
            <Text className="placeholder-text">二维码</Text>
            <Text className="placeholder-hint">长按保存图片分享</Text>
          </View>
          {/* TODO: 显示真实二维码 */}
          {/* <Image className="qrcode-image" src={qrCodeUrl} mode="aspectFit" /> */}
        </View>
        <View className="qrcode-btn" onClick={handleSaveQRCode}>
          <Text className="btn-text">保存二维码</Text>
        </View>
      </View>

      {/* 邀请奖励说明 */}
      <View className="rewards-section">
        <Text className="section-title">◆ 邀请奖励</Text>
        <View className="reward-list">
          <View className="reward-item">
            <View className="reward-icon">
              <Text className="icon-text">1️⃣</Text>
            </View>
            <View className="reward-content">
              <Text className="reward-title">新人注册奖励</Text>
              <Text className="reward-desc">好友使用你的邀请码注册，你获得 50 积分</Text>
            </View>
          </View>

          <View className="reward-item">
            <View className="reward-icon">
              <Text className="icon-text">2️⃣</Text>
            </View>
            <View className="reward-content">
              <Text className="reward-title">首次任务完成</Text>
              <Text className="reward-desc">好友完成首个任务，你获得 10元 现金奖励</Text>
            </View>
          </View>

          <View className="reward-item">
            <View className="reward-icon">
              <Text className="icon-text">3️⃣</Text>
            </View>
            <View className="reward-content">
              <Text className="reward-title">长期成长收益</Text>
              <Text className="reward-desc">好友每完成任务，你可获得其收益的 5% 作为引路人奖励</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 邀请规则 */}
      <View className="rules-section">
        <Text className="section-title">● 邀请规则</Text>
        <View className="rule-list">
          <View className="rule-item">
            <Text className="rule-bullet">•</Text>
            <Text className="rule-text">邀请码永久有效，可重复使用</Text>
          </View>
          <View className="rule-item">
            <Text className="rule-bullet">•</Text>
            <Text className="rule-text">被邀请人需在注册时填写邀请码才能建立关系</Text>
          </View>
          <View className="rule-item">
            <Text className="rule-bullet">•</Text>
            <Text className="rule-text">奖励将在好友完成任务后自动发放到你的钱包</Text>
          </View>
          <View className="rule-item">
            <Text className="rule-bullet">•</Text>
            <Text className="rule-text">引路人关系一旦建立，永久有效</Text>
          </View>
          <View className="rule-item">
            <Text className="rule-bullet">•</Text>
            <Text className="rule-text">禁止通过不正当手段获取奖励，违规将封禁账号</Text>
          </View>
        </View>
      </View>

      {/* 查看邀请记录 */}
      <View className="history-btn" onClick={handleViewInviteHistory}>
        <Text className="btn-text">查看邀请记录</Text>
      </View>
    </View>
  )
}
