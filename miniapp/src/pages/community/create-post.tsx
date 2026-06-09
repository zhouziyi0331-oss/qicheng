import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './create-post.scss'

type PostType = 'share' | 'help' | 'recruit'

interface SkillOption {
  value: string
  label: string
}

export default function CreatePost() {
  const [userLevel, setUserLevel] = useState(0)
  const [postType, setPostType] = useState<PostType | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  
  // 招募帖特有字段
  const [projectSource, setProjectSource] = useState('platform')
  const [mySkills, setMySkills] = useState<string[]>([])
  const [neededSkills, setNeededSkills] = useState<Array<{ skill: string; required: boolean }>>([])
  const [totalMembers, setTotalMembers] = useState(2)
  const [duration, setDuration] = useState('')
  const [profitShare, setProfitShare] = useState('')
  
  // 分享帖/求助帖特有字段
  const [track, setTrack] = useState('')
  const [skillTags, setSkillTags] = useState<string[]>([])
  
  const [submitting, setSubmitting] = useState(false)

  const projectSourceOptions = ['平台订单', '自发共创', '外部商单']
  const trackOptions = ['AI内容创作', 'AI工具开发']
  const skillOptions: SkillOption[] = [
    { value: 'React', label: 'React' },
    { value: 'Vue', label: 'Vue' },
    { value: 'Taro', label: 'Taro' },
    { value: 'TypeScript', label: 'TypeScript' },
    { value: 'Node.js', label: 'Node.js' },
    { value: 'Python', label: 'Python' },
    { value: 'UI设计', label: 'UI设计' },
    { value: 'Figma', label: 'Figma' },
    { value: '产品规划', label: '产品规划' }
  ]

  useEffect(() => {
    loadUserLevel()
  }, [])

  const loadUserLevel = async () => {
    try {
      const token = Taro.getStorageSync('token')
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
      setUserLevel(4)
    }
  }

  const handleSelectType = (type: PostType) => {
    if (type === 'recruit' && userLevel < 6) {
      Taro.showToast({
        title: '达到Lv.6后可发布招募帖',
        icon: 'none'
      })
      return
    }

    setPostType(type)
  }

  const handleAddSkill = (skillList: string[], setSkillList: (skills: string[]) => void) => {
    Taro.showActionSheet({
      itemList: skillOptions.map(s => s.label),
      success: (res) => {
        const selected = skillOptions[res.tapIndex]
        if (!skillList.includes(selected.value)) {
          setSkillList([...skillList, selected.value])
        }
      }
    })
  }

  const handleRemoveSkill = (skill: string, skillList: string[], setSkillList: (skills: string[]) => void) => {
    setSkillList(skillList.filter(s => s !== skill))
  }

  const handleAddNeededSkill = () => {
    Taro.showActionSheet({
      itemList: skillOptions.map(s => s.label),
      success: (res) => {
        const selected = skillOptions[res.tapIndex]
        if (!neededSkills.find(s => s.skill === selected.value)) {
          setNeededSkills([...neededSkills, { skill: selected.value, required: true }])
        }
      }
    })
  }

  const toggleSkillRequired = (index: number) => {
    const updated = [...neededSkills]
    updated[index].required = !updated[index].required
    setNeededSkills(updated)
  }

  const handleRemoveNeededSkill = (index: number) => {
    setNeededSkills(neededSkills.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return false
    }

    if (!content.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' })
      return false
    }

    if (postType === 'recruit') {
      if (mySkills.length === 0) {
        Taro.showToast({ title: '请添加你的技能', icon: 'none' })
        return false
      }
      if (neededSkills.length === 0) {
        Taro.showToast({ title: '请添加需要的技能', icon: 'none' })
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
    }

    if (postType === 'share' || postType === 'help') {
      if (!track) {
        Taro.showToast({ title: '请选择关联赛道', icon: 'none' })
        return false
      }
      if (skillTags.length === 0) {
        Taro.showToast({ title: '请添加技能标签', icon: 'none' })
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const token = Taro.getStorageSync('token')
      
      const postData: any = {
        type: postType,
        title,
        content
      }

      if (postType === 'recruit') {
        postData.recruitInfo = {
          projectSource,
          mySkills,
          neededSkills,
          totalMembers,
          duration,
          profitShare
        }
      } else {
        postData.track = track
        postData.skillTags = skillTags
      }

      await Taro.request({
        url: '/api/v1/community/posts',
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: postData
      })

      Taro.showToast({
        title: '发布成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
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

  // 类型选择页面
  if (!postType) {
    return (
      <View className="create-post-page">
        <View className="type-selection">
          <Text className="selection-title">选择帖子类型</Text>

          <View className="type-card" onClick={() => handleSelectType('share')}>
            <Text className="type-icon">💡</Text>
            <Text className="type-name">技能分享</Text>
            <Text className="type-desc">分享你的技能和经验</Text>
            <Text className="type-level">Lv.2+</Text>
          </View>

          <View className="type-card" onClick={() => handleSelectType('help')}>
            <Text className="type-icon">❓</Text>
            <Text className="type-name">问题求助</Text>
            <Text className="type-desc">寻求帮助和建议</Text>
            <Text className="type-level">Lv.2+</Text>
          </View>

          <View 
            className={`type-card ${userLevel < 6 ? 'disabled' : ''}`}
            onClick={() => handleSelectType('recruit')}
          >
            <Text className="type-icon">👥</Text>
            <Text className="type-name">招募队友</Text>
            <Text className="type-desc">组建团队一起完成项目</Text>
            <Text className="type-level">Lv.6+</Text>
            {userLevel < 6 && <View className="lock-badge">🔒</View>}
          </View>
        </View>
      </View>
    )
  }

  // 表单页面
  return (
    <View className="create-post-page">
      <View className="form-container">
        <View className="form-header">
          <Text className="form-title">
            {postType === 'recruit' && '招募队友'}
            {postType === 'share' && '技能分享'}
            {postType === 'help' && '问题求助'}
          </Text>
          <Text className="back-btn" onClick={() => setPostType(null)}>返回</Text>
        </View>

        <View className="form-section">
          <Text className="field-label">标题 *</Text>
          <Input
            className="field-input"
            placeholder="输入标题"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className="form-section">
          <Text className="field-label">内容 *</Text>
          <Textarea
            className="field-textarea"
            placeholder="详细描述..."
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={2000}
          />
        </View>

        {/* 招募帖特有字段 */}
        {postType === 'recruit' && (
          <>
            <View className="form-section">
              <Text className="field-label">项目来源</Text>
              <Picker
                mode="selector"
                range={projectSourceOptions}
                value={projectSourceOptions.indexOf(projectSource)}
                onChange={(e) => setProjectSource(projectSourceOptions[e.detail.value])}
              >
                <View className="picker-view">
                  <Text>{projectSource || '选择项目来源'}</Text>
                </View>
              </Picker>
            </View>

            <View className="form-section">
              <Text className="field-label">我的技能 *</Text>
              <View className="tags-container">
                {mySkills.map((skill, index) => (
                  <View key={index} className="tag-item">
                    <Text className="tag-text">{skill}</Text>
                    <Text className="tag-remove" onClick={() => handleRemoveSkill(skill, mySkills, setMySkills)}>×</Text>
                  </View>
                ))}
                <View className="add-tag-btn" onClick={() => handleAddSkill(mySkills, setMySkills)}>
                  <Text className="add-text">+ 添加</Text>
                </View>
              </View>
            </View>

            <View className="form-section">
              <Text className="field-label">需要的技能 *</Text>
              <View className="needed-skills-list">
                {neededSkills.map((item, index) => (
                  <View key={index} className="needed-skill-item">
                    <Text className="skill-name">{item.skill}</Text>
                    <Text 
                      className={`required-toggle ${item.required ? 'required' : 'optional'}`}
                      onClick={() => toggleSkillRequired(index)}
                    >
                      {item.required ? '必须' : '加分'}
                    </Text>
                    <Text className="skill-remove" onClick={() => handleRemoveNeededSkill(index)}>×</Text>
                  </View>
                ))}
                <View className="add-skill-btn" onClick={handleAddNeededSkill}>
                  <Text className="add-text">+ 添加技能</Text>
                </View>
              </View>
            </View>

            <View className="form-section">
              <Text className="field-label">预计周期 *</Text>
              <Input
                className="field-input"
                placeholder="例如：2周"
                value={duration}
                onInput={(e) => setDuration(e.detail.value)}
              />
            </View>

            <View className="form-section">
              <Text className="field-label">分润方式 *</Text>
              <Input
                className="field-input"
                placeholder="例如：5:5分润"
                value={profitShare}
                onInput={(e) => setProfitShare(e.detail.value)}
              />
            </View>
          </>
        )}

        {/* 分享帖/求助帖特有字段 */}
        {(postType === 'share' || postType === 'help') && (
          <>
            <View className="form-section">
              <Text className="field-label">关联赛道 *</Text>
              <Picker
                mode="selector"
                range={trackOptions}
                onChange={(e) => setTrack(trackOptions[e.detail.value])}
              >
                <View className="picker-view">
                  <Text>{track || '选择赛道'}</Text>
                </View>
              </Picker>
            </View>

            <View className="form-section">
              <Text className="field-label">技能标签 *</Text>
              <View className="tags-container">
                {skillTags.map((skill, index) => (
                  <View key={index} className="tag-item">
                    <Text className="tag-text">{skill}</Text>
                    <Text className="tag-remove" onClick={() => handleRemoveSkill(skill, skillTags, setSkillTags)}>×</Text>
                  </View>
                ))}
                <View className="add-tag-btn" onClick={() => handleAddSkill(skillTags, setSkillTags)}>
                  <Text className="add-text">+ 添加</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <Button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Text className="btn-text">{submitting ? '发布中...' : '发布'}</Text>
        </Button>
      </View>
    </View>
  )
}
