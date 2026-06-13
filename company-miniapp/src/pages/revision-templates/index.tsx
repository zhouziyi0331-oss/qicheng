import { View, Text, ScrollView, Button, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { revisionTemplateApi } from '../../api/experienceOptimization'
import './index.scss'

export default function RevisionTemplates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([
    { value: '', label: '全部' },
    { value: 'ui_design', label: 'UI设计' },
    { value: 'functionality', label: '功能' },
    { value: 'code_quality', label: '代码质量' },
    { value: 'performance', label: '性能' }
  ])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [placeholderValues, setPlaceholderValues] = useState<any>({})
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [selectedCategory])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await revisionTemplateApi.getList(selectedCategory || undefined)
      if (res.success) {
        setTemplates(res.data)
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const selectTemplate = (template: any) => {
    setSelectedTemplate(template)
    const placeholders = template.placeholders ? JSON.parse(template.placeholders) : {}
    const initialValues: any = {}
    Object.keys(placeholders).forEach(key => {
      initialValues[key] = ''
    })
    setPlaceholderValues(initialValues)
    setGeneratedContent('')
  }

  const generateContent = async () => {
    if (!selectedTemplate) return

    const placeholders = selectedTemplate.placeholders ? JSON.parse(selectedTemplate.placeholders) : {}
    const missingFields = Object.keys(placeholders).filter(key => !placeholderValues[key])

    if (missingFields.length > 0) {
      Taro.showToast({ title: '请填写所有占位符', icon: 'none' })
      return
    }

    try {
      const res = await revisionTemplateApi.apply(selectedTemplate.id, placeholderValues)
      if (res.success) {
        setGeneratedContent(res.data.content)
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '生成失败', icon: 'none' })
    }
  }

  const copyContent = () => {
    Taro.setClipboardData({
      data: generatedContent,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
      }
    })
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setPlaceholderValues({})
    setGeneratedContent('')
  }

  return (
    <View className='revision-templates'>
      {!selectedTemplate ? (
        <>
          <View className='page-header'>
            <Text className='title'>修改意见模板</Text>
            <Text className='subtitle'>快速生成规范的修改意见</Text>
          </View>

          <ScrollView className='category-tabs' scrollX>
            {categories.map((cat) => (
              <View
                key={cat.value}
                className={`category-tab ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </View>
            ))}
          </ScrollView>

          <ScrollView className='templates-list' scrollY>
            {loading ? (
              <View className='loading'>加载中...</View>
            ) : templates.length === 0 ? (
              <View className='empty'>暂无模板</View>
            ) : (
              templates.map((template) => (
                <View
                  key={template.id}
                  className='template-card'
                  onClick={() => selectTemplate(template)}
                >
                  {template.is_official && (
                    <View className='official-badge'>官方</View>
                  )}

                  <Text className='template-name'>{template.template_name}</Text>

                  <View className='template-preview'>
                    <Text>{template.template_content}</Text>
                  </View>

                  <View className='template-footer'>
                    <Text className='usage-count'>使用 {template.usage_count} 次</Text>
                    <Button className='use-btn'>使用模板</Button>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView className='template-editor' scrollY>
          <View className='editor-header'>
            <Button className='back-btn' onClick={resetForm}>
              ← 返回
            </Button>
            <Text className='template-title'>{selectedTemplate.template_name}</Text>
          </View>

          <View className='editor-content'>
            <View className='placeholders-section'>
              <Text className='section-title'>📝 填写占位符</Text>
              {Object.entries(JSON.parse(selectedTemplate.placeholders || '{}')).map(([key, desc]) => (
                <View key={key} className='placeholder-item'>
                  <Text className='placeholder-label'>{desc as string}</Text>
                  <Input
                    className='placeholder-input'
                    placeholder={`输入${desc}...`}
                    value={placeholderValues[key] || ''}
                    onInput={(e) => setPlaceholderValues({
                      ...placeholderValues,
                      [key]: e.detail.value
                    })}
                  />
                </View>
              ))}

              <Button className='generate-btn' onClick={generateContent}>
                生成修改意见
              </Button>
            </View>

            {generatedContent && (
              <View className='result-section'>
                <Text className='section-title'>✅ 生成结果</Text>
                <View className='result-box'>
                  <Text className='result-content'>{generatedContent}</Text>
                </View>

                <View className='result-actions'>
                  <Button className='btn btn-copy' onClick={copyContent}>
                    📋 复制
                  </Button>
                  <Button className='btn btn-use' onClick={() => {
                    Taro.showToast({ title: '功能开发中', icon: 'none' })
                  }}>
                    💬 直接发送
                  </Button>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
