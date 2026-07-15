import { View, Text, Switch, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { authAPI } from '../../../services/api'
import './index.scss'

interface UserInfo {
  id: string
  nickname: string
  avatar?: string
  phone?: string
  gender?: string
  completedTasks: number
  opcScore?: number
}

interface Settings {
  // 通知设置
  pushEnabled: boolean
  urgentNotify: boolean
  soundEnabled: boolean
  taskPushEnabled: boolean
  deadlineNotify: boolean
  reviewNotify: boolean
  paymentNotify: boolean
  enterpriseMsg: boolean
  platformMsg: boolean
  ratingNotify: boolean
  dndEnabled: boolean
  dndStart: string
  dndEnd: string

  // 存储设置
  wifiOnlyDownload: boolean
}

export default function Settings() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [settings, setSettings] = useState<Settings>({
    pushEnabled: true,
    urgentNotify: true,
    soundEnabled: false,
    taskPushEnabled: true,
    deadlineNotify: true,
    reviewNotify: true,
    paymentNotify: true,
    enterpriseMsg: true,
    platformMsg: false,
    ratingNotify: true,
    dndEnabled: true,
    dndStart: '22:00',
    dndEnd: '08:00',
    wifiOnlyDownload: true
  })
  const [cacheSize, setCacheSize] = useState('24.6 MB')

  useEffect(() => {
    loadUserInfo()
    loadSettings()
    calculateCacheSize()
  }, [])

  const loadUserInfo = async () => {
    try {
      const localUserInfo = Taro.getStorageSync('userInfo')
      if (localUserInfo) {
        setUserInfo(localUserInfo)
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const localSettings = Taro.getStorageSync('userSettings')
      if (localSettings) {
        setSettings({ ...settings, ...JSON.parse(localSettings) })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const calculateCacheSize = async () => {
    try {
      const res = await Taro.getStorageInfo()
      const sizeKB = res.currentSize
      const sizeMB = (sizeKB / 1024).toFixed(1)
      setCacheSize(`${sizeMB} MB`)
    } catch (error) {
      console.error('计算缓存失败:', error)
    }
  }

  const saveSettings = async (newSettings: Settings) => {
    try {
      Taro.setStorageSync('userSettings', JSON.stringify(newSettings))
      setSettings(newSettings)
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  const toggleSetting = (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    saveSettings(newSettings)
  }

  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/packageOther/pages/edit-profile/index' })
  }

  const handleNotificationSettings = () => {
    Taro.navigateTo({ url: '/packageOther/pages/notification-settings/index' })
  }

  const handlePrivacySettings = () => {
    Taro.navigateTo({ url: '/packageOther/pages/privacy-settings/index' })
  }

  const handleAbout = () => {
    Taro.navigateTo({ url: '/packageOther/pages/about/index' })
  }

  const handleClearCache = () => {
    Taro.showModal({
      title: '清除缓存',
      content: `当前缓存 ${cacheSize}\n\n清除后不影响账号数据，图片等内容将重新加载`,
      confirmText: '立即清除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorage()
          setCacheSize('0 KB')
          Taro.showToast({ title: '缓存已清除', icon: 'success' })
        }
      }
    })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '退出后本地数据将被清除，进行中的任务不受影响，下次登录后可继续操作。',
      confirmText: '确认退出',
      confirmColor: '#DC4444',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            await authAPI.logout()
            Taro.clearStorage()
            Taro.reLaunch({ url: '/pages/login/index' })
          } catch (error) {
            console.error('退出登录失败:', error)
            Taro.showToast({ title: '退出失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleDeactivate = () => {
    Taro.showModal({
      title: '注销账号',
      content: '此操作不可撤销！\n\n注销后将永久删除：\n· 账号信息与个人资料\n· 能力测试结果与雷达图\n· 所有任务记录与收入数据\n· 企业评价与评分记录',
      confirmText: '申请注销',
      confirmColor: '#DC4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '注销功能开发中', icon: 'none' })
        }
      }
    })
  }

  const handleBindPhone = () => {
    Taro.showToast({ title: '绑定手机功能开发中', icon: 'none' })
  }

  const handleChangePassword = () => {
    Taro.showModal({
      title: '修改密码',
      editable: true,
      placeholderText: '请输入旧密码',
      success: async (res1) => {
        if (res1.confirm && res1.content) {
          const oldPassword = res1.content
          Taro.showModal({
            title: '修改密码',
            editable: true,
            placeholderText: '请输入新密码（至少6位）',
            success: async (res2) => {
              if (res2.confirm && res2.content) {
                const newPassword = res2.content
                if (newPassword.length < 6) {
                  Taro.showToast({ title: '密码长度不能少于6位', icon: 'none' })
                  return
                }
                try {
                  Taro.showLoading({ title: '修改中...' })
                  const result = await authAPI.changePassword({ oldPassword, newPassword })
                  Taro.hideLoading()
                  if (result.success) {
                    Taro.showToast({ title: '密码修改成功', icon: 'success' })
                  } else {
                    Taro.showToast({ title: result.message || '修改失败', icon: 'none' })
                  }
                } catch (error: any) {
                  Taro.hideLoading()
                  Taro.showToast({ title: error.message || '修改失败', icon: 'none' })
                }
              }
            }
          })
        }
      }
    })
  }

  return (
    <View className='settings-page'>
      {/* 账号信息卡片 */}
      <View className='account-card' onClick={handleEditProfile}>
        <View className='account-bg-decoration' />
        <View className='account-avatar'>
          {userInfo?.avatar ? (
            <Image src={userInfo.avatar} className='avatar-img' />
          ) : (
            <View className='avatar-placeholder'>◉</View>
          )}
        </View>
        <View className='account-info'>
          <View className='account-name'>{userInfo?.nickname || '未设置昵称'}</View>
          <View className='account-desc'>
            探索整合者 · 已完成 {userInfo?.completedTasks || 0} 个任务
          </View>
          {userInfo?.opcScore && (
            <View className='account-badge'>
              <Text className='badge-icon'>★</Text>
              <Text className='badge-text'>优质OPC · {userInfo.opcScore}分</Text>
            </View>
          )}
        </View>
        <Text className='account-arrow'>›</Text>
      </View>

      {/* 通知与提醒 */}
      <View className='setting-group'>
        <View className='group-label'>通知与提醒</View>
        <View className='setting-card'>
          <View className='setting-row' onClick={() => toggleSetting('pushEnabled')}>
            <View className='setting-icon' style={{ background: 'rgba(188,100,70,.1)' }}>
              <Text className='icon-text'>●</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>推送通知</View>
              <View className='setting-desc'>任务推送、审核结果、企业消息</View>
            </View>
            <Switch checked={settings.pushEnabled} color='#BC6446' />
          </View>

          <View className='setting-row' onClick={() => toggleSetting('urgentNotify')}>
            <View className='setting-icon' style={{ background: 'rgba(248,113,113,.08)' }}>
              <Text className='icon-text'>▲</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>强提醒（任务截止）</View>
              <View className='setting-desc'>截止前 24h / 2h 重点提醒，不受勿扰影响</View>
            </View>
            <Switch checked={settings.urgentNotify} color='#BC6446' />
          </View>

          <View className='setting-row' onClick={() => toggleSetting('soundEnabled')}>
            <View className='setting-icon' style={{ background: 'rgba(147,174,193,.12)' }}>
              <Text className='icon-text'>♪</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>通知声音</View>
              <View className='setting-desc'>收到消息时播放提示音</View>
            </View>
            <Switch checked={settings.soundEnabled} color='#BC6446' />
          </View>

          <View className='setting-row' onClick={handleNotificationSettings}>
            <View className='setting-icon' style={{ background: 'rgba(242,205,120,.12)' }}>
              <Text className='icon-text'>■</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>通知详细设置</View>
              <View className='setting-desc'>分类管理各类通知开关</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>
        </View>
      </View>

      {/* 账号与安全 */}
      <View className='setting-group'>
        <View className='group-label'>账号与安全</View>
        <View className='setting-card'>
          <View className='setting-row' onClick={handleBindPhone}>
            <View className='setting-icon' style={{ background: 'rgba(190,215,209,.15)' }}>
              <Text className='icon-text'>○</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>绑定手机号</View>
              <View className='setting-desc'>
                {userInfo?.phone ? `已绑定 ${userInfo.phone}` : '未绑定'}
              </View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>

          <View className='setting-row' onClick={handleChangePassword}>
            <View className='setting-icon' style={{ background: 'rgba(188,100,70,.1)' }}>
              <Text className='icon-text'>●</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>登录密码</View>
              <View className='setting-desc'>修改账号登录密码</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>

          <View className='setting-row' onClick={handleEditProfile}>
            <View className='setting-icon' style={{ background: 'rgba(242,205,120,.12)' }}>
              <Text className='icon-text'>◆</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>第三方账号绑定</View>
              <View className='setting-desc'>微信已绑定</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>
        </View>
      </View>

      {/* 隐私 */}
      <View className='setting-group'>
        <View className='group-label'>隐私</View>
        <View className='setting-card'>
          <View className='setting-row' onClick={handlePrivacySettings}>
            <View className='setting-icon' style={{ background: 'rgba(188,100,70,.1)' }}>
              <Text className='icon-text'>○</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>隐私设置</View>
              <View className='setting-desc'>能力雷达可见范围、协议授权</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>
        </View>
      </View>

      {/* 存储与性能 */}
      <View className='setting-group'>
        <View className='group-label'>存储与性能</View>
        <View className='setting-card'>
          <View className='setting-row' onClick={handleClearCache}>
            <View className='setting-icon' style={{ background: 'rgba(147,174,193,.12)' }}>
              <Text className='icon-text'>○</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>清除缓存</View>
              <View className='setting-desc'>当前缓存 {cacheSize}</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>

          <View className='setting-row' onClick={() => toggleSetting('wifiOnlyDownload')}>
            <View className='setting-icon' style={{ background: 'rgba(242,205,120,.12)' }}>
              <Text className='icon-text'>▲</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>仅 Wi-Fi 下载附件</View>
              <View className='setting-desc'>移动网络下不自动下载任务附件</View>
            </View>
            <Switch checked={settings.wifiOnlyDownload} color='#BC6446' />
          </View>
        </View>
      </View>

      {/* 帮助与支持 */}
      <View className='setting-group'>
        <View className='group-label'>帮助与支持</View>
        <View className='setting-card'>
          <View className='setting-row' onClick={handleAbout}>
            <View className='setting-icon' style={{ background: 'rgba(188,100,70,.1)' }}>
              <Text className='icon-text'>?</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>帮助中心</View>
              <View className='setting-desc'>常见问题、使用指南</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>

          <View className='setting-row'>
            <View className='setting-icon' style={{ background: 'rgba(190,215,209,.15)' }}>
              <Text className='icon-text'>○</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>联系客服</View>
              <View className='setting-desc'>工作日 9:00–18:00 在线</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>

          <View className='setting-row' onClick={handleAbout}>
            <View className='setting-icon' style={{ background: 'rgba(188,100,70,.08)' }}>
              <Text className='icon-text'>i</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title'>关于启程 OPC</View>
              <View className='setting-desc'>版本号、协议、更新日志</View>
            </View>
            <View className='update-badge'>有更新</View>
            <Text className='setting-arrow'>›</Text>
          </View>
        </View>
      </View>

      {/* 危险操作 */}
      <View className='setting-group'>
        <View className='group-label'>账号操作</View>
        <View className='setting-card'>
          <View className='setting-row' onClick={handleLogout}>
            <View className='setting-icon' style={{ background: 'rgba(248,113,113,.08)' }}>
              <Text className='icon-text'>→</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title danger-text'>退出登录</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>

          <View className='setting-row' onClick={handleDeactivate}>
            <View className='setting-icon' style={{ background: 'rgba(248,113,113,.06)' }}>
              <Text className='icon-text'>×</Text>
            </View>
            <View className='setting-body'>
              <View className='setting-title danger-text'>注销账号</View>
              <View className='setting-desc'>注销后数据将永久删除</View>
            </View>
            <Text className='setting-arrow'>›</Text>
          </View>
        </View>
      </View>

      <View style={{ height: '40rpx' }} />
    </View>
  )
}
