import { View, Text } from '@tarojs/components'
import './index.scss'

export default function TestSimple() {
  return (
    <View className="test-page">
      <Text className="test-text">测试页面 - 如果你能看到这段文字，说明小程序基础功能正常</Text>
    </View>
  )
}
