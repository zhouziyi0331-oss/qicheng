import { View, Text, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

interface NotificationSettings {
  allNotify: boolean
  taskPush: boolean
  deadlineNotify: boolean
  reviewNotify: boolean
  paymentNotify: boolean
  enterpriseMsg: boolean
  platformMsg: boolean
  ratingNotify: boolean
  dndEnabled: boolean
  dndStart: string
  dndEnd: string
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    allNotify: true,
    taskPush: true,
    deadlineNotify: true,
    reviewNotify: true,
    paymentNotify: true,
    enterpriseMsg: true,
    platformMsg: false,
    ratingNotify: true,
    dndEnabled: true,
    dndStart: '22:00',
    dndEnd: '08:00'
  })

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '通知设置' })
    loadSettings()
  }, [])

  const loadSettings = () => {
    const saved = Taro.getStorageSync('notificationSettings')
    if (saved) {
      setSettings(saved)
    }
  }

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings)
    Taro.setStorageSync('notificationSettings', newSettings)
  }

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    saveSettings(newSettings)
  }

  const handleDndTime = () => {
    Taro.showModal({
      title: '免扰时段',
      content: `当前设置：${settings.dndStart} — ${settings.dndEnd}`,
      showCancel: true,
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '自定义时段开发中', icon: 'none' })
        }
      }
    })
  }

  return (
    <View className="notify-page">
      <View className="notify-content">
        {/* 总开关 */}
        <View className="master-toggle">
          <View className="master-icon">
            <Text className="icon-text">●</Text>
          </View>
          <View className="master-body">
            <View className="master-title">接收所有通知</View>
            <View className="master-desc">关闭后将不再收到任何推送</View>
          </View>
          <Switch
            className="master-switch"
            checked={settings.allNotify}
            onChange={() => toggleSetting('allNotify')}
            color="#BC6446"
          />
        </View>

        {/* 任务通知 */}
        <View className="setting-group">
          <View className="group-label">任务通知</View>
          <View className="setting-card">
            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(188,100,70,0.1)">
                <Text className="icon-text">■</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">新任务推送</View>
                <View className="setting-desc">平台为你推送匹配任务时通知</View>
              </View>
              <Switch
                checked={settings.taskPush}
                onChange={() => toggleSetting('taskPush')}
                color="#BC6446"
              />
            </View>

            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(248,113,113,0.08)">
                <Text className="icon-text">●</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">截止日期提醒</View>
                <View className="setting-desc">截止前 24h、2h 强提醒</View>
              </View>
              <Switch
                checked={settings.deadlineNotify}
                onChange={() => toggleSetting('deadlineNotify')}
                color="#BC6446"
              />
            </View>

            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(190,215,209,0.15)">
                <Text className="icon-text">✓</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">审核结果通知</View>
                <View className="setting-desc">交付审核通过 / 需修改</View>
              </View>
              <Switch
                checked={settings.reviewNotify}
                onChange={() => toggleSetting('reviewNotify')}
                color="#BC6446"
              />
            </View>

            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(242,205,120,0.12)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">收款到账通知</View>
                <View className="setting-desc">报酬到账时推送</View>
              </View>
              <Switch
                checked={settings.paymentNotify}
                onChange={() => toggleSetting('paymentNotify')}
                color="#BC6446"
              />
            </View>
          </View>
        </View>

        {/* 互动通知 */}
        <View className="setting-group">
          <View className="group-label">互动通知</View>
          <View className="setting-card">
            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(147,174,193,0.12)">
                <Text className="icon-text">●</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">企业消息</View>
                <View className="setting-desc">企业发送需求补充、确认消息</View>
              </View>
              <Switch
                checked={settings.enterpriseMsg}
                onChange={() => toggleSetting('enterpriseMsg')}
                color="#BC6446"
              />
            </View>

            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(188,100,70,0.08)">
                <Text className="icon-text">◆</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">平台公告</View>
                <View className="setting-desc">版本更新、活动、政策变更</View>
              </View>
              <Switch
                checked={settings.platformMsg}
                onChange={() => toggleSetting('platformMsg')}
                color="#BC6446"
              />
            </View>

            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(242,205,120,0.12)">
                <Text className="icon-text">★</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">评分与评价</View>
                <View className="setting-desc">企业对你的任务评分</View>
              </View>
              <Switch
                checked={settings.ratingNotify}
                onChange={() => toggleSetting('ratingNotify')}
                color="#BC6446"
              />
            </View>
          </View>
        </View>

        {/* 免扰时段 */}
        <View className="setting-group">
          <View className="group-label">免扰时段</View>
          <View className="setting-card">
            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(147,174,193,0.12)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">开启免扰模式</View>
                <View className="setting-desc">22:00 — 08:00 不推送（强提醒除外）</View>
              </View>
              <Switch
                checked={settings.dndEnabled}
                onChange={() => toggleSetting('dndEnabled')}
                color="#BC6446"
              />
            </View>

            <View className="setting-row" onClick={handleDndTime}>
              <View className="setting-icon" style="background: rgba(188,100,70,0.08)">
                <Text className="icon-text">●</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">免扰时段</View>
                <View className="setting-desc">自定义开始 / 结束时间</View>
              </View>
              <View className="setting-right">
                <Text className="setting-value">{settings.dndStart} — {settings.dndEnd}</Text>
                <Text className="setting-arrow">›</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
