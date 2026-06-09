import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface Tool {
  name: string
  icon: string
  description: string
  url?: string
  category: 'design' | 'dev' | 'ai' | 'productivity'
}

interface ToolCardProps {
  tool: Tool
  onSelect?: (tool: Tool) => void
}

export default function ToolCard({ tool, onSelect }: ToolCardProps) {
  const categoryColors = {
    design: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    dev: { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
    ai: { bg: '#E9D5FF', text: '#9333EA', border: '#D8B4FE' },
    productivity: { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' }
  }

  const categoryLabels = {
    design: '设计工具',
    dev: '开发工具',
    ai: 'AI工具',
    productivity: '效率工具'
  }

  const colors = categoryColors[tool.category]

  const handleClick = () => {
    if (tool.url) {
      Taro.showModal({
        title: '打开工具',
        content: `是否要打开 ${tool.name}？`,
        success: (res) => {
          if (res.confirm) {
            // 复制链接到剪贴板
            Taro.setClipboardData({
              data: tool.url!,
              success: () => {
                Taro.showToast({
                  title: '链接已复制',
                  icon: 'success'
                })
              }
            })
          }
        }
      })
    }
    onSelect?.(tool)
  }

  return (
    <View className="tool-card" onClick={handleClick}>
      <View className="tool-header">
        <View className="tool-icon-wrapper" style={{ backgroundColor: colors.bg }}>
          <Text className="tool-icon">{tool.icon}</Text>
        </View>
        <View className="tool-info">
          <Text className="tool-name">{tool.name}</Text>
          <View className="tool-category" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
            <Text className="category-text" style={{ color: colors.text }}>
              {categoryLabels[tool.category]}
            </Text>
          </View>
        </View>
      </View>
      <Text className="tool-description">{tool.description}</Text>
      {tool.url && (
        <View className="tool-action">
          <Text className="action-text">点击复制链接</Text>
          <Text className="action-icon">📋</Text>
        </View>
      )}
    </View>
  )
}
