import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import catLogo from '../assets/images/cat-logo.png'
import './index.scss'

export default class CustomTabBar extends Component {
  state = {
    selected: 0,
    userLevel: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconType: 'home'
      },
      {
        pagePath: '/pages/tasks/index',
        text: '任务',
        iconType: 'tasks'
      },
      {
        // 中央启程小猫按钮
        pagePath: '/pages/mentor/index',
        text: '启程小猫',
        iconType: 'mentor',
        isCenter: true
      },
      {
        pagePath: '/pages/community/index',
        text: '社区',
        iconType: 'community',
        requiredLevel: 4
      },
      {
        pagePath: '/pages/story/index',
        text: '故事墙',
        iconType: 'story'
      },
      {
        pagePath: '/pages/profile/index',
        text: '我的',
        iconType: 'profile'
      }
    ]
  }

  componentDidMount() {
    this.loadUserLevel()
  }

  loadUserLevel = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) return

      const res = await Taro.request({
        url: '/api/v1/user/profile',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        this.setState({
          userLevel: res.data.data.current_level || 0
        })
      }
    } catch (error) {
      console.error('加载用户等级失败:', error)
    }
  }

  switchTab(index, url) {
    const { list, userLevel } = this.state
    const item = list[index]
    const { isCenter, requiredLevel } = item

    // 检查等级权限
    if (requiredLevel && userLevel < requiredLevel) {
      Taro.showToast({
        title: `达到Lv.${requiredLevel}后解锁`,
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (isCenter) {
      // 中央按钮：跳转到AI导师页面（使用navigateTo而不是switchTab）
      console.log('跳转到AI导师页面:', url)
      Taro.navigateTo({
        url: url,
        fail: (err) => {
          console.error('跳转失败:', err)
          Taro.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        }
      })
    } else {
      // 普通 tab：切换页面
      this.setSelected(index)
      Taro.switchTab({ url })
    }
  }

  setSelected(index) {
    this.setState({ selected: index })
  }

  renderIcon(iconType: string, isActive: boolean) {
    // 使用简洁的线条风格Unicode字符图标
    const iconMap = {
      home: <Text className="tab-icon-text">⌂</Text>,
      tasks: <Text className="tab-icon-text">☐</Text>,
      community: <Text className="tab-icon-text">💬</Text>,
      story: <Text className="tab-icon-text">◐</Text>,
      profile: <Text className="tab-icon-text">◯</Text>
    }

    return iconMap[iconType] || null
  }

  render() {
    const { selected, list, userLevel } = this.state

    return (
      <View className="custom-tab-bar">
        {list.map((item, index) => {
          const isActive = selected === index
          const { isCenter, requiredLevel } = item
          const isLocked = requiredLevel && userLevel < requiredLevel

          if (isCenter) {
            // 中央启程小猫按钮（只显示logo，不显示文字）
            return (
              <View
                key={index}
                className="tab-item tab-center"
                onClick={() => this.switchTab(index, item.pagePath)}
              >
                <View className="center-mentor-btn">
                  <Image src={catLogo} className="mentor-logo" mode="aspectFit" />
                </View>
              </View>
            )
          }

          // 普通导航项
          return (
            <View
              key={index}
              className={`tab-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => this.switchTab(index, item.pagePath)}
            >
              <View className="tab-icon-wrapper">
                {isLocked ? <Text className="tab-icon-text">🔒</Text> : this.renderIcon(item.iconType, isActive)}
              </View>
              <Text className="tab-text">
                {item.text}
                {isLocked && <Text className="lock-hint"> Lv.{requiredLevel}</Text>}
              </Text>
            </View>
          )
        })}
      </View>
    )
  }
}
