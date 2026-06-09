import { View, Text } from '@tarojs/components'
import './index.scss'

interface EmptyProps {
  icon?: string;
  text?: string;
  hint?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function Empty(props: EmptyProps) {
  const {
    icon = '📭',
    text = '暂无内容',
    hint,
    buttonText,
    onButtonClick
  } = props

  return (
    <View className="empty-container">
      <Text className="empty-icon">{icon}</Text>
      <Text className="empty-text">{text}</Text>
      {hint && <Text className="empty-hint">{hint}</Text>}
      {buttonText && onButtonClick && (
        <View className="empty-button" onClick={onButtonClick}>
          <Text className="empty-button-text">{buttonText}</Text>
        </View>
      )}
    </View>
  )
}
