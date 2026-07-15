import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import Loading from '../../../components/Loading'
import { levelAPI } from '../../../services/api'
import './index.scss'

interface LevelPermission {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  type: 'permission' | 'benefit'
}

interface LevelInfo {
  currentLevel: number
  currentLevelName: string
  completedOrders: number
  requiredOrders: number
  currentPermissions: LevelPermission[]
  nextLevel: number
  nextLevelName: string
  nextPermissions: LevelPermission[]
  canSkipLevel: boolean
  skipLevelRequirements?: {
    targetLevel: number
    targetLevelName: string
    currentScore: number
    requiredScore: number
    hasQualifyingOrder: boolean
  }
}

export default function LevelGrowth() {
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  useEffect(() => {
    loadLevelInfo()
  }, [])

  const loadLevelInfo = async () => {
    setLoading(true)
    try {
      // 获取用户ID
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.id) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 2000
        })
        setTimeout(() => {
          Taro.reLaunch({ url: '/pages/login/index' })
        }, 2000)
        return
      }

      // 调用API获取等级信息
      const result = await levelAPI.getUserLevel(userInfo.id)

      if (result.success && result.data) {
        setLevelInfo(result.data)
      } else {
        throw new Error(result.message || '加载失败')
      }
    } catch (error: any) {
      console.error('加载等级信息失败:', error)

      // 使用模拟数据作为降级方案
      const mockData: LevelInfo = {
        currentLevel: 3,
        currentLevelName: '河成者',
        completedOrders: 8,
        requiredOrders: 10,
        currentPermissions: [
          { id: '1', name: '接取任务', description: '可以接取平台任务', icon: '▪', unlocked: true, type: 'permission' },
          { id: '2', name: '导师指导', description: '任务中可咨询AI导师', icon: '○', unlocked: true, type: 'permission' },
          { id: '3', name: '发布帖子', description: '可在社区发布技能分享和问题求助', icon: '▪', unlocked: true, type: 'permission' },
          { id: '4', name: '新手福利', description: '前3单享受平台补贴', icon: '◆', unlocked: true, type: 'benefit' }
        ],
        nextLevel: 4,
        nextLevelName: '河行者',
        nextPermissions: [
          { id: '5', name: '社区访问', description: '解锁社区板块，查看所有帖子', icon: '●', unlocked: false, type: 'permission' },
          { id: '6', name: '加入队伍', description: '可申请加入其他学生的队伍', icon: '●', unlocked: false, type: 'permission' },
          { id: '7', name: '优先推荐', description: '匹配算法优先推荐你', icon: '◇', unlocked: false, type: 'benefit' }
        ],
        canSkipLevel: true,
        skipLevelRequirements: {
          targetLevel: 4,
          targetLevelName: '河行者',
          currentScore: 92,
          requiredScore: 85,
          hasQualifyingOrder: true
        }
      }
      setLevelInfo(mockData)

      // 只在非网络错误时显示toast（网络错误已由API层处理）
      if (!error.message?.includes('网络')) {
        Taro.showToast({
          title: error.message || '加载失败',
          icon: 'none',
          duration: 2000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSkipLevel = () => {
    setShowSkipConfirm(true)
  }

  const confirmSkipLevel = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.id) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      Taro.showLoading({ title: '提交中...', mask: true })

      const result = await levelAPI.applyChallenge(userInfo.id, '')

      Taro.hideLoading()

      if (result.success) {
        Taro.showToast({
          title: '跳级申请已提交',
          icon: 'success',
          duration: 2000
        })
        setShowSkipConfirm(false)

        // 跳转到跳级任务页面
        setTimeout(() => {
          Taro.navigateTo({
            url: '/pages/tasks/skip-level'
          })
        }, 2000)
      } else {
        throw new Error(result.error?.message || '申请失败')
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('跳级申请失败:', error)

      // 只在非网络错误时显示toast
      if (!error.message?.includes('网络')) {
        Taro.showToast({
          title: error.message || '申请失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    }
  }

  if (loading) {
    return <Loading text="正在加载等级信息..." />
  }

  if (!levelInfo) {
    return (
      <View className="level-growth-page">
        <View className="empty-state">
          <Text className="empty-text">暂无等级信息</Text>
        </View>
      </View>
    )
  }

  const progress = (levelInfo.completedOrders / levelInfo.requiredOrders) * 100

  return (
    <View className="level-growth-page">
      <ScrollView className="content-scroll" scrollY>
        {/* 当前等级卡片 */}
        <View className="current-level-card">
          <View className="level-badge">
            <Text className="badge-level">Lv.{levelInfo.currentLevel}</Text>
          </View>
          <Text className="level-name">{levelInfo.currentLevelName}</Text>

          {/* 升级进度 */}
          <View className="progress-section">
            <View className="progress-header">
              <Text className="progress-label">升级进度</Text>
              <Text className="progress-value">
                {levelInfo.completedOrders}/{levelInfo.requiredOrders} 单
              </Text>
            </View>
            <View className="progress-bar">
              <View className="progress-fill" style={{ width: `${progress}%` }} />
            </View>
            <Text className="progress-hint">
              还需完成 {levelInfo.requiredOrders - levelInfo.completedOrders} 单即可升至 {levelInfo.nextLevelName}
            </Text>
          </View>
        </View>

        {/* 当前权限 */}
        <View className="permissions-section">
          <Text className="section-title">当前权限与福利</Text>
          <View className="permissions-list">
            {levelInfo.currentPermissions.map(permission => (
              <View key={permission.id} className={`permission-item ${permission.type}`}>
                <View className="permission-icon-wrapper">
                  <Text className="permission-icon">{permission.icon}</Text>
                  {permission.unlocked && (
                    <View className="unlocked-badge">
                      <Text className="unlocked-icon">✓</Text>
                    </View>
                  )}
                </View>
                <View className="permission-content">
                  <Text className="permission-name">{permission.name}</Text>
                  <Text className="permission-description">{permission.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 下一等级预览 */}
        <View className="next-level-section">
          <Text className="section-title">
            升至 Lv.{levelInfo.nextLevel} {levelInfo.nextLevelName} 后解锁
          </Text>
          <View className="permissions-list">
            {levelInfo.nextPermissions.map(permission => (
              <View key={permission.id} className={`permission-item ${permission.type} locked`}>
                <View className="permission-icon-wrapper">
                  <Text className="permission-icon">{permission.icon}</Text>
                  <View className="locked-badge">
                    <Text className="locked-icon">○</Text>
                  </View>
                </View>
                <View className="permission-content">
                  <Text className="permission-name">{permission.name}</Text>
                  <Text className="permission-description">{permission.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 跳级入口 */}
        {levelInfo.canSkipLevel && levelInfo.skipLevelRequirements && (
          <View className="skip-level-section">
            <View className="skip-level-card">
              <Text className="skip-title">▲ 跳级机会</Text>
              <Text className="skip-description">
                你的表现优秀，可以申请跳级至 Lv.{levelInfo.skipLevelRequirements.targetLevel} {levelInfo.skipLevelRequirements.targetLevelName}
              </Text>
              <View className="skip-requirements">
                <View className="requirement-item met">
                  <Text className="requirement-icon">✓</Text>
                  <Text className="requirement-text">
                    最近订单评分 {levelInfo.skipLevelRequirements.currentScore} 分（需≥{levelInfo.skipLevelRequirements.requiredScore}分）
                  </Text>
                </View>
                <View className="requirement-item met">
                  <Text className="requirement-icon">✓</Text>
                  <Text className="requirement-text">有符合条件的订单</Text>
                </View>
              </View>
              <Button className="skip-button" onClick={handleSkipLevel}>
                <Text className="button-text">申请跳级</Text>
              </Button>
            </View>
          </View>
        )}

        {!levelInfo.canSkipLevel && (
          <View className="skip-level-section">
            <View className="skip-level-card disabled">
              <Text className="skip-title">○ 跳级条件</Text>
              <Text className="skip-description">
                完成更多高质量订单后可解锁跳级机会
              </Text>
              <View className="skip-requirements">
                <View className="requirement-item">
                  <Text className="requirement-icon">○</Text>
                  <Text className="requirement-text">最近订单评分需≥85分</Text>
                </View>
                <View className="requirement-item">
                  <Text className="requirement-icon">○</Text>
                  <Text className="requirement-text">需有符合跳级条件的订单</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 跳级确认弹窗 */}
      {showSkipConfirm && levelInfo.skipLevelRequirements && (
        <View className="skip-confirm-overlay" onClick={() => setShowSkipConfirm(false)}>
          <View className="skip-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">确认申请跳级？</Text>
            <View className="modal-content">
              <View className="info-item">
                <Text className="info-label">目标等级：</Text>
                <Text className="info-value">
                  Lv.{levelInfo.skipLevelRequirements.targetLevel} {levelInfo.skipLevelRequirements.targetLevelName}
                </Text>
              </View>
              <View className="info-item">
                <Text className="info-label">跳级任务：</Text>
                <Text className="info-value">无报酬挑战任务</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">完成时限：</Text>
                <Text className="info-value">48小时</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">通过标准：</Text>
                <Text className="info-value">评分≥85分</Text>
              </View>
              <View className="warning-box">
                <Text className="warning-icon">▲</Text>
                <Text className="warning-text">
                  失败后需冷却7天才能再次申请
                </Text>
              </View>
            </View>
            <View className="modal-actions">
              <Button className="cancel-button" onClick={() => setShowSkipConfirm(false)}>
                <Text className="button-text">再想想</Text>
              </Button>
              <Button className="confirm-button" onClick={confirmSkipLevel}>
                <Text className="button-text">确认申请</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
