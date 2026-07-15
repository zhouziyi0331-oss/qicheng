import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function OPCTest() {
  const handleStartTest = () => {
    // 跳转到新的测评流程
    Taro.navigateTo({
      url: '/packageOnboarding/pages/opc-test/quiz'
    })
  }

  return (
    <View className="opc-test-entry-page">
      {/* 顶部装饰背景 */}
      <View className="entry-header">
        <View className="header-bg" />
        <View className="header-content">
          <View className="entry-badge">能力雷达</View>
          <Text className="entry-title">发现你真正的{'\n'}能力样貌</Text>
          <Text className="entry-subtitle">通过 OPC 测试，看见你独特的六维优势模式</Text>
        </View>
      </View>

      {/* 测试说明 */}
      <View className="entry-content">
        <View className="info-card">
          <View className="info-stats">
            <View className="stat-item">
              <Text className="stat-value">36</Text>
              <Text className="stat-label">选择题</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">2</Text>
              <Text className="stat-label">开放题</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">6</Text>
              <Text className="stat-label">能力维度</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">~15</Text>
              <Text className="stat-label">分钟</Text>
            </View>
          </View>
        </View>

        {/* 六个维度说明 */}
        <View className="dimensions-card">
          <View className="card-header">
            <Text className="card-title">六个能力维度</Text>
          </View>
          <View className="dimensions-list">
            <View className="dimension-item">
              <View className="dimension-dot" style={{ background: '#BC6446' }} />
              <View className="dimension-info">
                <Text className="dimension-name">信息处理</Text>
                <Text className="dimension-desc">你如何接收、整理和理解信息</Text>
              </View>
            </View>
            <View className="dimension-item">
              <View className="dimension-dot" style={{ background: '#D88760' }} />
              <View className="dimension-info">
                <Text className="dimension-name">创作驱动</Text>
                <Text className="dimension-desc">你的创造来源与表达方式</Text>
              </View>
            </View>
            <View className="dimension-item">
              <View className="dimension-dot" style={{ background: '#3A8A84' }} />
              <View className="dimension-info">
                <Text className="dimension-name">工具学习</Text>
                <Text className="dimension-desc">你掌握和运用工具的方式</Text>
              </View>
            </View>
            <View className="dimension-item">
              <View className="dimension-dot" style={{ background: '#5B8FAB' }} />
              <View className="dimension-info">
                <Text className="dimension-name">任务执行</Text>
                <Text className="dimension-desc">你推进和完成任务的风格</Text>
              </View>
            </View>
            <View className="dimension-item">
              <View className="dimension-dot" style={{ background: '#BF9E71' }} />
              <View className="dimension-info">
                <Text className="dimension-name">协作倾向</Text>
                <Text className="dimension-desc">你在团队中的角色与偏好</Text>
              </View>
            </View>
            <View className="dimension-item">
              <View className="dimension-dot" style={{ background: '#93AEC1' }} />
              <View className="dimension-info">
                <Text className="dimension-name">风险承受度</Text>
                <Text className="dimension-desc">你面对不确定性的应对方式</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 开始按钮 */}
        <View className="start-button" onClick={handleStartTest}>
          <Text className="start-text">开始 OPC 测试</Text>
        </View>
      </View>
    </View>
  )
}
