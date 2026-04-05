import { View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import './index.scss'

const loadingTexts = [
  '🐱 小猫正在努力加载中...',
  '✨ 正在为你打开新世界的大门...',
  '🚀 马上就好，别眨眼...',
  '🎨 正在绘制你的专属画面...',
  '🌟 启程即将开始...',
  '💫 好东西值得等待...',
  '🎯 正在寻找最适合你的任务...',
  '🌈 彩虹的尽头就在前方...'
]

interface LoadingProps {
  text?: string
}

export default function Loading({ text }: LoadingProps) {
  const [currentText, setCurrentText] = useState(text || loadingTexts[0])
  const [textIndex, setTextIndex] = useState(0)

  useEffect(() => {
    if (text) return

    const interval = setInterval(() => {
      setTextIndex(prev => {
        const next = (prev + 1) % loadingTexts.length
        setCurrentText(loadingTexts[next])
        return next
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [text])

  return (
    <View className="loading-container">
      <View className="loading-cat">🐱</View>
      <View className="loading-dots">
        <View className="dot"></View>
        <View className="dot"></View>
        <View className="dot"></View>
      </View>
      <View className="loading-text">{currentText}</View>
    </View>
  )
}
