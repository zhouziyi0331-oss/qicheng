import { View, Text } from '@tarojs/components'
import './index.scss'

interface IconProps {
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
  children?: React.ReactNode
}

// 使用纯文字或符号替代emoji
const ICON_MAP = {
  // 统计相关
  view: { text: '浏览', symbol: '○' },
  like: { text: '赞', symbol: '♥' },
  comment: { text: '评论', symbol: '●' },
  time: { text: '用时', symbol: '⌚' },
  thumbup: { text: '有用', symbol: '↑' },

  // 状态相关
  'level-up': { text: '升级', symbol: '↑' },
  'skill-breakthrough': { text: '突破', symbol: '◆' },
  achievement: { text: '成就', symbol: '★' },
  completed: { text: '完成', symbol: '✓' },
  notification: { text: '通知', symbol: '●' },

  // 其他
  star: { text: '★', symbol: '★' },
  arrow: { text: '→', symbol: '→' },
  dot: { text: '•', symbol: '•' }
}

export default function Icon({
  name,
  size = 'md',
  color,
  className = '',
  children
}: IconProps) {
  const sizeMap = {
    xs: '20px',
    sm: '24px',
    md: '28px',
    lg: '32px',
    xl: '40px'
  }

  const iconStyle: any = {
    fontSize: sizeMap[size]
  }

  if (color) {
    iconStyle.color = color
  }

  if (name && ICON_MAP[name]) {
    return (
      <Text className={`icon-text ${className}`} style={iconStyle}>
        {ICON_MAP[name].text}
      </Text>
    )
  }

  return (
    <View className={`custom-icon ${className}`} style={iconStyle}>
      <View className="custom-icon-content">{children}</View>
    </View>
  )
}
