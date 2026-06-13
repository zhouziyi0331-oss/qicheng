import { View, Text, Input, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { taskTemplateApi } from '../../api/experienceOptimization'
import './index.scss'

export default function TemplateMarket() {
  const [templates, setTemplates] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
    loadTemplates()
  }, [])

  // 加载分类
  const loadCategories = async () => {
    try {
      const res = await taskTemplateApi.getCategories()
      if (res.success) {
        setCategories([{ category: '', template_count: 0, name: '全部' }, ...res.data])
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  // 加载模板列表
  const loadTemplates = async (category?: string) => {
    setLoading(true)
    try {
      const res = await taskTemplateApi.getTemplates(category)
      if (res.success) {
        setTemplates(res.data)
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 切换分类
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    loadTemplates(category || undefined)
  }

  // 搜索模板
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadTemplates(selectedCategory || undefined)
      return
    }

    setLoading(true)
    try {
      const res = await taskTemplateApi.searchTemplates(searchKeyword)
      if (res.success) {
        setTemplates(res.data)
      }
    } catch (error) {
      Taro.showToast({ title: '搜索失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 查看模板详情
  const handleTemplateClick = (template: any) => {
    Taro.navigateTo({
      url: `/pages/template-detail/index?id=${template.id}`
    })
  }

  // 使用模板
  const handleUseTemplate = async (template: any) => {
    try {
      Taro.showLoading({ title: '创建中...' })
      const res = await taskTemplateApi.createDraftFromTemplate(template.id)
      Taro.hideLoading()

      if (res.success) {
        Taro.showToast({ title: '已创建草稿', icon: 'success' })
        setTimeout(() => {
          Taro.navigateTo({
            url: `/pages/task-publish/normal?draftId=${res.data.id}`
          })
        }, 1500)
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({
        title: error.message || '创建失败',
        icon: 'none'
      })
    }
  }

  return (
    <View className='template-market'>
      {/* 搜索栏 */}
      <View className='search-bar'>
        <Input
          className='search-input'
          placeholder='搜索模板...'
          value={searchKeyword}
          onInput={(e) => setSearchKeyword(e.detail.value)}
          onConfirm={handleSearch}
        />
      </View>

      {/* 分类筛选 */}
      <ScrollView className='category-tabs' scrollX>
        {categories.map((cat) => (
          <View
            key={cat.category}
            className={`category-tab ${selectedCategory === cat.category ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.category)}
          >
            <Text>{cat.name || cat.category || '全部'}</Text>
            {cat.template_count > 0 && (
              <Text className='count'>({cat.template_count})</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* 模板列表 */}
      <ScrollView className='template-list' scrollY>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : templates.length === 0 ? (
          <View className='empty'>暂无模板</View>
        ) : (
          templates.map((template) => (
            <View
              key={template.id}
              className='template-card'
              onClick={() => handleTemplateClick(template)}
            >
              {/* 官方标签 */}
              {template.is_official && (
                <View className='official-badge'>官方</View>
              )}

              {/* 模板信息 */}
              <View className='template-header'>
                <Text className='template-name'>{template.template_name}</Text>
                <View className='template-stats'>
                  <Text className='stat'>使用 {template.usage_count}</Text>
                  {template.success_rate && (
                    <Text className='stat'>
                      成功率 {(template.success_rate * 100).toFixed(0)}%
                    </Text>
                  )}
                </View>
              </View>

              <Text className='template-desc'>{template.template_description}</Text>

              {/* 标签 */}
              {template.tags && template.tags.length > 0 && (
                <View className='template-tags'>
                  {template.tags.slice(0, 3).map((tag: string, index: number) => (
                    <View key={index} className='tag'>
                      {tag}
                    </View>
                  ))}
                </View>
              )}

              {/* 价格区间 */}
              <View className='template-price'>
                <Text>预算参考：</Text>
                <Text className='price-range'>
                  ¥{template.typical_budget_min} - ¥{template.typical_budget_max}
                </Text>
              </View>

              {/* 操作按钮 */}
              <View className='template-actions'>
                <View
                  className='btn btn-secondary'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTemplateClick(template)
                  }}
                >
                  查看详情
                </View>
                <View
                  className='btn btn-primary'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUseTemplate(template)
                  }}
                >
                  使用模板
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
