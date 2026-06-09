import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { teamAPI } from '../../services/api'
import './create.scss'

interface SkillTag {
  id: string
  name: string
  selected: boolean
}

export default function CreateTeam() {
  const [teamName, setTeamName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [track, setTrack] = useState<'ai-content' | 'ai-tool' | ''>('')
  const [maxMembers, setMaxMembers] = useState(3)
  const [duration, setDuration] = useState('')
  const [profitShare, setProfitShare] = useState('')

  const [availableSkills, setAvailableSkills] = useState<SkillTag[]>([
    { id: '1', name: 'React', selected: false },
    { id: '2', name: 'Vue', selected: false },
    { id: '3', name: 'TypeScript', selected: false },
    { id: '4', name: 'Node.js', selected: false },
    { id: '5', name: 'Python', selected: false },
    { id: '6', name: 'UI设计', selected: false },
    { id: '7', name: '产品规划', selected: false },
    { id: '8', name: 'AI算法', selected: false },
    { id: '9', name: '数据分析', selected: false },
    { id: '10', name: '文案写作', selected: false }
  ])

  const [submitting, setSubmitting] = useState(false)

  const handleTrackSelect = (selectedTrack: 'ai-content' | 'ai-tool') => {
    setTrack(selectedTrack)
  }

  const handleSkillToggle = (skillId: string) => {
    setAvailableSkills(prev =>
      prev.map(skill =>
        skill.id === skillId ? { ...skill, selected: !skill.selected } : skill
      )
    )
  }

  const handleMemberCountChange = (delta: number) => {
    const newCount = maxMembers + delta
    if (newCount >= 2 && newCount <= 6) {
      setMaxMembers(newCount)
    }
  }

  const validateForm = () => {
    if (!teamName.trim()) {
      Taro.showToast({ title: '请输入队伍名称', icon: 'none' })
      return false
    }

    if (!projectName.trim()) {
      Taro.showToast({ title: '请输入项目名称', icon: 'none' })
      return false
    }

    if (!track) {
      Taro.showToast({ title: '请选择赛道', icon: 'none' })
      return false
    }

    if (!description.trim()) {
      Taro.showToast({ title: '请输入项目描述', icon: 'none' })
      return false
    }

    const selectedSkills = availableSkills.filter(s => s.selected)
    if (selectedSkills.length === 0) {
      Taro.showToast({ title: '请至少选择一个技能标签', icon: 'none' })
      return false
    }

    if (!duration.trim()) {
      Taro.showToast({ title: '请输入预计周期', icon: 'none' })
      return false
    }

    if (!profitShare.trim()) {
      Taro.showToast({ title: '请输入分润方式', icon: 'none' })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)

    try {
      const selectedSkills = availableSkills
        .filter(s => s.selected)
        .map(s => s.name)

      const result = await teamAPI.createTeam({
        name: teamName,
        track,
        description: `${projectName}\n\n${description}\n\n预计周期：${duration}\n分润方式：${profitShare}`,
        maxMembers,
        requiredSkills: selectedSkills
      })

      if (result.success) {
        Taro.showToast({
          title: '队伍创建成功',
          icon: 'success',
          duration: 2000
        })

        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } else {
        throw new Error(result.error?.message || '创建失败')
      }
    } catch (error: any) {
      console.error('创建队伍失败:', error)

      if (!error.message?.includes('网络')) {
        Taro.showToast({
          title: error.message || '创建失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="create-team-page">
      <View className="form-container">
        {/* 队伍名称 */}
        <View className="form-section">
          <Text className="section-label">队伍名称</Text>
          <Input
            className="text-input"
            placeholder="给你的队伍起个响亮的名字"
            value={teamName}
            onInput={(e) => setTeamName(e.detail.value)}
            maxlength={30}
          />
          <Text className="input-hint">{teamName.length}/30</Text>
        </View>

        {/* 项目名称 */}
        <View className="form-section">
          <Text className="section-label">项目名称</Text>
          <Input
            className="text-input"
            placeholder="你们要做什么项目？"
            value={projectName}
            onInput={(e) => setProjectName(e.detail.value)}
            maxlength={50}
          />
          <Text className="input-hint">{projectName.length}/50</Text>
        </View>

        {/* 赛道选择 */}
        <View className="form-section">
          <Text className="section-label">选择赛道</Text>
          <View className="track-options">
            <View
              className={`track-option ${track === 'ai-content' ? 'selected' : ''}`}
              onClick={() => handleTrackSelect('ai-content')}
            >
              <Text className="track-icon">✍️</Text>
              <Text className="track-name">AI内容创作</Text>
            </View>
            <View
              className={`track-option ${track === 'ai-tool' ? 'selected' : ''}`}
              onClick={() => handleTrackSelect('ai-tool')}
            >
              <Text className="track-icon">🛠️</Text>
              <Text className="track-name">AI工具开发</Text>
            </View>
          </View>
        </View>

        {/* 项目描述 */}
        <View className="form-section">
          <Text className="section-label">项目描述</Text>
          <Textarea
            className="textarea-input"
            placeholder="详细描述你的项目想法、目标用户、核心功能..."
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
            autoHeight
          />
          <Text className="input-hint">{description.length}/500</Text>
        </View>

        {/* 技能标签 */}
        <View className="form-section">
          <Text className="section-label">需要的技能</Text>
          <View className="skills-grid">
            {availableSkills.map(skill => (
              <View
                key={skill.id}
                className={`skill-tag ${skill.selected ? 'selected' : ''}`}
                onClick={() => handleSkillToggle(skill.id)}
              >
                <Text className="skill-name">{skill.name}</Text>
                {skill.selected && <Text className="check-icon">✓</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* 队伍人数 */}
        <View className="form-section">
          <Text className="section-label">队伍人数</Text>
          <View className="member-counter">
            <View
              className={`counter-button ${maxMembers <= 2 ? 'disabled' : ''}`}
              onClick={() => handleMemberCountChange(-1)}
            >
              <Text className="counter-icon">-</Text>
            </View>
            <View className="counter-value">
              <Text className="value-number">{maxMembers}</Text>
              <Text className="value-label">人</Text>
            </View>
            <View
              className={`counter-button ${maxMembers >= 6 ? 'disabled' : ''}`}
              onClick={() => handleMemberCountChange(1)}
            >
              <Text className="counter-icon">+</Text>
            </View>
          </View>
          <Text className="input-hint">包含你在内，最少2人，最多6人</Text>
        </View>

        {/* 预计周期 */}
        <View className="form-section">
          <Text className="section-label">预计周期</Text>
          <Input
            className="text-input"
            placeholder="例如：2周、1个月"
            value={duration}
            onInput={(e) => setDuration(e.detail.value)}
            maxlength={20}
          />
        </View>

        {/* 分润方式 */}
        <View className="form-section">
          <Text className="section-label">分润方式</Text>
          <Input
            className="text-input"
            placeholder="例如：均分、按贡献度分配"
            value={profitShare}
            onInput={(e) => setProfitShare(e.detail.value)}
            maxlength={50}
          />
        </View>

        {/* 提示信息 */}
        <View className="info-box">
          <Text className="info-icon">💡</Text>
          <Text className="info-text">
            创建队伍后，你将成为队长。队伍创建后会在社区招募板块展示，其他学生可以申请加入。
          </Text>
        </View>

        {/* 提交按钮 */}
        <Button
          className="submit-button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Text className="button-text">
            {submitting ? '创建中...' : '创建队伍'}
          </Text>
        </Button>
      </View>
    </View>
  )
}
