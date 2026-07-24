// 主页集成示例
// src/pages/index/index.tsx

import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import LevelUpNotificationCard from '../../components/LevelUpNotificationCard'
import LevelUpSheet from '../../components/LevelUpSheet'
import { useLevelUp } from '../../hooks/useLevelUp'
import TabBar from '../../components/TabBar'
import './index.scss'

export default function IndexPageWithLevelUp() {
  // 使用晋级验证 Hook
  const levelUp = useLevelUp()

  useEffect(() => {
    // 页面加载时检查晋级条件
    checkLevelUpOnLoad()

    // 监听任务完成事件
    Taro.eventCenter.on('taskCompleted', handleTaskCompleted)

    return () => {
      Taro.eventCenter.off('taskCompleted', handleTaskCompleted)
    }
  }, [])

  // 页面加载时检查晋级
  const checkLevelUpOnLoad = async () => {
    await levelUp.checkLevelUp()
  }

  // 任务完成时检查晋级
  const handleTaskCompleted = async (orderId: string) => {
    const shouldLevelUp = await levelUp.checkLevelUp(orderId)

    if (shouldLevelUp) {
      // 可以在这里添加额外的提示
      Taro.showToast({
        title: '恭喜完成任务！',
        icon: 'success',
        duration: 2000
      })
    }
  }

  return (
    <View className="index-page">
      {/* 顶部用户信息区域 */}
      <View className="user-header">
        {/* ... 原有的用户信息内容 */}
      </View>

      {/* 晋级通知卡（满足条件时显示） */}
      {levelUp.showNotification && levelUp.checkData && (
        <LevelUpNotificationCard
          fromLevel={levelUp.checkData.fromLevel}
          toLevel={levelUp.checkData.toLevel}
          completedCount={levelUp.checkData.completedCount}
          onClick={levelUp.openLevelUpSheet}
        />
      )}

      {/* 统计数据区域 */}
      <View className="stats-section">
        {/* ... 原有的统计内容 */}
      </View>

      {/* 推荐任务区域 */}
      <View className="tasks-section">
        {/* ... 原有的任务列表 */}
      </View>

      {/* 晋级弹窗 */}
      {levelUp.dialogData && levelUp.checkData && (
        <LevelUpSheet
          visible={levelUp.showSheet}
          fromLevel={levelUp.checkData.fromLevel}
          toLevel={levelUp.checkData.toLevel}
          mentorText={levelUp.dialogData.mentorText}
          question={levelUp.dialogData.question}
          options={levelUp.dialogData.options}
          mentorReply={levelUp.dialogData.mentorReply}
          dataCards={levelUp.dialogData.dataCards}
          timeline={levelUp.dialogData.timeline}
          onClose={levelUp.closeSheet}
          onConfirm={levelUp.confirmLevelUp}
          onAnswer={levelUp.submitAnswer}
        />
      )}

      {/* TabBar */}
      <TabBar />
    </View>
  )
}

// ===========================================
// 在任务完成页面触发晋级检查
// ===========================================

// src/pages/task-complete/index.tsx (示例)

import Taro from '@tarojs/taro'

export default function TaskCompletePage() {
  const handleConfirm = async () => {
    try {
      // 1. 完成任务API调用
      await completeTask(taskId)

      // 2. 触发晋级检查事件
      Taro.eventCenter.trigger('taskCompleted', taskId)

      // 3. 返回主页
      Taro.switchTab({
        url: '/pages/index/index'
      })
    } catch (error) {
      console.error('完成任务失败', error)
    }
  }

  return (
    <View>
      {/* 任务完成页面内容 */}
    </View>
  )
}

// ===========================================
// 方案2：直接在任务完成页面调用
// ===========================================

import { levelUpAPI } from '../../services/levelUpAPI'

export default function TaskCompletePageDirect() {
  const handleConfirm = async () => {
    try {
      // 1. 完成任务
      await completeTask(taskId)

      // 2. 检查晋级
      const checkResult = await levelUpAPI.checkLevelUp(taskId)

      if (checkResult.shouldLevelUp) {
        // 3. 存储晋级数据到本地
        Taro.setStorageSync('pendingLevelUp', checkResult)

        // 4. 显示提示
        await Taro.showToast({
          title: '导师想跟你说几句话',
          icon: 'none',
          duration: 2000
        })
      }

      // 5. 返回主页
      Taro.switchTab({
        url: '/pages/index/index'
      })
    } catch (error) {
      console.error('完成任务失败', error)
    }
  }

  return (
    <View>
      {/* 任务完成页面内容 */}
    </View>
  )
}

// 然后在主页的 useEffect 中检查本地存储
useEffect(() => {
  const pendingLevelUp = Taro.getStorageSync('pendingLevelUp')
  if (pendingLevelUp) {
    setCheckData(pendingLevelUp)
    setShowNotification(true)
    Taro.removeStorageSync('pendingLevelUp')
  }
}, [])
