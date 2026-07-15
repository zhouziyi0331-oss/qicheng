import { View, Text, ScrollView, Button, Textarea, Input } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { mentorRelationshipAPI } from '../../services/api'
import './index.scss'

interface QualificationStatus {
  isQualified: boolean
  requirements: {
    completedTasks: { required: number; current: number; met: boolean }
    level: { required: number; current: number; met: boolean }
    avgRating: { required: number; current: number; met: boolean }
  }
}

export default function MentorApply() {
  const [qualification, setQualification] = useState<QualificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 表单字段
  const [bio, setBio] = useState('')
  const [maxMentees, setMaxMentees] = useState('3')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [specialtyInput, setSpecialtyInput] = useState('')

  useLoad(() => {
    checkQualification()
  })

  const checkQualification = async () => {
    try {
      setLoading(true)
      const response = await mentorRelationshipAPI.checkQualification()

      if (response.success && response.data) {
        setQualification(response.data)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSpecialty = () => {
    if (specialtyInput.trim() && !specialties.includes(specialtyInput.trim())) {
      setSpecialties([...specialties, specialtyInput.trim()])
      setSpecialtyInput('')
    }
  }

  const handleRemoveSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!qualification?.isQualified) {
      Taro.showToast({
        title: '暂不满足资格要求',
        icon: 'error'
      })
      return
    }

    if (!bio.trim()) {
      Taro.showToast({
        title: '请填写个人简介',
        icon: 'error'
      })
      return
    }

    if (specialties.length === 0) {
      Taro.showToast({
        title: '请添加至少一个擅长领域',
        icon: 'error'
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await mentorRelationshipAPI.applyToBeMentor({
        bio: bio.trim(),
        maxMentees: parseInt(maxMentees),
        specialties
      })

      if (response.success) {
        Taro.showToast({
          title: '申请已提交',
          icon: 'success',
          duration: 2000
        })

        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !qualification) {
    return (
      <View className="mentor-apply">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView className="mentor-apply" scrollY>
      {/* 头部 */}
      <View className="header-section">
        <Text className="header-title">成为引路人</Text>
        <Text className="header-subtitle">
          带新人成长，同时提升自己
        </Text>
      </View>

      {/* 资格检查 */}
      <View className="qualification-section">
        <View className="section-header">
          <Text className="section-title">资格要求</Text>
          <View className={`status-badge ${qualification.isQualified ? 'qualified' : 'not-qualified'}`}>
            <Text className="status-text">
              {qualification.isQualified ? '✓ 已满足' : '✗ 未满足'}
            </Text>
          </View>
        </View>

        <View className="requirements-list">
          <View className={`requirement-item ${qualification.requirements.completedTasks.met ? 'met' : 'unmet'}`}>
            <View className="requirement-info">
              <Text className="requirement-label">完成任务数</Text>
              <Text className="requirement-value">
                {qualification.requirements.completedTasks.current} / {qualification.requirements.completedTasks.required}
              </Text>
            </View>
            <Text className="requirement-icon">
              {qualification.requirements.completedTasks.met ? '✓' : '✗'}
            </Text>
          </View>

          <View className={`requirement-item ${qualification.requirements.level.met ? 'met' : 'unmet'}`}>
            <View className="requirement-info">
              <Text className="requirement-label">等级</Text>
              <Text className="requirement-value">
                Lv.{qualification.requirements.level.current} / Lv.{qualification.requirements.level.required}
              </Text>
            </View>
            <Text className="requirement-icon">
              {qualification.requirements.level.met ? '✓' : '✗'}
            </Text>
          </View>

          <View className={`requirement-item ${qualification.requirements.avgRating.met ? 'met' : 'unmet'}`}>
            <View className="requirement-info">
              <Text className="requirement-label">平均评分</Text>
              <Text className="requirement-value">
                {qualification.requirements.avgRating.current.toFixed(1)} / {qualification.requirements.avgRating.required.toFixed(1)}
              </Text>
            </View>
            <Text className="requirement-icon">
              {qualification.requirements.avgRating.met ? '✓' : '✗'}
            </Text>
          </View>
        </View>
      </View>

      {/* 申请表单 */}
      {qualification.isQualified && (
        <View className="form-section">
          {/* 个人简介 */}
          <View className="form-item">
            <Text className="form-label">个人简介</Text>
            <Textarea
              className="form-textarea"
              placeholder="介绍一下你自己，让学弟学妹了解你..."
              value={bio}
              onInput={(e) => setBio(e.detail.value)}
              maxlength={500}
            />
            <Text className="char-count">{bio.length}/500</Text>
          </View>

          {/* 接收人数 */}
          <View className="form-item">
            <Text className="form-label">最多同时指导人数</Text>
            <View className="mentees-selector">
              {[1, 2, 3, 4, 5].map((num) => (
                <View
                  key={num}
                  className={`mentee-option ${maxMentees === String(num) ? 'active' : ''}`}
                  onClick={() => setMaxMentees(String(num))}
                >
                  <Text className="option-text">{num}人</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 擅长领域 */}
          <View className="form-item">
            <Text className="form-label">擅长领域</Text>
            <View className="specialty-input-row">
              <Input
                className="specialty-input"
                placeholder="输入领域，例如：前端开发"
                value={specialtyInput}
                onInput={(e) => setSpecialtyInput(e.detail.value)}
                onConfirm={handleAddSpecialty}
              />
              <Button className="add-btn" onClick={handleAddSpecialty}>
                添加
              </Button>
            </View>

            {specialties.length > 0 && (
              <View className="specialty-tags">
                {specialties.map((specialty, index) => (
                  <View key={index} className="specialty-tag">
                    <Text className="specialty-text">{specialty}</Text>
                    <Text
                      className="remove-icon"
                      onClick={() => handleRemoveSpecialty(index)}
                    >
                      ×
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 提交按钮 */}
          <Button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '提交申请'}
          </Button>
        </View>
      )}

      {/* 未满足资格提示 */}
      {!qualification.isQualified && (
        <View className="unqualified-hint">
          <Text className="hint-icon">能力</Text>
          <Text className="hint-title">继续努力！</Text>
          <Text className="hint-text">
            完成更多任务、提升等级和评分后即可申请成为引路人
          </Text>
        </View>
      )}

      <View className="bottom-spacing" />
    </ScrollView>
  )
}
