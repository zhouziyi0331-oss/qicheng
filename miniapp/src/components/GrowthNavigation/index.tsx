import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface GrowthNavItem {
  key: string
  label: string
  icon: string
  path: string
}

interface GrowthNavigationProps {
  current: string
}

const NAV_ITEMS: GrowthNavItem[] = [
  { key: 'talent', label: '天赋画像', icon: '●', path: '/pages/talent-profile/index' },
  { key: 'ability', label: '能力雷达', icon: '●', path: '/pages/ability/index' },
  { key: 'trend', label: '能力趋势', icon: '●', path: '/pages/ability-trend/index' },
  { key: 'comparison', label: '成长对比', icon: '⚖️', path: '/pages/growth-comparison/index' },
  { key: 'timeline', label: '成长时间线', icon: '●️', path: '/pages/growth-timeline/index' },
  { key: 'milestones', label: '里程碑', icon: '◆', path: '/pages/milestones/index' },
]

export default function GrowthNavigation({ current }: GrowthNavigationProps) {
  const handleNavigate = (item: GrowthNavItem) => {
    if (item.key === current) return

    Taro.redirectTo({
      url: item.path
    })
  }

  return (
    <View className="growth-navigation">
      <View className="nav-header">
        <Text className="nav-title">成长追踪</Text>
      </View>
      <View className="nav-list">
        {NAV_ITEMS.map(item => (
          <View
            key={item.key}
            className={`nav-item ${item.key === current ? 'active' : ''}`}
            onClick={() => handleNavigate(item)}
          >
            <Text className="nav-icon">{item.icon}</Text>
            <Text className="nav-label">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
