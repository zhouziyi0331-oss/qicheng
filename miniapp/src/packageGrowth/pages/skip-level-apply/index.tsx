import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

interface TargetLevel {
  level: number
  name: string
  desc: string
  difficulty: string
  difficultyStars: number
  successRate: number
  tags: { text: string; type: string }[]
  taskPreview: {
    name: string
    desc: string
    tags: string[]
  }
}

// 内容创作赛道任务
const CONTENT_TRACK_LEVELS: TargetLevel[] = [
  {
    level: 4,
    name: 'Lv.4 · 专业者',
    desc: '跨越一个级别，从AI生成到独立运营',
    difficulty: '难度 ★★★★',
    difficultyStars: 4,
    successRate: 68,
    tags: [
      { text: '推荐', type: 'terra' },
      { text: '难度 ★★★★', type: 'sand' },
      { text: '成功率 68%', type: 'mist' }
    ],
    taskPreview: {
      name: '独立搭建品牌内容矩阵',
      desc: '在 10 天内，为一个真实品牌（可以是自己的个人品牌）搭建完整内容矩阵，包括：至少2个平台的内容规划、5篇以上高质量内容、数据分析和优化方案。证明你已从"AI生成内容"跨越到"独立运营品牌"。',
      tags: ['10天完成', '品牌矩阵', '多平台运营', '数据驱动']
    }
  },
  {
    level: 5,
    name: 'Lv.5 · 独立OPC',
    desc: '跨越两个级别，直达毕业标准',
    difficulty: '难度 ★★★★★',
    difficultyStars: 5,
    successRate: 35,
    tags: [
      { text: '高难度', type: 'rust' },
      { text: '难度 ★★★★★', type: 'sand' },
      { text: '成功率 35%', type: 'golden' }
    ],
    taskPreview: {
      name: '打造个人IP并落地商业项目',
      desc: '在 20 天内，完成个人IP定位、内容体系搭建、商业变现路径设计，并成功承接至少1个付费内容项目（可以是课程、咨询或定制内容服务）。证明你具备独立OPC的商业化能力。',
      tags: ['20天完成', '个人IP', '商业项目', '付费转化']
    }
  }
]

// 开发赛道任务
const DEV_TRACK_LEVELS: TargetLevel[] = [
  {
    level: 4,
    name: 'Lv.4 · 专业者',
    desc: '跨越一个级别，从基础到复杂系统',
    difficulty: '难度 ★★★★',
    difficultyStars: 4,
    successRate: 62,
    tags: [
      { text: '推荐', type: 'terra' },
      { text: '难度 ★★★★', type: 'sand' },
      { text: '成功率 62%', type: 'mist' }
    ],
    taskPreview: {
      name: '开发复杂智能Agent系统',
      desc: '在 10 天内，开发一个具备多轮对话、数据处理、API集成的智能Agent应用，包括完整的功能设计、代码实现、测试文档。证明你已从"基础Agent"跨越到"复杂智能系统"。',
      tags: ['10天完成', 'Agent开发', '系统集成', '完整文档']
    }
  },
  {
    level: 5,
    name: 'Lv.5 · 独立OPC',
    desc: '跨越两个级别，直达毕业标准',
    difficulty: '难度 ★★★★★',
    difficultyStars: 5,
    successRate: 30,
    tags: [
      { text: '高难度', type: 'rust' },
      { text: '难度 ★★★★★', type: 'sand' },
      { text: '成功率 30%', type: 'golden' }
    ],
    taskPreview: {
      name: '落地商业化AI工具产品',
      desc: '在 20 天内，从0到1开发一个可商业化的AI工具产品，包括需求调研、产品设计、核心功能开发、部署上线、用户测试。证明你具备独立OPC的商业化落地能力。',
      tags: ['20天完成', '商业产品', '完整交付', '用户验证']
    }
  }
]

export default function SkipLevelApply() {
  const [currentLevel] = useState(3)
  const [currentLevelName] = useState('探索者')
  const [currentTrack, setCurrentTrack] = useState<'content' | 'dev'>('content')
  const [currentXP] = useState(1240)
  const [selectedLevel, setSelectedLevel] = useState<number>(4)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserTrack()
  }, [])

  const loadUserTrack = async () => {
    try {
      // 从后端获取用户赛道信息
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo && userInfo.selected_track) {
        setCurrentTrack(userInfo.selected_track)
      } else {
        // 没有赛道信息，提示用户先选择赛道
        Taro.showModal({
          title: '提示',
          content: '请先选择你的成长赛道',
          showCancel: false,
          success: () => {
            Taro.navigateTo({ url: '/packageCourse/pages/sector-hall/index' })
          }
        })
      }
    } catch (error) {
      console.error('获取用户赛道失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 根据赛道选择任务列表
  const TARGET_LEVELS = currentTrack === 'dev' ? DEV_TRACK_LEVELS : CONTENT_TRACK_LEVELS
  const trackName = currentTrack === 'dev' ? '开发' : '内容创作'

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level)
  }

  const handleConfirmApply = () => {
    const selected = TARGET_LEVELS.find(l => l.level === selectedLevel)
    if (!selected) return

    Taro.showModal({
      title: '确认申请',
      content: `确定要申请跳级到 ${selected.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({
            url: `/packageGrowth/pages/skip-level-task/index?level=${selectedLevel}`
          })
        }
      }
    })
  }

  const handleGoBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="skip-apply-page">
      {/* 顶部当前状态 */}
      <View className="apply-hero">
        <View className="hero-glow-1" />
        <View className="hero-glow-2" />

        {/* 赛道标识 */}
        <View className="track-badge">
          <View className={`track-icon ${currentTrack === 'dev' ? 'track-icon-dev' : 'track-icon-content'}`}>
            <Text className="icon-symbol">{currentTrack === 'dev' ? '◇' : '○'}</Text>
          </View>
          <Text className="track-name">{trackName}赛道</Text>
        </View>

        <View className="current-status">
          <View className="status-badge">
            <Text className="status-level">Lv.{currentLevel}</Text>
          </View>
          <View className="status-info">
            <Text className="status-name">{currentLevelName}</Text>
            <Text className="status-track">当前等级 · {trackName}赛道</Text>
            <View className="status-xp">
              <Text className="xp-icon">◇</Text>
              <Text className="xp-text">已累积 {currentXP} XP</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="apply-scroll" scrollY>
        <View className="apply-body">
          <Text className="section-title">选择你想跳到的目标级别</Text>

          {/* 目标级别列表 */}
          <View className="target-list">
            {TARGET_LEVELS.map(target => (
              <View
                key={target.level}
                className={`target-item ${selectedLevel === target.level ? 'selected' : ''}`}
                onClick={() => handleSelectLevel(target.level)}
              >
                <View
                  className="target-badge"
                  style={{
                    background: target.level === 4
                      ? 'linear-gradient(135deg, #D88760, #BC6446)'
                      : 'linear-gradient(135deg, #F2CD78, #D88760)'
                  }}
                >
                  <Text className="badge-level">{target.level}</Text>
                </View>

                <View className="target-info">
                  <Text className="target-name">{target.name}</Text>
                  <Text className="target-desc">{target.desc}</Text>
                  <View className="target-tags">
                    {target.tags.map((tag, index) => (
                      <View key={index} className={`tag tag-${tag.type}`}>
                        <Text className="tag-text">{tag.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="target-check">
                  {selectedLevel === target.level && (
                    <Text className="check-icon">✓</Text>
                  )}
                </View>

                {selectedLevel === target.level && (
                  <View className="selected-corner" />
                )}
              </View>
            ))}
          </View>

          {/* 提示信息 */}
          <View className="notice-card">
            <Text className="notice-icon">●</Text>
            <View className="notice-content">
              <Text className="notice-text">
                跳级任务为<Text className="notice-highlight">挑战性质</Text>，完成后由导师评分。评分 ≥ 80 分即跳级成功，低于 80 分需正常升满 2 级后重新申请。
              </Text>
            </View>
          </View>

          {/* 任务预览 */}
          {selectedLevel && (
            <View className="preview-card">
              <View className="preview-header">
                <Text className="preview-title">
                  Lv.{selectedLevel} 挑战任务预览
                </Text>
                <View className="preview-tag">
                  <Text className="tag-text">已锁定</Text>
                </View>
              </View>

              <Text className="preview-name">
                {TARGET_LEVELS.find(l => l.level === selectedLevel)?.taskPreview.name}
              </Text>
              <Text className="preview-desc">
                {TARGET_LEVELS.find(l => l.level === selectedLevel)?.taskPreview.desc}
              </Text>

              <View className="preview-tags">
                {TARGET_LEVELS.find(l => l.level === selectedLevel)?.taskPreview.tags.map((tag, index) => (
                  <View key={index} className="tag tag-outline">
                    <Text className="tag-text">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="apply-footer">
        <View className="btn-primary" onClick={handleConfirmApply}>
          <Text className="btn-text">确认申请 · 领取任务</Text>
        </View>
        <View className="btn-secondary" onClick={handleGoBack}>
          <Text className="btn-text">再想想</Text>
        </View>
      </View>
    </View>
  )
}
