import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { opcV2API, statsAPI } from '../../../services/api'
import AIWaitingScreen from '../../../animations/AIWaitingScreen'
import { useTypingEffect, useNumberAnimation, useAnimationSequence } from '../../../hooks/useAnimation'
import RadarChart from '../../../components/RadarChart'
import './result.scss'

interface AbilityScore {
  dimension: string
  score: number
  description: string
}

interface PersonalityTag {
  name: string
  description: string
  color: string
}

interface TrackRecommendation {
  track: string
  matchScore: number
  reason: string
  firstTaskSuggestion: string
}

interface SelfPerception {
  userWords: string[]
  aiAnalysis: string
  gap: string
}

interface OPCResult {
  assessmentId: string
  userId: string
  abilityScores: AbilityScore[]
  personalityTags: PersonalityTag[]
  selfPerception: SelfPerception
  trackRecommendation: TrackRecommendation
  identityStatement?: string  // 身份宣言
  createdAt: string
}

// 人格标签定义
const PERSONALITY_TAGS = {
  visual_storyteller: {
    name: '视觉叙事者',
    description: '你擅长用画面讲故事，能看到各个元素之间的联系，把抽象概念转化成具体视觉。',
    track: 'AI内容创作',
    level: 'Lv.1 试流者',
    firstTask: 'AI图文内容制作（小红书/公众号配图、产品宣传图等）'
  },
  system_builder: {
    name: '系统构建者',
    description: '你习惯先理解底层逻辑再动手，擅长设计规则和系统。',
    track: 'AI工具开发',
    level: 'Lv.1 试流者',
    firstTask: '工作流搭建、Agent设计、自动化系统'
  },
  creative_executor: {
    name: '创意执行者',
    description: '你享受从0到1的创作过程，喜欢快速出稿再打磨。',
    track: 'AI内容创作',
    level: 'Lv.1 试流者',
    firstTask: '社交媒体内容、广告素材制作'
  },
  logic_analyzer: {
    name: '逻辑拆解者',
    description: '你擅长把复杂问题拆成可执行的步骤，逻辑清晰，独立工作能力强。',
    track: 'AI数据处理',
    level: 'Lv.1 试流者',
    firstTask: '数据处理、代码实现、精细执行项目'
  },
  stable_deliverer: {
    name: '稳健交付者',
    description: '你追求稳定高质量的交付，做事有规划，不轻易冒险。',
    track: '通用赛道',
    level: 'Lv.1 试流者',
    firstTask: '对质量要求高、周期明确的项目'
  },
  explorer_integrator: {
    name: '探索整合者',
    description: '你擅长快速掌握新工具，并把不同的东西组合在一起创造新价值。',
    track: 'AI工具应用',
    level: 'Lv.1 试流者',
    firstTask: '探索性项目、新工具应用、跨领域整合'
  },
  balanced: {
    name: '混合型',
    description: '你的工作风格比较灵活，能根据项目需要调整自己的方式。建议通过完成前3个任务，让系统更精准地识别你的方向。',
    track: '通用赛道',
    level: 'Lv.0 涉水者',
    firstTask: '尝试不同类型的项目，找到自己的方向'
  }
}

// 维度名称映射
const DIMENSION_NAMES = {
  info_processing: '信息处理',
  creation_drive: '创作驱动',
  tool_learning: '工具学习',
  task_execution: '任务执行',
  collaboration: '协作倾向',
  risk_attitude: '风险态度'
}

// 生成默认身份宣言
const generateDefaultIdentityStatement = (tag: string, tagData: any): string => {
  const statements = {
    visual_storyteller: '我是一个擅长用画面讲复杂故事的人。在AI时代，这种能力的名字叫「视觉叙事者」。',
    system_builder: '我习惯先理解底层逻辑再动手。在AI时代，这种能力的名字叫「系统构建者」。',
    creative_executor: '我享受从0到1的创作过程。在AI时代，这种能力的名字叫「创意执行者」。',
    logic_analyzer: '我擅长把复杂问题拆成可执行的步骤。在AI时代，这种能力的名字叫「逻辑拆解者」。',
    stable_deliverer: '我追求稳定高质量的交付，做事有规划。在AI时代，这种能力的名字叫「稳健交付者」。',
    explorer_integrator: '我擅长快速掌握新工具，并把不同的东西组合在一起。在AI时代，这种能力的名字叫「探索整合者」。',
    balanced: '我的工作风格比较灵活，能根据项目需要调整自己的方式。通过完成任务，我会发现最适合自己的方向。'
  }
  return statements[tag] || statements.balanced
}

// 维度解读模板（使用类型描述而非评价）
const DIMENSION_INTERPRETATIONS = {
  info_processing: {
    low: '◆ 拆解式思维：你倾向于把复杂问题分解成小块，逐个处理。面对需求时，你习惯先拆解细节，确保每个环节清晰。',
    mid: '◆ 灵活切换：你能根据任务特点在拆解和整合之间切换，既能关注细节也能把握全局。',
    high: '◆ 整合式思维：你倾向于先理解整体框架，再决定如何行动。面对需求时，你习惯先看全貌和各部分关系。'
  },
  creation_drive: {
    low: '◆ 视觉导向：你更多通过画面和视觉元素思考。色彩、构图、光影是你关注的重点，你习惯用视觉语言表达想法。',
    mid: '◆ 视觉与逻辑兼顾：你在视觉感受和逻辑结构之间保持平衡，能在两种模式间灵活切换。',
    high: '◆ 逻辑导向：你更多通过结构和规则思考。信息层次、逻辑关系、系统架构是你关注的重点，你习惯用结构化方式组织内容。'
  },
  tool_learning: {
    low: '◆ 探索式学习：你倾向于直接上手尝试新工具，在使用中摸索功能。你更看重快速产出第一个成果。',
    mid: '◆ 情境适应：你根据工具复杂度选择学习方式，简单工具直接试，复杂工具先学习。',
    high: '◆ 手册式学习：你倾向于先系统了解工具的原理和功能，再开始使用。你更看重全面理解工具能力。'
  },
  task_execution: {
    low: '◆ 规划式推进：你倾向于先制定详细计划再执行。你习惯按既定步骤推进，确保过程可控。',
    mid: '◆ 灵活调整：你在计划和迭代之间找到平衡，既有大致方向也保持调整空间。',
    high: '◆ 迭代式推进：你倾向于先快速做出原型再打磨。你习惯在过程中调整方向，看重快速验证。'
  },
  collaboration: {
    low: '◆ 独立工作偏好：你更习惯独立掌控完整流程。在合作中，你倾向于负责界限清晰的独立模块。',
    mid: '◆ 协作弹性：你能根据项目需要在独立和协作间切换，适应不同的工作方式。',
    high: '◆ 协作工作偏好：你更享受与他人配合的过程。在合作中，你倾向于保持密切沟通和协调。'
  },
  risk_attitude: {
    low: '◆ 稳健倾向：你倾向于选择熟悉领域的任务，优先确保交付质量。你更看重可控性和确定性。',
    mid: '◆ 审慎探索：你愿意尝试新挑战，但会先评估可行性。你在稳定和冒险之间找到平衡点。',
    high: '◆ 冒险倾向：你愿意挑战未知领域，边做边学。你更看重成长机会和探索空间。'
  }
}

export default function OPCTestResult() {
  const [scores, setScores] = useState<any>(null)
  const [initialScores, setInitialScores] = useState<any>(null)
  const [personalityTag, setPersonalityTag] = useState<any>(null)
  const [interpretations, setInterpretations] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [assessmentId, setAssessmentId] = useState<string>('')
  const [showComparison, setShowComparison] = useState(false)
  const [identityStatement, setIdentityStatement] = useState<string>('')  // 身份宣言
  const [peerStats, setPeerStats] = useState<any>(null)  // 同类数据

  // 动画状态
  const { currentStep, nextStep } = useAnimationSequence(4)
  const { displayText: typingDescription } = useTypingEffect(
    personalityTag?.description || '',
    30
  )

  useEffect(() => {
    // 从URL参数获取assessmentId
    const params = Taro.getCurrentInstance().router?.params
    if (params?.assessmentId) {
      setAssessmentId(params.assessmentId)
      loadResult(params.assessmentId)
    } else {
      // 如果没有传assessmentId，尝试获取最新结果
      loadLatestResult()
    }
  }, [])

  // 动画序列控制
  useEffect(() => {
    if (!loading && scores && personalityTag && currentStep === 0) {
      runRevealSequence()
    }
  }, [loading, scores, personalityTag])

  const runRevealSequence = async () => {
    // Step 1: 标签卡片弹出 (0.5s)
    await wait(500)
    nextStep()

    // Step 2: 描述打字机 (根据文字长度)
    await wait(personalityTag.description.length * 30 + 500)
    nextStep()

    // Step 3: 雷达图绘制 (1s)
    await wait(1000)
    nextStep()

    // Step 4: 其他内容渐显 (0.5s)
    await wait(500)
    nextStep()
  }

  const loadLatestResult = async () => {
    try {
      setLoading(true)
      const result = await opcV2API.getLatestResult()
      if (result.success && result.data) {
        displayResult(result.data)
      } else {
        Taro.showToast({ title: '暂无测试结果', icon: 'none' })
      }
    } catch (error) {
      console.error('加载结果失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const loadResult = async (id: string) => {
    try {
      setLoading(true)
      const result = await opcV2API.getResult(id)
      if (result.success && result.data) {
        displayResult(result.data)
      } else {
        Taro.showToast({ title: '加载失败', icon: 'none' })
      }
    } catch (error) {
      console.error('加载结果失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const displayResult = (result: any) => {
    // 提取分数
    const scoresData = {
      info_processing: result.abilityScores?.info_processing || 50,
      creation_drive: result.abilityScores?.creation_drive || 50,
      tool_learning: result.abilityScores?.tool_learning || 50,
      task_execution: result.abilityScores?.task_execution || 50,
      collaboration: result.abilityScores?.collaboration || 50,
      risk_attitude: result.abilityScores?.risk_attitude || 50
    }
    setScores(scoresData)

    // 如果有初始分数，用于对比
    if (result.initialScores) {
      setInitialScores(result.initialScores)
      setShowComparison(true)
    }

    // 提取人格标签
    const tag = result.personalityTag || 'balanced'
    const tagData = PERSONALITY_TAGS[tag] || PERSONALITY_TAGS.balanced
    setPersonalityTag({
      ...tagData,
      tag,
      trackRecommendations: result.trackRecommendations,
      selfPerceptionAnalysis: result.selfPerceptionAnalysis
    })

    // 提取身份宣言
    if (result.identityStatement) {
      setIdentityStatement(result.identityStatement)
    } else {
      // 如果后端没有返回，生成默认的身份宣言
      const defaultStatement = generateDefaultIdentityStatement(tag, tagData)
      setIdentityStatement(defaultStatement)
    }

    // 提取维度解读
    const interps = {}
    Object.keys(scoresData).forEach(dimension => {
      const score = scoresData[dimension]
      const level = score < 40 ? 'low' : score > 60 ? 'high' : 'mid'
      interps[dimension] = DIMENSION_INTERPRETATIONS[dimension]?.[level] || ''
    })

    // 如果有AI整体洞察
    if (result.overallInsight) {
      interps['overall'] = result.overallInsight
    }

    setInterpretations(interps)

    // 加载同类数据统计
    loadPeerStats(tag)
  }

  const loadPeerStats = async (tag: string) => {
    try {
      const result = await statsAPI.getPersonalityStats(tag)
      if (result) {
        setPeerStats(result)
      }
    } catch (error) {
      console.error('加载同类数据失败:', error)
      // 静默失败，不影响主流程
    }
  }

  const handleComplete = () => {
    // 提供多个后续选项
    Taro.showActionSheet({
      itemList: ['查看完整天赋画像', '浏览任务大厅', '返回首页'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 跳转到天赋画像页面
          Taro.navigateTo({ url: '/pages/talent-profile/index' })
        } else if (res.tapIndex === 1) {
          // 跳转到任务大厅
          Taro.switchTab({ url: '/pages/tasks/index' })
        } else if (res.tapIndex === 2) {
          // 返回首页
          Taro.switchTab({ url: '/pages/index/index' })
        }
      }
    })
  }

  const handleViewTalentProfile = () => {
    Taro.navigateTo({ url: '/pages/talent-profile/index' })
  }

  const handleBrowseTasks = () => {
    Taro.switchTab({ url: '/pages/tasks/index' })
  }

  const handleGenerateIdentityCard = async () => {
    try {
      Taro.showLoading({ title: '生成中...' })

      const response = await opcV2API.generateIdentityCard()

      Taro.hideLoading()

      if (response.success && response.data) {
        // 跳转到卡片详情页面
        Taro.navigateTo({
          url: `/packageOnboarding/pages/identity-card/index?cardId=${response.data.cardId}`
        })
      } else {
        throw new Error('生成失败')
      }
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: error.message || '生成失败',
        icon: 'none'
      })
    }
  }

  // AI等待页
  if (loading) {
    return <AIWaitingScreen stage="analyzing" visible={true} />
  }

  if (!scores || !personalityTag) {
    return (
      <View className="result-page">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className="result-page">
      <View className="result-container">
        {/* 标题区 */}
        <View className="header-section">
          <Text className="main-title">你的能力河流已生成</Text>
          <Text className="subtitle">这不是标签，是你的起点</Text>
        </View>

        {/* 人格标签卡片 - 带弹出动画 */}
        <View className={`personality-card ${currentStep >= 1 ? 'personality-card-show' : ''}`}>
          <View className="personality-badge">
            <Text className="badge-icon">◆</Text>
            <Text className="badge-text">{personalityTag.name}</Text>
          </View>

          {/* 描述 - 打字机效果 */}
          {currentStep >= 2 && (
            <Text className="personality-description">
              {typingDescription}
              {typingDescription.length < personalityTag.description.length && (
                <Text className="cursor">|</Text>
              )}
            </Text>
          )}

          {/* 身份宣言 - 在描述后显示 */}
          {currentStep >= 2 && identityStatement && (
            <View className="identity-statement">
              <View className="statement-divider" />
              <Text className="statement-icon">◆</Text>
              <Text className="statement-text">{identityStatement}</Text>
            </View>
          )}

          {/* 同类数据展示 */}
          {currentStep >= 2 && peerStats && peerStats.total_count > 0 && (
            <View className="peer-stats">
              <Text className="peer-stats-text">
                全国有 <Text className="peer-stats-highlight">{peerStats.total_count}</Text> 个和你一样的「{personalityTag.name}」
                {peerStats.first_task_completion_rate > 0 && (
                  <>
                    ，其中 <Text className="peer-stats-highlight">{peerStats.first_task_completion_rate}%</Text> 已经完成了第一单
                  </>
                )}
              </Text>
            </View>
          )}
        </View>

        {/* 六维雷达图 - 带动画 */}
        {currentStep >= 3 && (
          <View className="scores-section fade-in">
            <Text className="section-title">你的能力雷达图</Text>
            <Text className="section-subtitle">不是能力分数，是你的特点</Text>

            <RadarChart
              data={scores}
              compareData={showComparison ? initialScores : undefined}
              size={320}
              showLabels={true}
              animate={true}
            />

            {showComparison && (
              <View className="comparison-legend">
                <View className="legend-item">
                  <View className="legend-color" style={{ background: '#9370DB' }} />
                  <Text className="legend-text">当前能力</Text>
                </View>
                <View className="legend-item">
                  <View className="legend-color" style={{ background: '#CCCCCC' }} />
                  <Text className="legend-text">初始能力</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 其他内容 - 渐显 */}
        {currentStep >= 4 && (
          <View className="fade-in">
            {/* 能力资产卡片 */}
            <View className="river-section">
              <View className="river-card">
                <Text className="river-card-title">你的能力特点</Text>
                <View className="assets-list">
                  <View className="asset-item">
                    <Text className="asset-icon">◆</Text>
                    <Text className="asset-text">
                      {scores.info_processing >= 60 ? '你倾向整合式思维，能看到整体和各部分关系' : '你倾向拆解式思维，能把复杂问题切分成可执行步骤'}
                    </Text>
                  </View>
                  <View className="asset-item">
                    <Text className="asset-icon">◈</Text>
                    <Text className="asset-text">
                      {scores.creation_drive >= 60 ? '你更多用逻辑和结构思考，擅长系统化组织信息' : '你更多用视觉和画面思考，擅长将抽象概念具象化'}
                    </Text>
                  </View>
                  <View className="asset-item">
                    <Text className="asset-icon">▲</Text>
                    <Text className="asset-text">
                      {scores.risk_attitude >= 60 ? '你更愿意探索未知，在不确定中寻找可能性' : '你更注重稳健交付，在确定性中建立信任'}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="river-card river-card-highlight">
                <Text className="river-card-title">你可能在这些方向找到自己的路</Text>
                <Text className="river-card-content">
                  不是技能清单，是可能性地图。这些方向不是限制，是起点。
                </Text>
                <View className="direction-tags">
                  <View className="direction-tag">{personalityTag.track}</View>
                  <View className="direction-tag">{personalityTag.firstTask}</View>
                </View>
              </View>
            </View>

            {/* 维度解读 */}
            <View className="interpretations-section">
              <Text className="section-title">维度解读</Text>

              {/* AI洞察 */}
              {interpretations.overall && (
                <View className="interpretation-item ai-insights">
                  <Text className="interpretation-title">◆ AI导师的洞察</Text>
                  <Text className="interpretation-text">{interpretations.overall}</Text>
                </View>
              )}

              {/* 自我认知对比 */}
              {personalityTag.selfPerceptionAnalysis && (
                <View className="interpretation-item self-perception">
                  <Text className="interpretation-title">◈ 自我认知对比</Text>
                  <Text className="interpretation-text">{personalityTag.selfPerceptionAnalysis}</Text>
                </View>
              )}

              {/* 其他维度 */}
              {Object.keys(interpretations).filter(k => k !== 'overall').map(dimension => (
                <View key={dimension} className="interpretation-item">
                  <Text className="interpretation-title">{DIMENSION_NAMES[dimension]}</Text>
                  <Text className="interpretation-text">{interpretations[dimension]}</Text>
                </View>
              ))}
            </View>

            {/* AI赛道推荐 */}
            {personalityTag.trackRecommendations && personalityTag.trackRecommendations.length > 0 && (
              <View className="ai-track-recommendations">
                <Text className="section-title">▲ AI为你推荐的赛道</Text>
                {personalityTag.trackRecommendations.map((track, index) => (
                  <View key={index} className="ai-track-item">
                    <View className="track-header">
                      <Text className="track-name">{track.track}</Text>
                      <Text className="track-score">{Math.round(track.matchScore * 100)}%匹配</Text>
                    </View>
                    <Text className="track-reason">{track.reason}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 后续导航区域 */}
            <View className="next-steps-section">
              <Text className="section-title">接下来你可以</Text>

              <View className="action-cards">
                <View className="action-card" onClick={handleGenerateIdentityCard}>
                  <View className="action-icon">★</View>
                  <View className="action-content">
                    <Text className="action-title">生成身份卡片</Text>
                    <Text className="action-desc">制作专属身份卡片，分享你的能力画像</Text>
                  </View>
                  <Text className="action-arrow">›</Text>
                </View>

                <View className="action-card" onClick={() => Taro.navigateTo({ url: '/packageOnboarding/pages/growth-dashboard/index' })}>
                  <View className="action-icon">▲</View>
                  <View className="action-content">
                    <Text className="action-title">成长仪表盘</Text>
                    <Text className="action-desc">查看你的打卡天数、完成任务和成就</Text>
                  </View>
                  <Text className="action-arrow">›</Text>
                </View>

                <View className="action-card" onClick={() => Taro.navigateTo({ url: '/packageOnboarding/pages/deep-mode/index' })}>
                  <View className="action-icon">◆</View>
                  <View className="action-content">
                    <Text className="action-title">深度模式</Text>
                    <Text className="action-desc">对比过去与现在的六维能力变化</Text>
                  </View>
                  <Text className="action-arrow">›</Text>
                </View>

                <View className="action-card" onClick={handleViewTalentProfile}>
                  <View className="action-icon">◇</View>
                  <View className="action-content">
                    <Text className="action-title">查看完整天赋画像</Text>
                    <Text className="action-desc">深入了解你的能力资产和成长轨迹</Text>
                  </View>
                  <Text className="action-arrow">›</Text>
                </View>

                <View className="action-card" onClick={handleBrowseTasks}>
                  <View className="action-icon">○</View>
                  <View className="action-content">
                    <Text className="action-title">浏览任务大厅</Text>
                    <Text className="action-desc">找到适合你的第一个任务</Text>
                  </View>
                  <Text className="action-arrow">›</Text>
                </View>
              </View>
            </View>

            {/* 完成测评，返回主页 */}
            <View
              className="next-step-btn tap-effect"
              onClick={() => {
                // 标记测评已完成
                const userInfo = Taro.getStorageSync('userInfo') || {}
                Taro.setStorageSync('userInfo', {
                  ...userInfo,
                  hasCompletedOPC: true
                })
                Taro.switchTab({ url: '/pages/index/index' })
              }}
            >
              <Text className="btn-icon">◆</Text>
              <Text className="btn-text">完成测评，进入主页</Text>
            </View>

            {/* 完成按钮 - 胶囊型 */}
            <View className="complete-btn tap-effect" onClick={handleComplete}>
              <Text className="btn-text">更多选项</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

// 进度条组件 - 带绘制动画
function ScoreBar({ label, value, color, delay = 0 }) {
  const { current } = useNumberAnimation(value, 800)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <View className={`score-item ${show ? 'score-item-show' : ''}`}>
      <View className="score-header">
        <Text className="score-label">{label}</Text>
        <Text className="score-value">{Math.round(current)}</Text>
      </View>
      <View className="score-bar">
        <View
          className="score-fill"
          style={{
            width: `${current}%`,
            background: color,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </View>
    </View>
  )
}

// 辅助函数
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
