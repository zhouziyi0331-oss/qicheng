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
          </View>

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
          </View>

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
