import { View, Text, Input, Textarea, Picker, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import toast from '../../utils/toast'
import { useRouteGuard } from '../../utils/routeGuard'
import './create.scss'

type PostType = 'recruit' | 'skill_share' | 'help'

interface SkillTag {
  name: string;
  selected: boolean;
}

export default function CommunityCreate() {
  const [postType, setPostType] = useState<PostType | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [userLevel, setUserLevel] = useState(0)

  // 招募帖专用字段
  const [projectSource, setProjectSource] = useState<'platform_order' | 'self_initiated' | 'external'>('platform_order')
  const [mySkills, setMySkills] = useState<string[]>([])
  const [requiredSkills, setRequiredSkills] = useState<Array<{ skillName: string; requiredLevel: 'must' | 'plus' }>>([])
  const [recruitCount, setRecruitCount] = useState(1)
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [profitSplit, setProfitSplit] = useState<'equal' | 'proportional' | 'negotiable'>('equal')

  // 技能分享/问题求助专用字段
  const [relatedTrack, setRelatedTrack] = useState<'content' | 'dev' | 'both'>('content')
  const [relatedLevels, setRelatedLevels] = useState<number[]>([])

  // 技能标签库
  const [availableSkills, setAvailableSkills] = useState<{ content: string[]; dev: string[]; common: string[] }>({
    content: [],
    dev: [],
    common: []
  })

  const projectSourceOptions = [
    { label: '平台接的单', value: 'platform_order' },
    { label: '自己发起的共创', value: 'self_initiated' },
    { label: '外部商单', value: 'external' }
  ]

  const profitSplitOptions = [
    { label: '均分', value: 'equal' },
    { label: '按模块权重分配', value: 'proportional' },
    { label: '协商确定', value: 'negotiable' }
  ]

  const trackOptions = [
    { label: 'AI内容创作', value: 'content' },
    { label: 'AI工具开发', value: 'dev' },
    { label: '两者都有', value: 'both' }
  ]

  useEffect(() => {
    checkPermission()
    loadUserLevel()
    loadSkillLibrary()
    loadMySkills()
  }, [])

  const checkPermission = async () => {
    const hasPermission = await useRouteGuard('/pages/community/create')
    if (!hasPermission) {
      return
    }
  }

  const loadUserLevel = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) return

      const res = await Taro.request({
        url: '/api/v1/user/profile',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setUserLevel(res.data.data.current_level || 0)
      }
    } catch (error) {
      console.error('加载用户等级失败:', error)
    }
  }

  const loadSkillLibrary = async () => {
    try {
      const token = Taro.getStorageSync('token')

      const res = await Taro.request({
        url: '/api/v1/community/skills',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setAvailableSkills(res.data.data)
      }
    } catch (error) {
      console.error('加载技能库失败:', error)
    }
  }

  const loadMySkills = async () => {
    try {
      const token = Taro.getStorageSync('token')

      const res = await Taro.request({
        url: '/api/v1/community/my-skills',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setMySkills(res.data.data.skills || [])
      }
    } catch (error) {
      console.error('加载我的技能失败:', error)
    }
  }

  const handleSelectPostType = (type: PostType) => {
    // 检查权限
    if (type === 'recruit' && userLevel < 5) {
      toast.permissionDenied(5)
      return
    }

    if (type === 'skill_share' && userLevel < 2) {
      toast.permissionDenied(2)
      return
    }

    setPostType(type)
  }

  const handleAddRequiredSkill = () => {
    Taro.showActionSheet({
      itemList: [...availableSkills.content, ...availableSkills.dev, ...availableSkills.common],
      success: (res) => {
        const allSkills = [...availableSkills.content, ...availableSkills.dev, ...availableSkills.common]
        const selectedSkill = allSkills[res.tapIndex]

        if (!requiredSkills.find(s => s.skillName === selectedSkill)) {
          setRequiredSkills([...requiredSkills, { skillName: selectedSkill, requiredLevel: 'must' }])
        }
      }
    })
  }

  const handleRemoveRequiredSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index))
  }

  const handleToggleSkillLevel = (index: number) => {
    const newSkills = [...requiredSkills]
    newSkills[index].requiredLevel = newSkills[index].requiredLevel === 'must' ? 'plus' : 'must'
    setRequiredSkills(newSkills)
  }

  const handleSubmit = async () => {
    // 验证表单
    if (!title.trim()) {
      toast.warning('请输入标题')
      return
    }

    if (!content.trim()) {
      toast.warning('请输入内容')
      return
    }

    if (postType === 'recruit') {
      if (requiredSkills.length === 0) {
        toast.warning('请添加需要的技能')
        return
      }
      if (!estimatedDuration) {
        toast.warning('请输入预计周期')
        return
      }
    }

    try {
      toast.loading('发布中...')
      const token = Taro.getStorageSync('token')

      const postData: any = {
        type: postType,
        title,
        content,
        relatedTrack
      }

      if (postType === 'recruit') {
        postData.projectSource = projectSource
        postData.mySkills = mySkills
        postData.requiredSkillsDetail = requiredSkills
        postData.recruitCount = recruitCount
        postData.estimatedDuration = estimatedDuration
        postData.profitSplit = profitSplit
      } else {
        postData.relatedLevels = relatedLevels
      }

      const res = await Taro.request({
        url: '/api/v1/community/posts',
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: postData
      })

      toast.hideLoading()

      if (res.data.success) {
        toast.success('发布成功')
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error: any) {
      toast.hideLoading()
      toast.error(error.message || '发布失败')
    }
  }

  // 如果还没选择类型，显示类型选择
  if (!postType) {
    return (
      <View className="community-create-page">
        <View className="type-selection">
          <Text className="page-title">选择帖子类型</Text>

          <View className="type-card" onClick={() => handleSelectPostType('recruit')}>
            <Text className="type-icon">🔍</Text>
            <Text className="type-name">招募队友</Text>
            <Text className="type-desc">找人一起完成项目</Text>
            {userLevel < 5 && <Text className="type-lock">🔒 Lv.5解锁</Text>}
          </View>

          <View className="type-card" onClick={() => handleSelectPostType('skill_share')}>
            <Text className="type-icon">💡</Text>
            <Text className="type-name">技能分享</Text>
            <Text className="type-desc">分享你的经验和技巧</Text>
            {userLevel < 2 && <Text className="type-lock">🔒 Lv.2解锁</Text>}
          </View>

          <View className="type-card" onClick={() => handleSelectPostType('help')}>
            <Text className="type-icon">❓</Text>
            <Text className="type-name">问题求助</Text>
            <Text className="type-desc">寻求技术帮助和建议</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="community-create-page">
      <View className="form-container">
        <Text className="page-title">
          {postType === 'recruit' && '发布招募'}
          {postType === 'skill_share' && '发布技能分享'}
          {postType === 'help' && '发布问题求助'}
        </Text>

        {/* 标题 */}
        <View className="form-item">
          <Text className="form-label">标题</Text>
          <Input
            className="form-input"
            placeholder="简洁描述你的内容"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={100}
          />
        </View>

        {/* 内容 */}
        <View className="form-item">
          <Text className="form-label">内容</Text>
          <Textarea
            className="form-textarea"
            placeholder="详细描述..."
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={postType === 'recruit' ? 500 : 2000}
          />
        </View>

        {/* 招募帖专用字段 */}
        {postType === 'recruit' && (
          <>
            <View className="form-item">
              <Text className="form-label">项目来源</Text>
              <Picker
                mode="selector"
                range={projectSourceOptions}
                rangeKey="label"
                onChange={(e) => setProjectSource(projectSourceOptions[e.detail.value].value as any)}
              >
                <View className="picker-view">
                  <Text>{projectSourceOptions.find(o => o.value === projectSource)?.label}</Text>
                </View>
              </Picker>
            </View>

            <View className="form-item">
              <Text className="form-label">我的技能</Text>
              <View className="skills-tags">
                {mySkills.map((skill, idx) => (
                  <View key={idx} className="skill-tag skill-tag-blue">
                    <Text className="skill-tag-text">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="form-item">
              <Text className="form-label">需要的技能</Text>
              <View className="skills-tags">
                {requiredSkills.map((skill, idx) => (
                  <View key={idx} className="skill-tag skill-tag-orange" onClick={() => handleToggleSkillLevel(idx)}>
                    <Text className="skill-tag-text">{skill.skillName}</Text>
                    <Text className="skill-badge">{skill.requiredLevel === 'must' ? '必须' : '加分'}</Text>
                    <Text className="skill-remove" onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveRequiredSkill(idx)
                    }}>×</Text>
                  </View>
                ))}
                <View className="add-skill-btn" onClick={handleAddRequiredSkill}>
                  <Text className="add-skill-text">+ 添加技能</Text>
                </View>
              </View>
            </View>

            <View className="form-item">
              <Text className="form-label">招募人数</Text>
              <Input
                className="form-input"
                type="number"
                value={String(recruitCount)}
                onInput={(e) => setRecruitCount(Number(e.detail.value))}
              />
            </View>

            <View className="form-item">
              <Text className="form-label">预计周期</Text>
              <Input
                className="form-input"
                placeholder="如：2周"
                value={estimatedDuration}
                onInput={(e) => setEstimatedDuration(e.detail.value)}
              />
            </View>

            <View className="form-item">
              <Text className="form-label">分润方式</Text>
              <Picker
                mode="selector"
                range={profitSplitOptions}
                rangeKey="label"
                onChange={(e) => setProfitSplit(profitSplitOptions[e.detail.value].value as any)}
              >
                <View className="picker-view">
                  <Text>{profitSplitOptions.find(o => o.value === profitSplit)?.label}</Text>
                </View>
              </Picker>
            </View>
          </>
        )}

        {/* 技能分享/问题求助专用字段 */}
        {(postType === 'skill_share' || postType === 'help') && (
          <View className="form-item">
            <Text className="form-label">关联赛道</Text>
            <Picker
              mode="selector"
              range={trackOptions}
              rangeKey="label"
              onChange={(e) => setRelatedTrack(trackOptions[e.detail.value].value as any)}
            >
              <View className="picker-view">
                <Text>{trackOptions.find(o => o.value === relatedTrack)?.label}</Text>
              </View>
            </Picker>
          </View>
        )}

        {/* 提交按钮 */}
        <Button className="submit-btn" onClick={handleSubmit}>
          发布
        </Button>
      </View>
    </View>
  )
}
