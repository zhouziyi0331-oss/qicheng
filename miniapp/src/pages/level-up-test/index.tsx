import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function LevelUpTest() {
  const testLevels = [
    { level: 1, title: 'Lv.0 → Lv.1', desc: '第一次把自己做出去' },
    { level: 2, title: 'Lv.1 → Lv.2', desc: '开始有自己的套路了' },
    { level: 3, title: 'Lv.2 → Lv.3', desc: '开始有自己的判断了' },
    { level: 4, title: 'Lv.3 → Lv.4', desc: '开始有自己的标准了' },
    { level: 5, title: 'Lv.4 → Lv.5', desc: '可以带别人了' }
  ]

  const handleTest = (level: number) => {
    Taro.navigateTo({
      url: `/pages/level-up-validation/index?targetLevel=${level}`
    })
  }

  return (
    <View className="level-up-test">
      <View className="header">
        <Text className="title">升级验证系统测试</Text>
        <Text className="subtitle">点击任意等级查看验证流程</Text>
      </View>

      <View className="level-list">
        {testLevels.map((item) => (
          <View
            key={item.level}
            className="level-item"
            onClick={() => handleTest(item.level)}
          >
            <View className="level-badge">{item.level}</View>
            <View className="level-info">
              <Text className="level-title">{item.title}</Text>
              <Text className="level-desc">{item.desc}</Text>
            </View>
            <Text className="arrow">→</Text>
          </View>
        ))}
      </View>

      <View className="tips">
        <Text className="tips-title">功能说明</Text>
        <Text className="tips-text">• 导师消息区域可滚动</Text>
        <Text className="tips-text">• 问题选项固定在底部</Text>
        <Text className="tips-text">• 选择后显示导师回复和升级按钮</Text>
        <Text className="tips-text">• 升级后跳转到完成页</Text>
      </View>
    </View>
  )
}
