import { View, Text, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { budgetSuggestionApi } from '../../api/experienceOptimization'
import './index.scss'

interface BudgetSuggestionProps {
  taskCategory: string
  taskDescription?: string
  requiredSkills?: string[]
  onSuggestionReceived?: (suggestion: any) => void
}

export default function BudgetSuggestion(props: BudgetSuggestionProps) {
  const { taskCategory, taskDescription, requiredSkills, onSuggestionReceived } = props
  const [suggestion, setSuggestion] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [qualityExpectation, setQualityExpectation] = useState<'basic' | 'standard' | 'premium'>('standard')

  // 获取预算建议
  const getSuggestion = async () => {
    if (!taskCategory) {
      Taro.showToast({ title: '请先选择任务分类', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await budgetSuggestionApi.getSuggestion({
        task_category: taskCategory,
        task_description: taskDescription,
        required_skills: requiredSkills,
        quality_expectation: qualityExpectation
      })

      if (res.success) {
        setSuggestion(res.data)
        onSuggestionReceived?.(res.data)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '获取建议失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 应用建议预算
  const applySuggestion = (amount: number) => {
    onSuggestionReceived?.({ ...suggestion, selected_amount: amount })
  }

  return (
    <View className='budget-suggestion'>
      <View className='suggestion-header'>
        <Text className='title'>💡 AI预算建议</Text>
        <Text className='subtitle'>基于{suggestion?.similar_tasks_count || 0}个同类任务分析</Text>
      </View>

      {/* 质量期望选择 */}
      <View className='quality-selector'>
        <Text className='label'>质量期望：</Text>
        <View className='quality-options'>
          {[
            { value: 'basic', label: '基础' },
            { value: 'standard', label: '标准' },
            { value: 'premium', label: '高级' }
          ].map((option) => (
            <View
              key={option.value}
              className={`quality-option ${qualityExpectation === option.value ? 'active' : ''}`}
              onClick={() => setQualityExpectation(option.value as any)}
            >
              {option.label}
            </View>
          ))}
        </View>
      </View>

      {/* 获取建议按钮 */}
      {!suggestion && (
        <Button
          className='get-suggestion-btn'
          loading={loading}
          onClick={getSuggestion}
        >
          {loading ? '分析中...' : '获取AI预算建议'}
        </Button>
      )}

      {/* 建议结果 */}
      {suggestion && (
        <View className='suggestion-result'>
          {/* 预算区间 */}
          <View className='budget-range'>
            <View className='budget-item' onClick={() => applySuggestion(suggestion.suggested_min)}>
              <Text className='budget-label'>最低预算</Text>
              <Text className='budget-value'>¥{suggestion.suggested_min}</Text>
              <Text className='budget-desc'>入门级</Text>
            </View>

            <View className='budget-item recommended' onClick={() => applySuggestion(suggestion.suggested_optimal)}>
              <View className='recommended-badge'>推荐</View>
              <Text className='budget-label'>建议预算</Text>
              <Text className='budget-value'>¥{suggestion.suggested_optimal}</Text>
              <Text className='budget-desc'>性价比最高</Text>
            </View>

            <View className='budget-item' onClick={() => applySuggestion(suggestion.suggested_max)}>
              <Text className='budget-label'>最高预算</Text>
              <Text className='budget-value'>¥{suggestion.suggested_max}</Text>
              <Text className='budget-desc'>高质量</Text>
            </View>
          </View>

          {/* AI分析理由 */}
          {suggestion.reasoning && (
            <View className='reasoning'>
              <View className='reasoning-header'>
                <Text className='reasoning-icon'>🤖</Text>
                <Text className='reasoning-title'>AI分析</Text>
              </View>
              <Text className='reasoning-content'>{suggestion.reasoning}</Text>
            </View>
          )}

          {/* 市场数据 */}
          {suggestion.market_data && (
            <View className='market-data'>
              <Text className='data-title'>市场数据参考</Text>
              <View className='data-row'>
                <Text className='data-label'>25%分位数：</Text>
                <Text className='data-value'>¥{JSON.parse(suggestion.market_data).p25}</Text>
              </View>
              <View className='data-row'>
                <Text className='data-label'>中位数：</Text>
                <Text className='data-value'>¥{JSON.parse(suggestion.market_data).p50}</Text>
              </View>
              <View className='data-row'>
                <Text className='data-label'>75%分位数：</Text>
                <Text className='data-value'>¥{JSON.parse(suggestion.market_data).p75}</Text>
              </View>
            </View>
          )}

          {/* 重新获取按钮 */}
          <Button
            className='refresh-btn'
            onClick={getSuggestion}
          >
            🔄 重新分析
          </Button>
        </View>
      )}
    </View>
  )
}
