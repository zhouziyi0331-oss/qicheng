import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
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
    borderRadius: string
    opacity: number
  }>>([])

  useLoad((options) => {
    const level = parseInt(options.level || '1')
    const title = options.levelTitle || ''
    const perks = options.unlockedPerks ? JSON.parse(decodeURIComponent(options.unlockedPerks)) : []

    setLevelInfo({
      level,
      title,
      perks
    })

    generateParticles()
  })


  const generateParticles = () => {
    const colors = ['#F2CD78', '#D88760', '#BC6446', '#BED7D1', '#BF9E71', '#F5E8D8', '#EDD0B0']
    const newParticles = []

    for (let i = 0; i < 36; i++) {
      const isSquare = Math.random() > 0.6
      newParticles.push({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 2.5,
        duration: 3.5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        borderRadius: isSquare ? '2px' : '50%',
        opacity: 0.35 + Math.random() * 0.65
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
    <View className="done-wrap">
      {/* 背景光晕 */}
      <View className="done-halo-bg" />

      {/* 粒子 */}
      <View className="done-particles">
        {particles.map((p) => (
          <View
            key={p.id}
            className="dp"
            style={{
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              borderRadius: p.borderRadius,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: p.opacity
            }}
          />
        ))}
      </View>

      {/* 主内容 */}
      <View className="done-inner">
        {/* 光晕 + 数字 */}
        <View className="done-halo-wrap">
          <View className="done-halo-outer" />
          <View className="done-halo-mid" />
          <View className="done-ring">
            <Text className="done-num">{levelInfo.level}</Text>
            <Text className="done-lv">LEVEL</Text>
          </View>
        </View>

        <Text className="done-title">走，Lv.{levelInfo.level} 了</Text>
        <Text className="done-sub">
          {levelInfo.level === 1 && '一单，从"我不知道怎么做"\n到"我做完了"。\n这是真的。'}
          {levelInfo.level === 2 && '三单，从"我不知道怎么做"\n到"自己做完了"。\n这是真的。'}
          {levelInfo.level === 3 && '五单，从开始到现在，\n你还在做。\n这就够了。'}
          {levelInfo.level === 4 && '八单，你已经不是\n在被标准推着走了。'}
          {levelInfo.level === 5 && '十单，这条路\n你已经走完了。'}
        </Text>

        <View className="done-divider" />

        {/* 解锁权益 */}
        {levelInfo.perks.length > 0 && (
          <View className="done-perks">
            <Text className="done-perks-title">Lv.{levelInfo.level} 解锁</Text>
            {levelInfo.perks.map((perk, index) => (
              <View key={index} className="done-perk">
                <View className="done-perk-dot" />
                <Text className="done-perk-text">{perk}</Text>
              </View>
            ))}
          </View>
        )}

        <Button className="done-btn" onClick={handleContinue}>
          继续接单
        </Button>
      </View>
    </View>
  )
}
