import { View, Text, ScrollView, Button, Textarea, Picker } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { companyStudentBridgeAPI } from '../../services/api'
import './index.scss'

export default function CompanyAddTag() {
  const router = useRouter()
  const { studentId, studentName } = router.params

  const [tagType, setTagType] = useState<'strength' | 'potential' | 'concern'>('strength')
  const [tagName, setTagName] = useState('')
  const [description, setDescription] = useState('')
  const [evidence, setEvidence] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const tagTypes = [
    { label: '优势', value: 'strength' },
    { label: '潜力', value: 'potential' },
    { label: '关注点', value: 'concern' }
  ]

  const strengthTemplates = [
    '代码质量高',
    '学习能力强',
    '沟通能力好',
    '责任心强',
    '团队协作好'
  ]

  const potentialTemplates = [
    '技术潜力大',
    '成长速度快',
    '创新意识强',
    '抗压能力好',
    '适应能力强'
  ]

  const concernTemplates = [
    '需提升代码规范',
    '需加强沟通',
    '需提高效率',
    '需增强自信',
    '需改善时间管理'
  ]

  const getTemplates = () => {
    switch (tagType) {
      case 'strength':
        return strengthTemplates
      case 'potential':
        return potentialTemplates
      case 'concern':
        return concernTemplates
      default:
        return []
    }
  }

  const handleTemplateClick = (template: string) => {
    setTagName(template)
  }

  const handleSubmit = async () => {
    if (!tagName.trim()) {
      Taro.showToast({
        title: '请输入标签名称',
        icon: 'error'
      })
      return
    }

    if (!description.trim()) {
      Taro.showToast({
        title: '请输入标签描述',
        icon: 'error'
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await companyStudentBridgeAPI.addReputationTag(studentId as string, {
        tagType,
        tagName: tagName.trim(),
        description: description.trim(),
        evidence: evidence.trim() || undefined
      })

      if (response.success) {
        Taro.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 2000
        })

        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '添加失败',
        icon: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getTagTypeColor = (type: string): string => {
    const colors = {
      strength: '#10B981',
      potential: '#F59E0B',
      concern: '#8B5CF6'
    }
    return colors[type] || '#6B7280'
  }

  return (
    <ScrollView className="company-add-tag" scrollY>
      {/* 头部 */}
      <View className="header-section">
        <Text className="header-title">添加声誉标签</Text>
        <Text className="header-subtitle">为 {studentName} 添加评价</Text>
      </View>

      {/* 表单 */}
      <View className="form-section">
        {/* 标签类型 */}
        <View className="form-item">
          <Text className="form-label">标签类型</Text>
          <View className="type-selector">
            {tagTypes.map((type) => (
              <View
                key={type.value}
                className={`type-option ${tagType === type.value ? 'active' : ''}`}
                style={{
                  borderColor: tagType === type.value ? getTagTypeColor(type.value) : '#E5E7EB'
                }}
                onClick={() => setTagType(type.value as any)}
              >
                <Text
                  className="type-text"
                  style={{
                    color: tagType === type.value ? getTagTypeColor(type.value) : '#6B7280'
                  }}
                >
                  {type.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 快捷模板 */}
        <View className="form-item">
          <Text className="form-label">快捷选择</Text>
          <View className="templates-grid">
            {getTemplates().map((template, index) => (
              <View
                key={index}
                className="template-item"
                onClick={() => handleTemplateClick(template)}
              >
                <Text className="template-text">{template}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 标签名称 */}
        <View className="form-item">
          <Text className="form-label">标签名称</Text>
          <Textarea
            className="form-input"
            placeholder="输入标签名称，例如：代码质量高"
            value={tagName}
            onInput={(e) => setTagName(e.detail.value)}
            maxlength={50}
            autoHeight
          />
          <Text className="char-count">{tagName.length}/50</Text>
        </View>

        {/* 详细描述 */}
        <View className="form-item">
          <Text className="form-label">详细描述</Text>
          <Textarea
            className="form-textarea"
            placeholder="详细描述这个标签的具体表现..."
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
          />
          <Text className="char-count">{description.length}/500</Text>
        </View>

        {/* 支撑证据（可选） */}
        <View className="form-item">
          <Text className="form-label">支撑证据（可选）</Text>
          <Textarea
            className="form-textarea"
            placeholder="例如：在XX项目中表现出色、完成XX任务..."
            value={evidence}
            onInput={(e) => setEvidence(e.detail.value)}
            maxlength={300}
          />
          <Text className="char-count">{evidence.length}/300</Text>
        </View>

        {/* 预览 */}
        <View className="preview-section">
          <Text className="preview-title">预览</Text>
          <View
            className="preview-card"
            style={{ borderColor: getTagTypeColor(tagType) }}
          >
            <View className="preview-header">
              <View
                className="preview-type-badge"
                style={{ background: getTagTypeColor(tagType) }}
              >
                <Text className="preview-type-text">
                  {tagTypes.find((t) => t.value === tagType)?.label}
                </Text>
              </View>
            </View>
            <Text className="preview-name">
              {tagName || '标签名称'}
            </Text>
            <Text className="preview-desc">
              {description || '详细描述'}
            </Text>
            {evidence && (
              <Text className="preview-evidence">
                证据：{evidence}
              </Text>
            )}
          </View>
        </View>

        {/* 提交按钮 */}
        <Button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交标签'}
        </Button>
      </View>

      <View className="bottom-spacing" />
    </ScrollView>
  )
}
