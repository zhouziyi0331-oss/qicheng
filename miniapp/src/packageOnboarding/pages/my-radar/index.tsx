import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import RadarChart from '../../../components/RadarChart'
import './index.scss'

// 7种人格类型定义（从HTML文档）
const PERSONALITY_TYPES = [
  {
    id: 0,
    name: '视觉叙事者',
    en: 'Visual Storyteller',
    icon: '◆',
    traits: ['信息处理强', '创作驱动高', '任务执行力突出'],
    desc: '你天生擅长将复杂的信息转化为直观的视觉语言。你的信息处理能力和创作驱动力都很强，能够快速捕捉模式，并用独特的方式表达出来。',
    insight: '你的任务执行（85）和信息处理（82）是最突出的优势。你能快速理解复杂信息并高效推进任务，是团队的"执行力+创作者"。建议关注风险承受度（58）的提升——适度拥抱不确定性，会让你的创作驱动力得到更大释放。'
  },
  {
    id: 1,
    name: '系统构建者',
    en: 'System Builder',
    icon: '▲',
    traits: ['工具学习最强', '任务执行稳健', '风险承受度理性'],
    desc: '你擅长构建清晰的系统和框架，把混乱的信息整理成可运行的结构。你的工具学习能力最强，能快速掌握新工具并将其整合进你的工作体系。',
    insight: '你的工具学习（88）和任务执行（82）是核心优势。你是天生的"架构师"，擅长将复杂系统拆解并重建。建议在创作驱动（55）上多加探索——你的系统思维一旦与创意结合，会产生最强的竞争力。'
  },
  {
    id: 2,
    name: '创意执行者',
    en: 'Creative Executor',
    icon: '○',
    traits: ['创作驱动最强', '任务执行力强', '风险承受度开放'],
    desc: '你的创作驱动力最强，能在短时间内产出大量高质量的创意内容。你不仅有想法，还能把想法落地执行，是少见的"创意+执行"双强型人才。',
    insight: '你的创作驱动（92）是所有类型中最突出的。你天生就是创造者，能把脑中的想法转化为真实的作品。建议在信息处理（65）上加强——更系统地整理创意素材，会让你的产出质量再上一个台阶。'
  },
  {
    id: 3,
    name: '逻辑拆解者',
    en: 'Logic Analyzer',
    icon: '◇',
    traits: ['信息处理最强', '工具学习稳健', '逻辑思维突出'],
    desc: '你擅长将复杂问题拆解成清晰的逻辑链条，找到问题的根本原因。你的信息处理能力最强，能在大量信息中快速识别关键模式和缺陷。',
    insight: '你的信息处理（88）是核心优势，你是天生的"问题诊断师"。你能看到别人看不到的逻辑漏洞和系统缺陷。建议在协作倾向（60）上多加投入——你的分析能力一旦与团队协作结合，影响力会成倍放大。'
  },
  {
    id: 4,
    name: '稳健交付者',
    en: 'Reliable Deliverer',
    icon: '▼',
    traits: ['任务执行最强', '协作倾向高', '工具学习稳健'],
    desc: '你是团队中最可靠的人。一旦承诺，你就会全力以赴完成，不达目标不罢休。你的任务执行力最强，能在复杂环境中保持稳定的高质量输出。',
    insight: '你的任务执行（92）是所有类型中最突出的。你是团队的"定海神针"，在关键时刻总能稳定交付。建议在风险承受度（55）上做一些突破——适度拥抱不确定性，会让你从"执行者"成长为"领导者"。'
  },
  {
    id: 5,
    name: '探索整合者',
    en: 'Explorer Integrator',
    icon: '◈',
    traits: ['协作倾向最强', '风险承受度开放', '整合能力突出'],
    desc: '你天生擅长连接不同的人、想法和资源，把分散的元素整合成完整的整体。你的协作倾向和风险承受度都很高，能在不确定的环境中推动多方协作。',
    insight: '你的协作倾向（88）和风险承受度（82）是核心优势。你是天生的"连接者"，能在复杂的人际网络中找到协作机会。建议在任务执行（68）上加强——更强的执行力会让你从"整合者"升级为"推动者"。'
  },
  {
    id: 6,
    name: '混合型',
    en: 'Hybrid Type',
    icon: '◐',
    traits: ['六维均衡', '适应性强', '多面手'],
    desc: '你的六维能力分布非常均衡，没有特别突出的短板，也没有极端的峰值。这种均衡型特质让你能够适应多种角色，在不同场景下都能发挥稳定的价值。',
    insight: '你的六维能力分布非常均衡，这是一种稀有的特质。你能在不同场景下灵活切换角色，是团队中不可或缺的"万能牌"成员。建议选择1-2个维度重点突破，让均衡的基础上出现一个"小峰"，会让你的竞争力更加突出。'
  }
]

export default function MyRadar() {
  const [currentScores, setCurrentScores] = useState({
    information_processing: 82,
    creation_drive: 75,
    tool_learning: 68,
    task_execution: 85,
    collaboration: 72,
    risk_attitude: 58
  })

  const [personalityType, setPersonalityType] = useState(PERSONALITY_TYPES[0])

  const dimensionNames = [
    '信息处理',
    '创作驱动',
    '工具学习',
    '任务执行',
    '协作倾向',
    '风险态度'
  ]

  const dimensionColors = [
    '#BC6446',
    '#D88760',
    '#3A8A84',
    '#5B8FAB',
    '#BF9E71',
    '#9B8EC4'
  ]

  const dimensionGrads = [
    'linear-gradient(90deg, #D88760, #BC6446)',
    'linear-gradient(90deg, #F2CD78, #D88760)',
    'linear-gradient(90deg, #BED7D1, #3A8A84)',
    'linear-gradient(90deg, #93AEC1, #5B8FAB)',
    'linear-gradient(90deg, #F2CD78, #BF9E71)',
    'linear-gradient(90deg, #C4B8E8, #9B8EC4)'
  ]

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="my-radar-page">
      {/* 顶部栏 - 按HTML S6设计 */}
      <View className="radar-header">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="header-title">六维能力雷达</Text>
        <View className="type-badge">
          <Text className="badge-text">{personalityType.name}</Text>
        </View>
      </View>

      <View className="header-subtitle">
        <Text className="subtitle-text">信息处理 · 创作驱动 · 工具学习 · 任务执行 · 协作倾向 · 风险态度</Text>
      </View>

      <ScrollView className="scroll-area" scrollY>
        {/* 雷达图卡片 */}
        <View className="radar-card">
          <RadarChart
            data={currentScores}
            size={480}
            showLabels={true}
            animate={true}
          />
        </View>

        {/* 维度徽章详情 */}
        <View className="dimensions-card">
          <View className="card-header">
            <View className="section-indicator" />
            <Text className="card-title">维度徽章详情</Text>
          </View>
          <View className="dimension-bars">
            {Object.values(currentScores).map((score, index) => (
              <View key={index} className="dimension-item">
                <View className="dimension-header">
                  <View className="dimension-label">
                    <View
                      className="dimension-dot"
                      style={{ background: dimensionColors[index] }}
                    />
                    <Text className="dimension-name">{dimensionNames[index]}</Text>
                  </View>
                  <Text
                    className="dimension-score"
                    style={{ color: dimensionColors[index] }}
                  >
                    {score}
                  </Text>
                </View>
                <View className="dimension-bar">
                  <View
                    className="bar-fill"
                    style={{
                      width: `${score}%`,
                      background: dimensionGrads[index]
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* AI能力洞察 */}
        <View className="insight-card">
          <View className="insight-header">
            <Text className="insight-icon">◆</Text>
            <Text className="insight-title">AI 能力洞察</Text>
          </View>
          <Text className="insight-text">{personalityType.insight}</Text>
        </View>

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}
