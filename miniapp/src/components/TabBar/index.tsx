import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import CatMascot from '../CatMascot'
import './index.scss'

interface TabItem {
  key: string
  label: string
  icon: string
  path: string
}

const TAB_ITEMS: TabItem[] = [
  { key: 'home', label: '首页', icon: '●', path: '/pages/index/index' },
  { key: 'tasks', label: '任务', icon: '▪', path: '/pages/tasks/index' },
  { key: 'mentor', label: '导师', icon: 'cat', path: '/pages/mentor/index' },
  { key: 'story', label: '故事墙', icon: '●', path: '/pages/story/index' },
  { key: 'profile', label: '我的', icon: '●', path: '/pages/profile/index' }
]

interface TabBarProps {
  current?: string
}

export default function TabBar({ current }: TabBarProps) {
  const [activeTab, setActiveTab] = useState(current || 'home')

  useEffect(() => {
    if (current) {
      setActiveTab(current)
    }
  }, [current])

  const handleTabClick = (item: TabItem) => {
    if (activeTab === item.key) return

    setActiveTab(item.key)
    Taro.switchTab({ url: item.path })
  }

  return (
    <View className="custom-tabbar">
      {TAB_ITEMS.map((item) => (
        <View
          key={item.key}
          className={`tab-item ${activeTab === item.key ? 'tab-item--active' : ''} ${
            item.key === 'mentor' ? 'tab-item--center' : ''
          }`}
          onClick={() => handleTabClick(item)}
        >
          <View className="tab-icon">
            {item.key === 'mentor' ? (
              <CatMascot size="sm" showBook={true} />
            ) : (
              <Text className="tab-icon-text">{item.icon}</Text>
            )}
          </View>
          <Text className="tab-label">{item.label}</Text>
        </View>
      ))}
    </View>
  )
}
