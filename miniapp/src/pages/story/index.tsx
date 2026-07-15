import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import StoryTimeline from './components/StoryTimeline'
import StoryList from './components/StoryList'
import './index.scss'

export default function Story() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'stories'>('timeline')

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    const pageInstance = Taro.getCurrentInstance().page
    if (pageInstance && typeof pageInstance.getTabBar === 'function') {
      const tabBar = pageInstance.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 3 })
      }
    }
  }, [])

  return (
    <View className="story-page">
      {/* 顶部 Tab 切换 */}
      <View className="story-tabs">
        <View
          className={`tab-item ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Text className="tab-text">我的成长线</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          <Text className="tab-text">平台故事</Text>
        </View>
        <View className={`tab-indicator ${activeTab === 'stories' ? 'right' : ''}`} />
      </View>

      {/* 内容区 */}
      {activeTab === 'timeline' ? <StoryTimeline /> : <StoryList />}
    </View>
  )
}
