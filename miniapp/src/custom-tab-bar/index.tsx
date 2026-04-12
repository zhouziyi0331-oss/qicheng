import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import catLogo from '../assets/images/cat-logo.png'
import './index.scss'

export default class CustomTabBar extends Component {
  state = {
    selected: 0,
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

  switchTab(index, url) {
    const { isCenter } = this.state.list[index]

    if (isCenter) {
      // 中央按钮：跳转到AI导师页面（使用navigateTo而不是switchTab）
      Taro.navigateTo({ url })
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
      story: <Text className="tab-icon-text">◐</Text>,
      profile: <Text className="tab-icon-text">◯</Text>
    }

    return iconMap[iconType] || null
  }

  render() {
    const { selected, list } = this.state

    return (
      <View className="custom-tab-bar">
        {list.map((item, index) => {
          const isActive = selected === index
          const { isCenter } = item

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
              className={`tab-item ${isActive ? 'active' : ''}`}
              onClick={() => this.switchTab(index, item.pagePath)}
            >
              <View className="tab-icon-wrapper">
                {this.renderIcon(item.iconType, isActive)}
              </View>
              <Text className="tab-text">{item.text}</Text>
            </View>
          )
        })}
      </View>
    )
  }
}
