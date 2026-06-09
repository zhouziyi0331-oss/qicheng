import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

interface ToastProps {
  visible: boolean
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onClose
}: ToastProps) {
  const [show, setShow] = useState(visible)

  useEffect(() => {
    setShow(visible)

    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return 'ℹ'
    }
  }

  return (
    <View className="toast-overlay">
      <View className={`toast-container ${type}`}>
        <View className="toast-icon">
          <Text className="icon-text">{getIcon()}</Text>
        </View>
        <Text className="toast-message">{message}</Text>
      </View>
    </View>
  )
}

// Toast管理器
class ToastManager {
  private callback: ((config: ToastConfig) => void) | null = null

  setCallback(callback: (config: ToastConfig) => void) {
    this.callback = callback
  }

  show(config: ToastConfig) {
    if (this.callback) {
      this.callback(config)
    }
  }

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration })
  }

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration })
  }

  warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration })
  }

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration })
  }
}

export interface ToastConfig {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const toast = new ToastManager()
