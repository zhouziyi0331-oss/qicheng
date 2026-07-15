import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

interface TaskRequirement {
  id: number
  icon: string
  text: string
}

interface TimelineStep {
  id: number
  title: string
  subtitle: string
  active: boolean
}

// 内容创作赛道 Lv.4 任务要求
const CONTENT_LV4_REQUIREMENTS: TaskRequirement[] = [
  { id: 1, icon: '●', text: '10天内完成所有任务，逾期视为失败' },
  { id: 2, icon: '●', text: '为一个真实品牌搭建完整内容矩阵（至少2个平台）' },
  { id: 3, icon: '●', text: '产出至少5篇高质量内容作品' },
  { id: 4, icon: '●', text: '提交数据分析和优化方案报告' },
  { id: 5, icon: '●', text: '通过导师评审，证明独立运营能力' }
]

// 内容创作赛道 Lv.5 任务要求
const CONTENT_LV5_REQUIREMENTS: TaskRequirement[] = [
  { id: 1, icon: '●', text: '20天内完成所有任务，逾期视为失败' },
  { id: 2, icon: '●', text: '完成个人IP定位和内容体系搭建' },
  { id: 3, icon: '●', text: '设计商业变现路径（课程/咨询/定制服务）' },
  { id: 4, icon: '●', text: '成功承接至少1个付费内容项目' },
  { id: 5, icon: '●', text: '通过导师评审，证明商业化落地能力' }
]

// 开发赛道 Lv.4 任务要求
const DEV_LV4_REQUIREMENTS: TaskRequirement[] = [
  { id: 1, icon: '●', text: '10天内完成所有任务，逾期视为失败' },
  { id: 2, icon: '●', text: '开发一个复杂智能Agent应用（多轮对话+数据处理+API集成）' },
  { id: 3, icon: '●', text: '完成功能设计文档和技术架构说明' },
  { id: 4, icon: '●', text: '提供完整的测试案例和使用文档' },
  { id: 5, icon: '●', text: '通过导师代码审查和功能验收' }
]

// 开发赛道 Lv.5 任务要求
const DEV_LV5_REQUIREMENTS: TaskRequirement[] = [
  { id: 1, icon: '●', text: '20天内完成所有任务，逾期视为失败' },
  { id: 2, icon: '●', text: '完成需求调研和产品设计（目标用户+核心功能）' },
  { id: 3, icon: '●', text: '开发并部署上线可商业化的AI工具产品' },
  { id: 4, icon: '●', text: '完成用户测试并提供反馈优化报告' },
  { id: 5, icon: '●', text: '通过导师评审，证明商业化落地能力' }
]

const TIMELINE_STEPS: TimelineStep[] = [
  { id: 1, title: '领取任务', subtitle: '确认申请，任务正式开始', active: true },
  { id: 2, title: '完成核心任务', subtitle: '按照要求完成主体工作', active: false },
  { id: 3, title: '提交作品材料', subtitle: '整理并上传所有交付物', active: false },
  { id: 4, title: '等待导师评分', subtitle: '导师 3-5 个工作日内完成评审', active: false },
  { id: 5, title: '查看结果', subtitle: '≥ 80 分跳级成功，否则继续努力', active: false }
]

export default function SkipLevelTask() {
  const router = useRouter()
  const { level } = router.params
  const targetLevel = parseInt(level || '4')

  const [fromLevel] = useState(3)
  const [toLevel] = useState(targetLevel)
  const [currentTrack, setCurrentTrack] = useState<'content' | 'dev'>('content')
  const [trackName, setTrackName] = useState('内容创作赛道')
  const [taskName, setTaskName] = useState('')
  const [requirements, setRequirements] = useState<TaskRequirement[]>([])

  useEffect(() => {
    loadTrackAndTask()
  }, [targetLevel])

  const loadTrackAndTask = async () => {
    try {
      // 从后端或storage获取用户赛道
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.selected_track) {
        // 没有赛道信息，提示用户先选择赛道
        Taro.showModal({
          title: '提示',
          content: '请先选择你的成长赛道',
          showCancel: false,
          success: () => {
            Taro.navigateTo({ url: '/packageCourse/pages/sector-hall/index' })
          }
        })
        return
      }

      const track = userInfo.selected_track
      setCurrentTrack(track)

      // 根据赛道和目标等级设置任务
      if (track === 'dev') {
        setTrackName('工具开发赛道')
        if (targetLevel === 4) {
          setTaskName('开发复杂智能Agent系统')
          setRequirements(DEV_LV4_REQUIREMENTS)
        } else {
          setTaskName('落地商业化AI工具产品')
          setRequirements(DEV_LV5_REQUIREMENTS)
        }
      } else {
        setTrackName('内容创作赛道')
        if (targetLevel === 4) {
          setTaskName('独立搭建品牌内容矩阵')
          setRequirements(CONTENT_LV4_REQUIREMENTS)
        } else {
          setTaskName('打造个人IP并落地商业项目')
          setRequirements(CONTENT_LV5_REQUIREMENTS)
        }
      }
    } catch (error) {
      console.error('加载任务信息失败:', error)
    }
  }

  const handleConfirmReceive = () => {
    Taro.showModal({
      title: '确认领取',
      content: '领取后任务正式开始计时，确定要开始挑战吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用API领取任务
          Taro.navigateTo({
            url: `/packageGrowth/pages/skip-level-progress/index?level=${toLevel}`
          })
        }
      }
    })
  }

  return (
    <View className="skip-task-page">
      {/* 顶部级别显示 */}
      <View className="task-hero">
        <View className="hero-glow-1" />
        <View className="hero-glow-2" />

        <View className="level-progression">
          <View className="level-from">
            <Text className="level-num">{fromLevel}</Text>
          </View>

          <View className="level-arrow">
            <View className="arrow-line" />
            <Text className="arrow-icon">→</Text>
          </View>

          <View className="level-to">
            <Text className="level-num">{toLevel}</Text>
          </View>
        </View>

        <Text className="task-title">Lv.{fromLevel} → Lv.{toLevel} 跳级任务</Text>
        <Text className="task-subtitle">{taskName}</Text>
      </View>

      <ScrollView className="task-scroll" scrollY>
        <View className="task-body">
          {/* 任务卡片 */}
          <View className="task-card">
            <View className="task-card-header">
              <View className={`task-icon ${currentTrack === 'dev' ? 'task-icon-dev' : 'task-icon-content'}`}>
                <Text className="icon-text">{currentTrack === 'dev' ? '◇' : '○'}</Text>
              </View>
              <View className="task-info">
                <Text className="task-name">{taskName}</Text>
                <Text className="task-desc">
                  {currentTrack === 'dev'
                    ? `开发完整的AI工具系统，证明你具备 Lv.${toLevel} 的技术能力`
                    : `独立运营品牌内容，证明你具备 Lv.${toLevel} 的运营能力`}
                </Text>
                <View className="task-tags">
                  <View className="tag tag-rust">
                    <Text className="tag-text">跳级专属</Text>
                  </View>
                  <View className="tag tag-sand">
                    <Text className="tag-text">{toLevel === 4 ? '10天' : '20天'}</Text>
                  </View>
                  <View className="tag tag-mist">
                    <Text className="tag-text">{trackName}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="task-card-body">
              <Text className="section-title">任务要求</Text>
              <View className="requirements-list">
                {requirements.map(req => (
                  <View key={req.id} className="requirement-item">
                    <Text className="req-icon">{req.icon}</Text>
                    <Text className="req-text">{req.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="task-card-footer">
              <View className="score-info">
                <Text className="score-icon">◇</Text>
                <Text className="score-text">
                  通过分数：<Text className="score-highlight">≥ 80 分</Text>
                </Text>
              </View>
              <View className="tag tag-golden">
                <Text className="tag-text">挑战性质</Text>
              </View>
            </View>
          </View>

          {/* 完成步骤 */}
          <View className="timeline-card">
            <View className="timeline-header">
              <Text className="timeline-icon">✓</Text>
              <Text className="timeline-title">完成步骤</Text>
            </View>
            <View className="timeline-list">
              {TIMELINE_STEPS.map((step, index) => (
                <View key={step.id} className="timeline-item">
                  <View className={`timeline-dot ${step.active ? 'active' : ''}`}>
                    {step.active ? (
                      <Text className="dot-icon">✓</Text>
                    ) : (
                      <Text className="dot-num">{index + 1}</Text>
                    )}
                  </View>
                  {index < TIMELINE_STEPS.length - 1 && (
                    <View className="timeline-line" />
                  )}
                  <View className="timeline-content">
                    <Text className="timeline-step-title">{step.title}</Text>
                    <Text className="timeline-step-subtitle">{step.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 注意事项 */}
          <View className="warn-card">
            <Text className="warn-icon">▲</Text>
            <View className="warn-content">
              <Text className="warn-text">
                领取任务后立即开始计时，7天内必须完成所有内容。未能按时完成将视为跳级失败，需正常升满
                <Text className="warn-highlight"> 2 级</Text>后才能再次申请。
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="task-footer">
        <View className="btn-primary" onClick={handleConfirmReceive}>
          <Text className="btn-text">确认领取，开始挑战</Text>
        </View>
      </View>
    </View>
  )
}
