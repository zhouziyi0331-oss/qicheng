import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import './index.scss'

interface TaskData {
  id: number
  name: string
  description: string
  reward: number
  status: 'done' | 'active' | 'pending'
}

interface LevelData {
  name: string
  englishName: string
  phase: string
  description: string
  abilities: string[]
  abilityColors: Array<'' | 'mist' | 'golden' | 'blue'>
  tasks: TaskData[]
  rewards: { coins: string; badge: string; nextLevel: string }
  progress: { current: number; total: number }
  mentorAdvice: string
}

interface TrackConfig {
  [key: string]: {
    [level: number]: LevelData
  }
}

export default function LevelDetail() {
  const [level, setLevel] = useState(2)
  const [track, setTrack] = useState('content')

  const trackConfig: TrackConfig = {
    content: {
      2: {
        name: '实践者',
        englishName: 'Practitioner',
        phase: '内容创作赛道 · 第三阶段',
        description: '能够使用 AI 工具生成完整剧情短视频、短篇内容作品，并独立完成品牌基础宣传内容的策划与制作，具备初步的商业内容交付能力。',
        abilities: ['AI 剧情短视频', '短篇内容作品', '品牌宣传内容', '脚本策划', '视觉风格设计', '内容交付'],
        abilityColors: ['', 'mist', 'golden', '', 'mist', 'golden'],
        tasks: [
          { id: 1, name: 'AI 短视频脚本创作', description: '使用 AI 工具完成一个 60 秒剧情短视频的完整脚本，包含分镜描述', reward: 120, status: 'done' },
          { id: 2, name: 'AI 视频素材生成', description: '使用 Runway / 即梦等工具生成视频素材，完成剪辑合成', reward: 150, status: 'done' },
          { id: 3, name: '品牌宣传内容策划', description: '为真实品牌客户策划一套基础宣传内容方案，包含文案 + 视觉', reward: 200, status: 'active' },
          { id: 4, name: '短篇内容作品发布', description: '在小红书 / 抖音发布一篇完整内容作品，获得真实用户反馈', reward: 180, status: 'pending' },
          { id: 5, name: 'Lv.2 综合测评', description: '提交完整作品集，通过 AI 导师综合评估，解锁 Lv.3', reward: 350, status: 'pending' }
        ],
        rewards: { coins: '+300', badge: '实践者', nextLevel: 'Lv.3' },
        progress: { current: 680, total: 1000 },
        mentorAdvice: '你的脚本创作能力已经很扎实了！现在最关键的是品牌宣传内容策划这个任务。建议你先研究 3 个同类品牌的内容风格，再动手策划，这样方案会更有说服力。加油！◇'
      }
    },
    dev: {
      3: {
        name: '熟练者',
        englishName: 'Proficient',
        phase: '工具开发赛道 · 第四阶段',
        description: '能够搭建基础智能 Agent 应用，开发行业轻量化自动化工作流工具，具备将业务需求转化为可落地 AI 产品的能力。',
        abilities: ['智能 Agent 搭建', '自动化工作流', '行业场景落地', 'Coze / Dify', 'n8n 工作流', '需求分析'],
        abilityColors: ['', 'blue', 'golden', '', 'blue', 'golden'],
        tasks: [
          { id: 1, name: 'Agent 基础搭建', description: '在 Coze 平台搭建一个具备多轮对话能力的基础 Agent，完成功能测试', reward: 150, status: 'done' },
          { id: 2, name: '工作流节点设计', description: '使用 n8n 设计一个包含 5+ 节点的自动化工作流，实现数据自动处理', reward: 180, status: 'done' },
          { id: 3, name: '行业场景 Agent 开发', description: '针对真实行业场景（如客服、销售、HR）开发一个可落地的 Agent 应用', reward: 250, status: 'active' },
          { id: 4, name: '工具交付与用户测试', description: '将开发的工具交付给真实用户使用，收集反馈并完成迭代优化', reward: 200, status: 'pending' },
          { id: 5, name: 'Lv.3 综合测评', description: '提交完整工具作品集，通过 AI 导师综合评估，解锁 Lv.4', reward: 420, status: 'pending' }
        ],
        rewards: { coins: '+600', badge: '熟练者', nextLevel: 'Lv.4' },
        progress: { current: 520, total: 1000 },
        mentorAdvice: '你的工作流设计能力已经很扎实了！现在最关键的是行业场景 Agent 开发这个任务。建议你先做一个客服场景的 Agent，需求明确、验证快，是最好的练手项目。加油！▲'
      }
    }
  }

  const getLevelData = (): LevelData => {
    return trackConfig[track]?.[level] || trackConfig.content[2]
  }

  const levelData = getLevelData()
  const progressPercent = Math.round((levelData.progress.current / levelData.progress.total) * 100)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.level) {
      setLevel(parseInt(params.level))
    }
    if (params?.track) {
      setTrack(params.track)
    }

    const lvl = params?.level || 2
    const levelName = trackConfig[params?.track || 'content']?.[parseInt(lvl)]?.name || '实践者'
    Taro.setNavigationBarTitle({ title: `Lv.${lvl} · ${levelName}` })
  }, [])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleContinueTask = () => {
    Taro.showToast({ title: '功能开发中', icon: 'none' })
  }

  return (
    <View className={`level-detail-page ${track === 'dev' ? 'dev-track' : ''}`}>
      {/* Status Bar */}
      <View className="status-bar" />

      {/* Top Bar */}
      <View className="top-bar">
        <View className="tb-back" onClick={handleBack}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="tb-title">Lv.{level} · {levelData.name}</Text>
        <View className="tb-actions">
          <View className="icon-btn">
            <Text className="icon-text">⋯</Text>
          </View>
        </View>
      </View>

      {/* Hero */}
      <View className={`lv-detail-hero ${track === 'dev' ? 'dev-hero' : ''}`}>
        <View className="lv-hero-top">
          <View className={`lv-hero-badge ${track === 'dev' ? 'dev-badge' : ''}`}>
            <Text className="lv-hero-badge-num">{level}</Text>
          </View>
          <View className="lv-hero-info">
            <Text className={`lv-hero-level ${track === 'dev' ? 'dev-level' : ''}`}>{levelData.phase}</Text>
            <Text className="lv-hero-name">{levelData.name}</Text>
            <Text className="lv-hero-sub">{levelData.englishName} · 进行中</Text>
          </View>
        </View>
        <Text className="lv-hero-desc">{levelData.description}</Text>
      </View>

      {/* Body */}
      <ScrollView className="scroll-area" scrollY>
        <View className="lv-detail-body">
          {/* 核心能力标签 */}
          <View className="card">
            <View className="sec-header">
              <Text className="sec-title">◆ 核心能力边界</Text>
            </View>
            <View className="ability-tags">
              {levelData.abilities.map((ability, idx) => (
                <View key={idx} className={`ability-tag ${levelData.abilityColors[idx] ? levelData.abilityColors[idx] + '-tag' : ''}`}>
                  <Text className="tag-text">{ability}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 进度 */}
          <View className="card">
            <View className="sec-header">
              <Text className="sec-title">● 当前进度</Text>
              <Text className={`progress-percent ${track === 'dev' ? 'dev-progress' : ''}`}>{progressPercent}%</Text>
            </View>
            <View className="prog-bar-wrapper">
              <View className="prog-bar">
                <View className={`prog-fill ${track === 'dev' ? 'dev-prog-fill' : ''}`} style={{ width: `${progressPercent}%` }} />
              </View>
            </View>
            <View className="progress-labels">
              <Text className="label-left">已完成 {levelData.progress.current} XP</Text>
              <Text className="label-right">目标 {levelData.progress.total} XP</Text>
            </View>
          </View>

          {/* 任务清单 */}
          <View className="card">
            <View className="sec-header">
              <Text className="sec-title">▪ 阶段任务</Text>
            </View>
            <View className="task-list">
              {levelData.tasks.map(task => (
                <View key={task.id} className={`task-item ${task.status}-task ${track === 'dev' && task.status === 'active' ? 'dev-active-task' : ''}`}>
                  <View className={`task-num ${task.status}-num ${track === 'dev' && task.status === 'active' ? 'dev-active-num' : ''} ${track === 'dev' && task.status === 'done' ? 'dev-done-num' : ''}`}>
                    <Text className="num-text">
                      {task.status === 'done' ? '✓' : task.id}
                    </Text>
                  </View>
                  <View className="task-content">
                    <Text className="task-name">{task.name}</Text>
                    <Text className="task-desc">{task.description}</Text>
                    <Text className={`task-reward ${task.status === 'pending' ? 'pending-reward' : ''} ${track === 'dev' && task.status !== 'pending' ? 'dev-reward' : ''}`}>
                      ● +{task.reward} XP · {task.status === 'done' ? '已完成' : task.status === 'active' ? '进行中' : '待解锁'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 升级奖励 */}
          <View className="card">
            <View className="sec-header">
              <Text className="sec-title">◆ 升级奖励</Text>
            </View>
            <View className="reward-grid">
              <View className="reward-item">
                <Text className="reward-icon">●</Text>
                <Text className={`reward-val ${track === 'dev' ? 'dev-reward-val' : ''}`}>{levelData.rewards.coins}</Text>
                <Text className="reward-label">平台积分</Text>
              </View>
              <View className="reward-item">
                <Text className="reward-icon">◆</Text>
                <Text className={`reward-val ${track === 'dev' ? 'dev-reward-val' : ''}`}>{levelData.rewards.badge}</Text>
                <Text className="reward-label">专属徽章</Text>
              </View>
              <View className="reward-item">
                <Text className="reward-icon">○</Text>
                <Text className={`reward-val ${track === 'dev' ? 'dev-reward-val' : ''}`}>{levelData.rewards.nextLevel}</Text>
                <Text className="reward-label">解锁{track === 'dev' ? '专业者' : '熟练者'}</Text>
              </View>
            </View>
          </View>

          {/* AI 导师建议 */}
          <View className={`card mentor-advice ${track === 'dev' ? 'dev-mentor' : ''}`}>
            <View className="sec-header">
              <Text className="sec-title">○ AI 导师建议</Text>
            </View>
            <Text className="mentor-text">
              {levelData.mentorAdvice}
            </Text>
          </View>

          <View className="bottom-btn-wrapper">
            <View className={`btn-primary ${track === 'dev' ? 'dev-btn' : ''}`} onClick={handleContinueTask}>
              <Text className="btn-text">▶ 继续当前任务</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
