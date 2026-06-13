import { View, Text, Input, Textarea, Button, Slider } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './normal.scss'

interface PriceRecommendation {
  min: number
  max: number
  average: number
  reason: string
}

interface SubTask {
  id: string
  title: string
  description: string
  skills: string[]
  difficulty: number
  estimatedHours: number
  estimatedCost: {
    min: number
    max: number
  }
  priority: string
}

interface BreakdownResult {
  subtasks: SubTask[]
  totalCost: {
    min: number
    max: number
    recommended: number
  }
  totalDays: {
    min: number
    max: number
    recommended: number
  }
  requiredSkills: string[]
  riskWarnings: string[]
  recommendations: string[]
}

export default function NormalPublish() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [deadline, setDeadline] = useState('')

  const [priceRecommendation, setPriceRecommendation] = useState<PriceRecommendation | null>(null)
  const [studentPrice, setStudentPrice] = useState(0)
  const [platformFee, setPlatformFee] = useState(0.15) // 15%平台抽佣
  const [totalPrice, setTotalPrice] = useState(0)

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // E-01: AI需求拆解相关状态
  const [breakdownResult, setBreakdownResult] = useState<BreakdownResult | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // E-02: 交付标准模板相关状态
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)

  // E-04: AI定价相关状态
  const [aiPricingResult, setAiPricingResult] = useState<any>(null)
  const [pricingLoading, setPricingLoading] = useState(false)

  useEffect(() => {
    // 模拟加载价格推荐
    loadPriceRecommendation()
  }, [])

  useEffect(() => {
    // 计算企业总支付
    if (studentPrice > 0) {
      const total = studentPrice / (1 - platformFee)
      setTotalPrice(Math.ceil(total))
    } else {
      setTotalPrice(0)
    }
  }, [studentPrice, platformFee])

  const loadPriceRecommendation = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/tasks/price-recommendation',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setPriceRecommendation(res.data.data)
        setStudentPrice(res.data.data.average)
      } else {
        throw new Error('加载失败')
      }
    } catch (error) {
      console.error('加载价格推荐失败:', error)

      // 使用模拟数据
      const mockRecommendation: PriceRecommendation = {
        min: 500,
        max: 2000,
        average: 1200,
        reason: '基于平台历史同类项目数据分析'
      }
      setPriceRecommendation(mockRecommendation)
      setStudentPrice(mockRecommendation.average)
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (value: number) => {
    if (priceRecommendation) {
      const price = Math.round(
        priceRecommendation.min +
        (priceRecommendation.max - priceRecommendation.min) * value / 100
      )
      setStudentPrice(price)
    }
  }

  // E-01: AI需求拆解功能
  const handleAIBreakdown = async () => {
    if (!description.trim() || description.length < 20) {
      Taro.showToast({
        title: '请先输入详细的任务描述（至少20字）',
        icon: 'none',
        duration: 2000
      })
      return
    }

    setBreakdownLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/tasks/ai-breakdown',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          rawDescription: description,
          additionalContext: {
            title: title || undefined,
            requirements: requirements || undefined
          }
        }
      })

      if (res.data.success) {
        const result = res.data.data as BreakdownResult
        setBreakdownResult(result)
        setShowBreakdown(true)

        // 自动填充AI建议的价格和工期
        if (result.totalCost.recommended > 0) {
          setStudentPrice(result.totalCost.recommended)
        }

        Taro.showToast({
          title: '拆解完成！',
          icon: 'success'
        })
      } else {
        throw new Error(res.data.error || '拆解失败')
      }
    } catch (error: any) {
      console.error('AI拆解失败:', error)
      Taro.showToast({
        title: error.message || 'AI拆解失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setBreakdownLoading(false)
    }
  }

  // 采用拆解结果
  const applyBreakdownResult = () => {
    if (!breakdownResult) return

    // 自动填充技能要求
    if (breakdownResult.requiredSkills.length > 0) {
      setRequirements(breakdownResult.requiredSkills.join('、'))
    }

    // 自动填充价格
    if (breakdownResult.totalCost.recommended > 0) {
      setStudentPrice(breakdownResult.totalCost.recommended)
    }

    // 自动填充工期
    if (breakdownResult.totalDays.recommended > 0) {
      // 可以设置deadline为建议工期后的日期
      const suggestedDate = new Date()
      suggestedDate.setDate(suggestedDate.getDate() + breakdownResult.totalDays.recommended)
      setDeadline(suggestedDate.toISOString().split('T')[0])
    }

    Taro.showToast({
      title: '已采用AI建议',
      icon: 'success'
    })
  }

  // E-02: 加载交付标准模板
  const loadTemplates = async () => {
    setTemplateLoading(true)
    try {
      const token = Taro.getStorageSync('token')

      // 如果有描述，推荐模板；否则获取所有官方模板
      const url = description.trim().length > 20
        ? '/api/tasks/deliverable-templates/recommend'
        : '/api/tasks/deliverable-templates?is_official=true&limit=10'

      const method = description.trim().length > 20 ? 'POST' : 'GET'
      const data = description.trim().length > 20 ? { taskDescription: description } : undefined

      const res = await Taro.request({
        url,
        method,
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data
      })

      if (res.data.success) {
        const templateList = res.data.data.templates || []
        setTemplates(templateList)
        setShowTemplateModal(true)
      }
    } catch (error: any) {
      console.error('加载模板失败:', error)
      Taro.showToast({
        title: '加载模板失败',
        icon: 'none'
      })
    } finally {
      setTemplateLoading(false)
    }
  }

  // E-02: 选择模板
  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template)

    // 自动填充交付物要求
    const deliverableText = generateDeliverableText(template)
    setDeliverables(deliverableText)

    setShowTemplateModal(false)

    Taro.showToast({
      title: '已应用模板',
      icon: 'success'
    })
  }

  // E-02: 根据模板生成交付物文本
  const generateDeliverableText = (template: any): string => {
    const { standards, checklist } = template
    let text = `【交付标准】\n`

    if (standards.functional && standards.functional.length > 0) {
      text += `功能要求：\n`
      standards.functional.forEach((item: string, index: number) => {
        text += `${index + 1}. ${item}\n`
      })
    }

    if (standards.quality && standards.quality.length > 0) {
      text += `\n质量要求：\n`
      standards.quality.forEach((item: string, index: number) => {
        text += `${index + 1}. ${item}\n`
      })
    }

    if (standards.documentation && standards.documentation.length > 0) {
      text += `\n文档要求：\n`
      standards.documentation.forEach((item: string, index: number) => {
        text += `${index + 1}. ${item}\n`
      })
    }

    if (standards.files && standards.files.length > 0) {
      text += `\n文件要求：\n`
      standards.files.forEach((item: string, index: number) => {
        text += `${index + 1}. ${item}\n`
      })
    }

    if (checklist && checklist.length > 0) {
      text += `\n【验收清单】\n`
      checklist.forEach((item: any, index: number) => {
        const required = item.required ? '【必需】' : '【可选】'
        text += `${index + 1}. ${required} ${item.item}\n`
      })
    }

    return text
  }

  // E-04: AI智能定价
  const handleAIPricing = async () => {
    if (!title.trim() || !description.trim()) {
      Taro.showToast({
        title: '请先填写标题和描述',
        icon: 'none'
      })
      return
    }

    setPricingLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/tasks/ai-pricing',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title,
          description,
          required_skills: requirements ? requirements.split(/[、,，]/).map(s => s.trim()) : [],
          difficulty: 3, // 默认中等难度
          estimated_hours: breakdownResult?.totalDays.recommended
            ? breakdownResult.totalDays.recommended * 8
            : undefined,
          urgency: 'normal'
        }
      })

      if (res.data.success) {
        const result = res.data.data
        setAiPricingResult(result)

        // 自动填充建议价格
        setStudentPrice(result.suggested_price)

        Taro.showToast({
          title: 'AI定价完成',
          icon: 'success'
        })
      } else {
        throw new Error(res.data.error || '定价失败')
      }
    } catch (error: any) {
      console.error('AI定价失败:', error)
      Taro.showToast({
        title: error.message || 'AI定价失败',
        icon: 'none'
      })
    } finally {
      setPricingLoading(false)
    }
  }

  const validateForm = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入项目标题', icon: 'none' })
      return false
    }

    if (!description.trim()) {
      Taro.showToast({ title: '请输入项目描述', icon: 'none' })
      return false
    }

    if (!requirements.trim()) {
      Taro.showToast({ title: '请输入技能要求', icon: 'none' })
      return false
    }

    if (!deliverables.trim()) {
      Taro.showToast({ title: '请输入交付物', icon: 'none' })
      return false
    }

    if (!deadline.trim()) {
      Taro.showToast({ title: '请输入截止日期', icon: 'none' })
      return false
    }

    if (studentPrice <= 0) {
      Taro.showToast({ title: '请设置项目价格', icon: 'none' })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const token = Taro.getStorageSync('token')
      
      await Taro.request({
        url: '/api/v1/tasks',
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          title,
          description,
          requirements,
          deliverables,
          deadline,
          studentPrice,
          totalPrice,
          mode: 'normal'
        }
      })

      Taro.showToast({
        title: '发布成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack({ delta: 2 })
      }, 1500)
    } catch (error) {
      console.error('发布失败:', error)
      Taro.showToast({
        title: '发布失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="normal-publish-page">
      <View className="form-container">
        <View className="form-section">
          <Text className="section-title">基本信息</Text>

          <View className="field-group">
            <Text className="field-label">项目标题 *</Text>
            <Input
              className="field-input"
              placeholder="简要描述项目内容"
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              maxlength={50}
            />
          </View>

          <View className="field-group">
            <Text className="field-label">项目描述 *</Text>
            <Textarea
              className="field-textarea"
              placeholder="详细描述项目背景、目标和具体要求..."
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={2000}
            />

            {/* E-01: AI拆解按钮 */}
            <View className="ai-breakdown-hint">
              <Text className="hint-text">💡 不知道怎么拆解？让AI帮你</Text>
              <Button
                className="ai-breakdown-btn"
                onClick={handleAIBreakdown}
                loading={breakdownLoading}
                disabled={breakdownLoading || description.length < 20}
              >
                {breakdownLoading ? 'AI分析中...' : 'AI帮我拆解'}
              </Button>
            </View>
          </View>

          {/* E-01: AI拆解结果展示 */}
          {showBreakdown && breakdownResult && (
            <View className="breakdown-result">
              <View className="breakdown-header">
                <Text className="breakdown-title">🤖 AI拆解结果</Text>
                <Button className="apply-btn" onClick={applyBreakdownResult}>
                  采用建议
                </Button>
              </View>

              {/* 总览 */}
              <View className="breakdown-summary">
                <View className="summary-item">
                  <Text className="summary-label">预估费用</Text>
                  <Text className="summary-value primary">
                    ¥{breakdownResult.totalCost.min} - ¥{breakdownResult.totalCost.max}
                  </Text>
                  <Text className="summary-recommend">
                    建议：¥{breakdownResult.totalCost.recommended}
                  </Text>
                </View>
                <View className="summary-item">
                  <Text className="summary-label">预估工期</Text>
                  <Text className="summary-value">
                    {breakdownResult.totalDays.min} - {breakdownResult.totalDays.max}天
                  </Text>
                  <Text className="summary-recommend">
                    建议：{breakdownResult.totalDays.recommended}天
                  </Text>
                </View>
              </View>

              {/* 所需技能 */}
              {breakdownResult.requiredSkills.length > 0 && (
                <View className="breakdown-section">
                  <Text className="section-label">所需技能</Text>
                  <View className="skills-list">
                    {breakdownResult.requiredSkills.map((skill, index) => (
                      <View key={index} className="skill-tag">{skill}</View>
                    ))}
                  </View>
                </View>
              )}

              {/* 子任务列表 */}
              <View className="breakdown-section">
                <Text className="section-label">
                  子任务清单 ({breakdownResult.subtasks.length}个)
                </Text>
                {breakdownResult.subtasks.map((subtask, index) => (
                  <View key={subtask.id} className="subtask-card">
                    <View className="subtask-header">
                      <Text className="subtask-number">#{index + 1}</Text>
                      <Text className="subtask-title">{subtask.title}</Text>
                      <View className={`priority-badge priority-${subtask.priority}`}>
                        {subtask.priority === 'high' ? '高' : subtask.priority === 'medium' ? '中' : '低'}
                      </View>
                    </View>
                    <Text className="subtask-description">{subtask.description}</Text>
                    <View className="subtask-meta">
                      <View className="meta-item">
                        <Text className="meta-label">难度</Text>
                        <Text className="meta-value">{'⭐'.repeat(subtask.difficulty)}</Text>
                      </View>
                      <View className="meta-item">
                        <Text className="meta-label">工时</Text>
                        <Text className="meta-value">{subtask.estimatedHours}h</Text>
                      </View>
                      <View className="meta-item">
                        <Text className="meta-label">费用</Text>
                        <Text className="meta-value">
                          ¥{subtask.estimatedCost.min}-{subtask.estimatedCost.max}
                        </Text>
                      </View>
                    </View>
                    {subtask.skills.length > 0 && (
                      <View className="subtask-skills">
                        {subtask.skills.map((skill, idx) => (
                          <Text key={idx} className="skill-badge">{skill}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* 风险提示 */}
              {breakdownResult.riskWarnings.length > 0 && (
                <View className="breakdown-section">
                  <Text className="section-label warning">⚠️ 风险提示</Text>
                  {breakdownResult.riskWarnings.map((warning, index) => (
                    <View key={index} className="warning-item">
                      <Text className="warning-text">{warning}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 建议 */}
              {breakdownResult.recommendations.length > 0 && (
                <View className="breakdown-section">
                  <Text className="section-label">💡 建议</Text>
                  {breakdownResult.recommendations.map((rec, index) => (
                    <View key={index} className="recommendation-item">
                      <Text className="recommendation-text">{rec}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View className="field-group">
            <Text className="field-label">技能要求 *</Text>
            <Textarea
              className="field-textarea small"
              placeholder="例如：React、TypeScript、UI设计..."
              value={requirements}
              onInput={(e) => setRequirements(e.detail.value)}
              maxlength={500}
            />
          </View>

          <View className="field-group">
            <Text className="field-label">交付物 *</Text>
            <Textarea
              className="field-textarea small"
              placeholder="例如：完整的小程序源码、设计稿..."
              value={deliverables}
              onInput={(e) => setDeliverables(e.detail.value)}
              maxlength={500}
            />

            {/* E-02: 交付标准模板选择 */}
            <View className="template-hint">
              <Text className="hint-text">📋 使用标准模板，更规范</Text>
              <Button
                className="template-btn"
                onClick={loadTemplates}
                loading={templateLoading}
                disabled={templateLoading}
              >
                {templateLoading ? '加载中...' : '选择模板'}
              </Button>
            </View>

            {selectedTemplate && (
              <View className="selected-template">
                <View className="template-tag">
                  ✓ 已应用：{selectedTemplate.name}
                </View>
              </View>
            )}
          </View>

          {/* E-02: 模板选择弹窗 */}
          {showTemplateModal && (
            <View className="template-modal-overlay" onClick={() => setShowTemplateModal(false)}>
              <View className="template-modal" onClick={(e) => e.stopPropagation()}>
                <View className="modal-header">
                  <Text className="modal-title">选择交付标准模板</Text>
                  <View className="close-btn" onClick={() => setShowTemplateModal(false)}>
                    ✕
                  </View>
                </View>

                <View className="modal-content">
                  {templates.length === 0 ? (
                    <View className="empty-state">
                      <Text className="empty-text">暂无推荐模板</Text>
                    </View>
                  ) : (
                    templates.map((template) => (
                      <View
                        key={template.id}
                        className="template-item"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <View className="template-item-header">
                          <Text className="template-name">{template.name}</Text>
                          {template.is_official && (
                            <View className="official-badge">官方</View>
                          )}
                        </View>
                        <Text className="template-description">{template.description}</Text>
                        <View className="template-meta">
                          <Text className="meta-text">使用次数：{template.usage_count || 0}</Text>
                          {template.success_rate && (
                            <Text className="meta-text">
                              成功率：{Math.round(template.success_rate * 100)}%
                            </Text>
                          )}
                        </View>
                        <View className="template-preview">
                          <Text className="preview-label">包含标准：</Text>
                          {template.standards.functional && (
                            <Text className="preview-item">
                              功能 ({template.standards.functional.length}项)
                            </Text>
                          )}
                          {template.standards.quality && (
                            <Text className="preview-item">
                              质量 ({template.standards.quality.length}项)
                            </Text>
                          )}
                          {template.standards.documentation && (
                            <Text className="preview-item">
                              文档 ({template.standards.documentation.length}项)
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}

          <View className="field-group">
            <Text className="field-label">截止日期 *</Text>
            <Input
              className="field-input"
              placeholder="例如：2026-06-15"
              value={deadline}
              onInput={(e) => setDeadline(e.detail.value)}
            />
          </View>
        </View>

        <View className="form-section">
          <Text className="section-title">价格设置</Text>

          {/* E-04: AI智能定价按钮 */}
          <View className="ai-pricing-trigger">
            <Text className="trigger-text">💰 让AI帮你定价更精准</Text>
            <Button
              className="pricing-btn"
              onClick={handleAIPricing}
              loading={pricingLoading}
              disabled={pricingLoading || !title.trim() || !description.trim()}
            >
              {pricingLoading ? 'AI分析中...' : 'AI智能定价'}
            </Button>
          </View>

          {/* E-04: AI定价结果展示 */}
          {aiPricingResult && (
            <View className="ai-pricing-result">
              <View className="pricing-header">
                <Text className="pricing-title">🤖 AI定价分析</Text>
                <View className="confidence-badge">
                  置信度 {Math.round(aiPricingResult.confidence_level * 100)}%
                </View>
              </View>

              <View className="pricing-summary">
                <View className="price-main">
                  <Text className="price-label">建议价格</Text>
                  <Text className="price-value">¥{aiPricingResult.suggested_price}</Text>
                </View>
                <View className="price-range-info">
                  <Text className="range-text">
                    合理区间：¥{aiPricingResult.min_price} - ¥{aiPricingResult.max_price}
                  </Text>
                </View>
              </View>

              <View className="pricing-breakdown">
                <Text className="breakdown-title">💡 定价分析</Text>
                <View className="breakdown-item">
                  <Text className="item-label">基础价格</Text>
                  <Text className="item-value">
                    ¥{aiPricingResult.pricing_breakdown.base_price}
                  </Text>
                </View>
                {aiPricingResult.pricing_breakdown.skill_premium > 0 && (
                  <View className="breakdown-item">
                    <Text className="item-label">技能加成</Text>
                    <Text className="item-value positive">
                      +¥{aiPricingResult.pricing_breakdown.skill_premium}
                    </Text>
                  </View>
                )}
                {aiPricingResult.pricing_breakdown.difficulty_premium > 0 && (
                  <View className="breakdown-item">
                    <Text className="item-label">难度加成</Text>
                    <Text className="item-value positive">
                      +¥{aiPricingResult.pricing_breakdown.difficulty_premium}
                    </Text>
                  </View>
                )}
                {aiPricingResult.pricing_breakdown.market_adjustment !== 0 && (
                  <View className="breakdown-item">
                    <Text className="item-label">市场调整</Text>
                    <Text className={`item-value ${aiPricingResult.pricing_breakdown.market_adjustment > 0 ? 'positive' : 'negative'}`}>
                      {aiPricingResult.pricing_breakdown.market_adjustment > 0 ? '+' : ''}
                      ¥{Math.round(aiPricingResult.pricing_breakdown.market_adjustment)}
                    </Text>
                  </View>
                )}
              </View>

              <View className="market-comparison">
                <Text className="comparison-title">📊 市场对比</Text>
                <View className="comparison-item">
                  <Text className="comparison-label">平台平均价格</Text>
                  <Text className="comparison-value">
                    ¥{Math.round(aiPricingResult.market_comparison.platform_average)}
                  </Text>
                </View>
                <View className="comparison-item">
                  <Text className="comparison-label">相似任务平均</Text>
                  <Text className="comparison-value">
                    ¥{Math.round(aiPricingResult.market_comparison.similar_tasks_avg)}
                  </Text>
                </View>
                <View className="comparison-item">
                  <Text className="comparison-label">价格排名</Text>
                  <Text className="comparison-value">
                    {aiPricingResult.market_comparison.percentile_rank > 1.1 ? '偏高' :
                     aiPricingResult.market_comparison.percentile_rank < 0.9 ? '偏低' : '合理'}
                  </Text>
                </View>
              </View>

              {aiPricingResult.reasoning && (
                <View className="pricing-reasoning">
                  <Text className="reasoning-text">{aiPricingResult.reasoning}</Text>
                </View>
              )}

              {aiPricingResult.recommendations && aiPricingResult.recommendations.length > 0 && (
                <View className="pricing-recommendations">
                  {aiPricingResult.recommendations.map((rec: string, index: number) => (
                    <View key={index} className="rec-item">
                      <Text className="rec-text">• {rec}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {loading ? (
            <View className="loading-box">
              <Text className="loading-text">正在分析价格...</Text>
            </View>
          ) : priceRecommendation ? (
            <>
              <View className="recommendation-box">
                <View className="recommendation-header">
                  <Text className="recommendation-title">💡 AI价格推荐</Text>
                  <Text className="recommendation-reason">{priceRecommendation.reason}</Text>
                </View>
                <View className="price-range">
                  <View className="range-item">
                    <Text className="range-label">最低</Text>
                    <Text className="range-value">¥{priceRecommendation.min}</Text>
                  </View>
                  <View className="range-divider" />
                  <View className="range-item highlight">
                    <Text className="range-label">推荐</Text>
                    <Text className="range-value">¥{priceRecommendation.average}</Text>
                  </View>
                  <View className="range-divider" />
                  <View className="range-item">
                    <Text className="range-label">最高</Text>
                    <Text className="range-value">¥{priceRecommendation.max}</Text>
                  </View>
                </View>
              </View>

              <View className="price-slider-box">
                <View className="slider-header">
                  <Text className="slider-label">学生到手价格</Text>
                  <Text className="slider-value">¥{studentPrice}</Text>
                </View>
                <Slider
                  className="price-slider"
                  min={0}
                  max={100}
                  value={
                    ((studentPrice - priceRecommendation.min) / 
                    (priceRecommendation.max - priceRecommendation.min)) * 100
                  }
                  activeColor="#8B5CF6"
                  backgroundColor="#E5E7EB"
                  blockSize={28}
                  onChange={(e) => handlePriceChange(e.detail.value)}
                />
                <View className="slider-range">
                  <Text className="range-text">¥{priceRecommendation.min}</Text>
                  <Text className="range-text">¥{priceRecommendation.max}</Text>
                </View>
              </View>

              <View className="price-breakdown">
                <View className="breakdown-row">
                  <Text className="breakdown-label">学生到手</Text>
                  <Text className="breakdown-value">¥{studentPrice}</Text>
                </View>
                <View className="breakdown-row">
                  <Text className="breakdown-label">平台服务费 ({(platformFee * 100).toFixed(0)}%)</Text>
                  <Text className="breakdown-value">¥{totalPrice - studentPrice}</Text>
                </View>
                <View className="breakdown-divider" />
                <View className="breakdown-row total">
                  <Text className="breakdown-label">您需支付</Text>
                  <Text className="breakdown-value highlight">¥{totalPrice}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        <Button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Text className="btn-text">{submitting ? '发布中...' : '发布项目'}</Text>
        </Button>

        <View className="tips-box">
          <Text className="tips-icon">💡</Text>
          <Text className="tips-text">
            发布后，系统将自动匹配最合适的学生，预计24小时内收到申请
          </Text>
        </View>
      </View>
    </View>
  )
}
