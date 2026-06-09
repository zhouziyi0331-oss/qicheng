import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './mode-select.scss'

export default function ModeSelect() {
  const handleSelectMode = (mode: 'normal' | 'master') => {
    if (mode === 'normal') {
      Taro.navigateTo({
        url: '/pages/task-publish/normal'
      })
    } else {
      Taro.navigateTo({
        url: '/pages/task-publish/master'
      })
    }
  }

  return (
    <View className="mode-select-page">
      <View className="header">
        <Text className="header-title">发布新项目</Text>
        <Text className="header-subtitle">选择派单模式</Text>
      </View>

      <View className="mode-cards">
        <View className="mode-card normal" onClick={() => handleSelectMode('normal')}>
          <View className="card-icon">
            <Text className="icon-emoji">🎯</Text>
          </View>
          <Text className="card-title">常规派单</Text>
          <Text className="card-desc">系统自动匹配最合适的学生</Text>
          
          <View className="features-list">
            <View className="feature-item">
              <Text className="feature-icon">✓</Text>
              <Text className="feature-text">AI智能匹配</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">✓</Text>
              <Text className="feature-text">价格区间明确</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">✓</Text>
              <Text className="feature-text">适合标准化任务</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">✓</Text>
              <Text className="feature-text">快速响应</Text>
            </View>
          </View>

          <View className="select-btn">
            <Text className="btn-text">选择常规派单</Text>
          </View>
        </View>

        <View className="mode-card master" onClick={() => handleSelectMode('master')}>
          <View className="card-icon">
            <Text className="icon-emoji">⭐</Text>
          </View>
          <Text className="card-title">指定大师</Text>
          <Text className="card-desc">定向邀请经验丰富的大师</Text>
          
          <View className="features-list">
            <View className="feature-item">
              <Text className="feature-icon">✓</Text>
              <Text className="feature-text">高质量保障</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">✓</Text>
              <Text className="feature-text">协商定价</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">✓</Text>
              <Text className="feature-text">适合复杂项目</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">✓</Text>
              <Text className="feature-text">专业指导</Text>
            </View>
          </View>

          <View className="select-btn premium">
            <Text className="btn-text">选择指定大师</Text>
          </View>
        </View>
      </View>

      <View className="comparison-section">
        <Text className="comparison-title">模式对比</Text>
        <View className="comparison-table">
          <View className="table-row header-row">
            <Text className="table-cell">特性</Text>
            <Text className="table-cell">常规派单</Text>
            <Text className="table-cell">指定大师</Text>
          </View>
          <View className="table-row">
            <Text className="table-cell">匹配方式</Text>
            <Text className="table-cell">AI自动</Text>
            <Text className="table-cell">手动选择</Text>
          </View>
          <View className="table-row">
            <Text className="table-cell">定价方式</Text>
            <Text className="table-cell">固定区间</Text>
            <Text className="table-cell">协商定价</Text>
          </View>
          <View className="table-row">
            <Text className="table-cell">响应速度</Text>
            <Text className="table-cell">快速</Text>
            <Text className="table-cell">需等待确认</Text>
          </View>
          <View className="table-row">
            <Text className="table-cell">适用场景</Text>
            <Text className="table-cell">标准任务</Text>
            <Text className="table-cell">复杂项目</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
