import { useState } from 'react'
import Taro from '@tarojs/taro'
import { levelUpAPI } from '../services/levelUpAPI'

interface LevelUpCheckData {
  shouldLevelUp: boolean
  fromLevel: number
  toLevel: number
  completedCount: number
  requiredCount: number
}

interface DialogData {
  mentorText: string[]
  question: string
  options: Array<{
    letter: 'A' | 'B' | 'C' | 'D'
    text: string
  }>
  mentorReply: string
  dataCards?: Array<{
    rows: Array<{
      label: string
      value: string
      highlight?: boolean
    }>
  }>
  timeline?: Array<{
    date: string
    label: string
    isNow?: boolean
  }>
}

/**
 * 晋级验证 Hook
 * 提供完整的晋级验证流程管理
 */
export function useLevelUp() {
  const [showNotification, setShowNotification] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [checkData, setCheckData] = useState<LevelUpCheckData | null>(null)
  const [dialogData, setDialogData] = useState<DialogData | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * 检查晋级条件
   */
  const checkLevelUp = async (completedOrderId?: string) => {
    try {
      const result = await levelUpAPI.checkLevelUp(completedOrderId)

      if (result.shouldLevelUp) {
        setCheckData(result)
        setShowNotification(true)
        return true
      }

      return false
    } catch (error) {
      console.error('检查晋级失败', error)
      return false
    }
  }

  /**
   * 打开晋级弹窗
   */
  const openLevelUpSheet = async () => {
    if (!checkData) {
      Taro.showToast({
        title: '数据加载失败',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)
      Taro.showLoading({ title: '加载中...' })

      // 获取对话内容
      const dialog = await levelUpAPI.getLevelDialog(
        checkData.fromLevel,
        checkData.toLevel
      )

      setDialogData(dialog)
      setShowSheet(true)
      setShowNotification(false)

      Taro.hideLoading()
      setLoading(false)
    } catch (error) {
      console.error('加载对话失败', error)
      setLoading(false)
      Taro.hideLoading()
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  }

  /**
   * 提交答案
   */
  const submitAnswer = async (option: string) => {
    if (!checkData) return

    try {
      await levelUpAPI.submitAnswer(
        checkData.fromLevel,
        checkData.toLevel,
        option
      )
    } catch (error) {
      console.error('提交答案失败', error)
      // 静默失败，不影响流程
    }
  }

  /**
   * 确认晋级
   */
  const confirmLevelUp = async () => {
    if (!checkData) return

    try {
      setLoading(true)
      Taro.showLoading({ title: '晋级中...' })

      const result = await levelUpAPI.confirmLevelUp(checkData.toLevel)

      Taro.hideLoading()
      setLoading(false)
      setShowSheet(false)

      // 跳转到晋级完成页
      Taro.navigateTo({
        url: `/pages/level-up-done/index?level=${result.newLevel}&levelTitle=${encodeURIComponent(result.levelTitle)}&unlockedPerks=${encodeURIComponent(JSON.stringify(result.unlockedPerks))}`
      })

      // 清理状态
      setCheckData(null)
      setDialogData(null)
    } catch (error) {
      console.error('晋级失败', error)
      setLoading(false)
      Taro.hideLoading()
      Taro.showToast({
        title: '晋级失败，请重试',
        icon: 'none'
      })
    }
  }

  /**
   * 关闭弹窗
   */
  const closeSheet = () => {
    setShowSheet(false)
  }

  /**
   * 隐藏通知
   */
  const hideNotification = () => {
    setShowNotification(false)
  }

  return {
    // 状态
    showNotification,
    showSheet,
    checkData,
    dialogData,
    loading,

    // 方法
    checkLevelUp,
    openLevelUpSheet,
    submitAnswer,
    confirmLevelUp,
    closeSheet,
    hideNotification
  }
}
