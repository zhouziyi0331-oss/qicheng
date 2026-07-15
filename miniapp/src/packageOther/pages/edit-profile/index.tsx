import { View, Text, Image, Input, Button, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { authAPI } from '../../../services/api'
import './index.scss'

interface UserInfo {
  id?: string
  nickname?: string
  avatar?: string
  phone?: string
  gender?: string
  completedTasks?: number
  opcScore?: number
}

export default function EditProfile() {
  const [user, setUser] = useState<UserInfo>({})
  const [nickname, setNickname] = useState('')
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [tempNickname, setTempNickname] = useState('')

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '账号与安全' })
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const localUser = Taro.getStorageSync('userInfo') || Taro.getStorageSync('user')
      if (localUser) {
        setUser(localUser)
        setNickname(localUser.nickname || '启程用户')
      }

      const token = Taro.getStorageSync('access_token')
      if (token) {
        try {
          const res = await authAPI.getCurrentUser()
          if (res.success && res.data) {
            setUser(res.data)
            setNickname(res.data.nickname || '启程用户')
            Taro.setStorageSync('userInfo', res.data)
          }
        } catch (error) {
          console.error('加载用户信息失败:', error)
        }
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  const handleChooseAvatar = () => {
    Taro.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']

        Taro.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: sourceType,
          success: async (imgRes) => {
            const tempFilePath = imgRes.tempFilePaths[0]
            Taro.showLoading({ title: '上传中...' })

            try {
              const newUser = { ...user, avatar: tempFilePath }
              setUser(newUser)
              Taro.setStorageSync('userInfo', newUser)
              Taro.showToast({ title: '头像已更新', icon: 'success' })
            } catch (error) {
              console.error('上传头像失败:', error)
              Taro.showToast({ title: '上传失败', icon: 'none' })
            } finally {
              Taro.hideLoading()
            }
          }
        })
      }
    })
  }

  const startEditNickname = () => {
    setTempNickname(nickname)
    setIsEditingNickname(true)
  }

  const saveNickname = async () => {
    if (!tempNickname.trim()) {
      Taro.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }

    try {
      const updatedUser = { ...user, nickname: tempNickname.trim() }
      setUser(updatedUser)
      setNickname(tempNickname.trim())
      Taro.setStorageSync('userInfo', updatedUser)
      setIsEditingNickname(false)

      Taro.showToast({ title: '昵称已更新', icon: 'success' })
    } catch (error) {
      console.error('保存昵称失败:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const cancelEditNickname = () => {
    setIsEditingNickname(false)
    setTempNickname('')
  }

  const handleBindPhone = () => {
    Taro.showModal({
      title: '绑定手机号',
      content: '输入新手机号和验证码',
      showCancel: true,
      confirmText: '确认更换',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '手机号已更换', icon: 'success' })
        }
      }
    })
  }

  const handleChangePassword = () => {
    Taro.showToast({ title: '修改密码功能开发中', icon: 'none' })
  }

  const handleGenderSelect = () => {
    Taro.showActionSheet({
      itemList: ['男', '女', '保密'],
      success: (res) => {
        const genders = ['男', '女', '保密']
        const selectedGender = genders[res.tapIndex]
        const updatedUser = { ...user, gender: selectedGender }
        setUser(updatedUser)
        Taro.setStorageSync('userInfo', updatedUser)
      }
    })
  }

  const handleDeviceManagement = () => {
    Taro.showToast({ title: '设备管理功能开发中', icon: 'none' })
  }

  return (
    <View className="account-page">
      <View className="account-content">
        {/* 个人信息 */}
        <View className="setting-group">
          <View className="group-label">个人信息</View>
          <View className="setting-card">
            {/* 头像行 */}
            <View className="setting-row" onClick={handleChooseAvatar}>
              <View className="setting-icon" style="background: rgba(188,100,70,0.1)">
                <Text className="icon-text">◉</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">头像</View>
              </View>
              <View className="setting-right">
                <View className="avatar-preview-wrapper">
                  {user.avatar ? (
                    <Image src={user.avatar} className="avatar-preview" mode="aspectFill" />
                  ) : (
                    <View className="avatar-preview avatar-placeholder">
                      <Text className="placeholder-icon">◉</Text>
                    </View>
                  )}
                  <View className="camera-badge">
                    <Text className="camera-icon">○</Text>
                  </View>
                </View>
                <Text className="setting-arrow">›</Text>
              </View>
            </View>

            {/* 昵称行 */}
            <View className="setting-row nickname-row">
              <View className="setting-icon" style="background: rgba(190,215,209,0.15)">
                <Text className="icon-text">◆</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">昵称</View>
              </View>
              {!isEditingNickname ? (
                <View className="setting-right nickname-display">
                  <Text className="setting-value">{nickname}</Text>
                  <View className="edit-btn" onClick={startEditNickname}>
                    <Text className="edit-icon">◆</Text>
                  </View>
                </View>
              ) : (
                <View className="setting-right nickname-edit">
                  <Input
                    className="nickname-input"
                    value={tempNickname}
                    onInput={(e) => setTempNickname(e.detail.value)}
                    placeholder="输入新昵称"
                    maxlength={12}
                    focus
                  />
                  <Button className="save-btn-small" onClick={saveNickname}>保存</Button>
                  <Button className="cancel-btn-small" onClick={cancelEditNickname}>取消</Button>
                </View>
              )}
            </View>

            {/* 性别行 */}
            <View className="setting-row" onClick={handleGenderSelect}>
              <View className="setting-icon" style="background: rgba(242,205,120,0.12)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">性别</View>
              </View>
              <View className="setting-right">
                <Text className="setting-value">{user.gender || '女'}</Text>
                <Text className="setting-arrow">›</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 登录方式 */}
        <View className="setting-group">
          <View className="group-label">登录方式</View>
          <View className="setting-card">
            <View className="setting-row" onClick={handleBindPhone}>
              <View className="setting-icon" style="background: rgba(190,215,209,0.15)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">手机号</View>
                <View className="setting-desc">138****8888</View>
              </View>
              <View className="setting-right">
                <View className="setting-badge bound">已绑定</View>
                <Text className="setting-arrow">›</Text>
              </View>
            </View>

            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(58,138,132,0.1)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">微信</View>
              </View>
              <View className="setting-right">
                <View className="setting-badge bound">已绑定</View>
                <Text className="setting-arrow">›</Text>
              </View>
            </View>

            <View className="setting-row">
              <View className="setting-icon" style="background: rgba(147,174,193,0.12)">
                <Text className="icon-text">○</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">Apple ID</View>
              </View>
              <View className="setting-right">
                <View className="setting-badge unbound">未绑定</View>
                <Text className="setting-arrow">›</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 安全 */}
        <View className="setting-group">
          <View className="group-label">安全</View>
          <View className="setting-card">
            <View className="setting-row" onClick={handleChangePassword}>
              <View className="setting-icon" style="background: rgba(188,100,70,0.1)">
                <Text className="icon-text">●</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">修改密码</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>

            <View className="setting-row" onClick={handleDeviceManagement}>
              <View className="setting-icon" style="background: rgba(242,205,120,0.12)">
                <Text className="icon-text">◆</Text>
              </View>
              <View className="setting-body">
                <View className="setting-title">登录设备管理</View>
                <View className="setting-desc">当前 2 台设备在线</View>
              </View>
              <View className="setting-right">
                <Text className="setting-arrow">›</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
