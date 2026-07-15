import { View, Text, Button } from '@tarojs/components'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Loading from '../../../components/Loading'
import './become-mentor.scss'

interface EligibilityData {
  canBeMentor: boolean
  currentOrders: number
  requiredOrders: number
}

export default function BecomeMentor() {
  const [loading, setLoading] = useState(true)
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')

  useEffect(() => {
    checkEligibility()
  }, [])

  const checkEligibility = async () => {
    try {
      setLoading(true)
      const token = tokenManager.getAccessToken()
      const res = await Taro.request({
        url: getApiUrl('/api/v1/student/can-be-mentor'),
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setEligibility(res.data.data)
      }
    } catch (err) {
      console.error('检查资格失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleBecomeMentor = async () => {
    try {
      const token = tokenManager.getAccessToken()
      const res = await Taro.request({
        url: getApiUrl('/api/v1/student/become-mentor'),
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setInviteCode(res.data.data.inviteCode)
        setInviteUrl(res.data.data.inviteUrl)
        Taro.showToast({ title: '成为引路人成功', icon: 'success' })
      }
    } catch (err) {
      console.error('成为引路人失败:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleCopyCode = () => {
    Taro.setClipboardData({
      data: inviteCode,
      success: () => {
        Taro.showToast({ title: '已复制邀请码', icon: 'success' })
      }
    })
  }

  const handleViewMentees = () => {
    Taro.navigateTo({ url: '/pages/mentor-system/my-mentees' })
  }

  if (loading || !eligibility) {
    return <Loading text="正在检查资格..." />
  }

  if (!eligibility.canBeMentor) {
    return (
      <View className="become-mentor-page">
        <View className="ineligible-card">
          <Text className="ineligible-icon">◆</Text>
          <Text className="ineligible-title">即将解锁引路人资格</Text>
          <Text className="ineligible-text">
            你已完成 {eligibility.currentOrders} 个项目
          </Text>
          <Text className="ineligible-text">
            还需完成 {eligibility.requiredOrders - eligibility.currentOrders} 个项目即可成为引路人
          </Text>
        </View>
      </View>
    )
  }

  if (!inviteCode) {
    return (
      <View className="become-mentor-page">
        <View className="page-header">
          <Text className="page-title">成为引路人</Text>
        </View>

        <View className="eligible-card">
          <Text className="celebration-icon">◇</Text>
          <Text className="eligible-title">你已完成 {eligibility.currentOrders} 个项目</Text>
          <Text className="eligible-subtitle">可以成为引路人了！</Text>
        </View>

        <View className="benefits-card">
          <Text className="benefits-title">成为引路人后，你可以：</Text>
          <View className="benefit-item">
            <Text className="benefit-icon">✓</Text>
            <Text className="benefit-text">邀请朋友加入启程（专属邀请码）</Text>
          </View>
          <View className="benefit-item">
            <Text className="benefit-icon">✓</Text>
            <Text className="benefit-text">获得「引路人」专属徽章</Text>
          </View>
          <View className="benefit-item">
            <Text className="benefit-icon">✓</Text>
            <Text className="benefit-text">你的学员完成首单后，你获得 ¥50 奖励</Text>
          </View>
          <View className="benefit-item">
            <Text className="benefit-icon">✓</Text>
            <Text className="benefit-text">主页显示"曾指引过 X 人"</Text>
          </View>
        </View>

        <Button className="btn-generate" onClick={handleBecomeMentor}>
          <Text className="btn-text">生成我的邀请码</Text>
        </Button>
      </View>
    )
  }

  return (
    <View className="become-mentor-page">
      <View className="page-header">
        <Text className="page-title">我的邀请码</Text>
      </View>

      <View className="invite-code-card">
        <Text className="code-label">专属邀请码</Text>
        <Text className="code-value">{inviteCode}</Text>
        <Button className="btn-copy" onClick={handleCopyCode}>
          <Text className="btn-text">复制邀请码</Text>
        </Button>
      </View>

      <View className="invite-url-card">
        <Text className="url-label">邀请链接</Text>
        <Text className="url-value">{inviteUrl}</Text>
      </View>

      <Button className="btn-view-mentees" onClick={handleViewMentees}>
        <Text className="btn-text">查看我的学员</Text>
      </Button>
    </View>
  )
}
