import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

interface TypewriterProps {
  text: string
  speed?: number
  delay?: number
  onComplete?: () => void
  className?: string
}

/**
 * 打字机效果组件
 * @param text - 要显示的文字
 * @param speed - 打字速度（毫秒/字），默认100ms
 * @param delay - 开始前延迟（毫秒），默认0ms
 * @param onComplete - 完成回调
 * @param className - 自定义样式类名
 */
export default function Typewriter({
  text,
  speed = 100,
  delay = 0,
  onComplete,
  className = ''
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isStarted, setIsStarted] = useState(false)

  useEffect(() => {
    // 延迟开始
    if (delay > 0 && !isStarted) {
      const delayTimer = setTimeout(() => {
        setIsStarted(true)
      }, delay)
      return () => clearTimeout(delayTimer)
    } else {
      setIsStarted(true)
    }
  }, [delay, isStarted])

  useEffect(() => {
    if (!isStarted) return

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else if (currentIndex === text.length && onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, isStarted, onComplete])

  return (
    <Text className={`typewriter-text ${className}`}>
      {displayText}
      {currentIndex < text.length && <Text className="typewriter-cursor">|</Text>}
    </Text>
  )
}

// 使用示例：
// <Typewriter text="欢迎来到成长旅程" speed={80} delay={300} />
