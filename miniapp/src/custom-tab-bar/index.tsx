import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
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
        // 中央大按钮
        pagePath: '/pages/story/post',
        text: '',
        iconType: 'add',
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
      // 中央按钮：跳转到发布页面（非 tab 页面）
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
    const iconMap = {
      home: (
        <svg viewBox="0 0 24 24" className="tab-icon">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      tasks: (
        <svg viewBox="0 0 24 24" className="tab-icon">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      story: (
        <svg viewBox="0 0 24 24" className="tab-icon">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      profile: (
        <svg viewBox="0 0 24 24" className="tab-icon">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      add: (
        <svg viewBox="0 0 24 24" className="tab-icon-add">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
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
            // 中央荧光绿胶囊形大按钮
            return (
              <View
                key={index}
                className="tab-item tab-center"
                onClick={() => this.switchTab(index, item.pagePath)}
              >
                <View className="center-btn">
                  <Text className="tab-icon-add">+</Text>
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
