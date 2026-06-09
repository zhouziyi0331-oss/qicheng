import { View, Text } from '@tarojs/components'
import './index.scss'

interface LoadingStateProps {
  type?: 'loading' | 'empty' | 'error'
  text?: string
  icon?: string
  onRetry?: () => void
  retryText?: string
}

export default function LoadingState({
  type = 'loading',
  text,
  icon,
  onRetry,
  retryText = '重试'
}: LoadingStateProps) {
  const getDefaultContent = () => {
    switch (type) {
      case 'loading':
        return {
          icon: '⏳',
          text: text || '加载中...'
        }
      case 'empty':
        return {
          icon: icon || '📭',
          text: text || '暂无数据'
        }
      case 'error':
        return {
          icon: icon || '⚠️',
          text: text || '加载失败'
        }
      default:
        return {
          icon: '⏳',
          text: '加载中...'
        }
    }
  }

  const content = getDefaultContent()

  return (
    <View className={`loading-state loading-state-${type}`}>
      <View className="loading-content">
        {type === 'loading' ? (
          <View className="loading-spinner">
            <View className="spinner-ring" />
            <View className="spinner-ring" />
            <View className="spinner-ring" />
          </View>
        ) : (
          <Text className="loading-icon">{content.icon}</Text>
        )}
        <Text className="loading-text">{content.text}</Text>
        {type === 'error' && onRetry && (
          <View className="retry-button" onClick={onRetry}>
            <Text className="retry-text">{retryText}</Text>
          </View>
        )}
      </View>
    </View>
  )
}
