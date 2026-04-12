import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import api from '../../services/api'
import './index.scss'

/**
 * 探索模式库页面
 *
 * 核心理念：记录学生发现的可复用模式
 * - 不是技能清单，是"我发现的做事方法"
 * - 可以标记"想应用到生活中"
 * - 记录应用次数
 */

interface Pattern {
  id: string
  pattern_name: string
  pattern_description: string
  discovered_in_task_title: string
  applied_count: number
  want_apply_to_life: boolean
  created_at: string
}

export default function ExplorationPatterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [stats, setStats] = useState({ total: 0, appliedToLife: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatterns()
  }, [])

  const loadPatterns = async () => {
    try {
      const studentId = Taro.getStorageSync('userId')
      const response = await api.exploration.getStudentPatterns(studentId)
      setPatterns(response.patterns)
      setStats(response.stats)
    } catch (error) {
      console.error('加载探索模式失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLife = async (patternId: string, currentValue: boolean) => {
    try {
      await api.exploration.markPatternForLife(patternId, !currentValue)
      loadPatterns()
    } catch (error) {
      console.error('标记失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleRecordApplication = async (patternId: string) => {
    try {
      await api.exploration.recordPatternApplication(patternId)
      Taro.showToast({ title: '已记录应用', icon: 'success' })
      loadPatterns()
    } catch (error) {
      console.error('记录失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <View className='exploration-patterns-page'>
        <View className='loading'>加载中...</View>
      </View>
    )
  }

  return (
    <View className='exploration-patterns-page'>
      {/* 统计卡片 */}
      <View className='stats-card'>
        <View className='stats-title'>我的探索模式库</View>
        <View className='stats-grid'>
          <View className='stat-item'>
            <View className='stat-value'>{stats.total}</View>
            <View className='stat-label'>发现的模式</View>
          </View>
          <View className='stat-item'>
            <View className='stat-value'>{stats.appliedToLife}</View>
            <View className='stat-label'>应用到生活</View>
          </View>
        </View>
      </View>

      {/* 理念说明 */}
      <View className='concept-card'>
        <View className='concept-icon'>🧩</View>
        <View className='concept-text'>
          <View className='concept-title'>模式是可复用的</View>
          <View className='concept-desc'>
            你在项目中发现的好方法，可以用到学习、工作、生活的其他地方
          </View>
        </View>
      </View>

      {/* 模式列表 */}
      <View className='patterns-list'>
        {patterns.length === 0 ? (
          <View className='empty-state'>
            <View className='empty-icon'>🔍</View>
            <View className='empty-text'>还没有发现模式</View>
            <View className='empty-hint'>完成项目后，记录你发现的新方法</View>
          </View>
        ) : (
          patterns.map(pattern => (
            <View key={pattern.id} className='pattern-card'>
              <View className='pattern-header'>
                <View className='pattern-icon'>💡</View>
                <View className='pattern-content'>
                  <View className='pattern-name'>{pattern.pattern_name}</View>
                  <View className='pattern-desc'>{pattern.pattern_description}</View>
                </View>
              </View>

              <View className='pattern-meta'>
                <View className='meta-item'>
                  <View className='meta-icon'>📦</View>
                  <Text>发现于：{pattern.discovered_in_task_title || '未知项目'}</Text>
                </View>
                <View className='meta-item'>
                  <View className='meta-icon'>🔄</View>
                  <Text>已应用 {pattern.applied_count} 次</Text>
                </View>
              </View>

              <View className='pattern-actions'>
                <View
                  className='action-btn btn-apply'
                  onClick={() => handleRecordApplication(pattern.id)}
                >
                  记录一次应用
                </View>
                <View
                  className={`action-btn btn-life ${pattern.want_apply_to_life ? 'active' : ''}`}
                  onClick={() => handleToggleLife(pattern.id, pattern.want_apply_to_life)}
                >
                  {pattern.want_apply_to_life ? '✓ 想用到生活' : '用到生活中'}
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  )
}
