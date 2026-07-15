import { View, Text } from '@tarojs/components'
import './index.scss'

interface CardProps {
  type?: 'data' | 'task' | 'gradient'
  gradient?: 'pink' | 'green' | 'blue' | 'yellow' | 'purple'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export default function Card({
  type = 'data',
  gradient = 'pink',
  className = '',
  children,
  onClick
}: CardProps) {
  const cardClass = `custom-card custom-card--${type} ${
    type === 'gradient' ? `custom-card--gradient-${gradient}` : ''
  } ${className} ${onClick ? 'custom-card--clickable' : ''}`

  return (
    <View className={cardClass} onClick={onClick}>
      {children}
    </View>
  )
}

// 数据卡片子组件
interface DataCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  className?: string
  onClick?: () => void
}

export function DataCard({ icon, value, label, className = '', onClick }: DataCardProps) {
  return (
    <Card type="data" className={className} onClick={onClick}>
      <View className="data-card-content">
        <View className="data-card-icon">{icon}</View>
        <Text className="data-card-value">{value}</Text>
        <Text className="data-card-label">{label}</Text>
      </View>
    </Card>
  )
}

// 任务卡片子组件
interface TaskCardProps {
  title: string
  tags?: string[]
  price?: string
  participants?: number
  className?: string
  onClick?: () => void
  children?: React.ReactNode
}

export function TaskCard({
  title,
  tags = [],
  price,
  participants,
  className = '',
  onClick,
  children
}: TaskCardProps) {
  return (
    <Card type="task" className={className} onClick={onClick}>
      <View className="task-card-content">
        {tags.length > 0 && (
          <View className="task-card-header">
            {tags.map((tag, index) => (
              <View key={index} className="task-card-tag">
                <Text>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <Text className="task-card-title">{title}</Text>
        {children}
        <View className="task-card-footer">
          {price && <Text className="task-card-price">{price}</Text>}
          {participants !== undefined && (
            <Text className="task-card-participants">{participants}人申请</Text>
          )}
        </View>
      </View>
    </Card>
  )
}
