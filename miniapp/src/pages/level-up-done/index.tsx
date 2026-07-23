import { View, Text, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import catLogo from '../../assets/images/cat-logo.png'
import './index.scss'

interface LevelInfo {
  level: number
  title: string
  perks: string[]
}

export default function LevelUpDone() {
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [particles, setParticles] = useState<Array<{
    id: number
    left: string
    size: number
    delay: number
    duration: number
    color: string
  }>>([])

  useLoad((options) => {
    const level = parseInt(options.level || '1')
    initLevelInfo(level)
    generateParticles()
  })

  const initLevelInfo = (level: number) => {
    const levelMap = {
      1: {
        level: 1,
        title: '初探者',
        perks: [
          '可接"入门文案"类任务',
          '匹配池扩大 · 更多客户可见你',
          '解锁"成长故事"发布权'
        ]
      },
      2: {
        level: 2,
        title: '实践者',
        perks: [
          '可接"进阶文案"类任务',
          '匹配池扩大 · 更多客户可见你',
          '解锁"擅长领域"标记权'
        ]
      },
      3: {
        level: 3,
        title: '专注者',
        perks: [
          '可接"专业创作"类任务',
          '优先匹配相关领域客户',
          '解锁"作品集"展示权'
        ]
      },
      4: {
        level: 4,
        title: '匠人',
        perks: [
          '可接"高阶定制"类任务',
          '客户可主动邀约合作',
          '解锁"品质认证"标识'
        ]
      },
      5: {
        level: 5,
        title: '引路人',
        perks: [
          '可接"全类型"任务',
          '可带新人（导师身份）',
          '解锁"成长导师"标识'
        ]
      }
    }

    setLevelInfo(levelMap[level] || levelMap[1])
  }

  const generateParticles = () => {
    const colors = ['#F2CD78', '#D88760', '#BC6446', '#BED7D1', '#BF9E71', '#F5E8D8', '#EDD0B0']
    const newParticles = []

    for (let i = 0; i < 36; i++) {
      newParticles.push({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 2.5,
        duration: 3.5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    setParticles(newParticles)
  }

  const handleContinue = () => {
    Taro.reLaunch({
      url: '/pages/index/index'
    })
  }

  if (!levelInfo) {
    return <View className="level-up-done"></View>
  }

  return (
    <View className="level-up-done">
      {/* 粒子背景 */}
      <View className="particles">
        {particles.map((p) => (
          <View
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              borderRadius: Math.random() > 0.6 ? '4px' : '50%'
            }}
          ></View>
        ))}
      </View>

      {/* 主内容 */}
      <View className="content">
        {/* 光环 + 等级圆环 */}
        <View className="halo-wrap">
          <View className="halo-outer"></View>
          <View className="halo-mid"></View>
          <View className="ring">
            <Image src={catLogo} className="ring-logo" mode="aspectFit" />
            <Text className="ring-level">LEVEL</Text>
            <Text className="ring-number">{levelInfo.level}</Text>
          </View>
        </View>

        {/* 标题 */}
        <Text className="title">走，Lv.{levelInfo.level} 了</Text>
        <Text className="subtitle">
          {levelInfo.level === 1 && '一单，从"不知道怎么做"\n到"自己做完了"。\n这是真的。'}
          {levelInfo.level === 2 && '三单，从"不知道怎么做"\n到"自己做完了"。\n这是真的。'}
          {levelInfo.level === 3 && '五单，你开始知道\n自己擅长什么了。'}
          {levelInfo.level === 4 && '八单，你有了\n自己的标准。'}
          {levelInfo.level === 5 && '十单，你可以\n带别人了。'}
        </Text>

        {/* 分隔线 */}
        <View className="divider"></View>

        {/* 权益卡片 */}
        <View className="perks">
          <Text className="perks-title">Lv.{levelInfo.level} 解锁</Text>
          {levelInfo.perks.map((perk, index) => (
            <View key={index} className="perk">
              <View className="perk-dot"></View>
              <Text className="perk-text">{perk}</Text>
            </View>
          ))}
        </View>

        {/* 按钮 */}
        <View className="button" onClick={handleContinue}>
          继续接单
        </View>
      </View>
    </View>
  )
}
