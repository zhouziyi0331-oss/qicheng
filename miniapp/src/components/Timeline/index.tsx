import { View, Text } from '@tarojs/components'
import './index.scss'

interface TimelineNode {
  status: string
  label: string
  time?: string
  description?: string
  icon: string
  completed: boolean
  current: boolean
}

interface TimelineProps {
  nodes: TimelineNode[]
}

export default function Timeline({ nodes }: TimelineProps) {
  return (
    <View className="timeline-container">
      {nodes.map((node, index) => (
        <View key={index} className={`timeline-node ${node.completed ? 'completed' : ''} ${node.current ? 'current' : ''}`}>
          {/* 节点图标 */}
          <View className="node-icon-wrapper">
            <View className="node-icon">
              {node.completed ? (
                <Text className="icon-check">✓</Text>
              ) : node.current ? (
                <Text className="icon-current">{node.icon}</Text>
              ) : (
                <Text className="icon-pending">{node.icon}</Text>
              )}
            </View>
            {/* 连接线 */}
            {index < nodes.length - 1 && (
              <View className={`node-line ${node.completed ? 'completed' : ''}`} />
            )}
          </View>

          {/* 节点内容 */}
          <View className="node-content">
            <Text className="node-label">{node.label}</Text>
            {node.time && (
              <Text className="node-time">{node.time}</Text>
            )}
            {node.description && (
              <Text className="node-description">{node.description}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}
