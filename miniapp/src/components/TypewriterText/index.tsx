import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

interface TypewriterTextProps {
  text: string
  speed?: number // 每个字符的延迟时间（毫秒）
  onComplete?: () => void
  className?: string
}

export default function TypewriterText({
  text,
  speed = 30,
  onComplete,
  className = ''
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else if (!isComplete && text.length > 0) {
      setIsComplete(true)
      onComplete?.()
    }
  }, [currentIndex, text, speed, isComplete, onComplete])

  // 如果文本改变，重置状态
  useEffect(() => {
    setDisplayText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  return (
    <View className={`typewriter-text ${className}`}>
      <Text className="typewriter-content">{displayText}</Text>
      {!isComplete && <Text className="typewriter-cursor">▋</Text>}
    </View>
  )
}
