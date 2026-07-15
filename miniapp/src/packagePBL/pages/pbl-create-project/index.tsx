import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import pblAPI from '../../../services/pbl'
import { checkTextSecurity } from '../../../utils/contentSecurity'
import './index.scss'

const DOMAINS = [
  'AI人工智能',
  'Web开发',
  '移动开发',
  '数据分析',
  '产品设计',
  '游戏开发',
  '区块链',
  '物联网',
  '其他'
]

export default function PBLCreateProject() {
  const [initialProblem, setInitialProblem] = useState('')
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState('')
  const [domainIndex, setDomainIndex] = useState(0)
  const [learningGoals, setLearningGoals] = useState(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: 初始问题, 2: 详细信息

  // 下一步
  const handleNext = () => {
    if (!initialProblem.trim()) {
      Taro.showToast({
        title: '请描述你的项目想法',
        icon: 'none'
      })
      return
    }

    setStep(2)
  }

  // 上一步
  const handleBack = () => {
    setStep(1)
  }

  // 选择领域
  const handleDomainChange = (e) => {
    const index = e.detail.value
    setDomainIndex(index)
    setDomain(DOMAINS[index])
  }

  // 更新学习目标
  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...learningGoals]
    newGoals[index] = value
    setLearningGoals(newGoals)
  }

  // 创建项目
  const handleCreate = async () => {
    if (!initialProblem.trim()) {
      Taro.showToast({
        title: '请描述你的项目想法',
        icon: 'none'
      })
      return
    }

    // 锁 文本内容安全检查
    const isProblemSecure = await checkTextSecurity(initialProblem)
    if (!isProblemSecure) {
      return
    }

    // 锁 检查标题（如果有填写）
    if (title.trim()) {
      const isTitleSecure = await checkTextSecurity(title)
      if (!isTitleSecure) {
        return
      }
    }

    // 锁 检查学习目标（如果有填写）
    const filteredGoals = learningGoals.filter(g => g.trim())
    if (filteredGoals.length > 0) {
      for (const goal of filteredGoals) {
        const isGoalSecure = await checkTextSecurity(goal)
        if (!isGoalSecure) {
          return
        }
      }
    }

    try {
      setLoading(true)
      Taro.showLoading({ title: '创建中...' })

      const filteredGoals = learningGoals.filter(g => g.trim())

      const res = await pblAPI.initProject({
        initialProblem: initialProblem.trim(),
        title: title.trim() || undefined,
        domain: domain || undefined,
        learningGoals: filteredGoals.length > 0 ? filteredGoals : undefined
      })

      if (res.success && res.data) {
        const { projectId, openingQuestions } = res.data

        Taro.hideLoading()
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })

        // 跳转到对话页面
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/mentor/index?projectId=${projectId}&projectTitle=${title || '新项目'}`
          })
        }, 1500)
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '创建失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='pbl-create-project-page'>
      {/* 进度指示器 */}
      <View className='progress-indicator'>
        <View className={`progress-step ${step >= 1 ? 'active' : ''}`}>
          <View className='step-number'>1</View>
          <Text className='step-label'>项目想法</Text>
        </View>
        <View className='progress-line' />
        <View className={`progress-step ${step >= 2 ? 'active' : ''}`}>
          <View className='step-number'>2</View>
          <Text className='step-label'>详细信息</Text>
        </View>
      </View>

      {/* 步骤1：初始问题 */}
      {step === 1 && (
        <View className='step-content'>
          <View className='step-header'>
            <Text className='step-icon'>想法</Text>
            <Text className='step-title'>说说你的项目想法</Text>
            <Text className='step-hint'>
              和启程小猫聊聊你想做什么，不用想得太复杂，
              {'\n'}
              就像和朋友聊天一样~
            </Text>
          </View>

          <View className='form-section'>
            <Text className='form-label'>你想做什么？</Text>
            <Textarea
              className='form-textarea'
              placeholder='比如：我想用AI自动总结会议纪要'
              value={initialProblem}
              onInput={(e) => setInitialProblem(e.detail.value)}
              maxlength={500}
              autoHeight
            />
            <Text className='form-counter'>{initialProblem.length}/500</Text>
          </View>

          <View className='examples'>
            <Text className='examples-title'>思考 一些例子：</Text>
            <View
              className='example-item'
              onClick={() => setInitialProblem('我想用AI自动总结会议纪要')}
            >
              <Text>我想用AI自动总结会议纪要</Text>
            </View>
            <View
              className='example-item'
              onClick={() => setInitialProblem('我想做一个个人博客网站')}
            >
              <Text>我想做一个个人博客网站</Text>
            </View>
            <View
              className='example-item'
              onClick={() => setInitialProblem('我想学习数据分析，分析我的消费习惯')}
            >
              <Text>我想学习数据分析，分析我的消费习惯</Text>
            </View>
          </View>

          <View className='step-actions'>
            <View className='action-btn primary' onClick={handleNext}>
              <Text>下一步</Text>
            </View>
          </View>
        </View>
      )}

      {/* 步骤2：详细信息 */}
      {step === 2 && (
        <View className='step-content'>
          <View className='step-header'>
            <Text className='step-icon'>笔记</Text>
            <Text className='step-title'>完善项目信息</Text>
            <Text className='step-hint'>这些信息可以帮助启程小猫更好地指导你</Text>
          </View>

          {/* 项目标题 */}
          <View className='form-section'>
            <Text className='form-label'>项目标题（可选）</Text>
            <Input
              className='form-input'
              placeholder='给你的项目起个名字'
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              maxlength={50}
            />
          </View>

          {/* 项目领域 */}
          <View className='form-section'>
            <Text className='form-label'>项目领域（可选）</Text>
            <Picker mode='selector' range={DOMAINS} onChange={handleDomainChange}>
              <View className='form-picker'>
                <Text className={domain ? '' : 'placeholder'}>
                  {domain || '选择项目领域'}
                </Text>
                <Text className='picker-arrow'>▼</Text>
              </View>
            </Picker>
          </View>

          {/* 学习目标 */}
          <View className='form-section'>
            <Text className='form-label'>学习目标（可选）</Text>
            <Text className='form-hint'>你希望通过这个项目学到什么？</Text>
            {learningGoals.map((goal, index) => (
              <Input
                key={index}
                className='form-input goal-input'
                placeholder={`学习目标 ${index + 1}`}
                value={goal}
                onInput={(e) => handleGoalChange(index, e.detail.value)}
                maxlength={100}
              />
            ))}
          </View>

          <View className='step-actions'>
            <View className='action-btn secondary' onClick={handleBack}>
              <Text>上一步</Text>
            </View>
            <View
              className={`action-btn primary ${loading ? 'disabled' : ''}`}
              onClick={handleCreate}
            >
              <Text>{loading ? '创建中...' : '开始项目'}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
