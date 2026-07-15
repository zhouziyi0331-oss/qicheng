import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import './index.scss'

interface RewardData {
  icon: string
  value: string
  label: string
}

interface LevelUpData {
  name: string
  description: string
  rewards: {
    coins: string
    badge: string
    unlock: string
  }
  theme: 'content' | 'dev'
  intensity: 'light' | 'medium' | 'deep' | 'deeper' | 'deepest'
  congratsText: string
}

export default function LevelUpCeremony() {
  const router = useRouter()
  const { level = '2', track = 'content' } = router.params
  const levelNum = parseInt(level)
  const [theme, setTheme] = useState<'content' | 'dev'>('content')
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'deep' | 'deeper' | 'deepest'>('light')

  // 完整的等级配置数据
  const levelConfig: { [key: string]: { [level: number]: LevelUpData } } = {
    content: {
      0: {
        name: '探索者',
        description: '你现在可以使用 AI 辅助生成单张配图、基础推文文案了',
        rewards: { coins: '+100', badge: '探索者', unlock: '配图生成' },
        theme: 'content',
        intensity: 'light',
        congratsText: '◇ 初次启程!'
      },
      1: {
        name: '入门者',
        description: '你现在可以使用 AI 生成系列配图、短视频基础脚本了',
        rewards: { coins: '+200', badge: '入门者', unlock: '短视频脚本' },
        theme: 'content',
        intensity: 'light',
        congratsText: '◇ 初露锋芒!'
      },
      2: {
        name: '实践者',
        description: '你现在可以使用 AI 生成完整剧情短视频、品牌基础宣传内容了',
        rewards: { coins: '+300', badge: '实践者', unlock: '剧情短视频' },
        theme: 'content',
        intensity: 'medium',
        congratsText: '◇ 稳步前进!'
      },
      3: {
        name: '熟练者',
        description: '你现在可以创作系列 IP 内容和完整新媒体内容矩阵了',
        rewards: { coins: '+500', badge: '熟练者', unlock: 'IP 创作' },
        theme: 'content',
        intensity: 'deep',
        congratsText: '◇ 熟练进阶!'
      },
      4: {
        name: '专业者',
        description: '你现在可以独立搭建品牌内容矩阵，落地商业化运营了',
        rewards: { coins: '+600', badge: '专业者', unlock: '品牌矩阵' },
        theme: 'content',
        intensity: 'deeper',
        congratsText: '◇ 专业突破!'
      },
      5: {
        name: '独立 OPC',
        description: '你现在可以独立承接商业定制项目、打造个人 IP 了',
        rewards: { coins: '+1000', badge: 'OPC大师', unlock: '商业定制' },
        theme: 'content',
        intensity: 'deepest',
        congratsText: '◆ 荣耀毕业!'
      }
    },
    dev: {
      0: {
        name: '探索者',
        description: '你现在可以使用 AI 辅助完成文档优化、数据整理、基础表格制作了',
        rewards: { coins: '+100', badge: '探索者', unlock: '文档优化' },
        theme: 'dev',
        intensity: 'light',
        congratsText: '▲ 开始征程!'
      },
      1: {
        name: '入门者',
        description: '你现在可以使用 AI 生成简易实用小工具、基础功能小程序了',
        rewards: { coins: '+200', badge: '入门者', unlock: '实用小工具' },
        theme: 'dev',
        intensity: 'light',
        congratsText: '◇ LEVEL UP!'
      },
      2: {
        name: '实践者',
        description: '你现在可以搭建具备独立落地功能的小程序、轻量化办公自动化工具了',
        rewards: { coins: '+300', badge: '实践者', unlock: '自动化工具' },
        theme: 'dev',
        intensity: 'medium',
        congratsText: '◇ LEVEL UP!'
      },
      3: {
        name: '熟练者',
        description: '你现在可以搭建基础智能 Agent 应用、行业轻量化自动化工作流工具了',
        rewards: { coins: '+500', badge: '熟练者', unlock: 'Agent 应用' },
        theme: 'dev',
        intensity: 'deep',
        congratsText: '◇ LEVEL UP!'
      },
      4: {
        name: '专业者',
        description: '你现在可以开发复杂智能 Agent、全流程自动化工作流、定制化 AI 工具了',
        rewards: { coins: '+600', badge: '专业者', unlock: '企业级工具' },
        theme: 'dev',
        intensity: 'deeper',
        congratsText: '◇ LEVEL UP!'
      },
      5: {
        name: '独立 OPC',
        description: '你现在可以独立落地商业化 AI 工具、承接企业定制化开发订单了',
        rewards: { coins: '+1000', badge: 'OPC大师', unlock: '大师生态' },
        theme: 'dev',
        intensity: 'deepest',
        congratsText: '◆ LEVEL UP!'
      }
    }
  }

  const getLevelData = (): LevelUpData => {
    return levelConfig[track]?.[levelNum] || levelConfig.content[0]
  }

  const levelData = getLevelData()

  useEffect(() => {
    setTheme(levelData.theme)
    setIntensity(levelData.intensity)
  }, [levelData])

  const rewards: RewardData[] = [
    {
      icon: '●',
      value: levelData.rewards.coins,
      label: '平台积分'
    },
    {
      icon: '◆',
      value: levelData.rewards.badge,
      label: '专属徽章'
    },
    {
      icon: '○',
      value: levelData.rewards.unlock,
      label: '新能力解锁'
    }
  ]

  const handleContinue = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const trackName = track === 'dev' ? '工具开发赛道' : '内容创作赛道'

  return (
    <View className={`levelup-page ${theme === 'dev' ? 'dev-theme' : `content-level-${levelNum}`}`}>
      {/* Status Bar */}
      <View className="status-bar">
        <Text className="time">9:41</Text>
        <View className="icons">
          <Text className="icon-text">●●●●</Text>
        </View>
      </View>

      {/* Level Up Background */}
      <View className={`levelup-bg ${theme === 'dev' ? `dev-bg dev-bg-${intensity}` : ''}`}>
        {/* Particles */}
        <View className="lu-particles">
          <View className={`lu-particle p1 ${theme === 'dev' ? 'dev-particle' : ''}`} />
          <View className={`lu-particle p2 ${theme === 'dev' ? 'dev-particle' : ''}`} />
          <View className={`lu-particle p3 ${theme === 'dev' ? 'dev-particle' : ''}`} />
          <View className={`lu-particle p4 ${theme === 'dev' ? 'dev-particle' : ''}`} />
          <View className={`lu-particle p5 ${theme === 'dev' ? 'dev-particle' : ''}`} />
          <View className={`lu-particle p6 ${theme === 'dev' ? 'dev-particle' : ''}`} />
        </View>
        <View className={`lu-glow ${theme === 'dev' ? `dev-glow dev-glow-${intensity}` : `content-glow-${levelNum}`}`} />

        {/* Badge */}
        <View className="lu-badge-wrap">
          <View className={`lu-badge ${theme === 'dev' ? `dev-badge dev-badge-${intensity}` : `content-badge-${levelNum}`}`}>
            <Text className="lu-badge-num">{levelNum}</Text>
          </View>
        </View>

        {/* Text */}
        <Text className={`lu-congrats ${theme === 'dev' ? 'dev-congrats' : `content-congrats-${levelNum}`} ${levelNum >= 4 ? 'golden-text' : ''}`}>
          {levelData.congratsText}
        </Text>
        <Text className="lu-title">
          {levelNum === 0 && track === 'dev' ? '欢迎来到' : '恭喜升级！'}
          {'\n'}
          {levelNum === 0 && track === 'dev' ? '工具开发赛道' : `你已成为${levelData.name}`}
        </Text>
        <Text className="lu-sub">
          {trackName} · Lv.{levelNum}{'\n'}
          {levelData.description}
        </Text>

        {/* Rewards */}
        <View className="lu-rewards">
          {rewards.map((reward, idx) => (
            <View key={idx} className="lu-reward-item">
              <Text className="lu-reward-icon">{reward.icon}</Text>
              <Text className={`lu-reward-val ${theme === 'dev' ? 'dev-reward-val' : `content-reward-${levelNum}`} ${levelNum >= 4 ? 'golden-val' : ''}`}>
                {reward.value}
              </Text>
              <Text className="lu-reward-label">{reward.label}</Text>
            </View>
          ))}
        </View>

        {/* Button */}
        <View className={`lu-btn ${theme === 'dev' ? 'dev-btn' : `content-btn-${levelNum}`}`} onClick={handleContinue}>
          <Text className="lu-btn-text">◇ 开启 Lv.{levelNum} 之旅</Text>
        </View>
      </View>
    </View>
  )
}
