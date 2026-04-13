import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
import './index.scss'

export default function WorkoutTimer() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '运动计时器' })
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const speakNumber = (num: number) => {
    console.log(`报数: ${num}秒`)
    Taro.vibrateShort({ type: 'light' }).catch(() => {})
  }

  const handleStart = () => {
    if (isRunning) return
    setIsRunning(true)
    Taro.setKeepScreenOn({ keepScreenOn: true })

    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        const newSeconds = prev + 1
        speakNumber(newSeconds)
        return newSeconds
      })
    }, 1000)
  }

  const handlePause = () => {
    if (!isRunning) return
    setIsRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    Taro.setKeepScreenOn({ keepScreenOn: false })
  }

  const handleReset = () => {
    handlePause()
    setSeconds(0)
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return {
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: secs.toString().padStart(2, '0')
      }
    }
    return {
      hours: null,
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0')
    }
  }

  const time = formatTime(seconds)

  return (
    <View className="workout-timer-page">
      <View className="timer-header">
        <Text className="header-title">运动计时</Text>
        <Text className="header-subtitle">专注每一秒的进步</Text>
      </View>

      <View className="timer-main">
        <View className="timer-circle">
          <View className="circle-bg" />
          <View className="timer-display">
            <View className="time-row">
              {time.hours && (
                <>
                  <View className="time-unit">
                    <Text className="time-value">{time.hours}</Text>
                    <Text className="time-label">时</Text>
                  </View>
                  <Text className="time-separator">:</Text>
                </>
              )}
              <View className="time-unit">
                <Text className="time-value">{time.minutes}</Text>
                <Text className="time-label">分</Text>
              </View>
              <Text className="time-separator">:</Text>
              <View className="time-unit">
                <Text className="time-value">{time.seconds}</Text>
                <Text className="time-label">秒</Text>
              </View>
            </View>
            <View className="seconds-count">
              <Text className="count-number">{seconds}</Text>
              <Text className="count-label">总秒数</Text>
            </View>
          </View>
        </View>

        <View className="stats-row">
          <View className="stat-card">
            <Text className="stat-icon">🔥</Text>
            <Text className="stat-value">{Math.floor(seconds / 60)}</Text>
            <Text className="stat-label">分钟</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-icon">💪</Text>
            <Text className="stat-value">{seconds}</Text>
            <Text className="stat-label">次报数</Text>
          </View>
          <View className="stat-card">
            <Text className="stat-icon">⚡</Text>
            <Text className="stat-value">{isRunning ? '进行中' : '已暂停'}</Text>
            <Text className="stat-label">状态</Text>
          </View>
        </View>
      </View>

      <View className="control-section">
        <View className="control-buttons">
          {!isRunning ? (
            <Button className="btn-primary" onClick={handleStart}>
              <Text className="btn-text">{seconds === 0 ? '开始运动' : '继续'}</Text>
            </Button>
          ) : (
            <Button className="btn-secondary" onClick={handlePause}>
              <Text className="btn-text">暂停</Text>
            </Button>
          )}

          {seconds > 0 && (
            <Button className="btn-outline" onClick={handleReset}>
              <Text className="btn-text">重置</Text>
            </Button>
          )}
        </View>

        <View className="tips-section">
          <View className="tip-item">
            <Text className="tip-icon">📳</Text>
            <Text className="tip-text">每秒震动提醒</Text>
          </View>
          <View className="tip-item">
            <Text className="tip-icon">📱</Text>
            <Text className="tip-text">屏幕保持常亮</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
