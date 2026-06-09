import { View, Text, ScrollView, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import pblAPI from '../../services/pbl'
import './index.scss'

const REFLECTION_TYPES = [
  {
    type: 'daily',
    label: '每日反思',
    icon: '📅',
    description: '回顾今天的学习和进展',
    color: '#8B5CF6'
  },
  {
    type: 'milestone',
    label: '里程碑反思',
    icon: '🎯',
    description: '完成重要阶段后的总结',
    color: '#EC4899'
  },
  {
    type: 'challenge',
    label: '挑战反思',
    icon: '💪',
    description: '遇到困难时的思考',
    color: '#F59E0B'
  },
  {
    type: 'learning',
    label: '学习反思',
    icon: '📚',
    description: '新知识和技能的总结',
    color: '#10B981'
  }
]

const REFLECTION_QUESTIONS = {
  daily: [
    '今天我学到了什么？',
    '今天哪些地方做得好？',
    '今天遇到了什么困难？',
    '明天我打算做什么？'
  ],
  milestone: [
    '这个阶段我完成了什么？',
    '哪些方法特别有效？',
    '如果重新开始，我会怎么做？',
    '下一步我要做什么？'
  ],
  challenge: [
    '我遇到了什么困难？',
    '我是如何解决的？',
    '这个过程中我学到了什么？',
    '以后遇到类似问题怎么办？'
  ],
  learning: [
    '我学到了什么新知识？',
    '这些知识如何应用到项目中？',
    '还有哪些不理解的地方？',
    '接下来想学什么？'
  ]
}

interface ReflectionLog {
  id: string
  reflectionType: string
  whatLearned?: string
  whatWorked?: string
  whatDidntWork?: string
  whatSurprised?: string
  nextSteps?: string
  emotionalState?: string
  createdAt: string
}

export default function PBLReflectionLog() {
  const [projectId, setProjectId] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [guidance, setGuidance] = useState<any>(null)
  const [loadingGuidance, setLoadingGuidance] = useState(false)

  // 表单字段
  const [whatLearned, setWhatLearned] = useState('')
  const [whatWorked, setWhatWorked] = useState('')
  const [whatDidntWork, setWhatDidntWork] = useState('')
  const [whatSurprised, setWhatSurprised] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [emotionalState, setEmotionalState] = useState('')

  const [saving, setSaving] = useState(false)
  const [logs, setLogs] = useState<ReflectionLog[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.projectId) {
      setProjectId(params.projectId)
      setProjectTitle(params.projectTitle || '项目')
      loadLogs(params.projectId)
    }
  }, [])

  // 加载反思日志
  const loadLogs = async (projectId: string) => {
    try {
      // TODO: 实现获取反思日志列表的API
      // const res = await pblAPI.getReflectionLogs(projectId)
      // if (res.success && res.data) {
      //   setLogs(res.data)
      // }
    } catch (error) {
      console.error('加载日志失败:', error)
    }
  }

  // 选择反思类型
  const handleSelectType = async (type: string) => {
    setSelectedType(type)
    setShowForm(true)

    // 获取AI引导
    try {
      setLoadingGuidance(true)
      const res = await pblAPI.guideReflection(projectId, type)
      if (res.success && res.data) {
        setGuidance(res.data)
      }
    } catch (error) {
      console.error('获取引导失败:', error)
    } finally {
      setLoadingGuidance(false)
    }
  }

  // 返回类型选择
  const handleBack = () => {
    setShowForm(false)
    setSelectedType('')
    setGuidance(null)
    clearForm()
  }

  // 清空表单
  const clearForm = () => {
    setWhatLearned('')
    setWhatWorked('')
    setWhatDidntWork('')
    setWhatSurprised('')
    setNextSteps('')
    setEmotionalState('')
  }

  // 保存反思
  const handleSave = async () => {
    if (!whatLearned.trim() && !whatWorked.trim() && !whatDidntWork.trim()) {
      Taro.showToast({
        title: '请至少填写一项内容',
        icon: 'none'
      })
      return
    }

    try {
      setSaving(true)
      Taro.showLoading({ title: '保存中...' })

      const res = await pblAPI.saveReflectionLog(projectId, {
        reflectionType: selectedType,
        whatLearned: whatLearned.trim() || undefined,
        whatWorked: whatWorked.trim() || undefined,
        whatDidntWork: whatDidntWork.trim() || undefined,
        whatSurprised: whatSurprised.trim() || undefined,
        nextSteps: nextSteps.trim() || undefined,
        emotionalState: emotionalState.trim() || undefined
      })

      Taro.hideLoading()

      if (res.success) {
        Taro.showToast({
          title: '保存成功',
          icon: 'success'
        })
        handleBack()
        loadLogs(projectId)
      }
    } catch (error) {
      console.error('保存失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      setSaving(false)
    }
  }

  // 查看历史日志
  const handleViewLog = (log: ReflectionLog) => {
    setSelectedType(log.reflectionType)
    setWhatLearned(log.whatLearned || '')
    setWhatWorked(log.whatWorked || '')
    setWhatDidntWork(log.whatDidntWork || '')
    setWhatSurprised(log.whatSurprised || '')
    setNextSteps(log.nextSteps || '')
    setEmotionalState(log.emotionalState || '')
    setShowForm(true)
    setShowHistory(false)
  }

  const currentReflectionType = REFLECTION_TYPES.find(t => t.type === selectedType)

  return (
    <View className='pbl-reflection-log-page'>
      {/* 头部 */}
      <View className='reflection-header'>
        <View className='header-info'>
          <Text className='header-icon'>✨</Text>
          <View className='header-text'>
            <Text className='header-title'>反思日志</Text>
            <Text className='header-subtitle'>{projectTitle}</Text>
          </View>
        </View>
        <View
          className='history-btn'
          onClick={() => setShowHistory(!showHistory)}
        >
          <Text className='history-icon'>📖</Text>
          <Text className='history-text'>历史</Text>
        </View>
      </View>

      <ScrollView className='reflection-content' scrollY>
        {/* 类型选择 */}
        {!showForm && !showHistory && (
          <View className='type-selection'>
            <View className='selection-header'>
              <Text className='selection-title'>选择反思类型</Text>
              <Text className='selection-hint'>
                定期反思能帮助你更好地成长
              </Text>
            </View>

            {REFLECTION_TYPES.map(type => (
              <View
                key={type.type}
                className='type-card'
                style={{ borderLeftColor: type.color }}
                onClick={() => handleSelectType(type.type)}
              >
                <View className='type-header'>
                  <Text className='type-icon'>{type.icon}</Text>
                  <Text className='type-label'>{type.label}</Text>
                </View>
                <Text className='type-description'>{type.description}</Text>
                <View className='type-questions'>
                  {REFLECTION_QUESTIONS[type.type].slice(0, 2).map((q, i) => (
                    <Text key={i} className='question-preview'>• {q}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 反思表单 */}
        {showForm && currentReflectionType && (
          <View className='reflection-form'>
            <View className='form-header'>
              <View
                className='back-btn'
                onClick={handleBack}
              >
                <Text>‹ 返回</Text>
              </View>
              <View className='form-type'>
                <Text className='form-type-icon'>{currentReflectionType.icon}</Text>
                <Text className='form-type-label'>{currentReflectionType.label}</Text>
              </View>
            </View>

            {/* AI引导 */}
            {loadingGuidance && (
              <View className='guidance-loading'>
                <Text>启程小猫正在为你准备引导...</Text>
              </View>
            )}

            {guidance && (
              <View className='guidance-section'>
                <View className='guidance-header'>
                  <Text className='guidance-icon'>🐱</Text>
                  <Text className='guidance-title'>启程小猫的引导</Text>
                </View>
                <Text className='guidance-content'>{guidance.guidanceText}</Text>
                {guidance.questions && guidance.questions.length > 0 && (
                  <View className='guidance-questions'>
                    {guidance.questions.map((q, i) => (
                      <Text key={i} className='guidance-question'>💭 {q}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 表单字段 */}
            <View className='form-fields'>
              <View className='form-field'>
                <Text className='field-label'>我学到了什么？</Text>
                <Textarea
                  className='field-textarea'
                  placeholder='写下你的收获和新知识...'
                  value={whatLearned}
                  onInput={(e) => setWhatLearned(e.detail.value)}
                  maxlength={500}
                  autoHeight
                />
              </View>

              <View className='form-field'>
                <Text className='field-label'>什么方法有效？</Text>
                <Textarea
                  className='field-textarea'
                  placeholder='哪些做法帮助你取得进展...'
                  value={whatWorked}
                  onInput={(e) => setWhatWorked(e.detail.value)}
                  maxlength={500}
                  autoHeight
                />
              </View>

              <View className='form-field'>
                <Text className='field-label'>遇到了什么困难？</Text>
                <Textarea
                  className='field-textarea'
                  placeholder='记录遇到的挑战和问题...'
                  value={whatDidntWork}
                  onInput={(e) => setWhatDidntWork(e.detail.value)}
                  maxlength={500}
                  autoHeight
                />
              </View>

              <View className='form-field'>
                <Text className='field-label'>有什么意外发现？</Text>
                <Textarea
                  className='field-textarea'
                  placeholder='记录让你惊讶的事情...'
                  value={whatSurprised}
                  onInput={(e) => setWhatSurprised(e.detail.value)}
                  maxlength={500}
                  autoHeight
                />
              </View>

              <View className='form-field'>
                <Text className='field-label'>下一步计划？</Text>
                <Textarea
                  className='field-textarea'
                  placeholder='接下来你打算做什么...'
                  value={nextSteps}
                  onInput={(e) => setNextSteps(e.detail.value)}
                  maxlength={500}
                  autoHeight
                />
              </View>

              <View className='form-field'>
                <Text className='field-label'>现在的心情？</Text>
                <Textarea
                  className='field-textarea'
                  placeholder='记录你的感受和情绪...'
                  value={emotionalState}
                  onInput={(e) => setEmotionalState(e.detail.value)}
                  maxlength={300}
                  autoHeight
                />
              </View>
            </View>

            {/* 保存按钮 */}
            <View className='form-actions'>
              <View
                className={`save-btn ${saving ? 'disabled' : ''}`}
                onClick={handleSave}
              >
                <Text>{saving ? '保存中...' : '保存反思'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 历史记录 */}
        {showHistory && (
          <View className='history-section'>
            <View className='history-header'>
              <Text className='history-title'>反思历史</Text>
              <Text className='history-count'>{logs.length} 条记录</Text>
            </View>

            {logs.length === 0 ? (
              <View className='empty-history'>
                <Text className='empty-icon'>📝</Text>
                <Text className='empty-text'>还没有反思记录</Text>
                <Text className='empty-hint'>开始你的第一次反思吧</Text>
              </View>
            ) : (
              logs.map(log => {
                const type = REFLECTION_TYPES.find(t => t.type === log.reflectionType)
                return (
                  <View
                    key={log.id}
                    className='history-item'
                    onClick={() => handleViewLog(log)}
                  >
                    <View className='history-item-header'>
                      <View className='history-type'>
                        <Text className='history-type-icon'>{type?.icon}</Text>
                        <Text className='history-type-label'>{type?.label}</Text>
                      </View>
                      <Text className='history-time'>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {log.whatLearned && (
                      <Text className='history-preview'>{log.whatLearned}</Text>
                    )}
                  </View>
                )
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
